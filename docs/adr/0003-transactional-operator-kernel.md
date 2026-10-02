# ADR 0003 — Transactional operator kernel

Status: Accepted for M1 implementation, 2026-10-02.

## Context

Supabase clients perform individual HTTP requests. Separate state/event/intervention writes cannot provide the atomicity established in ADR 0001. An authenticated user is not necessarily the operator. Local development currently has no Docker runtime; tests still need to execute real SQL.

## Decision

Use one narrowly scoped Postgres command function for START, ADVANCE, PAUSE, RESUME, KILL and COMPLETE. The public wrapper is SECURITY INVOKER; its private implementation is SECURITY DEFINER with an empty search path, explicit operator membership verification and narrowly granted EXECUTE. Application roles can only SELECT domain tables through RLS. Operator membership is a singleton private table provisioned by an administrator, never user-editable metadata. No service-role credential is required by the application.

A short transaction takes one advisory lock for this single-operator V1, verifies the command's idempotency payload and expected version, enforces transitions/deadline, and commits state, ordered events, intervention and receipt. A unique partial index independently enforces one ACTIVE/PAUSED experiment. Failed commands leave no partial mutation. A replay returns the original result, even if subsequent commands changed the state. UI then reloads current state. Domain state is not changed by timers or page loads.

START enters DISCOVERING immediately; there is no persisted draft editor in M1. Lifecycle status is separate from stage. Pause retains stage/deadline; resume is forbidden after expiry. At expiry, an explicit operator command can enter DECIDING from any nonterminal stage, including a paused final-analysis stage. No automated wakeup is claimed yet. Kill is terminal; completion requires active DECIDING. Every successful operator command requires a concise reason; optional minutes are labelled estimates and unknown remains null.

The Control Room reads one SQL statement snapshot, with the latest 100 events/interventions/pending approvals. It never exposes raw private records publicly. Approval storage exists, but no approval mutation or external execution adapter is installed: all execution decisions deny until later milestones.

Use password authentication for the pre-provisioned operator, with no sign-up UI, server-verified identity and a separate database membership check on reads/actions. Proxy refreshes cookies and disables caching of private responses. Server Components use an explicitly read-only cookie adapter. Server Actions preserve cookie-write failures and use Next.js origin protections.

## Alternatives and reversibility

Client-side multi-write transactions were rejected because they are not atomic. A service-role-backed application would widen the trust boundary. Full event sourcing or a runner would exceed M1. Per-experiment locks are unnecessary until multiple active ventures are allowed. Domain commands can later use narrower locks without changing the external contract.

PGlite runs the migration locally using PostgreSQL semantics, with a minimal auth.uid/role harness. CI also runs on PostgreSQL 17 with independent connections for concurrent starts and duplicate delivery. Neither test harness proves hosted Auth/PostgREST integration; staging sign-in, RLS and Supabase advisors remain required before operating a live experiment.

## Consequences

The small state-transition table is authoritative in SQL; TypeScript only validates input and proposes UI controls. Tests exercise SQL directly so a direct RPC call cannot bypass invariants. This duplicates a little stage vocabulary, not authority. No agents or external side effects run in M1. Operator bootstrap and live project selection are explicit operational steps, documented in the runbook.
