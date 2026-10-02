# M1 operator runbook

## Bring up a development environment

Use a dedicated development Supabase project or the local stack; do not reuse unrelated production data. Install the repository with `npm ci`. For local Supabase, install Docker (or a compatible running container runtime), then:

```sh
npx supabase start
npx supabase db push --local
npx supabase migration list --local
npx supabase db advisors --local --type security
```

The committed config disables signups and anonymous sign-ins. `private` must never be added to the Data API exposed schemas. No seed account/password is committed. A local reset destroys the local database; it is not part of normal startup.

For hosted Supabase, select the dedicated project, link using the CLI's `link --help` instructions, then review `npx supabase db push --linked --dry-run` before applying `npx supabase db push --linked`. Run `npx supabase migration list --linked` and `npx supabase db advisors --linked --type security`. Configure hosted Auth to disable public signups and anonymous sign-ins as well; the local config is not an assertion that hosted settings changed. Configure the project's actual site URL, password policy and login rate limits.

Create the single operator account through Supabase Auth administration, using a strong unique password. Copy its user UUID, then run this in the project's SQL editor as administrator, replacing the placeholder:

```sql
insert into private.operators(user_id) values ('OPERATOR_AUTH_USER_UUID');
```

Never accept the UUID from an unauthenticated form and never grant authority through user_metadata. The singleton constraint permits only one designated operator. To revoke access, remove membership first; then revoke sessions through Auth administration. An old token without membership cannot read or mutate domain data.

Copy `.env.example` to `.env.local`, set the project's URL and modern publishable key, then run `npm run dev`. No secret/service-role key belongs in the application. Visit `/login`, sign in and open `/control`. Without configuration, login displays setup pending; control routes redirect there instead of exposing data. Builds need no credentials.

## Before the first real experiment

Verify on the selected staging project:

1. Operator can sign in; ordinary authenticated users and anonymous requests cannot read records or invoke commands successfully.
2. START COMPANY creates one experiment, a persisted deadline exactly 168 hours later, ordered audit events and one intervention.
3. Retry the identical command ID/payload: no duplicate records. A different payload with that ID is rejected.
4. Pause, reload and resume: stage and deadline stay fixed. A stale tab's command is rejected.
5. Kill is terminal. After expiry only final analysis or termination is available; pause does not extend the experiment.
6. Sign out removes access; removing operator membership blocks even an existing session.
7. Inspect Supabase advisors and address material notices. Confirm private pages are not cached and session refresh survives expiry.

Record this as a labelled staging experiment; never present it as real demand or traction. These checks have not been claimed as completed on a hosted project merely because CI passes.

## Operating and reviewing

Each operator change requires a concise rationale and optionally estimated human minutes. Leave time blank if unknown. Do not paste passwords, personal data or private reasoning into the rationale. The interface shows latest records, not lifetime totals. Records beyond the last 100 remain in the database.

Review status, elapsed time, intervention reasons and audit events daily. Stage advancement in M1 is an operator judgement, not evidence of automated research/build completion. External actions, agents and real metrics remain unconnected. Do not interpret empty metrics as zero demand.

A completed or killed experiment permits a new one. A paused or expired nonterminal experiment retains the active slot until explicitly ended. The deadline is not reset by deployments or page loads. Deadline transitions are enforced when commands run; automatic scheduled final analysis belongs to M2.

## Failure and recovery

A command either commits state, ledger, intervention and receipt together or rolls back. If the response is lost, reload current state first; a programmatic retry must reuse the original command ID and identical payload. Reusing the ID with edited data fails. New intent uses a new ID and the current expected version.

A stale-version error means another command won: refresh and reconsider. Do not bypass the error by blindly substituting a new version. If the database is unavailable the UI shows an error, never a success or fabricated empty experiment. No external effects exist in M1, so there are no external receipts to reconcile yet.

Events and interventions cannot be edited/deleted by application roles. Administrators remain trusted and can change schema/privileges; this is not tamper-proof storage. For an application regression, roll back the Vercel deployment while retaining database records. Do not drop tables or reverse the ledger to undo a user decision. Fix forward with a reviewed migration.

## Tests and limits

`npm test` runs unit/auth-boundary tests and the real migration in PGlite. The auth harness supplies only roles, users and auth.uid; it does not emulate Supabase Auth. `npm run test:postgres` requires `TEST_DATABASE_URL` pointing at an empty disposable localhost PostgreSQL database. It creates test-only auth objects and truncates its domain tables between tests. Never use an existing database. CI provisions PostgreSQL 17 and runs independent-connection concurrency tests in addition to the local suite.

Hosted Auth, PostgREST, session revocation, password throttling, deployed browser workflows and Supabase advisors require a selected project. The current architecture supports these checks but local SQL tests do not replace them.
