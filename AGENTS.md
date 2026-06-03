# AI Agent Instructions — YCode Fork

## ⚠️ MANDATORY — Read Before Any Code Change

This project follows strict coding conventions defined in `.cursorrules`.
**Every AI agent (Cursor, Antigravity, OpenCode, Claude, etc.) MUST read and apply these rules before writing any code.**

Read the file: `.cursorrules` at the root of the project.

---

## 🔒 Golden Rules (Non-Negotiable)

1. **NEVER modify Ycode source code without explicit user authorization.**
2. **NEVER make assumptions** — if intent is unclear, ask first.
3. **ALWAYS follow the coding conventions** in `.cursorrules`.
4. **NEVER commit, push, or publish** changes (including code, git commits, or using publishing tools) unless explicitly requested by the user.
5. **NEVER use relative deep paths** — use `@/` aliases for all imports outside the current directory.
6. **NEVER overwrite user modifications on components or pages via broad SQL updates.** If the user has made manual edits on the Canvas, do not replace the entire `layers` or `variants` columns. Use targeted SQL (`jsonb_set`) or API tools to modify specific nodes, or request permission.

---

## 🏗️ Architecture Summary

- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Supabase
- **UI Primitives**: ShadCN components in `/components/ui/` — **always use these, never custom HTML primitives**
- **State**: Zustand stores in `/stores/` — domain-scoped, never global god-stores
- **Data Access**: Repository pattern — `API Route → Repository → Supabase`. Never use Supabase directly in API routes.
- **Hooks**: Extract reusable logic into custom hooks in `/hooks/`
- **Utilities**: Pure functions go in `/lib/`

---

## 📁 Key Directories

| Directory | Purpose |
|---|---|
| `app/(builder)/ycode/` | Builder UI (all editor components) |
| `app/(site)/` | Published site renderer |
| `components/` | Shared React components |
| `components/ui/` | ShadCN UI primitives |
| `hooks/` | Custom React hooks |
| `lib/` | Utilities and pure functions |
| `lib/repositories/` | All Supabase data access (repository pattern) |
| `stores/` | Zustand state stores |
| `types/` | TypeScript type definitions |
| `scripts/` | Maintenance/utility scripts (NOT used at runtime) |

---

## 📐 Coding Conventions Summary

Full details are in `.cursorrules`. Key points:

### Components
- File names: `kebab-case.tsx`
- Exports: `PascalCase` matching the filename
- Single Responsibility — one component, one job
- Use `React.memo` for expensive pure components
- Use `'use client'` only when strictly required (hooks, events, browser APIs)

### Imports (ALWAYS in this order)
1. React / Next.js core
2. External libraries (alphabetical)
3. ShadCN UI components (alphabetical)
4. Internal components (alphabetical)
5. Zustand stores (alphabetical)
6. Utils / lib / api (alphabetical)
7. Types (always last)

### Path Aliases
- Use `@/` for everything outside the current directory
- Use `./` ONLY for files in the same directory
- NEVER use deep relative paths like `../../../../`

### State & Async
- Always show loading states with `<Spinner />`
- Always handle errors with try/catch/finally
- Use early returns instead of nested ternaries
- Use `upsert` for DB operations, never queries in loops

### TypeScript
- **NEVER use `any`** — always define proper interfaces
- Use `CreateXData` / `UpdateXData` interfaces for repository input types, never `Omit<>`
- Use Zod `message` parameter (not the deprecated `required_error`)

### Supabase & Database (CRITICAL)
- **Repository pattern is mandatory** — create a repository for every new data entity
- **ALWAYS null-check after `getSupabaseAdmin()`** — it can return null
- Use `@/lib/...` alias imports — never relative paths like `../supabase-server`
- Migrations must be **idempotent** — use `IF NOT EXISTS`, `hasColumn()`, and safe `WHERE` clauses

### UI & Accessibility
- Use semantic HTML (`<button>` not `<div onClick>`)
- Include `aria-label` for icon-only buttons
- Maintain heading hierarchy (h1 → h2 → h3)
- Ensure keyboard navigation (Tab, Enter, Esc)

### Custom Code & Components
- When targeting rendered layers from page `custom_code`, do **NOT** rely on internal component `layer.id` / `data-layer-id` values from the component source.
- Component instances can rewrite or derive runtime layer IDs, so selectors based on source layer IDs are not stable across pages.
- For DOM targeting, animations, marquees, hover effects, or external scripts, prefer stable `html_id` values or explicit custom attributes set intentionally for runtime selection.
- If custom code must target repeated component structure, anchor it to stable HTML IDs and local DOM relationships, not to source component layer IDs.

### Input Sanitization (for design properties)
- Use `removeSpaces()` from `@/lib/utils` for all Tailwind design property handlers
- Use `useControlledInput` hook for input state management (auto-sanitizes)
- Never create local `const sanitize =` helpers inside components

### Icons
- When adding to the `Icon` component, ALWAYS update both: (1) the TypeScript union type AND (2) the `ICONS` object
- Use kebab-case names (e.g., `eye-off`), and SVG viewBox `0 0 12 12`

### Performance
- Use `React.memo` for expensive pure components
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive calculations

### Comments & Documentation
- Comment WHY, not WHAT
- Use JSDoc for public APIs and utility functions
- Never write obvious comments that repeat the code

---

## 📝 Commit Message Conventions

Format: `<type>: <concise summary in imperative mood>`

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring, no behavior change |
| `chore` | Maintenance, cleanup |
| `docs` | Documentation only |
| `style` | Formatting, whitespace |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |

Rules:
- **Imperative mood**: "add user auth" not "added user auth"
- **Lowercase** after type: `feat: add domain management`
- **No period** at end of subject line
- **50 chars max** for subject line
- **No AI attribution**: never mention Cursor, AI, copilot, or assistant
- **No WIP commits**: if work is incomplete, describe what IS done
- **No `--trailer` flags** in git commit commands

---

## 🛑 Critical — Translation Data Integrity (NEVER Violate)

### Dual-Record Architecture — Mandatory Understanding
Every YCode translation uses TWO database records:
1. **Draft** (`is_published=false`) — what the YCode builder/editor displays. NEVER delete or modify `is_published` on drafts.
2. **Published** (`is_published=true`) — what the public frontend reads. Coexists with the draft.

Both records MUST always coexist for translations to work correctly in both editor and frontend.

### Absolute Rules (NEVER Break)
1. **NEVER run DELETE on translations** — you will delete drafts that the builder needs.
2. **NEVER change `is_published`** via SQL on existing translations. The only valid operation is INSERT for new translations (always with `is_published=false` for draft + `is_published=true` for published copies).
3. **NEVER touch `page` or `component` source_type translations** — only `cms` when specifically requested and with explicit authorization per collection.
4. **Bulk operations on translations are FORBIDDEN** — always operate on a single known content_key, source_id, or a small explicit list approved by the user.
5. If a translation needs to be "published" for public display, the user must use YCode's own publish mechanism. Do NOT set `is_published=true` via SQL.
6. If a translation exists and is working correctly in the builder, leave it alone — do not modify it in any way.

### Correct Workflow for Adding New Translations
Use `ycode_batch_set_translations` to create drafts, then immediately INSERT matching published copies via SQL:

```sql
-- Step 1: Create draft via MCP (ycode_batch_set_translations)
-- Step 2: Create published copy
INSERT INTO translations (id, locale_id, source_type, source_id, content_key, content_type, content_value, is_completed, is_published, created_at, updated_at)
SELECT gen_random_uuid(), 'en-locale-id', source_type, source_id, content_key, content_type, content_value, true, true, NOW(), NOW()
FROM translations
WHERE locale_id = 'en-locale-id'
  AND source_type = 'cms'
  AND source_id = 'specific-item-id'
  AND is_published = false
  AND is_completed = false
ON CONFLICT (locale_id, source_type, source_id, content_key, is_published) DO NOTHING;
```

NEVER update existing draft records. Only insert new ones.

## 🚫 What NOT to Do

- Do NOT use HTML embed blocks, custom <style> tags, or hardcoded raw CSS/HTML snippets for designs, hover states, transitions, or animations. ALWAYS use native Tailwind utility classes (such as `group`, `group-hover:`, `transition-`, `duration-`, `scale-`, `rotate-`, etc.) to build clean, native, and fully customizable visual styles inside the builder.
- For animations/interactions, prefer YCode 1.13.0 native MCP interaction tools and presets before any custom code fallback.
- Do NOT run any git commit, git push, or ycode_publish commands unless explicitly requested by the user
- Do NOT add `yarn.lock` (project uses npm)
- Do NOT commit `.playwright-mcp/`, `.opencode/`, `.specify/` (in `.gitignore`)
- Do NOT write debug/test scripts in `/scripts/` — delete them when done
- Do NOT use `console.log` in production components (use `console.error` with context for errors only)
- Do NOT use direct Supabase client in API routes — always use repositories
- Do NOT use `any` TypeScript type
- Do NOT use `Omit<FullType, ...>` for repository input types — use dedicated interfaces
- Do NOT use deep relative import paths
- Do NOT execute queries inside loops — use batch `upsert`
- Do NOT write non-idempotent migrations

---

## ✅ Pre-Commit Checklist

- [ ] Using ShadCN components for all UI primitives?
- [ ] Extracted reusable logic into hooks/utils?
- [ ] Components are small and focused (single responsibility)?
- [ ] Used proper TypeScript types (no `any`)?
- [ ] Imports organized correctly with `@/` aliases?
- [ ] Loading states for all async operations?
- [ ] Error handling with try/catch/finally?
- [ ] Early returns instead of nested ternaries?
- [ ] `'use client'` only where strictly needed?
- [ ] API routes use repository pattern?
- [ ] Null check after `getSupabaseAdmin()`?
- [ ] New icons added to BOTH type definition AND ICONS object?
- [ ] Repository functions use `CreateXData` / `UpdateXData` interfaces?
- [ ] Zod schemas use `message` (not `required_error`)?
- [ ] Ran `npm run lint:fix` and `npm run type-check`?
- [ ] Design property inputs sanitized with `removeSpaces`?
- [ ] Migrations are idempotent?

---

## 🌐 YCode MCP — Localization (Translations)

### Workflow: Translating Component Texts

When asked to translate texts of a **component** (e.g. Home Hero), follow this workflow:

**Step 1 — Discover exact translation keys**

As of YCode 1.18.0, use MCP translation discovery before writing translations. Do not guess `content_key` values from layer JSON when the tool is available.

```bash
ycode_list_translatable_content(source_type, source_id, locale_id)
```

Use it for:
- `source_type: "component"` to translate master component text.
- `source_type: "page"` to translate page-only text and per-instance component overrides.
- `source_type: "cms"` to translate CMS item fields; pass `search`/`limit` when needed.

Per-instance component override translations are page-scoped in YCode 1.18.0 and use `source_type: "page"`, not `"component"`. Their keys look like:
- `layer:<instance_layer_id>:override:text:<variable_id>`
- `layer:<instance_layer_id>:override:rich_text:<variable_id>`
- `layer:<instance_layer_id>:override:image_src:<variable_id>`
- `layer:<instance_layer_id>:override:image_alt:<variable_id>`

**Step 2 — Identify the component and its texts if manual inspection is still needed**

```bash
# List all components, locales, and the target page's layers
ycode_list_components
ycode_list_locales
ycode_get_layers(page_id)
```

The page layer tree shows which `componentId` is used. Then call `ycode_get_component(component_id)` to inspect all text layers.

**Step 3 — Check existing translations**

```bash
ycode_list_translations(locale_id)  # e.g. English locale ID
```

Translations for components use `source_type: "component"` and `source_id: <component_id>`.

**Step 4 — Translate using batch upsert**

Use `ycode_batch_set_translations` — one call upserts all translations at once:

```json
{
  "locale_id": "<english_locale_id>",
  "source_type": "component",
  "source_id": "<component_id>",
  "content_key": "layer:<layer_id>:text",
  "content_type": "text",
  "content_value": "English translation",
  "is_completed": true
}
```

Key rules:
- `content_key` format: `layer:<layer_id>:text`
- `source_type`: `"component"` (for component texts), `"page"` (for page texts), `"cms"` (for CMS fields)
- `content_type`: `"text"` for simple text, `"richtext"` for rich text (JSON string)
- **Always batch**: group all translations into a single `ycode_batch_set_translations` call
- YCode 1.18.0 validates each batch entry before saving; if one translation has an invalid format, none are saved. Fix the reported index/key and retry the whole batch.
- Prefer `ycode_set_rich_text_translation` for rich-text content when the MCP surface exposes it, instead of assembling Tiptap JSON manually.
- **"MODERN" / "SOLUTION"** — marquee/branding texts already in English: skip them
- **"Discover more"** — already English: still add the translation entry for completeness

### Current Locales

| ID | Code | Label | Default |
|---|---|---|---|
| `99990e19-dfd1-44f4-8a7d-e22d89305e3f` | fr | Français | ✅ |
| `a28a2581-def2-4a6f-8f2e-478f61143f0d` | en | English | |

### UI Verification

After saving, verify translations at `http://localhost:3002/ycode/localization?locale=en`.

### Public Frontend Verification

The localization editor and the public frontend can legitimately disagree if translations have not been published.

Runtime rules:
- Builder/localization and preview use draft translations (`is_published = false`) and may show incomplete values during editing.
- Public pages such as `/en` use published translations only (`is_published = true`).
- Public pages ignore translation rows unless `is_completed = true` and `content_value` is non-empty.
- MCP translation writes are draft changes; they must be published before the public frontend can use them.
- In YCode 1.18.0, `ycode_get_unpublished_changes` reports pending translations and locales; use it before asking for publish confirmation.
- Never run `ycode_publish` unless the user explicitly confirms publishing.

When `/en` still shows French text while the builder looks English:
- First inspect whether the missing translations are draft-only or incomplete. Do not change renderer code before checking data state.
- For component instances, verify the page layer tree with `ycode_get_layers(page_id)` and confirm translations use `source_type: "component"` with `source_id: <componentId>`.
- Check published/completed counts for the affected component IDs in the `translations` table.
- After publishing with user approval, re-test the public URL (`http://localhost:3002/en`) and not only the localization UI.

Useful diagnostic SQL:

```sql
select is_published, source_type, source_id, count(*)
from translations
where locale_id = '<english-locale-id>'
  and deleted_at is null
group by is_published, source_type, source_id
order by source_type, source_id, is_published;
```

```sql
select source_id,
  count(*) filter (where is_completed) as completed,
  count(*) filter (where not is_completed) as incomplete,
  count(*) as total
from translations
where locale_id = '<english-locale-id>'
  and source_type = 'component'
  and is_published = true
  and deleted_at is null
group by source_id
order by source_id;
```

---

## 🔄 Webflow DevLink → YCode Native Component Workflow

For general client Webflow migrations, first read `docs/WEBFLOW_TO_YCODE_NATIVE_IMPORT_PLAYBOOK.md`. That playbook is the agnostic golden path for using both DevLink and static Webflow exports, maintaining an import ledger, rebuilding native YCode resources idempotently, and handing off a responsive baseline to the designer.

### YCode 1.13.0 MCP Baseline
- The embedded MCP server has full editor parity as of YCode 1.13.0. Prefer MCP tools over SQL for layers, settings, CMS, component variants, variables, interactions, animations, rich text, redirects, form settings, translations, and static export workflows.
- SQL is now a last-resort repair path only: use it when the active MCP surface cannot express the operation, or when repairing malformed legacy JSON. Always use targeted paths and verify before/after.
- Component variants are scriptable. Do not create duplicate components for visual/state variants when a native component variant is the correct model.
- Animations are scriptable. Use curated reveal, hover, click, parallax, stagger, and loop presets, or raw layer interactions for custom GSAP timelines.
- CMS is expanded. Support option/count fields, metadata, sorting, manual order, references, dynamic page binding, and rich-text translations through MCP where available.
- Static HTML export is available for published sites to local disk, S3, or GitHub, but never run publish/export without explicit user confirmation.

### YCode 1.18.0 Localization Updates
- Use MCP translation discovery (`ycode_list_translatable_content`) before translating pages, components, or CMS content. It returns the exact `source_type`, `source_id`, `content_key`, `content_type`, labels, source values, and optional existing locale status.
- Component instance overrides are now translatable as page-scoped rows. Translate them with `source_type: "page"` and the `layer:<instance_layer_id>:override:*:<variable_id>` keys surfaced by discovery.
- Translation writes validate content format before saving. Treat batch failures as all-or-nothing: fix the reported invalid entries and retry the batch.
- `get_unpublished_changes` now includes pending translations and locales. Check it before any publish discussion, but still never publish without explicit user confirmation.

### Critical Rule: Read EVERY source file upfront

Before touching any MCP tool, you MUST read ALL of these source files:
1. **Main component** (e.g. `sections/OverviewService.tsx`) — element tree, props, children
2. **Every sub-component** used (e.g. `buttons/PrimaryButton.tsx`, `cards/CardServiceItem.tsx`, `label/Label.tsx`) — each has its own structure, styles, and interactions
3. **`css/variables.css`** — ALL design tokens (colors, radii, spacing, typography)
4. **`css/classes.css`** — ALL class definitions for every class referenced in components

Skipping any of these WILL produce incorrect results.

### Critical Rule: Detect and Implement CMS Collection Lists
- DevLink exports CMS lists as static elements or placeholders (`<NotSupported _atom="Collection List" />`). **Do NOT make components static if they are meant to display dynamic data (like Blogs, Services, Testimonials, Team, etc.).**
- ALWAYS detect if the component needs a CMS list, look up the target collection (using `ycode_list_collections`), and implement a native YCode Collection List. Connect nested elements (headings, paragraphs, images) to their respective CMS fields dynamically.

### ⚠️ Critical Rule: Collection Display Field Must Use `key: "name"` (Not `"title"`)

The YCode builder uses the `key` column on `collection_fields` to determine which field to show in CMS item dropdowns (Link Settings, navigation, CMS item selectors). **If the key is anything other than `"name"`, the builder falls back to the first value in the item's values map — which is rarely correct.**

#### Builder display-name resolution (do NOT look for `"title"`):

| Function | File | Priority |
|---|---|---|
| `getCollectionItemDisplayName()` | `LinkItemOptions.tsx` | `name` → slug → first value → UUID |
| `getItemLabel()` | `use-collection-item-search.ts` | `name` → first value → "Item {uuid}" |
| `getCollectionItemLabel()` | `useCollectionsStore.ts` | `name` → "Item {uuid}" |
| `getItemLabel()` | `page-navigation.ts` | `name` → `title` → `slug` → first visible text |

Only `page-navigation.ts` checks for `key: "title"` as a fallback. **The other three (used in Link Settings and CMS item pickers) ONLY check `key: "name"`.**

#### Fixing a broken collection dropdown:

Both the `name` (UI label) and `key` columns must be `"Name"` / `"name"`:

```sql
-- Update both draft and published records
UPDATE collection_fields SET key = 'name' WHERE id = '<title-field-id>' AND collection_id = '<collection-id>';
UPDATE collection_fields SET name = 'Name' WHERE id = '<title-field-id>' AND collection_id = '<collection-id>';
```

This makes the field un-hideable in the builder UI — which is correct behavior (you should not hide the field that identifies each item).

#### Known affected collections (fixed 2026-06-03):
- **Services** — Title field `7b5d3470-...` was `key: "title"` → now `key: "name"`
- **Case Studies** — Title field `a23d5228-...` was `key: "title"` → now `key: "name"`
- **Blog Posts** — Title field `09fd739d-...` was `key: "title"` → now `key: "name"`
- **Industrial Ideas** — Title field `7d59018c-...` was `key: "title"` → now `key: "name"`
- **Pages** — Title field `6f1d7113-...` was `key: "title"` → now `key: "name"`

#### Why Solutions worked while Services/Case Studies didn't:
Solutions' first field already had `key: "name"`, matching the builder's lookup. The other two had `key: "title"`, which the builder ignores in 3 out of 4 resolution functions.

#### Runtime note:
`findDisplayField()` in `collection-field-utils.ts:591` (used by the public frontend) correctly checks BOTH `key === 'title'` and `key === 'name'` — so the frontend was never affected. This is a builder-only issue.

### Critical Rule: CMS Fields Must Have Stable Keys
- Every CMS field created by an agent MUST include a stable `key` at creation time.
- Use clear API-safe keys such as `name`, `description`, `slug`, `content`, `benefits`, `characteristics`, `author_name`, etc.
- Never leave `collection_fields.key = null` for editor-facing or translatable fields. A null key forces YCode to use UUID-based translation keys (`field:id:<uuid>`), which is fragile and creates duplicate translation formats.
- After creating or modifying CMS fields, verify both draft and published `collection_fields` records have non-null keys for every translatable field.
- If an existing field has no key, add one immediately and create non-destructive translation aliases from the old UUID/id format to `field:key:<key>`.

### Critical Rule: Preserve CMS Text Binding Contracts
- `Element > Content > Insert Variable` is powered by `fieldGroups`, which are built from ancestor layers that have `variables.collection`. A text layer must be a descendant of the correct collection layer, otherwise the sidebar has no collection fields to show.
- For text/heading layers, **never** bind CMS text by setting `variables.text` directly to `{ type: "field", data: ... }`. The sidebar editor expects text content to be a `dynamic_rich_text` value containing an inline `dynamicVariable` node.
- The inline variable must include `source: "collection"`, `collection_layer_id: <ancestor collection layer id>`, `field_id`, `field_type`, and `relationships: []` (or the nested relationship path). This is what `buildFieldVariableData()` creates when users insert a variable manually.
- If you write CMS text bindings through SQL, update both `components.layers` and `components.variants[0].layers`, then set `content_hash = NULL`. Verify with a recursive SELECT that no text layer has `variables.text.type = "field"`.

Canonical CMS text binding shape:

```json
{
  "variables": {
    "text": {
      "type": "dynamic_rich_text",
      "data": {
        "content": {
          "type": "doc",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "dynamicVariable",
                  "attrs": {
                    "label": "Author",
                    "variable": {
                      "type": "field",
                      "data": {
                        "source": "collection",
                        "field_id": "<collection-field-id>",
                        "field_type": "text",
                        "relationships": [],
                        "collection_layer_id": "<ancestor-collection-layer-id>"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      }
    }
  }
}
```

### Pattern: CMS Tabs Using Native YCode Slider
- YCode does not have a native tabs element. For Webflow tabs/testimonials/carousels, use a native YCode `slider` layer as the content mechanism and build the tab buttons as a separate CMS collection list.
- Use two collection-backed templates from the same collection: one collection layer for tab buttons, and one collection layer inside the slider's `slides` wrapper for slide content.
- Keep the actual content inside the native `slider` → `slides` tree so the slider remains visible and editable in the YCode layer tree. Do not replace it with a plain `div` plus a runtime-only Swiper instance.
- Synchronize external tabs to the native Swiper instance exposed on the slider element (`sliderElement.swiper`) with scoped custom attributes such as `data-yc-role="tabs"`, `data-yc-role="tab"`, `data-yc-role="slider"`, and `data-yc-role="slide"`.
- Layout must remain controlled by YCode Designer classes, not page custom CSS. If all slides appear at once, set native Tailwind/YCode classes on the slide item such as `w-full`, `max-w-full`, `!flex-[0_0_100%]`, and `!shrink-0`.
- The synchronization script should only set ARIA state and call `swiper.slideTo(index)`. Active tab styling should use static YCode/Tailwind classes such as `aria-selected:*` and `group-aria-selected:*`.

### Step 1 — Map design tokens to YCode color variables

Use `ycode_list_color_variables` to see current variables, then `ycode_update_color_variable` to match Webflow's `variables.css`. Always verify exact values from the source file — never guess or assume.

**Color variable references in design properties:**
- Use format `"color:var(--variable-uuid)"` — e.g. `"color:var(--278bfea0-7517-41b4-a075-0bfcaab8788a)"`
- Get the variable UUID from `ycode_list_color_variables`

### Step 2 — Create/update component using MCP tools

Use `ycode_create_component` / component MCP tools, then edit layers with batch operations. In YCode 1.13.0, component variants, settings, variables, CMS, interactions, rich text, and animations should be handled through MCP when the active tool surface exposes them.

Operational rules:
- Prefer MCP batch operations for both page and component edits.
- Target a specific component variant when editing variant-specific structure or styling.
- Use native rich-text and variant variable types instead of duplicating components.
- Use MCP layer settings for tag, stable HTML IDs, custom attributes, form settings, redirects, and dynamic page bindings when available.
- Use SQL only after verifying MCP lacks the operation or for legacy JSON repair.

### Step 3 — Apply exact Webflow styles per layer

For every layer, cross-reference against Webflow's `classes.css`:

| Webflow | YCode property |
|---|---|
| `border-radius: var(--radius-medium)` | `borderRadius: "50px"` |
| `letter-spacing: var(--letter-spacing-xxxs)` | `letterSpacing: "-0.8px"` |
| `background-color: var(--black)` | `backgroundColor: "color:var(--black-uuid)"` |
| `padding: 10px 30px` | `paddingTop/Bottom: "10px"`, `paddingLeft/Right: "30px"` |

**Hover/interaction rule:** use YCode 1.13.0 native interactions or Tailwind/YCode hover classes first. Add SQL classes or page custom code only when the native MCP/editor surface cannot express the behavior.

Button from `classes.css`:
```css
.primary-button {
    padding: 10px 30px;
    border: 1px solid var(--black);
    border-radius: 50px /* radius-medium */;
    background-color: var(--black);
    color: var(--white);
    font-size: 16px;
    font-weight: 500;
    letter-spacing: -0.8px;
}
.primary-button:hover {
    background-color: transparent;
    transform: scale(0.95);
    color: var(--black);
}
```

### Step 4 — Reimplement interactions

| Webflow event | YCode approach |
|---|---|
| `MOUSE_OVER` on card → animate underline | Native hover classes or YCode interaction preset |
| `CLICK` menu → toggle panel | YCode built-in `interactions` on the layer |
| Marquee infinite scroll | YCode loop animation preset or raw layer interaction; custom code only if needed |
| `SCROLL_INTO_VIEW` fade-in | YCode reveal animation preset |

### Step 5 — Verify fidelity before proceeding

- [ ] Colors match `variables.css` exactly (use CSS variable refs, not hardcoded hex)
- [ ] Border-radius matches (`--radius-small: 10px`, `--radius-medium: 50px`, `--radius-large: 50%`)
- [ ] Typography matches (size, weight, line-height, letter-spacing, family)
- [ ] Hover/active states present and working
- [ ] Collection items render with CMS data
- [ ] Card items are wrapped in `<a>` tags if clickable in Webflow
- [ ] Responsive breakpoints (stack grid on mobile, hide elements)

### Step 6 — SQL fallback (only when MCP lacks features)

Reserved for operations still missing from the active MCP surface or for repairing malformed legacy component/page JSON.

Use the database function `ycode_update_layer_recursive` for simple JSONB traversal when appropriate, or targeted `jsonb_set` paths for exact nodes. Always restrict draft-only edits with `is_published = false`, set `content_hash = NULL`, and verify both `components.layers` and the targeted variant when direct SQL is unavoidable.

### ⚠️ Known/Legacy YCode Bugs & Workarounds (CRITICAL — verify before relying on them)

These notes were observed during prior imports and may be fixed or partially mitigated by YCode 1.13.0. Before applying a workaround, first test the current MCP/editor behavior. Keep workarounds only when the bug is still reproducible in the active environment.

1. **`clamp()` in font-size → invalid Tailwind class**
   - `fontSize: "clamp(1.75rem, 5vw, 2.5rem)"` produces `text-clamp(1.75rem, 5vw, 2.5rem)` (invalid Tailwind, class ignored → no font-size applied)
   - **Root cause**: `formatMeasurementClass()` in `tailwind-class-mapper.ts:167` falls through to `prefix-${value}` for values starting with non-digit, non-`-` characters. No brackets are added.
   - **Workaround**: Set `fontSize` to the max pixel equivalent (e.g. `"40px"` for `2.5rem`), then add `#ov-heading { font-size: clamp(...) !important; }` in the page `custom_code.head`. Always set `settings.id` on the layer first for a stable CSS selector.
   - **Fix target**: `formatMeasurementClass()` should detect functions like `clamp()`, `min()`, `max()`, `calc()` and wrap in `prefix-[...]`.

2. **Component layer JSONB paths are fragile**
   - Always verify paths by querying `customName` before writing updates.
   - Use `ycode_update_layer_recursive` for settings-only changes; use manual `jsonb_set` with explicit paths for design/class changes.
   - After any SQL update, immediately verify with a SELECT.
   - Keep a hierarchy map of the component's layers with their ids for reference.

3. **Component variables must have `default_value` for Editor rendering**
   - **Bug**: Linked component variables with no `default_value` inside the component's `variables` schema array render as completely blank/invisible (empty strings) on the Editor Canvas, even if the layer's default JSON has text. (Root cause: `LayerRenderer.tsx:992` explicitly returns `''` when a linked variable has no default/override).
   - **Workaround**: Always set `default_value` (e.g. a `dynamic_rich_text` or `link` object matching the schema) on variables in the `components.variables` column via SQL.

4. **UUID syntax crash with non-UUID virtual items (EAV query)**
   - **Bug**: When fetching EAV values for virtual items (like navigation links starting with `__page_navigation_parent__`), Postgres throws `invalid input syntax for type uuid` because the database `item_id` and `field_id` columns are strictly UUID-typed.
   - **Fix**: Apply a UUID regex check (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) to filter `item_ids` and `fieldIds` before running queries in `getValuesByItemIds` (`lib/repositories/collectionItemValueRepository.ts`).

5. **HTML Nesting Repair (Nested `<p>` tags) → Style inheritance lost**
   - **Bug**: When a text layer's `settings.tag` is set to `"p"` (paragraph), and it has a linked rich text variable (`dynamic_rich_text`), Tiptap renders its own `<p>` tags inside. This creates invalid HTML nesting (`<p><p>...</p></p>`). The browser's automatic DOM repair splits/empties the outer `<p>` container, which means all parent typography classes (like `text-[#676767]` and `text-[16px]`) are completely lost or ignored on the actual text node.
   - **Workaround**: Never use `"p"` as the outer layer's HTML tag for rich text variables. Always set `settings.tag: "div"` (or leave empty to fallback to div) so that the Tiptap `<p>` nests inside validly and inherits all parent styles properly.

6. **Component Canvas rendering loads layers from the `variants` column**
   - **Bug**: If you update a component's structural `layers` via SQL directly but forget to update the nested layers inside the `variants` column (specifically `components.variants[0].layers`), the component will render as completely blank/empty on the Editor Canvas. (Root cause: `LayerRenderer.tsx:1198` loads layers from the active variant schema, not the main `layers` array column).
   - **Workaround**: Always synchronize the `variants` JSON column dynamically when editing a component's structure via SQL: `UPDATE components SET variants = jsonb_build_array(jsonb_build_object('id', 'cmpvar-variants-id', 'name', 'Default', 'layers', layers)) ...`

7. **SQL-created text layers lack `restrictions.editText` → CMS fieldGroups invisible in sidebar**
   - **Bug**: Text layers written via SQL (`"name": "text"` or `"name": "heading"`) without `restrictions: { editText: true }` do not show CMS collection fields in the Element settings panel (the `fieldGroups` are correctly computed at runtime, but the editor's Insert Variable UI depends on `restrictions.editText` to display the CMS field picker).
   - **Workaround**: ALWAYS include `"restrictions": {"editText": true}` on every text/heading layer created via SQL. Without it, the user cannot bind CMS fields through the sidebar UI, even if the collection ancestor layer is correctly set up with `variables.collection`.
   - **Root cause**: `isTextEditable()` in `layer-utils.ts:562` checks `layer.restrictions?.editText`. The fieldGroups system in `RightSidebar.tsx:1682` and `CenterCanvas.tsx:1321` builds CMS field lists from ancestor collection layers, but the sidebar's Insert Variable/Content section for text layers only renders the field picker when the selected layer passes `restrictions.editText`. Without this flag, the field groups exist but are never exposed to the user.
   - **Additional requirement**: Never include `variables.link`, `variables.image`, or other unrelated variable types on text layers. Keep `variables` to only `{ text: { type: "dynamic_rich_text", ... } }` on text layers.

---

## 🔧 Environment

- **Local dev**: `npm run dev` (starts SSH tunnel to VPS + Next.js on port 3002)
- **Supabase**: Self-hosted at `https://supabase.bauhem.com` (running on VPS `51.222.143.231` via Docker)
- **Admin/Builder**: `https://bauhem.com` (hosted on Netlify, connected to the VPS Supabase database)
- **MCP Bridge**: `scripts/mcp-ycode-bridge.js` (connects local agents to the admin MCP server)

### 🏗️ Connection & MCP Architecture Setup

#### 1. Database & SSH Tunnel
For local development, the PostgreSQL database is not exposed publicly. Running `npm run dev` executes:
`ssh -i ~/.ssh/vps_ycode -o StrictHostKeyChecking=accept-new -L 5433:172.18.0.4:5432 ubuntu@51.222.143.231 -N -f`
This creates a local SSH tunnel mapping port `5433` to port `5432` of the `supabase-db` container on the VPS. Both the local dev server (port `3002`) and the Netlify production server (`bauhem.com`) share this same database.

#### 2. Deployed Admin & Serverless MCP
The YCode administration panel is deployed on Netlify. Even though Netlify runs serverless functions with strict timeouts, the YCode MCP server is designed to work statelessly on serverless thanks to two settings in `app/(builder)/ycode/mcp/[token]/route.ts`:
- `enableJsonResponse: true`: Ensures that tool call results are sent directly in the HTTP POST response body, rather than relying on a persistent SSE connection.
- `autoInitialize`: When a serverless instance loses the in-memory session mapping, it programmatically performs a transient initialization handshake on the fly before processing the incoming tool request.
