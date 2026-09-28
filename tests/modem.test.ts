import test from "node:test";
import assert from "node:assert/strict";
import { planWarDial } from "../client/src/presentation/modem.js";

test("war-dial scan always fails at least once before connecting", () => {
  for (let index = 0; index < 128; index += 1) {
    const plan = planWarDial(`SCAN-SEED-${index}`);
    assert.ok(plan.attempts.length >= 1);
    assert.ok(plan.attempts.length <= 8);
    assert.ok(plan.attempts.every((attempt) => attempt.outcome !== "CONNECTED"));
  }
});

test("war-dial failure count varies across scans", () => {
  const counts = new Set<number>();
  for (let index = 0; index < 128; index += 1) {
    counts.add(planWarDial(`VARIATION-SEED-${index}`).attempts.length);
  }
  assert.ok(counts.size >= 4, `expected varied failure counts, got ${[...counts].join(", ")}`);
});
