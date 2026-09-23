import { enabledSecret } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  return (
    <main className="login">
      <div className="wordmark">
        i. <span>IMPOSSIBLE / IDEA LAB</span>
      </div>
      <h1>
        A place for
        <br />
        what comes next.
      </h1>
      {enabledSecret() ? (
        <form action="/api/login" method="post">
          <label htmlFor="password">Your access key</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          {error && <p role="alert">That key did not match. Try again.</p>}
          <button className="primary">Enter the lab →</button>
        </form>
      ) : (
        <p>
          Setup is incomplete. Add a random LAB_ACCESS_SECRET of at least 32 characters in Vercel to
          enable private access.
        </p>
      )}
    </main>
  );
}
