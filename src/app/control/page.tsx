import Link from "next/link";
import { loadControlRoom } from "@/lib/experiments/read-model";
import { availableCommands } from "@/domain/experiment";
import { signOut } from "@/app/login/actions";
import { CommandForm } from "./command-form";
import { Countdown } from "./countdown";
export const dynamic = "force-dynamic";
const messages: Record<string, string> = {
  invalid: "Check the command fields and include a reason.",
  stale: "This experiment changed. Review its current state before retrying.",
  active: "An experiment is already active. Refresh to see it.",
  rejected:
    "The command was not accepted. Review the current state and deadline before retrying.",
};
export default async function Control({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { experiment, events, interventions, approvals, observedAt } =
    await loadControlRoom();
  const terminal =
    experiment && ["KILLED", "COMPLETED"].includes(experiment.status);
  return (
    <main>
      <header>
        <Link className="wordmark" href="/">
          IMPOSSIBLE.
        </Link>
        <span className="status">Private Control Room / M1</span>
        <form action={signOut}>
          <button>Sign out</button>
        </form>
      </header>
      <section className="control-title">
        <p className="eyebrow">Evidence before ambition</p>
        <h1>
          {experiment
            ? `Experiment ${String(experiment.number).padStart(3, "0")}`
            : "Ready for the first experiment"}
        </h1>
        {params.error && (
          <p role="alert">
            {Object.hasOwn(messages, params.error)
              ? messages[params.error]
              : messages.rejected}
          </p>
        )}
        {experiment ? (
          <>
            <p className="lead">
              {experiment.stage} · {experiment.status} · Version{" "}
              {experiment.version}
            </p>
            <Countdown deadline={experiment.deadline_at} active={!terminal} />
            <p>
              No hypothesis selected. Agents and behavioural metrics are not
              connected yet.
            </p>
          </>
        ) : (
          <p>
            No experiments exist. Starting one records a fixed seven-day
            deadline and your intervention.
          </p>
        )}
      </section>
      {(!experiment || terminal) && (
        <CommandForm kind="START" label="START COMPANY" />
      )}
      {experiment && (
        <>
          <section aria-label="Experiment controls" className="control-grid">
            {availableCommands(experiment, observedAt).map((command) => (
              <CommandForm
                key={command.kind}
                {...command}
                experiment={experiment}
              />
            ))}
          </section>
          <section className="control-grid">
            <article>
              <h2>Approval queue</h2>
              {approvals.length ? (
                <ul>
                  {approvals.map((item) => (
                    <li key={item.id}>
                      {item.action_type} · {item.risk_level} ·{" "}
                      {Date.parse(item.expires_at) <= observedAt
                        ? "Expired"
                        : item.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No pending approvals.</p>
              )}
              <p>External action execution is disabled.</p>
            </article>
            <article>
              <h2>Agents and metrics</h2>
              <p>No agent runs. No collected evidence or measured traction.</p>
              <p>
                Acquisition budget: £
                {(experiment.acquisition_budget_pence / 100).toFixed(2)}
              </p>
            </article>
          </section>
          <section className="control-grid">
            <article>
              <h2>Event ledger</h2>
              <p>
                Latest {events.length} events, newest first. All records remain
                in the database.
              </p>
              <ol className="event-list">
                {events.map((event) => (
                  <li key={event.id}>
                    <strong>
                      #{event.sequence} {event.type}
                    </strong>
                    <br />
                    <time>{event.created_at}</time>
                    {typeof event.payload.rationale === "string" && (
                      <p>{event.payload.rationale}</p>
                    )}
                  </li>
                ))}
              </ol>
            </article>
            <article>
              <h2>Human interventions</h2>
              <p>
                Latest {interventions.length}. Blank time means unrecorded, not
                zero.
              </p>
              <ul className="event-list">
                {interventions.map((item) => (
                  <li key={item.id}>
                    <strong>{item.type}</strong>
                    <p>{item.reason}</p>
                    <span>
                      {item.minutes_estimate === null
                        ? "Time unrecorded"
                        : `${item.minutes_estimate} minutes (estimated)`}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
