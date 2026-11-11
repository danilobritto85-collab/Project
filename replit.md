# Jungle Beatdown

A browser-based 2.5D jungle beat ’em up using the user-supplied pixel-art sprites and game specification.

## Run & Operate
- `pnpm --filter @workspace/jungle-beatdown run dev` — run the playable game (defaults: `PORT=25103`, `BASE_PATH=/`)
- `pnpm --filter @workspace/jungle-beatdown run typecheck` — check the game frontend
- `pnpm --filter @workspace/jungle-beatdown run test` — sprite/rule unit tests

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env (API/DB only): `DATABASE_URL` — Postgres connection string

### Windows / Cursor notes
- Native win32 packages for esbuild, lightningcss, Tailwind oxide and Rollup are allowed in `pnpm-workspace.yaml`.
- After first install on pnpm 12+, run `pnpm approve-builds --all -y` if esbuild postinstall is blocked.
- Spec source of truth: `JUNGLE_BEATDOWN_ESPECIFICACAO.md`

## Stack

- pnpm workspaces, Node.js 24+ (local Cursor currently Node 26 LTS), TypeScript 5.9
- Game UI: React 19 + Vite 7 + Canvas 2D + Web Audio
- API: Express 5 (optional; game is frontend-only)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild / Vite

## Where things live

- Game app: `artifacts/jungle-beatdown/`
- Simulation + render loop: `artifacts/jungle-beatdown/src/game/useJungleGame.ts`
- Per-character atlases: `artifacts/jungle-beatdown/src/game/*Sprites.ts`, `panteraCombo.ts`, `toenailPolish.ts`, `spriteMask.ts`
- HUD / menu / touch: `artifacts/jungle-beatdown/src/App.tsx`, `src/index.css`
- Art + audio: `attached_assets/` (+ `attached_assets/generated_audio/`)
- Agent product memory: `.agents/memory/`
- Full product rules: `JUNGLE_BEATDOWN_ESPECIFICACAO.md`

## Architecture decisions

- Frontend-only combat: Canvas 2D + synthesized/file Web Audio; no server round-trips for fights.
- Opponent counts are free integers (boss capped at 1 until scale/collision/IA are validated for duplicates).
- Special intimate/opt-in scenes always go through Accept/Decline + Esc; combat-only defeat animations may start automatically.
- Sprite crops stay in native sheet space; checkerboards use per-panel edge flood-fill, not global gray keys.
- Laura KO offers an opt-in special: sheets `7536004`/`8481211` (panels 7–10) + `7593869` (11–13). Decline keeps combat-only defeat; Esc exits the special.
- Defeeated freezes a full fight snapshot and restores it exactly on exit.

## Product

The game is frontend-only and uses Canvas 2D and file/synthesized Web Audio. It supports keyboard + touch movement, running, punches, kicks, jumps, a configurable roster, grapple escape challenges, Defeeated previews, and timed/custom defeat sequences. Interface copy is in Brazilian Portuguese; keep the **Defeeated** label.

## User preferences

- Free opponent quantities (“quantos personagens quiser”); warn on large rosters.
- Restart returns to opponent selection and keeps counts; stop scene audio first.
- Generic defeats: no Game Over modal, no countdown card, enemies freeze idle.
- Optional scenes: explicit Aceitar/Recusar, never preselected accept; Esc exits.
- Amazon toenails stay red across variants and paired scenes.

## Gotchas

- Inspect uploaded art at native resolution before cropping; some `.png` names were JPEG data.
- Run verification from the artifact package (`pnpm --filter @workspace/jungle-beatdown …`), not assumed root binaries.
- Two Laura kick cells overlap neighboring poses — they stay excluded from `LAURA_ATTACKS` until separate art exists.
- Replit historically pinned linux-only optional deps; Windows needs the win32-x64 natives kept.

## Pointers

- See `JUNGLE_BEATDOWN_ESPECIFICACAO.md` for acceptance criteria and migration checklist
- See `.agents/memory/MEMORY.md` for cross-session product decisions
