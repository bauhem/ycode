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
4. **ALWAYS commit and push** changes after completing a task.
5. **NEVER use relative deep paths** — use `@/` aliases for all imports outside the current directory.

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

## 🔧 Environment

- **Local dev**: `npm run dev` (starts SSH tunnel to VPS + Next.js on port 3002)
- **Supabase**: Self-hosted at `https://supabase.bauhem.com`
- **Admin**: `https://admin.bauhem.com`
- **MCP Bridge**: `scripts/mcp-ycode-bridge.js` (connects local agents to admin MCP server)
