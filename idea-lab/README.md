# Idea Lab

A bounded companion to IMPOSSIBLE: scheduled research, sceptical triage, concept-page generation, rendered visual critique and owner feedback. This is a candidate pipeline, not the seven-day venture engine. It does not claim the core PRD milestones are complete.

## Run locally

Requires Node 22+.

```sh
cd idea-lab
npm ci
npm run dev
```

Open http://localhost:3000. Three labelled examples are included. Local development permits access without authentication. Production fails closed until `LAB_ACCESS_SECRET` contains a random secret of at least 32 characters. Optional `IDEA_LAB_DEMO=true` exposes only labelled fixture batches and suppresses live batches.

```sh
npm run typecheck
npm test
npm run build
```

## Activate

1. Create a **private** repository from the reviewed code (or deliberately make this repository private). Do not copy secrets into Git. The live runner refuses public repositories.
2. Import the private repository in Vercel. Set **Root Directory: idea-lab** and framework **Next.js**. Set `LAB_ACCESS_SECRET` to a random 32+ character value, and `NEXT_PUBLIC_LAB_REPOSITORY=owner/repository`. Protect preview deployments with Vercel Authentication; keep demo mode off for live work.
3. In GitHub Actions secrets add `OPENAI_API_KEY` using a dedicated provider project. API billing is separate from ChatGPT. Do not put the model key or GitHub write credentials in the Vercel app.
4. Enable “Allow GitHub Actions to create and approve pull requests” in repository Actions settings (the workflow only creates drafts and never approves). Set repository variable `LAB_ENABLED=true`. Optionally set `LAB_MODEL` to a Responses-compatible model that supports web search, image inputs and structured output. Default adapter: OpenAI / `gpt-4.1`.
5. Merge the workflow onto the default branch, then run **Idea Lab → Run workflow**. Inspect the run issue, generated draft PR, Vercel preview and visual-check artifact. Validate one live run before relying on the schedule.

No activation has happened merely because these files exist.

## Operating rhythm

- Monday, Wednesday, Friday at 04:17 UTC: research two ideas and challenge them.
- Monday and Friday: build at most one idea scoring 65+ with a `build` verdict. A run can produce no page.
- One claimed run per UTC date, including manual runs. Reruns stop before model calls if the date was already claimed, even after failure. Resume deliberately on a later date; do not delete audit records to retry.
- At six open `lab/` draft branches with pull requests, stop. Close rejected drafts or merge accepted batches.
- Open an issue titled exactly `[Lab pause]` to pause. Close it to resume. The `LAB_ENABLED` variable is the primary off switch.
- Workflow concurrency is one. Model cap is six calls per run, each capped at 7,000 output tokens; research is capped at three web tool calls. No automatic model retries. This bounds operations, **not an exact monetary budget**. Configure provider spend controls and monitor actual billing.

## Review and learning

Each Vercel preview shows batches in its own Git snapshot. The main dashboard updates when a batch is merged. GitHub pull requests are the authoritative review queue; this is not a live aggregated dashboard.

On a live idea, enter scores, decision, note and scope. “Prepare feedback” creates a GitHub issue draft link. **Submit the issue on GitHub to persist it.** Nothing is saved just by clicking Prepare. Only schema-valid feedback authored by the repository owner is consumed. The next run reads it even if the candidate PR was closed without merging.

`this-page` feedback affects that page; `general-preference` affects future pages. On the next build day, the newest unapplied `revise` decision for an existing page takes priority over a fresh page. The revised page is saved to a new batch and PR; its feedback issue number is recorded so it is not repeatedly rebuilt. A later pursue/reject decision cancels a pending revision. Every fresh builder run uses general preference feedback. The visual critic can trigger one automatic revision within its initial run. Proposed rules are stored with the batch; permanent edits to `design/standards.md` require review.

## Boundaries and limitations

- The current builder generates typed page compositions across three implemented art directions. It cannot yet write arbitrary React components, generate custom photography or implement a real product backend. Add those through reviewed renderer changes after preferences are calibrated.
- Render checks cover desktop/mobile overflow, one headline, CTA disclosure behaviour and runtime errors. They are not a full accessibility audit or real user test.
- Source URLs must come from the research tool. That prevents invented URLs, but does not prove source interpretation or demand claims are accurate.
- Research and feedback are stored as private repository data and issues. The renderer escapes text; model output is never executed as code.
- Events are appended as issue comments; admins can still edit them. This is an operational history, not a tamper-proof compliance ledger.
- Model input/output token counts are recorded. Exact costs and conversion outcomes are not yet calculated.
- Live API, GitHub scheduled-run and Vercel integration checks require configured credentials. Mock-provider tests do not establish those integrations work.

## Architecture

`GitHub schedule → Scout → structured evidence → Sceptic → Builder → browser render → visual critic → optional one revision → draft PR → Vercel preview → owner feedback issue → next run`

Workflows and permissions live outside model control. The web app does not hold GitHub write or model credentials. The model adapter implements a small `ModelProvider` interface; an alternative provider can implement the same contract.
