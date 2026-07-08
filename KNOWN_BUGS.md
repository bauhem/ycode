# Known/Legacy YCode Bugs & Workarounds

⚠️ Verify before relying on them — some may be fixed in newer YCode versions.

## 1. `clamp()` in font-size → invalid Tailwind class
`fontSize: "clamp(1.75rem, 5vw, 2.5rem)"` produces `text-clamp(...)` (invalid).
**Workaround**: Set `fontSize` to max px equivalent, add `#ov-heading { font-size: clamp(...) !important; }` in `custom_code.head`.

## 2. Component layer JSONB paths are fragile
Verify `customName` before writing updates. Use `ycode_update_layer_recursive` for settings, `jsonb_set` for design/class changes. Verify with SELECT after any SQL.

## 3. Component variables must have `default_value` for Editor rendering
Linked variables without `default_value` render blank on Canvas.
**Workaround**: Always set `default_value` on `components.variables` via SQL.

## 4. UUID syntax crash with non-UUID virtual items (EAV query)
Virtual items (e.g. `__page_navigation_parent__`) cause UUID errors.
**Fix**: Regex check `/^[0-9a-f]{8}-...$/i` before querying `collectionItemValueRepository.ts`.

## 5. HTML Nesting Repair → Style inheritance lost
`<p>` tag + `dynamic_rich_text` + Tiptap `<p>` = `<p><p>...</p></p>` (invalid).
**Workaround**: Use `settings.tag: "div"` for rich text layers, never `"p"`.

## 6. Canvas renders layers from `variants` column, not `layers`
SQL updates to `components.layers` without updating `variants[0].layers` → blank canvas.
**Workaround**: `UPDATE components SET variants = jsonb_build_array(jsonb_build_object('id', 'cmpvar-...', 'name', 'Default', 'layers', layers))`

## 7. SQL text layers lack `restrictions.editText` → CMS fieldGroups invisible
**Workaround**: Always include `"restrictions": {"editText": true}` on every text/heading layer created via SQL. Never include unrelated variable types.

## 8. `tagLayersWithComponentId` overwrites `_masterComponentId` on sub-components
→ translations not found, French text on `/en`.
**Fix** (applied 2026-06-08): `layer._masterComponentId = layer._masterComponentId || componentId` in `lib/resolve-components.ts:567`.

## 9. SQL edits to `components.layers` only affect draft row
Frontend reads `is_published = true` → stale published version.
**Workaround**: Prefer MCP (`ycode_update_component_layers`). If SQL, apply to BOTH draft AND published rows.

## 10. Component translations override CMS-bound `dynamicVariable` text layers
`injectTranslatedText` runs AFTER `injectCollectionData` → overwrites CMS field values.
**Workaround**: Delete component-level translations for layers bound to CMS fields. Only keep translations for truly static text.

## 11. Per-page `generated_css` stale after creating/updating components
New component classes missing from published dynamic pages.
**Workaround**: Regenerate CSS via `POST /ycode/api/css/generate-pages`, then sync draft→published `generated_css`.

## 12. Setting rich_text via SQL → empty in builder
`\uXXXX` escapes stored as literal text, not actual chars.
**Workaround**: Always use MCP `ycode_update_collection_item` with actual UTF-8 characters.
