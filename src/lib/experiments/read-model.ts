import "server-only";
import { z } from "zod";
import { experimentSchema } from "@/domain/experiment";
import { requireOperator } from "@/lib/auth/operator";
const eventSchema = z.object({
  id: z.uuid(),
  sequence: z.number(),
  type: z.string(),
  created_at: z.string(),
  payload: z.record(z.string(), z.unknown()),
});
const interventionSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  reason: z.string(),
  minutes_estimate: z.number().nullable(),
});
const approvalSchema = z.object({
  id: z.uuid(),
  action_type: z.string(),
  risk_level: z.string(),
  status: z.string(),
  expires_at: z.string(),
});

const snapshotSchema = z.object({
  experiment: experimentSchema.nullable(),
  events: z.array(eventSchema),
  interventions: z.array(interventionSchema),
  approvals: z.array(approvalSchema),
  observed_at: z.iso.datetime({ offset: true }),
});
export async function loadControlRoom() {
  const client = await requireOperator();
  const { data, error } = await client.rpc("control_room");
  if (error) throw new Error("Unable to load experiment records");
  const snapshot = snapshotSchema.parse(data);
  return { ...snapshot, observedAt: Date.parse(snapshot.observed_at) };
}
