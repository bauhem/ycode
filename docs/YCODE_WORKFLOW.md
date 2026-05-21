# YCode Builder Workflow

This repository is built around two different layers of work:

- the **builder state** in YCode
- the **source code** of the app

For component work, the builder state is the source of truth.

## Working model

Use this order for new components or page-level composition work:

1. Create a new component in the YCode builder.
2. Keep the existing component untouched unless the user explicitly asks for a replacement.
3. Add the new component instance to the target page or `body`.
4. Validate the result in the browser on the authenticated builder UI.
5. Only use direct database writes when the builder UI does not expose a needed operation.

## What to use for what

- **YCode builder / MCP**: create components, edit layers, manage variables, and keep the editor tree in sync.
- **Browser**: verify the real editor UI, confirm the component is visible, and test insertion/selection behavior.
- **Supabase / SQL**: persist builder state only when the operation is not exposed cleanly by the builder UI.

## Rules

- Do not overwrite an existing component unless the user explicitly asks for that.
- Prefer creating a new component name with a clear namespace, for example `Navbar Light Native`.
- Keep responsive behavior in the component from the beginning.
- Validate that the new instance is actually present in the page layer tree, not only in the component library.
- Do not treat Supabase as the design tool. It is a persistence layer, not the editor.

## Practical example

For a new navbar:

- create `Navbar Light Native`
- keep `Navbar Light` intact
- insert `Navbar Light Native` into the home page body
- confirm it appears in the builder layer tree
- publish only after the browser validation passes

## Replicable component creation playbook

When you want a native YCode component to match a source component closely and remain editable in the builder, use this sequence every time:

1. Capture the source of truth.
   - Start from the existing YCode component, not from an assumption.
   - Compare it with the DevLink export and the live site if there is a visual reference.

2. Rebuild the outer shell first.
   - section or root wrapper
   - container
   - main row / content rail
   - left, center, right groupings
   - mobile menu shell

3. Recreate the dynamic structure before fine styling.
   - collection-backed navigation
   - nested dropdown collections
   - locale or utility slots
   - CTA slot
   - icon slot for toggles and arrows
   - CMS tabs built from native YCode sliders when the source uses tabbed testimonials or tabbed content

4. Map responsive behavior explicitly.
   - desktop: horizontal navigation, dropdowns floating or anchored
   - tablet: collapsed or stacked navigation, menu button visible
   - mobile: vertical stack, dropdown panels inline or full-width
   - never leave responsive behavior implied

5. Preserve builder-editable contracts.
   - use stable variable names
   - use stable layer names
   - keep instance overrides predictable
   - avoid overwriting the original component unless requested

6. Validate the real editor UI.
   - confirm the component appears in the library
   - confirm the instance appears in the page body or target page tree
   - confirm the browser shows the expected layers on desktop and tablet

7. Only then align visuals.
   - button radius
   - button color
   - dropdown arrow presence
   - hover states
   - spacing and typography

## What "complete" means

A component is considered complete only when all of these are true:

- it is editable in the YCode builder
- it uses collections or variables where the source component does
- it has the same desktop and tablet structure as the reference
- it includes the same interactive affordances, such as dropdown arrows or menu toggles
- it is present in the target page tree, not just in the component library
- it has been validated in the browser, not only through database inspection

## Component variants pattern

YCode component variants live in the component record, not as separate components.

- `components.variants` is an array of variant objects: `{ id, name, layers }`.
- Each variant owns its own complete `layers` tree. Duplicated variants usually generate new layer IDs, so do not assume child layer IDs match across variants.
- `components.layers` is the legacy/default fallback tree. The renderer prefers `components.variants`; when no `componentVariantId` is set, it falls back to `variants[0]`.
- Component variables are shared at the component level in `components.variables`. Each variant layer should link to the same variable IDs for the same editable contract.
- A component instance selects a variant with `layer.componentVariantId`.
- A nested component can expose its variant choice through a parent variable using `layer.componentVariantVariableId` and `componentOverrides.variant`.
- When using SQL, update the exact affected variant under `components.variants[N].layers`; do not overwrite `variants[0]` or rebuild the whole `variants` array unless that is explicitly intended.
- If the default variant structure changes through SQL, keep `components.layers` and `components.variants[0].layers` in sync for legacy fallback/editor safety.
- Clear `content_hash` after SQL changes so thumbnails/rendered component caches can refresh.

Example from `Button Link Arrow Dark`:

- `Default` uses black text/icon styling.
- `White` is a second entry in `components.variants` with its own generated layer IDs and white icon/text overrides.
- Both variants reuse the same `Button Text` and `Button Link` variable IDs, so instances can switch variants without losing text/link overrides.

## CMS text binding pattern

When building collection-backed text layers, preserve the same data shape the editor creates from `Element > Content > Insert Variable`.

- Put the text layer under an ancestor with `variables.collection` for the target collection.
- Store text bindings as `variables.text.type = "dynamic_rich_text"`.
- Put the field reference inside a Tiptap `dynamicVariable` node.
- Include `source: "collection"`, `collection_layer_id`, `field_id`, `field_type`, and `relationships: []` in the variable data.
- Do not store text as a direct `variables.text.type = "field"`; that breaks the editor contract and can make future variable insertion/editing unreliable.
- If SQL is required, update the affected variant layer trees in `components.variants`. For the default variant, also keep `components.layers` in sync. Clear `content_hash`, then verify recursively that there are no direct field text variables left.

Minimal shape:

```json
{
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
                "label": "Field label",
                "variable": {
                  "type": "field",
                  "data": {
                    "source": "collection",
                    "field_id": "<field-id>",
                    "field_type": "text",
                    "relationships": [],
                    "collection_layer_id": "<collection-layer-id>"
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
```

## CMS tabs with native slider pattern

YCode has no native tabs element. Rebuild tabbed CMS sections with a native YCode `slider` layer and separate CMS tab controls.

- Create one collection-backed tab-list layer for the tab buttons.
- Create one native `slider` layer with a `slides` child.
- Put a collection-backed slide item inside `slides`, using the same CMS collection as the tab buttons.
- Bind all text inside tabs and slides using the CMS text binding pattern above.
- Add stable custom attributes, for example `data-yc-role="tabs"`, `data-yc-role="tab"`, `data-yc-role="slider"`, and `data-yc-role="slide"`.
- Synchronize tab clicks to the native Swiper instance exposed by YCode on the slider DOM element, rather than creating a second runtime-only Swiper.
- Keep the synchronization script minimal: set ARIA state and call `swiper.slideTo(index)`. Do not put layout, colors, hover states, or responsive rules in custom CSS.
- If multiple slides are visible unintentionally, fix it with native YCode/Tailwind classes on the slide item, for example `w-full`, `max-w-full`, `!flex-[0_0_100%]`, and `!shrink-0`.
- Style the active tab with static YCode/Tailwind classes, for example `aria-selected:*` on the tab and `group-aria-selected:*` on children.
- Keep DOM selectors based on stable custom attributes or HTML IDs; do not rely on source `layer.id` values in rendered component instances.

## Navigation-specific pattern

For navbars, the most reliable shape is:

- section wrapper
- inner container
- left brand group
- navigation collection group
- dropdown toggle with a dedicated icon layer
- dropdown panel as a sibling layer
- utility group or CTA as the final block

That pattern keeps the desktop version stable and makes the tablet version predictable because the same logical blocks can be restacked without rewriting the component.

## Localization publish verification

The builder/localization UI and the public frontend do not read the same translation snapshot.

- The builder and preview read draft records (`is_published = false`) and can surface incomplete translations while editing.
- The public frontend (`/en`, `/en/...`) reads published records only (`is_published = true`).
- Public rendering also ignores translations where `is_completed` is false or `content_value` is empty.
- `ycode_batch_set_translations` creates or updates draft translations. Those values are not visible on the public frontend until the site is published.
- Do not call `ycode_publish` automatically. Ask for explicit confirmation before publishing.

When `/en` shows a mix of English and French, do not assume the renderer is broken. First check the translation state:

```sql
select is_published, source_type, source_id, count(*)
from translations
where locale_id = '<english-locale-id>'
  and deleted_at is null
group by is_published, source_type, source_id
order by source_type, source_id, is_published;
```

For component text specifically, confirm that every component used by the page has a published, completed row for each translatable layer:

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

Validation sequence after translating:

1. Verify draft translations in `http://localhost:3002/ycode/localization?locale=en`.
2. Verify the page composition with `ycode_get_layers(page_id)` and note each `componentId`.
3. Check that those component IDs have draft translations marked `is_completed = true`.
4. Publish only after user confirmation.
5. Re-test `http://localhost:3002/en` and any translated slugs with Playwright or the browser.

If the builder looks translated but `/en` does not, the usual causes are:

- translations exist only as draft rows
- translations are published but `is_completed = false`
- translations were created under `source_type: "page"` while the text lives inside a component and must use `source_type: "component"`
- the `source_id` is not the master `componentId` used by the page instance
