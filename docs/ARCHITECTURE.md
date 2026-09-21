# Technical Architecture

## 1. Shape

IMPOSSIBLE is an event-led application with a deterministic orchestration core and bounded AI workers.

```
Control Room / Public Timeline
            |
       Application API
            |
   ---------------------
   | Orchestrator      |
   | Approval Engine   |
   | Agent Runtime     |
   ---------------------
      |           |
 Postgres      Model Gateway
      |
 Event Ledger
```

## 2. Recommended V1 stack

- Next.js App Router + TypeScript
- Vercel hosting/functions
- Supabase Postgres + Auth
- Zod schemas
- model-provider adapter
- background execution chosen only when synchronous/serverless execution becomes insufficient

Avoid premature distributed-agent infrastructure.

## 3. Event-led design

Every material domain change emits an event in the same logical operation where practical.

Events have:
- monotonically ordered sequence within experiment
- type
- actor
- visibility
- typed payload
- timestamp

The private ledger is authoritative for audit. Public timeline entries are sanitised projections.

## 4. State machine

Primary path:

DRAFT
→ DISCOVERING
→ CHALLENGING
→ SELECTING
→ PLANNING
→ BUILDING
→ TESTING
→ DECIDING
→ COMPLETED

PAUSED can interrupt active stages. KILLED is terminal.

Transition validation belongs in code, not agent prompts.

## 5. Agent runtime

Agents are stateless workers from the application's perspective. Durable context is supplied by references to persisted domain records.

Generic flow:

1. Orchestrator creates AgentRun.
2. Runtime loads only required context.
3. Provider receives system contract + task.
4. Output is parsed against schema.
5. Invalid output retries within a bounded policy.
6. Valid output is persisted.
7. Domain service decides what state changes are permitted.
8. Events are emitted.

An agent never receives database credentials or unrestricted mutation access.

## 6. Approval engine

Each proposed external/consequential Action has a risk classification.

GREEN can execute automatically if policy permits.
AMBER creates Approval and waits in V1.
RED always creates Approval and waits.

Approval decision and subsequent execution are separate events. Approval does not imply execution succeeded.

## 7. Evidence model

Evidence is not generic memory.

Each Evidence record stores provenance plus the claim it supports. Agent conclusions should reference evidence IDs.

Source snapshots should respect source terms/copyright. Store summaries/excerpts needed for audit rather than indiscriminately copying content.

## 8. Security

- all model/API secrets server-side
- Supabase RLS
- operator-only private routes
- public projection allowlist rather than denylist
- structured redaction before publication
- never log environment variables or raw auth tokens
- external actions executed through narrowly scoped adapters

## 9. Model abstraction

Define a small interface around capabilities required by agents rather than provider-specific code.

Example capabilities:
- structuredGenerate
- toolEnabledGenerate (later)
- embedding (only if needed)

Store provider/model metadata with AgentRun for reproducibility and cost analysis.

## 10. Background work

Do not select a heavyweight orchestration framework before required.

V1 can start with explicit jobs and persisted statuses. Requirements that may later justify a durable workflow engine:
- multi-hour waits
- scheduled retries
- webhook-resumed jobs
- long research fan-out
- autonomous seven-day operation

The database remains the source of durable state regardless.

## 11. Repository strategy

IMPOSSIBLE core stays in this repository.

Products created by experiments should eventually live in separate repositories so:
- failed ventures do not pollute core
- permissions can be scoped
- deployments are isolated
- costs and provenance are attributable per experiment

V1 Builder may stop at a build specification until this boundary is implemented safely.

## 12. Social architecture

Documentarian reads approved/sanitised event context.

V1:
Event -> significance classifier -> draft -> factual claim validation -> Approval

Later:
Approval -> platform adapter -> publication result -> Event

Never let social-platform credentials enter the Documentarian model context.

## 13. Observability

Track:
- agent latency
- provider/model
- tokens/cost
- retries/schema failures
- orchestration errors
- approvals
- human interventions
- external action results

The system should eventually answer: exactly why did Experiment 17 cost more and require more human intervention than Experiment 16?
