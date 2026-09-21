# AGENTS.md — Instructions for Codex and coding agents

## Mission

You are building **IMPOSSIBLE**, an evidence-driven AI venture engine that runs seven-day company experiments.

Read `docs/PRD.md` before making architectural or product decisions.

## Non-negotiable rules

1. Do not weaken approval gates to make a demo easier.
2. Do not put permissions solely in prompts. Enforce them in application code.
3. Do not fabricate evidence, users, revenue, metrics or external actions.
4. Model-generated structured data must be schema-validated before persistence.
5. Events are append-only audit records. Do not silently rewrite history.
6. Keep secrets and credentials out of prompts, event payloads and client bundles.
7. Prefer deterministic code over LLM judgement for state transitions, permissions, budgets and deadlines.
8. Keep agents narrow. The Orchestrator owns workflow state.
9. Build the smallest implementation that satisfies the current milestone.
10. Do not introduce infrastructure because it is fashionable. Add it when a requirement demonstrates need.
11. Every consequential external action must pass the risk/approval engine.
12. Preserve source provenance for evidence.

## Working method

For each task:

1. Read the PRD and relevant architecture section.
2. Inspect existing code before changing it.
3. State assumptions in the PR/commit description.
4. Implement one bounded vertical slice.
5. Add or update tests.
6. Run lint/typecheck/tests.
7. Report exactly what changed, what remains, and any risk introduced.

Do not opportunistically refactor unrelated code.

## Preferred stack

- Next.js App Router
- TypeScript
- Supabase/Postgres
- Zod or equivalent runtime schemas
- server-side model calls
- Vercel deployment

Do not hard-wire the application to one model provider. Use a small provider interface.

## Domain invariants

- At most one active primary experiment in V1.
- Experiment deadline is persisted and not recalculated from page load.
- Stage changes must be valid state-machine transitions.
- AMBER and RED actions cannot execute without required approval.
- RED actions always require explicit human approval.
- Agents cannot alter Constitution rules.
- Agent output never directly mutates protected state without validation/application logic.
- Evidence must identify provenance.
- Human interventions must be measurable.
- Public events are sanitised projections of private events, never raw internal logs.

## Initial state machine

`DRAFT -> DISCOVERING -> CHALLENGING -> SELECTING -> PLANNING -> BUILDING -> TESTING -> DECIDING -> COMPLETED`

Global escape states:
`PAUSED`, `KILLED`

Transitions should be explicit and tested.

## Agent interface

Each agent run should accept a typed task and return typed structured output.

Persist:
- agent type
- task type
- model/provider
- input reference(s)
- start/end timestamps
- status
- validated structured output
- error metadata
- token/cost metadata when available

Do not persist private chain-of-thought. Persist concise rationale, evidence references and decisions.

## Definition of done

A task is not done merely because UI renders.

Relevant tests must pass, error states must be handled, events must be emitted where required, and approval/security invariants must remain intact.

## First implementation target

Build **Milestone 0/1 only** before adding autonomous web research:

- app boots
- Supabase schema/migrations exist
- operator auth
- experiment creation
- persisted seven-day deadline
- state machine
- append-only events
- Control Room reads real persisted state
- approval data model and permission guard skeleton
- tests for transitions and risk gates

Once this foundation is trustworthy, add Scout.
