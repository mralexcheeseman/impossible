import { randomUUID } from "node:crypto";
import { runCommand } from "./actions";
import type { Experiment, ExperimentCommand } from "@/domain/experiment";
export function CommandForm({
  kind,
  label,
  experiment,
  nextStage = null,
}: {
  kind: ExperimentCommand["kind"];
  label: string;
  experiment?: Experiment;
  nextStage?: string | null;
}) {
  return (
    <form action={runCommand} className="operator-form command-form">
      <input type="hidden" name="commandId" value={randomUUID()} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="experimentId" value={experiment?.id ?? ""} />
      <input
        type="hidden"
        name="expectedVersion"
        value={experiment?.version ?? ""}
      />
      <input type="hidden" name="nextStage" value={nextStage ?? ""} />
      <h3>
        {label}
        {nextStage ? ` → ${nextStage.toLowerCase()}` : ""}
      </h3>
      <label>
        Reason
        <textarea
          name="reason"
          required
          maxLength={1000}
          placeholder="What evidence or judgement supports this action?"
        />
      </label>
      <label>
        Human minutes (optional estimate)
        <input name="minutes" type="number" min="0" max="10080" step="0.1" />
      </label>
      {kind === "KILL" && (
        <label className="confirmation">
          <input type="checkbox" required />I understand this permanently ends
          the experiment.
        </label>
      )}
      <button type="submit" className={kind === "KILL" ? "danger" : ""}>
        {label}
      </button>
    </form>
  );
}
