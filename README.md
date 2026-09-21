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
