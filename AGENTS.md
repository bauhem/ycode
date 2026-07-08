# AI Agent Instructions — YCode Fork

## ⚠️ CRITICAL — Dual-Record Architecture

**Every entity has draft (`is_published=false`) and published (`is_published=true`) rows.**
| Surface | Reads |
|---|---|
| Builder UI / Preview | Draft rows |
| Public frontend | Published rows |

**Changes via MCP/UI only update drafts.** To make changes visible on the public site, either run `ycode_publish` (requires approval) or manually sync draft→published via SQL.

**Checklist before done:** [ ] Draft? [ ] Published synced? [ ] Content_hash invalidated? [ ] Publish approved?

## ⚠️ MANDATORY — Read `.cursorrules` before any code change.

## 🔒 Golden Rules
1. NEVER modify Ycode source without authorization.
2. NEVER make assumptions — ask if unclear.
3. ALWAYS follow `.cursorrules` conventions.
4. NEVER commit/push/publish unless explicitly asked.
5. NEVER use deep relative paths — use `@/` aliases.
6. NEVER overwrite user Canvas edits via broad SQL — use `jsonb_set` or MCP.

## 🏗️ Architecture
- **Framework**: Next.js 15, TypeScript, Tailwind v4, Supabase
- **UI**: ShadCN in `components/ui/` — always use these
- **State**: Zustand in `/stores/`, domain-scoped
- **Data**: `API Route → Repository → Supabase`
- **Hooks**: Custom hooks in `/hooks/`
- **Utils**: Pure functions in `/lib/`

## 📐 Key Conventions
- Files: `kebab-case.tsx`, exports: `PascalCase`
- Single responsibility per component
- `React.memo` for expensive components
- `'use client'` only when strictly needed
- **Imports order**: React/Next → externals (alpha) → ShadCN (alpha) → internals (alpha) → stores → lib → types (last)
- **Never `any`** — always proper interfaces
- **Loading states** for all async (`<Spinner />`)
- **Error handling** with try/catch/finally
- **Early returns** over nested ternaries
- **Repository pattern mandatory** — create repo for each entity
- **Null-check after `getSupabaseAdmin()`**
- **Idempotent migrations** — `IF NOT EXISTS`, `hasColumn()`
- Semantic HTML, `aria-label` for icon buttons, keyboard nav
- Use `upsert` for DB, never queries in loops
- Use `CreateXData`/`UpdateXData` for repo inputs (not `Omit<>`)
- Zod: use `message` not `required_error`

## 📝 Commits
`<type>: <summary>` (imperative, 50 chars max, no period, no AI attribution).
Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `test`.

## 🛑 Translation Integrity
- Dual-record: draft + published MUST coexist.
- NEVER `DELETE` translations, NEVER change `is_published` via SQL.
- Only `INSERT` new translations (draft + published copies via `ON CONFLICT DO NOTHING`).
- Never touch `page`/`component` source_type translations — only `cms` when explicitly authorized.
- After `ycode_batch_set_translations`, INSERT published copies:
  ```sql
  INSERT INTO translations (id, locale_id, source_type, source_id, content_key, content_type, content_value, is_completed, is_published, created_at, updated_at)
  SELECT gen_random_uuid(), '<locale-id>', source_type, source_id, content_key, content_type, content_value, true, true, NOW(), NOW()
  FROM translations WHERE locale_id = '<locale-id>' AND source_type = '<type>' AND source_id = '<id>' AND is_published = false AND is_completed = false
  ON CONFLICT (locale_id, source_type, source_id, content_key, is_published) DO NOTHING;
  ```

## 🚫 What NOT to Do
- No HTML embed / `<style>` / raw CSS — use Tailwind classes
- No `console.log` in production (use `console.error` with context)
- No direct Supabase in API routes — use repositories
- No `any`, no `Omit<>` for repo inputs, no deep relative paths
- No queries in loops — use batch `upsert`
- No non-idempotent migrations
- No `yarn.lock` (project uses npm)
- Delete debug scripts from `/scripts/` when done

## ✅ Pre-Commit
[ ] ShadCN for primitives? [ ] Hooks extracted? [ ] Single responsibility? [ ] Proper types (no `any`)? [ ] Imports ordered? [ ] Loading states? [ ] Error handling? [ ] Early returns? [ ] `'use client'` minimal? [ ] Repository pattern? [ ] Null-check `getSupabaseAdmin()`? [ ] Icons in both type + ICONS? [ ] `CreateXData`/`UpdateXData`? [ ] Zod `message`? [ ] Ran `npm run lint:fix && npm run type-check`? [ ] `removeSpaces` for design props? [ ] Idempotent migrations?

## 🔧 Environment
- **Local**: `npm run dev` (SSH tunnel + Next.js :3002)
- **Supabase**: Self-hosted on VPS via Docker
- **Admin**: `bauhem.com` (Netlify)
- **MCP**: `scripts/mcp-ycode-bridge.js`
- **SSH**: `ssh -i ~/.ssh/vps_ycode -L 5433:172.18.0.4:5432 ubuntu@51.222.143.231`

## 📎 External References
- Detailed localization workflow → see YCode MCP section in old AGENTS.md or docs
- Known bugs & workarounds → `KNOWN_BUGS.md`
- Full DevLink → YCode import playbook → `docs/WEBFLOW_TO_YCODE_NATIVE_IMPORT_PLAYBOOK.md`
