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

### State & Async
- Always show loading states with `<Spinner />`
- Always handle errors with try/catch/finally
- Use early returns instead of nested ternaries
- Use `upsert` for DB operations, never queries in loops

### Database
- **Repository pattern is mandatory** — create a repository for every new data entity
- Use `@/lib/...` alias imports always — never relative paths like `../supabase-server`

---

## 🚫 What NOT to Do

- Do NOT add `yarn.lock` (project uses npm)
- Do NOT commit `.playwright-mcp/`, `.opencode/`, `.specify/` (in `.gitignore`)
- Do NOT write debug/test scripts in `/scripts/` — delete them when done
- Do NOT use `console.log` in production components (use `console.error` with context for errors only)
- Do NOT use direct Supabase client in API routes — always use repositories

---

## 🔧 Environment

- **Local dev**: `npm run dev` (starts SSH tunnel to VPS + Next.js on port 3002)
- **Supabase**: Self-hosted at `https://supabase.bauhem.com`
- **Admin**: `https://admin.bauhem.com`
- **MCP Bridge**: `scripts/mcp-ycode-bridge.js` (connects local agents to admin MCP server)
