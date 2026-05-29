# Webflow to YCode Native Import Playbook

This playbook is the general workflow for migrating a client Webflow project into native YCode. It is intentionally project-agnostic: do not hardcode brand-specific choices, prefixes, color names, typography scales, or component names unless they are derived from the source project.

The agent's job is not to invent a design system. The agent must analyze the source project, infer the design system already present in Webflow, rebuild the bulk of it natively in YCode, and leave a clean responsive baseline for the designer to refine in the YCode Builder.

## Core Principles

- Treat YCode 1.13.0 MCP as the default authoring surface. It has full editor parity for layers, settings, CMS, variants, interactions, rich text, and exports.
- Use DevLink as the component and structure source of truth.
- Use the static Webflow export as the visual and browser-rendered source of truth.
- Use both sources when both are available. Do not rely on only one.
- When an established native YCode design system already differs from Webflow, the YCode design system prevails for those known decisions.
- Build native YCode layers, styles, components, collections, and bindings.
- Every complete section imported from Webflow must become a native YCode component unless the user explicitly asks for a one-off page-only layer.
- Do not use Webflow wrappers, HTML embeds, raw CSS, or page custom code for normal layout and styling.
- Reuse existing YCode resources only when they match the inferred source design system and intent.
- Create only what the source project requires. Do not add speculative variants or personalized styling.
- Keep the import idempotent. Re-running the workflow should not duplicate resources or overwrite unrelated work.
- Keep the process resumable. Maintain an import ledger before and during the work.
- Never publish unless the user explicitly asks for publishing.

## YCode 1.13.0 MCP Baseline

YCode 1.13.0 promoted the embedded MCP server to full editor parity. Older notes that require SQL for component settings, variants, hover states, breakpoints, CMS setup, rich-text translations, or interactions should be treated as historical unless the current MCP server truly lacks the needed operation.

Default authoring order:

- Use YCode MCP tools for native page, component, layer, style, CMS, settings, redirect, form, animation, variant, and translation work.
- Use batch MCP operations when possible; 1.13.0 includes page layer caching and faster batch execution.
- Use direct SQL only after checking that the current MCP surface cannot express the operation or when repairing existing malformed JSON.
- When SQL is unavoidable, use targeted `jsonb_set`/recursive node edits and verify the exact path before writing.
- Do not modify YCode source code for builder-state issues unless the user explicitly authorizes source-code changes.

New MCP capabilities to prefer over SQL/manual workarounds:

- First-class layer interactions and curated animation presets for reveal, hover, click, parallax, stagger, and loop effects.
- Raw layer interaction editing for custom GSAP timelines when presets are insufficient.
- Component variant list/create/clone/rename/delete and variant-targeted layer edits.
- Component variables with `rich_text` and `variant` types, placeholders, and defaults.
- Expanded CMS fields and metadata: option, count, sorting, field reordering, manual item order, references, and dynamic page collection binding.
- Page extensions including redirects and form settings.
- Expanded rich-text blocks and rich-text translations.
- Static HTML export to local disk, S3, or GitHub for published sites.

## Required Sources

Before creating or modifying YCode resources, locate and inspect all available source material.

### DevLink Source

Use DevLink to understand:

- Component hierarchy.
- React component boundaries.
- Props, slots, and repeated sub-components.
- Static placeholders that may represent CMS lists.
- Intended component composition.
- Interactions encoded in component structure.

Read every relevant file upfront:

- Main section/page component.
- All sub-components imported by it.
- Shared buttons, cards, labels, nav, footer, and layout helpers.
- DevLink CSS or generated class references.
- Any source files that define design variables, utility classes, or shared props.

### Static Webflow Export

Use the static export to understand:

- Final rendered HTML structure.
- Exact CSS rules and media queries.
- `variables.css`, global CSS, page CSS, and class definitions.
- Asset filenames and dimensions.
- Browser layout and computed styles.
- Breakpoint behavior.
- Visual details that DevLink alone may not expose.

Read every relevant file upfront:

- Target page HTML.
- Global CSS files.
- Variables CSS.
- Classes CSS.
- Webflow interaction snippets if present.
- Asset references used by the target page.

## Mandatory Import Ledger

Create an import ledger before creating or modifying any YCode resource. The ledger is the restart point if the process stops, fails, or is continued by another agent.

Recommended location:

```txt
docs/import-ledgers/<client-or-project>-<page-or-scope>.md
```

If the repository should not keep import ledgers, use a persistent temporary location agreed with the user. Do not keep the only copy inside chat context.

### Ledger Rules

- Create the initial ledger after source discovery and before YCode writes.
- Keep it updated after each meaningful operation.
- Record all created and reused YCode IDs.
- Record all source-to-target mappings.
- Record all workarounds and why they were needed.
- Record remaining QA gaps and known differences.
- Mark items with `pending`, `in_progress`, `done`, `blocked`, or `skipped`.

### Ledger Template

```md
# Webflow to YCode Import Ledger

## Scope
| Field | Value |
|---|---|
| Source project | |
| Target YCode project | |
| Target page(s) | |
| DevLink path | |
| Static export path | |
| Started by | |
| Last updated | |

## Source Files
| Type | Path | Status | Notes |
|---|---|---|---|
| DevLink main component | | pending | |
| DevLink sub-component | | pending | |
| Static HTML | | pending | |
| Variables CSS | | pending | |
| Classes CSS | | pending | |
| Assets | | pending | |

## Inferred Design System
| Type | Source token/class | Source value | YCode target | Status | Notes |
|---|---|---|---|---|---|
| Color | | | | pending | |
| Typography | | | | pending | |
| Spacing | | | | pending | |
| Radius | | | | pending | |
| Grid | | | | pending | |

## CMS Mapping
| Source list/model | YCode collection | Fields | Status | Notes |
|---|---|---|---|---|
| | | | pending | |

## Assets
| Source asset | YCode asset ID | Usage | Status | Notes |
|---|---|---|---|---|
| | | | pending | |

## Components
| Source component/section | Native YCode target | Reuse/Create | YCode ID | Status | Notes |
|---|---|---|---|---|---|
| | | | | pending | |

## Page Composition
| Section order | Source section | YCode component/layers | Status | Notes |
|---|---|---|---|---|
| 1 | | | pending | |

## Interactions
| Source interaction | Native YCode approach | Status | Notes |
|---|---|---|---|
| | | pending | |

## QA
| Check | Status | Evidence | Notes |
|---|---|---|---|
| Desktop visual comparison | pending | | |
| Tablet visual comparison | pending | | |
| Mobile visual comparison | pending | | |
| No horizontal overflow | pending | | |
| CMS renders real data | pending | | |
| Links resolve correctly | pending | | |
| Components editable in Builder | pending | | |
| MCP-only authoring checked | pending | | Record any remaining SQL fallback and why it was unavoidable. |
| Interactions/animations verified | pending | | Confirm native YCode interactions where source has motion. |
| Static export verified, if requested | pending | | Only after publish/export confirmation. |
| Known differences documented | pending | | |
```

## Golden Path

### 1. Discover and Read Sources

Find both source types when available:

- DevLink folder, often under `/webflow`, `/devlink`, or exported project directories.
- Static Webflow export folder, often containing `.html`, `/css`, `/images`, `/js`, and asset files.

Then read all relevant files before any YCode writes. Do not skip sub-components or CSS files. Missing one shared button/card/label file usually causes incorrect output.

### 2. Build a Source Map

Create a structured map of:

- Page sections in order.
- Repeated components.
- Primitive components such as buttons, labels, cards, links, images, media blocks, and grid wrappers.
- CMS lists and their target fields.
- Assets and where they are used.
- Interactions and hover states.
- Breakpoints and responsive behavior.
- Text hierarchy and heading levels.

Record this map in the ledger.

### 3. Infer the Design System

Extract the design system from the Webflow source. Do not invent it.

Analyze:

- Color variables and recurring color usage.
- Typography scale, font families, weights, line heights, and letter spacing.
- Section spacing and container widths.
- Grid systems and repeated column patterns.
- Border radius values.
- Button, link, card, and label patterns.
- Media sizing and object-position rules.
- Responsive overrides.

Create YCode styles only for patterns that are stable and repeated. For one-off layout details, layer classes may be more appropriate than reusable styles.

### 3.1. Respect Existing YCode Design Decisions

The static Webflow export is the default visual reference for a new import, but it is not allowed to override an established YCode design decision that the designer has already validated.

When Webflow and YCode differ:

- Prefer the existing YCode design system if the difference is intentional or already used elsewhere in the target site.
- Prefer YCode-native components and styles that the designer has already accepted.
- Do not force Webflow values over YCode values for known decisions such as hero text scale, section rhythm, button sizing, or reusable CTA styling.
- Record the decision in the ledger as a deliberate YCode divergence, not as a bug.
- Ask the user when it is unclear whether a difference is intentional.

Example ledger note:

```md
| Typography | Webflow hero H1 | 96px | Reuse YCode hero H1 scale | done | YCode scale is the approved design-system source of truth for this project. |
```

### 4. Plan Reuse Before Creation

Before creating any token, style, component, collection, or asset:

- List existing YCode resources.
- Compare name, intent, and actual values.
- Reuse only if the resource matches the source design intent and values.
- Create only if missing or mismatched.
- Do not overwrite unrelated resources.
- Do not create duplicate resources because of small naming differences.

If an existing resource has the same name but different values, treat it as a conflict and document it in the ledger. Ask the user if changing it could affect other work.

Page composition rule:

- Pages should be assembled from component instances, not from full section layer trees.
- A full page section created during the import must first be created as a native component, then inserted into the page as an instance.
- Page-level raw layers are acceptable only for one-off glue, wrappers, temporary diagnostics, or if the user explicitly requests a page-only section.
- If a section is initially prototyped on a page for speed, extract it into a component before marking the import complete.
- Record each created/reused component ID in the ledger.

### 5. Build Native Foundations First

Create or reuse in this order:

- Color variables.
- Fonts.
- Reusable layer styles.
- CMS collections and fields.
- Component variables and variants.
- Native interactions/animation presets.
- Assets.
- Primitive components.
- Section components.
- Page composition.

Avoid building full page sections before the underlying tokens, styles, and primitives are mapped.

### 6. Build Components Natively

Use YCode native layers and component instances.

Component creation rules:

- Reuse an existing native component when it matches the source pattern.
- Create a component when a section or pattern is reused, structurally significant, or useful for designer editing.
- Use component variants when Webflow has the same component with alternate visual states, themes, layouts, or responsive/editor choices. Do not create duplicate components for variant-only differences.
- Keep layer names clear and close to the source intent.
- Add component variables only when the designer needs per-instance overrides.
- Ensure component variables have placeholders/defaults when needed for Builder rendering.
- Keep CMS list structures as native collection layers.
- Use native slider layers for slider/carousel/tab content when possible.
- Preserve forms as native YCode form components, not page-only layer groups or HTML embeds.

Do not use:

- Webflow wrapper components.
- HTML embeds for normal layout.
- Raw `<style>` blocks for normal styling.
- Runtime scripts for static layout.
- Source layer IDs as stable runtime selectors.

### 6.1. Build Forms For YCode Detection

YCode detects and stores form submissions from native rendered `form` layers.

Form detection rules:

- Use a native layer with `name: "form"` or rendered tag `form`.
- Set `settings.id` to the stable form ID. This is the `form_id` used in submissions and the Forms dashboard.
- Also set `attributes.id` to the same value for stable DOM targeting and accessibility.
- Use kebab-case form IDs such as `contact-form`, `newsletter-form`, or `quote-request-form`.
- Every submitted field must be a native `input`, `textarea`, `select`, `checkbox`, or `radio` with a stable `name` attribute.
- Use real `label` layers with `for` attributes matching the field `id` when possible.
- Set submit buttons explicitly with `attributes.type = "submit"`. YCode also converts buttons inside forms to submit buttons in preview/published mode when type is missing or `button`, but explicit is safer.
- Add native success/error alert layers when visible feedback is required. YCode toggles descendants marked with `data-alert-type="success"` or `data-alert-type="error"` after submission.
- Do not replace forms with HTML embeds or custom scripts unless the user explicitly requests an external form provider.

Runtime behavior:

- On submit, YCode prevents the browser default submit, reads the form with `FormData`, and posts to `/ycode/api/form-submissions`.
- Submissions are grouped by `form_id` in the YCode Forms screen.
- Select values are saved as the selected option text, not just raw IDs, when the option text differs from the value.
- Unchecked checkboxes are saved as `false`.
- Optional email notifications and success redirects are read from `layer.settings.form`.

Component rule:

- If a form is inside a component, set `settings.id` on the form layer inside the component, not only on the page instance.
- Prefer MCP form settings and layer settings tools for form configuration.
- When editing component form JSON directly is unavoidable, update only the target variant. If the default variant is changed through SQL, keep `components.layers` and `components.variants[0].layers` in sync, then invalidate `content_hash` with a new non-null value.

### 7. Implement CMS Natively

Detect CMS lists from DevLink, static HTML, naming, repeated cards, and Webflow collection wrappers.

For each CMS list:

- Identify the source collection/model.
- Map source fields to YCode collection fields.
- Create or reuse the collection.
- Configure source-compatible field metadata, options, count fields, references, default sorting, manual ordering, and field order when present in Webflow.
- Bind dynamic pages to their collection through MCP when the source list links to detail pages.
- Bind text through `dynamic_rich_text` with inline `dynamicVariable` nodes.
- Bind links to the correct dynamic page and current collection item.
- Bind images/assets to the correct fields.
- Verify rendered items use real CMS data.

Never bind CMS text by setting `variables.text` directly to a field object. The text layer must be inside the correct collection layer and use YCode's dynamic rich text variable shape.

### 7.1. Localize Native Components

If the YCode project has more than one locale, translations are part of the import. Do not mark the import complete until component text has been translated through YCode's native localization system.

Localization rules:

- Use the existing locale list as the source of truth. Do not create locales unless the user explicitly asks.
- Identify the YCode default/primary locale before writing any component content.
- Native layer default text must be written in the YCode primary locale, even when the Webflow source project is in another language.
- If the Webflow source language is not the YCode primary locale, use the Webflow source copy as the translation for the matching secondary locale instead of as the component default.
- Do not duplicate components per language.
- Do not hardcode translated variants into page-specific layer trees.
- Translate reusable section text as component translations with `source_type: "component"` and `source_id: <component_id>`.
- Translate page-only text as page translations with `source_type: "page"` and `source_id: <page_id>`.
- Translate visible CMS fields used by imported collection lists with `source_type: "cms"` when the CMS item is reused across locales.
- Use the content key format `layer:<layer_id>:text` for text layers.
- For CMS field translations, use the project's CMS translation key convention, such as `field:key:<field_key>` when that is how existing CMS translations are stored.
- Use `content_type: "text"` for simple text and `content_type: "richtext"` for rich text JSON.
- Use the expanded rich-text translation support for rich-text fields/blocks instead of flattening structured content into plain strings.
- Mark translations as completed only when the value is final and non-empty.
- Batch translation writes when possible.
- Record translation coverage in the import ledger.

Workflow:

1. List locales with `ycode_list_locales`.
2. Determine the primary locale and the source content language.
3. If they differ, translate/import default component/page/CMS text into the primary locale first.
4. Inspect the page with `ycode_get_layers` to identify component instances and component IDs.
5. Inspect each component with `ycode_get_component` and list text layer IDs.
6. Check existing translations with `ycode_list_translations(locale_id)`.
7. Upsert missing translations with `ycode_batch_set_translations`.
8. Verify both the primary preview and the localized preview, for example `/ycode/preview/<page-slug>` and `/ycode/preview/<locale-code>/<page-slug>`.
9. Verify the localization editor, for example `/ycode/localization?locale=<code>`.

Example component translation entry:

```json
{
  "locale_id": "<target-locale-id>",
  "source_type": "component",
  "source_id": "<component-id>",
  "content_key": "layer:<layer-id>:text",
  "content_type": "text",
  "content_value": "Translated text",
  "is_completed": true
}
```

Publishing rule:

- Localization writes are draft changes.
- The builder/localization preview can show draft translations before public pages do.
- Public localized pages only use published, completed, non-empty translations.
- Never publish translations unless the user explicitly confirms publishing.

### 8. Apply Styles From Source, Not From Taste

For every important layer, cross-check DevLink classes with static export CSS.

If the current YCode project already has an approved native style for the same pattern, use the YCode style instead of copying the Webflow value exactly. The goal is accurate migration into the project's native design system, not blind duplication of obsolete Webflow values.

Apply:

- Exact colors from variables or CSS.
- Exact font family, size, weight, line height, and letter spacing.
- Exact padding, margin, gap, width, max-width, min-height, and radius.
- Exact grid and flex behavior.
- Exact image fit and position.
- Exact hover and active states where supported.

If a value is ambiguous, inspect computed styles in the browser against the static Webflow export.

### 9. Verify Tailwind/YCode Class Generation

YCode may not generate every arbitrary Tailwind class. Do not assume a class works because it is present in layer JSON.

Always verify computed styles for suspicious values, especially:

- Arbitrary font sizes such as `text-[150px]`.
- Arbitrary grid definitions such as `grid-cols-[1fr_1fr_1fr]`.
- Responsive arbitrary variants such as `max-md:text-[56px]`.
- Grid span variants such as `max-md:col-span-1`.
- CSS functions such as `clamp()`, `min()`, `max()`, and `calc()`.

If a class is not generated:

- Prefer an equivalent class already generated by YCode.
- Prefer native YCode design controls when they generate valid classes.
- Document the workaround in the ledger.
- Use SQL only after checking the current MCP tools cannot express the needed design setting.

### 10. Compose the Page

Build the page from native sections in the source order.

Composition rules:

- Reuse global nav/footer only if they match the source project and current page needs.
- Preserve section order from the static export unless the user requests changes.
- Preserve semantic heading hierarchy.
- Ensure links point to the correct YCode pages or external URLs.
- Ensure component instances remain editable in Builder.

### 11. Rebuild Interactions Conservatively

Classify each interaction:

- Native YCode animation preset.
- Native YCode raw layer interaction/GSAP timeline.
- Native hover/transition state.
- Native link/button behavior.
- Native slider behavior.
- Native CMS/dynamic page behavior.
- Custom code fallback only when there is no native YCode equivalent.

Prefer YCode 1.13.0 interaction tools for scroll reveals, hover/click effects, staggered entrances, parallax, and loops. Avoid custom scripts for normal visual styling or motion. If custom code is required, use stable HTML IDs or explicit custom attributes, never generated component layer IDs.

When SQL is required for component interactions, update both the legacy/default `components.layers` tree and the targeted `components.variants[N].layers` tree for default-variant edits. Invalidate `content_hash` with a non-null value, then verify unpublished-change detection before preview QA.

### 11.1. Static HTML Export

YCode 1.13.0 can export the published site as standalone HTML to local disk, Amazon S3, or a GitHub branch.

Export rules:

- Export only after the user explicitly confirms publishing/exporting.
- Static export uses published pages and published translations, not draft preview state.
- Before export, verify SEO metadata, fonts, Tailwind classes, sliders, lightboxes, forms, images/srcset, redirects, and localized routes in the published site.
- Record export target, command/tool used, timestamp, and any post-export checks in the ledger.
- Do not use static export as a substitute for native YCode page/component QA; it is a delivery target after the native build is correct.

### 12. QA Against Webflow

Verification is mandatory before handoff.

Use the static Webflow page and YCode preview side by side.

Check desktop, tablet, and mobile:

- Overall section order.
- Container widths.
- Spacing and vertical rhythm.
- Typography scale.
- Colors and backgrounds.
- Cards and grid behavior.
- CMS item count and field content.
- Images and videos.
- Hover states and links.
- Native interactions and animation triggers.
- No horizontal overflow.
- Heading hierarchy.
- Component editability in Builder.
- Draft/published state is understood: use `/ycode/preview` for draft QA and public routes only after explicit publish confirmation.

Use screenshots and computed-style checks for major elements. Record evidence and remaining differences in the ledger.

Differences are acceptable when they match documented YCode design-system decisions. Do not “fix” those differences back to Webflow during QA.

### 13. Handoff to Designer

The target result is a strong native baseline, not permanent pixel-lock.

Before handoff:

- Make sure the page is editable in YCode Builder.
- Make sure native components and styles are clean enough to refine.
- Leave no Webflow-only wrappers.
- Leave no unexplained custom CSS or scripts.
- Document known differences and suggested design refinements.
- Do not publish unless explicitly requested.

## Idempotency Rules

- Search before creating resources.
- Prefer upsert-style operations for data writes when available.
- Use MCP variant-targeted edits for component variants.
- Use targeted updates, not broad replacement of `layers` or `variants`, especially if the designer may have made manual Builder edits.
- When SQL is required, update only the exact node/path needed.
- For components, keep `layers` and `variants[0].layers` synchronized only when direct SQL changes the default variant structure/classes.
- Do not modify published rows when only draft changes are intended.
- Do not overwrite unrelated page/component edits.
- If a conflict exists, stop and ask the user.

## Native Resource Checklist

Use this checklist to decide what should become a reusable YCode resource.

### Create or Reuse a Style When

- A typography treatment appears repeatedly.
- A section/container pattern appears repeatedly.
- A button/link/card pattern appears repeatedly.
- A layout utility is part of the source design system.
- The designer will likely reuse it across pages.

### Create or Reuse a Component When

- A full section appears on multiple pages.
- A card, CTA, footer, nav, testimonial, pricing item, or similar pattern repeats.
- A CMS list item template repeats.
- The pattern needs variables or per-instance overrides.
- The designer should be able to drag/reuse it later.

### Keep as Local Layer Styling When

- The style is one-off.
- The value exists only to fix a local layout detail.
- A reusable style would create unnecessary design-system noise.

## Anti-Patterns

- Starting YCode writes before reading all source files.
- Importing only from DevLink and ignoring the static rendered output.
- Importing only from static HTML and ignoring component structure.
- Creating a visual approximation from memory or taste.
- Overriding approved YCode design-system decisions with Webflow values.
- Creating speculative tokens, styles, or components.
- Duplicating existing YCode resources without checking them.
- Using custom code for normal layout and responsive behavior.
- Binding CMS text with direct field variables instead of dynamic rich text.
- Creating duplicate components where a YCode component variant is the correct model.
- Rebuilding animations with custom code before checking native YCode interaction presets.
- Trusting layer JSON classes without verifying computed styles.
- Replacing entire component/page JSON after designer edits.
- Publishing during import without explicit approval.

## Definition of Done

An import is ready for designer handoff when:

- The import ledger is complete and up to date.
- All required source files were read and recorded.
- Native YCode resources were created or reused idempotently.
- CMS lists render real dynamic data.
- Component variants, variables, interactions, and form settings are native MCP/editor state where applicable.
- Page composition matches the Webflow source at a high fidelity baseline.
- Documented YCode design-system decisions prevail over conflicting Webflow values.
- Desktop, tablet, and mobile previews were checked.
- No horizontal overflow remains.
- Major computed styles were verified for risky classes.
- Components are editable in YCode Builder.
- Any static HTML export requested by the user has been verified against the published site.
- Known differences and workarounds are documented.
- Nothing was published without explicit approval.
