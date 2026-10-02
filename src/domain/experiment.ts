import { z } from "zod";

export const stages = [
  "DISCOVERING",
  "CHALLENGING",
  "SELECTING",
  "PLANNING",
  "BUILDING",
  "TESTING",
  "DECIDING",
] as const;
export const experimentSchema = z.object({
  id: z.uuid(),
  number: z.number().int().positive(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "KILLED"]),
  stage: z.enum(stages),
  started_at: z.string(),
  deadline_at: z.string(),
  ended_at: z.string().nullable(),
  version: z.number().int().positive(),
  acquisition_budget_pence: z.number().int().nonnegative(),
  constitution_version: z.string(),
  autonomy_policy: z.string(),
});
export type Experiment = z.infer<typeof experimentSchema>;
export const commandSchema = z
  .object({
    commandId: z.uuid(),
    kind: z.enum(["START", "PAUSE", "RESUME", "KILL", "ADVANCE", "COMPLETE"]),
    experimentId: z.uuid().nullable(),
    expectedVersion: z.number().int().positive().nullable(),
    nextStage: z.enum(stages).nullable(),
    reason: z.string().trim().min(1).max(1000),
    minutes: z.number().finite().min(0).max(10080).nullable(),
  })
  .superRefine((command, ctx) => {
    if (
      command.kind === "START"
        ? command.experimentId !== null || command.expectedVersion !== null
        : command.experimentId === null || command.expectedVersion === null
    ) {
      ctx.addIssue({ code: "custom", message: "Invalid experiment reference" });
    }
    if ((command.kind === "ADVANCE") !== (command.nextStage !== null)) {
      ctx.addIssue({ code: "custom", message: "Invalid next stage" });
    }
  });
export type ExperimentCommand = z.infer<typeof commandSchema>;

/** UI affordances only. The database independently enforces every transition. */
export function availableCommands(experiment: Experiment, now: number) {
  if (["KILLED", "COMPLETED"].includes(experiment.status)) return [];
  const result: {
    kind: ExperimentCommand["kind"];
    label: string;
    nextStage: (typeof stages)[number] | null;
  }[] = [{ kind: "KILL", label: "End experiment", nextStage: null }];
  const expired = now >= Date.parse(experiment.deadline_at);
  if (experiment.status === "ACTIVE")
    result.unshift({ kind: "PAUSE", label: "Pause", nextStage: null });
  if (experiment.status === "PAUSED" && !expired)
    result.unshift({ kind: "RESUME", label: "Resume", nextStage: null });
  if (
    expired &&
    (experiment.stage !== "DECIDING" || experiment.status === "PAUSED")
  )
    result.push({
      kind: "ADVANCE",
      label: "Begin final analysis",
      nextStage: "DECIDING",
    });
  else if (experiment.status === "ACTIVE" && experiment.stage === "DECIDING")
    result.push({
      kind: "COMPLETE",
      label: "Complete experiment",
      nextStage: null,
    });
  else if (experiment.status === "ACTIVE" && !expired)
    result.push({
      kind: "ADVANCE",
      label: "Advance stage",
      nextStage: stages[stages.indexOf(experiment.stage) + 1],
    });
  return result;
}
