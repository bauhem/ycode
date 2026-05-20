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

