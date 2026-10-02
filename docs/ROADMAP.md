# Build Roadmap

## Milestone 0 — Repository foundation
- Next.js/TypeScript project
- formatting/lint/typecheck/test commands
- environment example
- CI
- Vercel-ready config
- Supabase local/deployment instructions

**Exit:** clean clone can be installed, tested and built.

## Milestone 1 — Experiment kernel
- schema + migrations
- operator auth
- Experiment service
- seven-day deadline
- state machine
- append-only Event service
- risk classifier types
- Approval model and deny-by-default execution guard
- pause/resume/kill controls; fixed deadline and stale-work fencing contracts
- atomic state/event persistence and duplicate-command handling
- Control Room shell using persisted data

**Exit:** START COMPANY creates a durable experiment and event stream; invalid transitions and protected actions are blocked by tests.

## Milestone 2 — Agent runtime
- provider abstraction
- typed AgentRun lifecycle
- structured output validation
- retry/error handling
- token/cost metadata
- local fake provider for tests
- durable runner recovery spike and ADR before background execution
- persisted job leases, fencing, retries, cancellation, deadline and spend checks

**Exit:** deterministic test agent and one real provider can execute the same typed task contract.

## Milestone 3 — Scout
- Opportunity schema/UI
- Evidence schema/provenance
- research task contract
- opportunity creation
- evidence display

**Exit:** Scout can produce auditable, schema-valid opportunities from supplied/retrieved evidence.

## Milestone 4 — Sceptic + Strategist
- independent critique
- contradiction/evidence-gap UI
- VentureHypothesis
- ExperimentPlan
- selection approval

**Exit:** system can move from opportunity to an approved falsifiable experiment without overwriting dissent.

## Milestone 5 — Approval engine
- proposed actions
- GREEN/AMBER/RED enforcement
- approval queue
- approve/reject
- intervention logging
- adapter interface for external actions

**Exit:** protected actions are impossible to execute without policy-compliant approval.

## Milestone 6 — Builder
- BuildSpec schema
- minimal-scope rules
- implementation task generation
- future repository/deployment adapter boundaries

**Exit:** approved ExperimentPlan produces a Codex-ready BuildSpec.

## Milestone 7 — Documentarian
- event significance scoring
- factual context assembly
- X/LinkedIn/timeline drafts
- claim references
- publication approval

**Exit:** at least one material event can become a grounded content draft without invented facts.

## Milestone 8 — Public experiment
- sanitised public event projection
- experiment status/countdown
- metrics
- narrative timeline
- privacy/redaction tests

**Exit:** a member of the public can follow Experiment 001 without seeing private system data.

## Milestone 9 — Experiment 001 readiness
- end-to-end tests
- observability
- error/retry UX
- verify pause/kill under in-flight work and recovery
- decision memo
- security review
- runbook

**Exit:** press START COMPANY for Experiment 001.

## Explicitly deferred
- autonomous payments
- automatic social posting
- mass outreach
- self-modifying core
- multi-tenant SaaS
- complex vector memory
- large agent councils

## Scope and readiness notes

M0 is [Issue #1](https://github.com/mralexcheeseman/impossible/issues/1): deployable shell, environment example, client factories, checks and setup docs only. M1 is a separate implementation. M5 adds the approval UI and action adapters; earlier milestones cannot execute protected actions while those adapters are absent.

M3–M4 preserve versioned evidence, predictions, confidence, objections and outcome links. M5 captures attributable human effort. Before M9, approve a bounded human-assisted product build, distribution and real metric ingestion path: a build specification alone cannot validate demand. Review the [architecture decisions](ARCHITECTURE_REVIEW.md) before introducing any new infrastructure.
