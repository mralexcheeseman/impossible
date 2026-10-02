import { describe, expect, it } from "vitest";
import {
  availableCommands,
  commandSchema,
  type Experiment,
} from "./experiment";
import { classifyRisk, executionDecision } from "./permissions";
const exp: Experiment = {
  id: "11111111-1111-4111-8111-111111111111",
  number: 1,
  status: "ACTIVE",
  stage: "DISCOVERING",
  started_at: "2026-10-01T00:00:00Z",
  deadline_at: "2026-10-08T00:00:00Z",
  ended_at: null,
  version: 1,
  acquisition_budget_pence: 0,
  constitution_version: "1",
  autonomy_policy: "operator-only-v1",
};
describe("command affordances", () => {
  it("offers only the next stage, pause and kill while active", () => {
    expect(availableCommands(exp, Date.parse("2026-10-02"))).toEqual(
      expect.arrayContaining([
        { kind: "ADVANCE", label: "Advance stage", nextStage: "CHALLENGING" },
      ]),
    );
  });
  it("does not offer resume after expiry and permits final analysis", () => {
    const actions = availableCommands(
      { ...exp, status: "PAUSED" },
      Date.parse("2026-10-09"),
    );
    expect(actions.map((action) => action.kind)).not.toContain("RESUME");
    expect(actions.find((action) => action.kind === "ADVANCE")?.nextStage).toBe(
      "DECIDING",
    );
  });
  it("offers no terminal mutations", () => {
    expect(availableCommands({ ...exp, status: "KILLED" }, 0)).toEqual([]);
  });
  it("rejects missing version and invalid duration or reason", () => {
    expect(
      commandSchema.safeParse({
        commandId: exp.id,
        kind: "PAUSE",
        experimentId: exp.id,
        expectedVersion: null,
        nextStage: null,
        reason: "",
        minutes: -1,
      }).success,
    ).toBe(false);
  });
});
it.each([
  "deploy",
  "spend_money",
  "draft_code",
  "fabricated_traction",
  "unknown",
  "toString",
  "__proto__",
])("never executes %s in M1", (action) => {
  expect(executionDecision(action).allowed).toBe(false);
});
it("distinguishes prohibition from approval requirements", () => {
  expect(classifyRisk("spam")).toBe("PROHIBITED");
  expect(classifyRisk("deploy")).toBe("AMBER");
  expect(classifyRisk("spend_money")).toBe("RED");
  expect(classifyRisk("__proto__")).toBe("UNKNOWN");
});
