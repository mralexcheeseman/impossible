# IMPOSSIBLE — Product Requirements Document

**Status:** V1 build specification  
**Canonical product name:** IMPOSSIBLE  
**Core question:** Can AI repeatedly discover, build and validate real businesses with progressively less human intervention?

## 1. Product thesis

Most AI startup tools optimise for generating ideas, copy or code. IMPOSSIBLE optimises for **validated learning under constraints**.

The unit of progress is not an output. It is an experiment with:
- a falsifiable hypothesis;
- evidence supporting why it should be run;
- a declared success/failure threshold;
- a time limit;
- observed results;
- a decision trace.

The system should prefer killing weak ideas quickly over producing impressive-looking products without demand.

## 2. Mission

Give an AI system £0 acquisition budget and seven days to create something real people demonstrably want.

Repeat the process. Preserve all evidence and outcomes. Measure whether the system improves.

## 3. Product principles

### Evidence before confidence
Agents must distinguish observation, inference and speculation. Material conclusions should point to stored evidence.

### Behaviour over opinion
A payment, repeated use or completed workflow is stronger evidence than a compliment or survey response.

### Failure is valid
Killing an idea because evidence is weak is a successful system outcome.

### Agents disagree
The Sceptic is structurally independent. Consensus is not an objective.

### Autonomy is earned
Low-risk reversible actions can be autonomous. Consequential actions require approval until demonstrated safe.

### Everything is auditable
Agent actions, model outputs, evidence, approvals, state transitions and human interventions are evented.

### No fake traction
No fabricated users, revenue, testimonials, metrics, reviews or social engagement.

## 4. Primary user

V1 has one operator: the founder/operator.

The operator should function as an approval and judgement layer, not the primary researcher, strategist or builder.

## 5. Seven-day lifecycle

### Stage 0 — Initialise
Operator presses **START COMPANY**.

System creates:
- Experiment ID
- seven-day deadline
- £0 acquisition budget
- constitution version
- autonomy policy
- initial event

### Stage 1 — Discover
Scout searches permitted public sources for observable pain, workarounds, unmet needs and willingness-to-pay signals.

Each Opportunity must contain:
- problem statement
- target user
- source evidence
- observed workaround
- existing alternatives
- reason now
- buildability estimate
- reachable-with-£0 hypothesis
- uncertainty

### Stage 2 — Challenge
Sceptic independently reviews opportunities.

It can:
- reject weak evidence
- flag duplicated/derivative ideas
- identify selection bias
- challenge willingness-to-pay assumptions
- request more research

### Stage 3 — Select
Strategist converts surviving opportunities into candidate Venture Hypotheses.

A hypothesis contains:
- customer
- problem
- proposed outcome
- solution concept
- price hypothesis
- acquisition hypothesis
- primary risk
- cheapest falsification test

V1 may require operator approval before selecting the final hypothesis.

### Stage 4 — Design experiment
Strategist creates a measurable Experiment Plan:
- hypothesis
- test
- duration
- target population
- success threshold
- failure threshold
- required assets
- risk level
- expected information gain

Sceptic reviews before execution.

### Stage 5 — Build
Builder creates the smallest functional artefact needed to test the hypothesis.

Builder should prefer:
1. no-code/manual test where sufficient;
2. landing page / fake-door test where ethically appropriate and clearly represented;
3. thin functional MVP;
4. custom product only where needed.

No unnecessary platform construction.

### Stage 6 — Distribute
Growth functionality is deliberately limited in V1. The system may propose organic distribution actions but public posting, outreach and account actions require approval.

No unsolicited mass messaging.

### Stage 7 — Observe
System records:
- visits
- signups
- activation
- repeat usage
- explicit feedback
- payment/revenue when later enabled
- experiment-specific metrics

### Stage 8 — Decide
At deadline, Strategist and Sceptic independently recommend:
- CONTINUE
- PIVOT
- KILL

The final memo must include evidence, contradictions, unknowns and proposed next experiment.

The operator owns the actual continuation decision.

## 6. Agents

### 6.1 Scout
**Goal:** find problems worth testing.

Inputs: experiment constraints, search tools, prior opportunity history.  
Outputs: structured Opportunity records and Evidence records.

Scout must not invent demand signals or present model intuition as external evidence.

### 6.2 Strategist
**Goal:** transform evidence into falsifiable venture hypotheses and tests.

Outputs: VentureHypothesis, ExperimentPlan, decision memo.

Strategist must optimise for information gained per unit of time/cost, not scope.

### 6.3 Sceptic
**Goal:** reduce false positives.

Sceptic should explicitly seek:
- contradictory evidence
- alternative explanations
- weak samples
- survivorship bias
- fake urgency
- markets where distribution is implausible
- products that are technically interesting but commercially weak

Sceptic cannot silently block. Every rejection requires reasons and evidence quality notes.

### 6.4 Builder
**Goal:** create the minimum artefact necessary to run an approved test.

Builder receives an approved build brief, not unrestricted authority.

V1 Builder outputs a build specification and implementation task set. Later versions may create branches, code, deploy and repair products autonomously.

### 6.5 Documentarian
**Goal:** accurately capture the story without distorting the experiment.

It consumes Events, not private chain-of-thought.

Outputs may include:
- public timeline entry
- X draft
- LinkedIn draft
- carousel brief
- short-form video script
- weekly documentary outline

V1 generates drafts only. Publication requires approval.

Content must never fabricate drama, certainty, traction or quotes.

## 7. Orchestrator

The Orchestrator is deterministic application logic wherever possible.

Responsibilities:
- current stage
- deadline
- allowed transitions
- agent task dispatch
- retries/timeouts
- budgets
- risk classification
- approval gates
- event creation
- idempotency
- experiment termination

The LLM must not be the authority on whether a protected action is permitted.

## 8. Risk and approval model

### GREEN — autonomous
Examples:
- research public information
- analyse stored data
- create internal hypotheses
- challenge an idea
- draft code
- create internal copy/design briefs
- calculate metrics

### AMBER — approval required in V1
Examples:
- deploy public website
- publish social content
- materially change pricing
- contact an individual
- invite testers
- modify a live product
- create an external account/resource

### RED — always explicit human approval
Examples:
- spend money
- initiate payments/transfers
- enter contracts
- make legal commitments
- mass outreach
- delete production data
- access/export sensitive personal data

Constitution violations (including deceptive identity, fabricated traction and spam) are prohibited, not actions an approval can authorise.

Every approval produces an immutable event with actor, timestamp, requested action and outcome.

## 9. The Constitution

The following rules are system constraints:

1. Starting paid-acquisition budget is £0 unless operator explicitly changes it.
2. Never fabricate users, revenue, testimonials, engagement or evidence.
3. Never knowingly spam.
4. Never pretend an AI agent is a human.
5. Preserve source provenance for evidence.
6. Separate observed facts from model inference.
7. Consequential actions require the configured approval.
8. Log every human intervention.
9. Failure and uncertainty must be reported plainly.
10. Agents may not modify the Constitution.
11. Credentials/secrets never enter prompts, logs or public events.
12. The operator can pause or terminate an experiment at any time.

## 10. Core data model

### experiments
id, number, status, stage, started_at, deadline_at, ended_at, acquisition_budget_pence, constitution_version, autonomy_policy, selected_hypothesis_id

### opportunities
id, experiment_id, problem, target_user, summary, buildability, distribution_thesis, status, created_by

### evidence
id, experiment_id, opportunity_id nullable, hypothesis_id nullable, source_type, source_url, source_title, excerpt_or_summary, observed_at, collected_at, claim_supported, evidence_strength, metadata

### hypotheses
id, experiment_id, opportunity_id, customer, problem, proposed_outcome, solution, price_hypothesis, acquisition_hypothesis, primary_risk, falsification_test, status

### experiment_plans
id, experiment_id, hypothesis_id, test_description, success_metric, success_threshold, failure_threshold, duration_hours, risk_level, status

### agent_runs
id, experiment_id, agent_type, task_type, input_ref, model, status, started_at, ended_at, structured_output, error

### events
id, experiment_id, sequence, type, actor_type, actor_id, visibility, payload, created_at

### approvals
id, experiment_id, action_type, risk_level, requested_by, request_payload, status, decided_by, decided_at, decision_note

### interventions
id, experiment_id, type, minutes_estimate, reason, related_event_id, created_at

### metrics
id, experiment_id, metric_name, value, unit, source, measured_at

### content_drafts
id, experiment_id, triggering_event_id, channel, hook, body, asset_brief, factual_claim_refs, status

## 11. Event taxonomy

Minimum V1 events:
- experiment.created
- experiment.started
- stage.changed
- opportunity.created
- opportunity.rejected
- hypothesis.created
- hypothesis.selected
- evidence.added
- agent.started
- agent.completed
- agent.failed
- experiment_plan.created
- approval.requested
- approval.approved
- approval.rejected
- intervention.logged
- build.spec_created
- deployment.requested
- metric.recorded
- content.draft_created
- decision.proposed
- experiment.paused
- experiment.completed
- experiment.killed

Events are append-only. Current state may be materialised separately.

## 12. Control Room

### Private operator view
Must show:
- experiment number and countdown
- current stage
- mission/selected hypothesis
- live agent status
- approval queue
- event stream
- evidence count
- interventions
- current metrics
- unresolved contradictions
- pause/kill controls

### Public view
Later in V1, expose a sanitised read-only timeline:
- what happened
- factual metrics
- selected public agent conclusions
- experiment status
- time remaining

Never expose secrets, private prompts, credentials, private user data or hidden reasoning.

## 13. Documentarian / social pipeline

Every public-worthy event may trigger a draft.

Pipeline:
Event → significance filter → factual context retrieval → narrative draft → claim check → approval → publisher.

V1 scope:
- generate drafts
- support X, LinkedIn and public timeline formats
- approval UI
- no automatic publishing

V1.1:
- platform integrations
- scheduling
- approved auto-publish rules for GREEN content
- image/video generation pipeline

## 14. Metrics

### System metrics
- human interventions per experiment
- human minutes per experiment
- agent failure/retry rate
- approval rate
- median time between stages
- cost per experiment
- evidence items per material decision

### Venture metrics
Experiment-specific, but may include:
- qualified visits
- signup conversion
- activation
- retained usage
- willingness to pay
- paid conversion
- revenue

### Long-term research metrics
- opportunity-to-test rate
- kill rate
- hypothesis calibration
- which evidence types correlate with subsequent behaviour
- Sceptic rejection precision
- human intervention trend across experiments

## 15. V1 user stories

1. As operator, I can start a numbered seven-day experiment.
2. I can see the exact stage and time remaining.
3. Scout can create structured opportunities backed by evidence.
4. Sceptic can independently challenge an opportunity.
5. Strategist can create a falsifiable hypothesis and test.
6. Protected actions create approval requests rather than execute.
7. I can approve/reject and the decision is logged.
8. Builder can turn an approved test into a build spec.
9. Every meaningful system action appears in the event stream.
10. Documentarian can draft factual content from events.
11. I can pause or kill an experiment.
12. The system can produce an end-of-experiment decision memo.

## 16. V1 non-goals

Do not build yet:
- autonomous financial transactions
- automatic social publishing
- mass outreach
- a complex multi-tenant SaaS
- dozens of agent personas
- self-modifying production code
- elaborate vector-memory infrastructure without demonstrated need
- simulated vanity metrics
- full accounting
- mobile native apps

## 17. Technical requirements

- TypeScript end-to-end where practical
- schema validation on every model-generated structured output
- provider abstraction for LLM calls
- secrets only in server environment
- Row Level Security where appropriate
- append-only event semantics
- idempotent orchestrator jobs
- retry policy with bounded attempts
- observable model/token/cost metadata
- deterministic permissions outside prompts
- UTC storage; localised display
- tests for state transitions and permission gates before autonomous execution

## 18. Acceptance criteria for Experiment 001 readiness

Before Experiment 001:
- production app deployed
- database migrations reproducible
- operator auth works
- START COMPANY creates exactly one active experiment
- seven-day deadline persists correctly
- state transitions are tested
- Scout produces schema-valid opportunities
- Evidence records preserve provenance
- Sceptic can challenge without overwriting Scout output
- approval gate blocks AMBER/RED actions
- event stream reconstructs all material actions
- Builder creates a build spec
- Documentarian creates at least one grounded draft
- pause/kill works
- no secrets appear in logs/events
- README contains run/deploy instructions

## 19. V1 build order

1. Foundation: Next.js, Supabase, auth, schema, migrations.
2. Event ledger + experiment state machine.
3. Control Room shell.
4. LLM provider abstraction + structured agent runtime.
5. Scout + Evidence.
6. Sceptic.
7. Strategist + experiment plans.
8. approval queue and external adapters (deny-by-default guards already exist in the kernel).
9. Builder specification workflow.
10. Documentarian.
11. public sanitised timeline.
12. observability, tests and Experiment 001 readiness review.

## 20. Open decisions

These should be resolved by implementation evidence rather than architecture preference where possible:
- exact LLM/provider mix
- orchestration runtime beyond basic durable jobs
- vector store necessity
- social publishing provider
- analytics provider
- whether products built by Builder live in same or separate repositories
- when deployment becomes autonomous

## 21. North-star research question

After N experiments, can we show that IMPOSSIBLE requires fewer human interventions and/or less human time to produce increasingly strong evidence of genuine demand?

That—not number of generated startups—is the long-term measure of the system.

## 22. Foundation review clarifications

See [architecture review](ARCHITECTURE_REVIEW.md). M0 is only Issue #1; it does not implement the M1 kernel or agents. Pause/kill, fixed deadline semantics and deny-by-default execution guards must exist before autonomous work. Pausing retains the original deadline and current stage. Approval binds the exact proposed action and expires; execution must recheck current authority.

State mutations and audit events commit atomically. Future jobs must recover safely after crashes; uncertain external outcomes require reconciliation before retry. Capture versioned beliefs, evidence references, contradictions, outcomes and attributable human effort as those features arrive. Retain concise rationale, never private chain-of-thought.

**Product question for Experiment 001 planning:** V1 Builder delivers a build specification. To observe real behaviour, the operator must approve a concrete human-assisted build/distribution and measurement path, with all human effort logged. This clarification does not expand M0 or silently authorise autonomous deployment.
