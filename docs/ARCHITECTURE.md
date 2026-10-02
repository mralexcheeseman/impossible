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
- durable execution selected by a recovery spike before background agents (M2); no runner dependency in M0

Avoid premature distributed-agent infrastructure.

## 3. Event-led design

Every material domain change, its ordered audit event, and any dispatch intent must commit in one database transaction. Use current-state tables plus an append-only audit ledger; full event sourcing is not required. Unique command IDs prevent duplicate domain mutations. Serialise sequence allocation within each experiment; application roles cannot update or delete audit records.

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

Persist lifecycle status separately from stage. PAUSED retains the interrupted stage and original deadline and occupies the single active experiment slot. KILLED is terminal. Resume must revalidate the deadline. After expiry, block new venture work while allowing reconciliation and final analysis.

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
RED always creates Approval and waits, unless the action is prohibited by the Constitution (for example deceptive identity or spam), in which case it is rejected outright.

Bind approval to an immutable action payload/version, target, policy version and expiry. Recheck authority, lifecycle, deadline and budget at execution. Changes invalidate approval. Unknown action types default to blocked.

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

The database remains the source of durable state regardless. Before background agents, persist job status, attempts, next run time, lease expiry, fencing/version token, input/output references and errors. Commit dispatch intent with domain state; recover expired leases with bounded retry and spend limits. A stale worker must not commit after pause/kill or a newer lease.

External actions require stable idempotency keys and recorded receipts. Unknown outcomes require reconciliation before retry, not an exactly-once promise. Pause/kill blocks new work and requests cancellation; already submitted external effects may still complete and must be recorded. Never hold an HTTP request open for a seven-day experiment.

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

## 14. Learning and narrative data contracts

Introduce with their owning milestones: versioned hypotheses/predictions with confidence, outcome target and horizon; concise rationale and supporting/contradicting evidence IDs; Sceptic objections linked to later outcomes; provider/model/prompt/schema/policy versions; metric provenance, denominators, observation windows and deduplication keys. Never store private chain-of-thought. Unknown values remain null/unknown, not fabricated zeroes.

Interventions identify actor, type (approval, correction, repair, override), reason, related run/decision and measured or estimated minutes. Avoid double-counting approval and intervention events. The Documentarian uses the beliefs and evidence available at the time, plus subsequent outcomes, with explicit claim references.

Keep sensitive evidence bodies in access-controlled records with retention/redaction rules, referenced by the ledger. An authorised deletion can retain a non-sensitive audit marker without retaining the deleted personal data.

## 15. Milestone boundaries and decisions

M0 exposes only a static shell and unused Supabase client factories. No auth, private data, protected commands, domain schemas, agents or external action execution are implemented. M1 must add verified operator authorisation, session refresh, RLS and transactional invariants before any private feature. Model-call budgets are separate from the acquisition budget.

Future Builder execution uses isolated workspaces and per-venture credentials/resources. Untrusted code and retrieved text cannot alter policy or access core secrets. See [architecture review](ARCHITECTURE_REVIEW.md) and [ADRs](adr/README.md).
