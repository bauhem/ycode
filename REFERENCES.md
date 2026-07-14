# Reference — Detailed Workflows & Patterns

Supplementary reference for YCode operations. Not loaded in agent context by default.

---

## 🌐 Localization (Translations)

### Workflow: Translating Component Texts

**Step 1 — Discover exact translation keys via MCP**

Use `ycode_list_translatable_content(source_type, source_id, locale_id)`:
- `source_type: "component"` — master component text
- `source_type: "page"` — page-only text + per-instance component overrides
- `source_type: "cms"` — CMS item fields (pass `search`/`limit`)

Per-instance override keys (page-scoped, `source_type: "page"`):
- `layer:<instance_layer_id>:override:text:<variable_id>`
- `layer:<instance_layer_id>:override:rich_text:<variable_id>`
- `layer:<instance_layer_id>:override:image_src:<variable_id>`
- `layer:<instance_layer_id>:override:image_alt:<variable_id>`

**Step 2 — Inspect manually if needed**
```
ycode_list_components
ycode_list_locales
ycode_get_layers(page_id)
ycode_get_component(component_id)
```

**Step 3 — Check existing translations**
```
ycode_list_translations(locale_id)
```
Components use `source_type: "component"`, `source_id: <component_id>`.

**Step 4 — Translate using batch upsert**
```
ycode_batch_set_translations({
  locale_id, source_type, source_id,
  content_key: "layer:<layer_id>:text",
  content_type: "text" | "richtext",
  content_value: "Translation",
  is_completed: true
})
```
- Group all translations into a single call (all-or-nothing)
- Use `ycode_set_rich_text_translation` for rich-text content when available
- "MODERN", "SOLUTION", "Discover more" — already English, add for completeness

**Current Locales**
| ID | Code | Label | Default |
|---|---|---|---|
| `99990e19-dfd1-44f4-8a7d-e22d89305e3f` | fr | Français | ✅ |
| `a28a2581-def2-4a6f-8f2e-478f61143f0d` | en | English | |

**UI Verification**: `http://localhost:3002/ycode/localization?locale=en`

### Runtime Rules
- Builder/preview uses draft translations (`is_published = false`)
- Public pages use published translations only (`is_published = true`, `is_completed = true`, non-empty `content_value`)
- MCP writes are draft changes — must be published before public frontend sees them
- Use `ycode_get_unpublished_changes` before asking for publish confirmation
- Never run `ycode_publish` without explicit user confirmation

### Diagnostic SQL
```sql
-- Check draft vs published counts
select is_published, source_type, source_id, count(*)
from translations
where locale_id = '<locale-id>' and deleted_at is null
group by is_published, source_type, source_id
order by source_type, source_id, is_published;

-- Check completion by component
select source_id,
  count(*) filter (where is_completed) as completed,
  count(*) filter (where not is_completed) as incomplete,
  count(*) as total
from translations
where locale_id = '<locale-id>' and source_type = 'component'
  and is_published = true and deleted_at is null
group by source_id order by source_id;
```

---

## 🔄 Webflow DevLink → YCode Native Component Workflow

For client Webflow migrations, first read `docs/WEBFLOW_TO_YCODE_NATIVE_IMPORT_PLAYBOOK.md`.

### Critical Rule: Read EVERY source file upfront

Before using any MCP tool, read ALL of:
1. **Main component** (e.g. `sections/OverviewService.tsx`)
2. **Every sub-component** used
3. **`css/variables.css`** — all design tokens
4. **`css/classes.css`** — all class definitions

Skipping any produces incorrect results.

### Critical Rule: Detect and Implement CMS Collection Lists
- DevLink exports CMS lists as `<NotSupported _atom="Collection List" />`. **Do not make components static** if they need dynamic data.
- ALWAYS detect CMS list need, look up the target collection (`ycode_list_collections`), and implement a native YCode Collection List.

### ⚠️ Critical: Collection Display Field Must Use `key: "name"`

The builder uses `key: "name"` to determine which field to show in CMS item dropdowns. If key is anything else, the builder falls back incorrectly.

Builder resolution priority: `name` → slug → first value → UUID (only `page-navigation.ts` checks `title` as fallback).

Fix:
```sql
UPDATE collection_fields SET key = 'name', name = 'Name'
WHERE id = '<field-id>' AND collection_id = '<collection-id>';
```

### Critical Rule: CMS Fields Must Have Stable Keys
- Every CMS field MUST include a stable `key` at creation time.
- Use clear keys: `name`, `description`, `slug`, `content`, `benefits`, etc.
- Never leave `collection_fields.key = null` for translatable fields.
- After creating/modifying CMS fields, verify both draft+published `collection_fields` have non-null keys.

### Critical Rule: Preserve CMS Text Binding Contracts
- **Never** bind CMS text by setting `variables.text` directly to `{ type: "field", data: ... }`. The sidebar expects `dynamic_rich_text` with an inline `dynamicVariable` node.
- The inline variable must include `source: "collection"`, `collection_layer_id`, `field_id`, `field_type`, `relationships: []`.

Canonical shape:
```json
{
  "variables": {
    "text": {
      "type": "dynamic_rich_text",
      "data": {
        "content": {
          "type": "doc",
          "content": [{
            "type": "paragraph",
            "content": [{
              "type": "dynamicVariable",
              "attrs": {
                "label": "Field Name",
                "variable": {
                  "type": "field",
                  "data": {
                    "source": "collection",
                    "field_id": "<id>",
                    "field_type": "text",
                    "relationships": [],
                    "collection_layer_id": "<ancestor-layer-id>"
                  }
                }
              }
            }]
          }]
        }
      }
    }
  }
}
```
If writing via SQL, update both `components.layers` and `components.variants[0].layers`, then set `content_hash = NULL`.

### Pattern: CMS Tabs Using Native YCode Slider
- YCode has no native tabs. For tabs/testimonials/carousels, use a native slider + CMS collection list.
- Use two collection-backed templates from the same collection: one for tab buttons, one inside the slider's `slides` wrapper.
- Keep content inside native `slider` → `slides` tree. Do not replace with a plain div.
- Synchronize external tabs to `sliderElement.swiper` with scoped custom attributes (`data-yc-role="tabs"`, etc.).
- Use Tailwind/YCode classes for layout: `w-full`, `max-w-full`, `!flex-[0_0_100%]`, `!shrink-0`.
- Active tab styling: `aria-selected:*` and `aria-selected:*` Tailwind variants.

### Step 1 — Map design tokens to YCode color variables
Use `ycode_list_color_variables` then `ycode_update_color_variable`. Color refs use `"color:var(--uuid)"`.

### Step 2 — Create/update component using MCP tools
- Prefer MCP batch operations for page/component edits.
- Target specific component variants when editing variant-specific structure.
- Use native rich-text and variant variable types instead of duplicating components.
- Use SQL only when MCP lacks the operation.

### Step 3 — Apply exact Webflow styles per layer

| Webflow | YCode property |
|---|---|
| `border-radius: var(--radius-medium)` | `borderRadius: "50px"` |
| `letter-spacing: var(--letter-spacing-xxxs)` | `letterSpacing: "-0.8px"` |
| `background-color: var(--black)` | `backgroundColor: "color:var(--uuid)"` |
| `padding: 10px 30px` | `paddingTop/Bottom/Left/Right` |

Use Tailwind hover classes / YCode interactions before custom code.

### Step 4 — Reimplement interactions
| Webflow event | YCode approach |
|---|---|
| `MOUSE_OVER` → animate underline | Native hover classes or interaction preset |
| `CLICK` → toggle panel | YCode built-in interactions |
| Marquee scroll | YCode loop animation preset |
| `SCROLL_INTO_VIEW` fade-in | YCode reveal animation preset |

### Step 5 — Verify fidelity
- [ ] Colors match `variables.css` (use CSS variable refs, not hex)
- [ ] Border-radius matches (`--radius-small: 10px`, `--radius-medium: 50px`, `--radius-large: 50%`)
- [ ] Typography matches (size, weight, line-height, letter-spacing)
- [ ] Hover/active states present
- [ ] Collection items render with CMS data
- [ ] Card items wrapped in `<a>` if clickable in Webflow
- [ ] Responsive breakpoints (stack grid on mobile, hide elements)

### Step 6 — SQL fallback (only when MCP lacks features)
Use `ycode_update_layer_recursive` or targeted `jsonb_set`. Restrict to `is_published = false`, set `content_hash = NULL`, verify both `components.layers` and targeted variant.

### ❌ Never use SQL for rich_text collection_item_values
Unicode escapes stored as literal text → empty in builder. Always use MCP `ycode_update_collection_item` with actual UTF-8.

### Published copies required for new collections/fields
```sql
-- Collection
INSERT INTO collections SELECT *, true AS is_published, gen_random_uuid() AS uuid
FROM collections WHERE id = '<id>' AND is_published = false;
-- Fields
INSERT INTO collection_fields SELECT *, true AS is_published
FROM collection_fields WHERE collection_id = '<id>' AND is_published = false;
-- Items
INSERT INTO collection_items SELECT *, true AS is_published
FROM collection_items WHERE collection_id = '<id>' AND is_published = false;
-- Values
INSERT INTO collection_item_values (id, item_id, field_id, value, is_published, ...)
SELECT gen_random_uuid(), item_id, field_id, value, true, ...
FROM collection_item_values WHERE ... AND is_published = false;
```
Without published copies, collections/fields won't appear in template binding dropdowns.

---

## 🔧 Connection & MCP Architecture

### SSH Tunnel
`npm run dev` runs:
```
ssh -i ~/.ssh/vps_ycode -o StrictHostKeyChecking=accept-new -L 5433:127.0.0.1:5433 ubuntu@51.222.143.231 -N -f
```
Maps local port 5433 to the VPS host's published Supabase DB port 5433.

### Deployed Admin & Serverless MCP
YCode MCP server runs on Netlify serverless. Two settings in `app/(builder)/ycode/mcp/[token]/route.ts`:
- `enableJsonResponse: true` — tool results in HTTP response body (no SSE)
- `autoInitialize` — transient handshake if serverless instance loses in-memory session

---

## 📎 CMS Field Display Name Resolution

| Function | File | Priority |
|---|---|---|
| `getCollectionItemDisplayName()` | `LinkItemOptions.tsx` | `name` → slug → first value → UUID |
| `getItemLabel()` | `use-collection-item-search.ts` | `name` → first value → "Item {uuid}" |
| `getCollectionItemLabel()` | `useCollectionsStore.ts` | `name` → "Item {uuid}" |
| `getItemLabel()` | `page-navigation.ts` | `name` → `title` → `slug` → first visible text |

Only `page-navigation.ts` checks `title` as fallback.
