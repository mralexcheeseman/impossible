# IMPOSSIBLE

**Can AI build a real business from nothing in seven days?**

IMPOSSIBLE is an experimental AI venture engine. It repeatedly discovers a real problem, forms a testable business hypothesis, builds the smallest useful product, gets it in front of real people, measures behaviour, and decides whether to continue, pivot or kill — while documenting the journey publicly.

The objective is not to generate startup ideas. It is to build an evidence-driven system that becomes progressively better at autonomous entrepreneurship.

## Core constraint

Each experiment begins with:

- £0 starting acquisition budget
- 7 days
- no fabricated users, testimonials, demand or engagement
- no spam or deceptive identity
- evidence required for material claims
- human approval for consequential actions
- every human intervention logged

## V1 agents

1. **Scout** — finds evidenced problems and opportunities.
2. **Strategist** — turns evidence into falsifiable propositions and experiments.
3. **Sceptic** — attacks assumptions, evidence quality and premature conclusions.
4. **Builder** — produces the MVP and deployment plan.
5. **Documentarian** — turns the event stream into an accurate public narrative.

An **Orchestrator** owns state, sequencing, permissions, time and approvals. Agents are workers; they do not own the company.

## V1 stack

- Next.js / TypeScript
- Vercel
- Supabase / Postgres
- Model access behind a provider abstraction
- Structured event log as the system backbone

Base44 may later be used by Builder when it is the best tool for a particular experiment, but it is not a dependency of IMPOSSIBLE.

## Repository map

- `docs/PRD.md` — canonical product requirements
- `docs/ARCHITECTURE.md` — technical architecture and state model
- `AGENTS.md` — operating instructions for Codex and coding agents
- `docs/ROADMAP.md` — staged implementation sequence

## Definition of V1 success

A user can press **START COMPANY**, the system opens a seven-day experiment, agents can progress through research → hypothesis → challenge → build plan, consequential actions stop at approval gates, every action is recorded as an event, and the Control Room accurately reconstructs what happened.

V1 does **not** need to autonomously make money. It needs to prove that the operating system is trustworthy, inspectable and capable of running Experiment 001.

See [docs/PRD.md](docs/PRD.md).

## Local development (M0)

Prerequisites: Node.js 22.20.0 (see `.nvmrc`) and npm 10+. With nvm installed:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open <http://localhost:3000>. The M0 shell runs and builds without credentials, network data or a database. It deliberately shows no active experiment and offers no operational controls. Operator authentication, database migrations and real experiment state are M1 work.

Optional Supabase configuration:

```sh
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project's Connect dialog. Use an HTTPS origin, or HTTP localhost for local development. Factories require a modern `sb_publishable_...` key; legacy JWT anon keys are intentionally not supported. Never place a secret/service-role key in a `NEXT_PUBLIC_` variable: Next.js embeds these values in browser builds. Runtime validation is not a substitute for keeping secrets out of build configuration.

For a local Supabase instance, install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) and its supported container runtime, then run `supabase init` and `supabase start` locally and copy the local URL and publishable key. This optional step is not needed for M0 checks. Do not commit ad-hoc local schema changes: M1 will introduce reviewed configuration and migrations, RLS policies and database tests. For a hosted development project, use the dashboard-provided public values. Never point previews/tests at production data.

`src/lib/supabase/client.ts` provides a browser factory; `server.ts` provides a fresh request-scoped factory for cookie-writable Server Actions/Route Handlers. Both are unused setup boundaries. The server factory intentionally propagates cookie-write errors. Before using private Server Components, M1 must add session-refresh Proxy integration, verified identity, explicit operator authorisation and RLS. A client instance does not authorise access.

## Checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm run typecheck` generates Next.js route types first, so it works on a clean clone before a build. `npm test` is a non-watching unit suite for honest shell rendering, configuration failures and cookie/client boundaries; it does not claim live Supabase/auth coverage. `npm run test:watch` is available during development. CI runs installation and all five checks on pull requests and main. The production build needs no remote fonts or credentials.

## Vercel deployment

Import this repository into Vercel, select the Next.js preset, root directory `.` and Node.js 22.x. Use `npm ci` to install and `npm run build` to build; keep the framework's default output directory. No `vercel.json` or external resources are needed for the M0 shell. Optional public environment values must be configured separately per environment and require a rebuild when changed. Do not provision privileged credentials for M0.

After deployment, verify `/` renders the foundation and an unknown route returns 404. Deployment is a separate operator action; a successful local build or CI run does not prove a deployment occurred. Before private features ship, M1 must supply operator auth, deny-by-default RLS, migrations, session refresh and access-control tests. See [architecture review](docs/ARCHITECTURE_REVIEW.md) and [decisions](docs/adr/README.md).

## Implementation map and dependencies

- `src/app/`: static shell and global presentation; no simulated experiment state.
- `src/lib/supabase/`: explicit public configuration and browser/server setup boundaries.
- `.github/workflows/ci.yml`: reproducible checks with read-only repository permissions and no application secrets.
- `docs/adr/`: architectural decisions and milestone boundaries.

Next.js/React implement the requested UI; Supabase JS/SSR supply official cookie-aware clients; `server-only` prevents server imports in client bundles. TypeScript and React/Node types provide static checks, ESLint/Next rules check framework conventions, Vitest runs unit tests, and Prettier checks formatting. Dependencies are pinned with a committed lockfile. No agent framework, model SDK, UI kit, analytics service or orchestration infrastructure is installed.

Known tooling debt: ESLint is pinned to 9.39.5 because the React/import/accessibility plugins bundled by `eslint-config-next@16.3.5` do not support ESLint 10 (verified by dependency checks and a failing rule load). ESLint 9 is deprecated upstream. Upgrade the lint stack together when compatible; do not disable rules or force incompatible peer versions.
