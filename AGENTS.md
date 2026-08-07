# AGENTS.md

Calendar booking app (Hexlet project). Two independent npm packages; no backend in the repo.

## Layout

- **Root** — API contract in TypeSpec: `main.tsp` → emits OpenAPI 3.1 to `tsp-output/schema/openapi.yaml` (gitignored). Run `npx tsp compile .` from root to re-emit.
- **`front/`** — React 19 + TypeScript + Vite + Mantine SPA. Separate `package.json`; install and run all frontend commands from `front/`.
- `src/api/contract.d.ts` is generated from the OpenAPI spec and gitignored. `src/api/client.ts` consumes its types via `components["schemas"]["..."]`.

## Contract → frontend types workflow

After editing `main.tsp`, regenerate the frontend types before building/committing:

```bash
npx tsp compile .          # root: emit openapi.yaml
npm run generate:api       # front/: regenerate src/api/contract.d.ts
```

Forgetting either step leaves stale types or a stale spec. `contract.d.ts` is gitignored, so it must be regenerated on a fresh clone (deps are NOT pre-generated there).

## Backend commands (run in `backend/`)

```bash
npm run start   # real in-memory API on :4010 (node:http only, no deps)
```

- `backend/src/rules.js` is the production home of business rules (slots 09:00–18:00, 30-min steps, 14-day default window, 409 `SLOT_OCCUPIED` on overlapping bookings across all event types). Keep it in sync with the contract.
- Storage is in-memory (`backend/src/storage.js`): data resets on restart.
- `backend/src/server.js` maps domain errors to coded responses (400 `VALIDATION_ERROR`, 404 `NOT_FOUND`, 409 `SLOT_OCCUPIED`) and adds CORS headers (API is for a separate frontend client).

## Frontend commands (run in `front/`)

```bash
npm run mock   # optional: plain-Node API stub on :4010 (kept as a contract reference)
npm run dev    # Vite on :5173, proxies /event-types, /bookings, /admin to :4010
npm run lint   # oxlint (NOT eslint)
npm run build  # tsc -b && vite build
```

- Start the backend (`backend/`) and `dev` together; `mock` is optional and must not run on the same port at the same time. No test framework exists; verification = `lint` then `build`.
- Backend base URL comes from `VITE_API_BASE_URL` (default `http://localhost:4010`, wired in `vite.config.ts`).
- `front/mock-server.mjs` remains as a reference implementation of the contract; `backend/` is the real backend.

## Constraints

- **Do not edit `hexlet-check.yml`** or `.github/workflows/README.md` — auto-generated Hexlet CI.
- `opencode.json` requires approval for `npx *`, installs, and downloads — expect prompts.
- Existing comments and UI copy are in Russian; match that style.

## Commit convention (Conventional Commits)

All commits — including those made by the agent — must follow the Conventional Commits spec: `type(scope): description`.

- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `style`, `build`, `revert`.
- Scope (optional, lowercase): `contract`, `backend`, `front`, `e2e`, `ci`, `docs`.
- Breaking changes: add `!` after the type/scope, e.g. `feat(front)!: ...`.
- Keep messages concise, imperative, in the project's language where appropriate.
- release-please derives version bumps and the CHANGELOG from these, so unrelated changes must not be bundled into `feat`/`fix` commits.

## e2e / releases

- `e2e/` — Playwright integration tests (TypeScript). Run with `npm test` (in `e2e/`); Playwright starts backend (:4010) + frontend (:5173) itself via `webServer`.
- `.github/workflows/ci.yml` — CI: frontend lint/build + Playwright tests.
- `.github/workflows/release-please.yml` — auto release-PR with CHANGELOG on commits to `main` (Conventional Commits).
