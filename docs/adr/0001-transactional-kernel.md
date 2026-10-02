# ADR 0001 — Transactional kernel and recoverable execution

Status: Accepted for staged implementation (M1/M2), 2026-09-21.

## Context

Seven-day experiments outlive requests. Audit gaps, duplicate delivery and uncertain external outcomes threaten trust. Event-led does not require event sourcing.

## Decision

Keep a modular Next.js application and Supabase/Postgres. Commit current state, ordered audit events and dispatch intent atomically. Application roles cannot mutate prior events. Unique command IDs and concurrency checks protect domain mutations. Persist jobs and leases before background agents; fence stale workers and recheck deadline, pause/kill, policy and budgets. Bind approvals to immutable action payloads and expiry. Record external receipts; reconcile uncertain outcomes before retrying.

## Alternatives

Full event sourcing and distributed-agent services add replay and operating complexity. In-memory orchestration fails on process loss. Blind retries cannot provide exactly-once external effects. Defer all three. Select the actual durable runner using the recovery experiment in the architecture review before M2.

## Consequences and reversibility

M1 needs transactional database commands and integration tests; M2 needs recovery tests and an actual scheduler. A runner can later be replaced because business records and action IDs remain durable. Transactional guarantees are non-negotiable even if implementation changes. M0 introduces no job infrastructure.
