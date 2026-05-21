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

## 🚫 What NOT to Do

- Do NOT use HTML embed blocks, custom <style> tags, or hardcoded raw CSS/HTML snippets for designs, hover states, transitions, or animations. ALWAYS use native Tailwind utility classes (such as `group`, `group-hover:`, `transition-`, `duration-`, `scale-`, `rotate-`, etc.) to build clean, native, and fully customizable visual styles inside the builder.
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

**Step 1 — Identify the component and its texts**

```bash
# List all components, locales, and the target page's layers
ycode_list_components
ycode_list_locales
ycode_get_layers(page_id)
```

The page layer tree shows which `componentId` is used. Then call `ycode_get_component(component_id)` to inspect all text layers.

**Step 2 — Check existing translations**

```bash
ycode_list_translations(locale_id)  # e.g. English locale ID
```

Translations for components use `source_type: "component"` and `source_id: <component_id>`.

**Step 3 — Translate using batch upsert**

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
- **"MODERN" / "SOLUTION"** — marquee/branding texts already in English: skip them
- **"Discover more"** — already English: still add the translation entry for completeness

### Current Locales

| ID | Code | Label | Default |
|---|---|---|---|
| `99990e19-dfd1-44f4-8a7d-e22d89305e3f` | fr | Français | ✅ |
| `a28a2581-def2-4a6f-8f2e-478f61143f0d` | en | English | |

### UI Verification

After saving, verify translations at `http://localhost:3002/ycode/localization?locale=en`.

---

## 🔄 Webflow DevLink → YCode Native Component Workflow

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

### Step 1 — Map design tokens to YCode color variables

Use `ycode_list_color_variables` to see current variables, then `ycode_update_color_variable` to match Webflow's `variables.css`. Always verify exact values from the source file — never guess or assume.

**Color variable references in design properties:**
- Use format `"color:var(--variable-uuid)"` — e.g. `"color:var(--278bfea0-7517-41b4-a075-0bfcaab8788a)"`
- Get the variable UUID from `ycode_list_color_variables`

### Step 2 — Create/update component using MCP tools

Use `ycode_create_component` then `ycode_update_component_layers` with batch operations.

**MCP tool capabilities for component layers:**

| Operation | Supported | Notes |
|---|---|---|
| `add_layer` | ✅ | All templates |
| `update_design` | ✅ | Desktop only — NO `ui_state`, NO `breakpoint` params |
| `update_text` | ✅ | |
| `delete_layer` | ✅ | |
| `move_layer` | ✅ | |
| `link_variable` | ✅ | For component variables |
| `update_settings` | ❌ | Tag, html_id, custom_attributes — use SQL |
| Hover states (`ui_state`) | ❌ | Use SQL or page CSS workaround |
| Breakpoint designs | ❌ | Use SQL |
| CMS field bindings | ❌ | Use SQL `UPDATE components SET layers = ...` |

For **page-level** operations, `ycode_batch_operations` is preferred.

### Step 3 — Apply exact Webflow styles per layer

For every layer, cross-reference against Webflow's `classes.css`:

| Webflow | YCode property |
|---|---|
| `border-radius: var(--radius-medium)` | `borderRadius: "50px"` |
| `letter-spacing: var(--letter-spacing-xxxs)` | `letterSpacing: "-0.8px"` |
| `background-color: var(--black)` | `backgroundColor: "color:var(--black-uuid)"` |
| `padding: 10px 30px` | `paddingTop/Bottom: "10px"`, `paddingLeft/Right: "30px"` |

**Hover states workaround** (MCP has no `ui_state` support for components):
1. Add Tailwind `hover:` classes via SQL: `hover:bg-transparent hover:scale-[0.95] hover:text-[#000000]`
2. Or add page-level `custom_code.head` CSS targeting the layer

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
| `MOUSE_OVER` on card → animate underline | CSS `:hover` on parent + child transition, or `custom_code` JS |
| `CLICK` menu → toggle panel | YCode built-in `interactions` on the layer |
| Marquee infinite scroll | `custom_code` JS with `requestAnimationFrame` |
| `SCROLL_INTO_VIEW` fade-in | Not natively supported — `custom_code` IntersectionObserver |

### Step 5 — Verify fidelity before proceeding

- [ ] Colors match `variables.css` exactly (use CSS variable refs, not hardcoded hex)
- [ ] Border-radius matches (`--radius-small: 10px`, `--radius-medium: 50px`, `--radius-large: 50%`)
- [ ] Typography matches (size, weight, line-height, letter-spacing, family)
- [ ] Hover/active states present and working
- [ ] Collection items render with CMS data
- [ ] Card items are wrapped in `<a>` tags if clickable in Webflow
- [ ] Responsive breakpoints (stack grid on mobile, hide elements)

### Step 6 — SQL fallback (only when MCP lacks features)

Reserved for: `update_settings`, hover states on component layers, breakpoint designs on components, CMS field bindings.

Use the database function `ycode_update_layer_recursive` for JSONB traversal. Always set `is_published = false` and `content_hash = NULL` after SQL edits.

### ⚠️ Known YCode Bugs & Workarounds (CRITICAL — read before styling any layer)

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

---

## 🔧 Environment

- **Local dev**: `npm run dev` (starts SSH tunnel to VPS + Next.js on port 3002)
- **Supabase**: Self-hosted at `https://supabase.bauhem.com`
- **Admin**: `https://admin.bauhem.com`
- **MCP Bridge**: `scripts/mcp-ycode-bridge.js` (connects local agents to admin MCP server)
