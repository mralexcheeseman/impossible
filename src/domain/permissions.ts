export type Risk = "GREEN" | "AMBER" | "RED" | "PROHIBITED" | "UNKNOWN";
const risks: Record<string, Risk> = {
  analyse_evidence: "GREEN",
  draft_hypothesis: "GREEN",
  draft_code: "GREEN",
  deploy: "AMBER",
  publish: "AMBER",
  contact_person: "AMBER",
  change_pricing: "AMBER",
  create_resource: "AMBER",
  spend_money: "RED",
  enter_contract: "RED",
  delete_production_data: "RED",
  export_sensitive_data: "RED",
  deceptive_identity: "PROHIBITED",
  fabricated_traction: "PROHIBITED",
  spam: "PROHIBITED",
};
export function classifyRisk(action: string): Risk {
  return Object.hasOwn(risks, action) ? risks[action] : "UNKNOWN";
}
/** M1 has no action adapters. Even a stored approval cannot execute a side effect. */
export function executionDecision(action: string): {
  allowed: false;
  reason: string;
  risk: Risk;
} {
  const risk = classifyRisk(action);
  return {
    allowed: false,
    risk,
    reason:
      risk === "PROHIBITED"
        ? "Prohibited by the Constitution"
        : risk === "UNKNOWN"
          ? "Unknown action"
          : risk === "GREEN"
            ? "No execution adapter installed"
            : "Approval and execution adapter required",
  };
}
