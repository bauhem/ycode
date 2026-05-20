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
