# ADR 0002 — M0 boundaries and staged authority

Status: Accepted, 2026-09-21.

## Context

Issue #1 requests bootstrap only, while AGENTS previously grouped M0/M1. Roadmap placed pause/kill at final readiness, and PRD listed deceptive identity as approvable RED behaviour despite the Constitution.

## Decision

M0 ships a static, honest shell, Next.js/TypeScript, user-scoped Supabase setup factories, repeatable checks and CI. No authentication or database feature is claimed. M1 implements operator authorisation, transactional state/audit, pause/kill and deny-by-default guards. M2 adds recoverable jobs. M5 adds approval UI and external adapters. Constitution prohibitions cannot be approved. Preserve the build-spec-only Builder scope; require a human-assisted real-world test plan before Experiment 001 readiness.

## Alternatives

Implementing M1 now exceeds the issue. Deferring all controls until M5/M9 allows unsafe earlier execution. Expanding Builder silently changes the product; record the open planning decision instead.

## Consequences and reversibility

The shell is deployable without Supabase credentials and exposes no private data or actions. Later auth requires session refresh and operator checks, not merely adding keys. Additional capabilities arrive in bounded issues. Product direction remains unchanged; the human-assisted test path is an operator planning choice.
