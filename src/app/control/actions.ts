"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { commandSchema, experimentSchema } from "@/domain/experiment";
import { requireOperator } from "@/lib/auth/operator";

export async function runCommand(form: FormData) {
  const client = await requireOperator(true);
  const parsed = commandSchema.safeParse({
    commandId: form.get("commandId"),
    kind: form.get("kind"),
    experimentId: form.get("experimentId") || null,
    expectedVersion: form.get("expectedVersion")
      ? Number(form.get("expectedVersion"))
      : null,
    nextStage: form.get("nextStage") || null,
    reason: form.get("reason"),
    minutes: form.get("minutes") ? Number(form.get("minutes")) : null,
  });
  if (!parsed.success) redirect("/control?error=invalid");
  const c = parsed.data;
  const { data, error } = await client.rpc("experiment_command", {
    p_command_id: c.commandId,
    p_kind: c.kind,
    p_experiment_id: c.experimentId,
    p_expected_version: c.expectedVersion,
    p_next_stage: c.nextStage,
    p_reason: c.reason,
    p_minutes: c.minutes,
  });
  if (error) {
    const code =
      error.code === "40001"
        ? "stale"
        : error.code === "23505"
          ? "active"
          : "rejected";
    redirect(`/control?error=${code}`);
  }
  experimentSchema.parse(data);
  revalidatePath("/control");
  redirect("/control");
}
