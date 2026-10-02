import Link from "next/link";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { signIn } from "./actions";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  let configured = true;
  try {
    getSupabaseConfig();
  } catch {
    configured = false;
  }
  return (
    <main>
      <header>
        <Link className="wordmark" href="/">
          IMPOSSIBLE.
        </Link>
        <span className="status">Operator access</span>
      </header>
      <section className="intro">
        <p className="eyebrow">Control Room</p>
        <h1>Operator sign in</h1>
        {configured ? (
          <>
            <p>Use the operator account provisioned for this project.</p>
            {error && (
              <p role="alert">
                {error === "access"
                  ? "This account does not have operator access."
                  : "Sign in failed. Check your credentials and try again."}
              </p>
            )}
            <form action={signIn} className="operator-form">
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button type="submit">Sign in</button>
            </form>
          </>
        ) : (
          <p>
            Database setup is pending. Configure Supabase, apply the migration
            and provision the operator account using the repository runbook.
          </p>
        )}
      </section>
    </main>
  );
}
