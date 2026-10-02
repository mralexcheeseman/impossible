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

## Current implementation — M1

M0 is merged. M1 adds a private operator Control Room, Supabase password sign-in, database-backed operator authorisation, transactional experiment commands, an append-only ledger, intervention records and approval storage. No agents or external execution adapters are enabled. The public page does not reveal experiment state.

## Local development

Prerequisites: Node.js 22.20.0 (see `.nvmrc`) and npm 10+.

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open <http://localhost:3000>. The public shell and setup-pending login page work without credentials. To use the Control Room, follow [the operator runbook](docs/OPERATIONS.md) to apply migrations, provision one operator and configure Supabase.

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Only modern `sb_publishable_...` keys are supported. Never put a privileged key in a public environment variable. Preview environments must use development data, never production credentials.

## Checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm run typecheck` generates Next.js route types before checking. Tests cover configuration, cookie forwarding, verified operator membership, private-route refresh, domain input and actual SQL transitions/RLS/audit atomicity. PGlite needs no container runtime. CI additionally runs `npm run test:postgres` against disposable PostgreSQL 17 to test simultaneous independent requests. See the runbook before running that command locally.

## Deployment

Import the repository into Vercel with the Next.js preset, root `.`, Node.js 22.x, install `npm ci`, build `npm run build`, and default output. No `vercel.json` is needed. Configure the project's public environment variables per environment and rebuild after changes. Apply the migration and provision the operator separately; deploying a UI does not provision a database.

Follow the [staging checklist](docs/OPERATIONS.md) before starting a real experiment. A production build/CI pass is not a claim of deployed or hosted-auth validation.

## Code boundaries

- `src/app/`: public shell, login, private Control Room and server actions.
- `src/domain/`: validated command/data contracts, UI transition affordances and deny-by-default execution skeleton.
- `src/lib/auth/`: server-verified identity plus database operator membership.
- `src/lib/experiments/`: validated private read model.
- `src/lib/supabase/`, `src/proxy.ts`: user-scoped cookie clients and session refresh; no service-role key.
- `supabase/migrations/`: authoritative transactional state machine, privileges and RLS.
- `tests/kernel.test.ts`: migration tests against PGlite and CI PostgreSQL.
- `docs/adr/`: architectural decisions; `docs/OPERATIONS.md`: bootstrap and recovery.

Zod validates untrusted commands and database responses. Supabase CLI is pinned for migrations; PGlite and pg are test-only dependencies for SQL fidelity and real concurrency tests. No agent framework, model SDK, vector infrastructure or external action adapter is installed.

Known tooling debt: ESLint 9 remains pinned for compatibility with the bundled Next.js lint plugins; upgrade the lint stack together without suppressing rules. Next.js is patched to 16.3.8 following GHSA-vcvr-r3jv-pc5j (the app does not use the affected ImageResponse API).
