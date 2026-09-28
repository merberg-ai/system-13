import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { GameEngine } from "../client/src/engine/core/engine.js";
import { generateWorld } from "../client/src/engine/scenario/generator.js";
import { validateScenario } from "../client/src/engine/scenario/validate.js";

const scenario = validateScenario(JSON.parse(fs.readFileSync("scenarios/northstar-relay/scenario.json", "utf8")));

function newEngine(): GameEngine {
  return new GameEngine(generateWorld(scenario, "NORTHSTAR-TEST-13"));
}

test("Northstar field-to-root path reaches DARKLINE ending", () => {
  const engine = newEngine();
  engine.handleInput("field");
  engine.handleInput("service");
  assert.equal(engine.user?.username, "field");

  const backup = engine.handleInput("cat /var/backups/ops.env").lines.join("\n");
  const opsPassword = backup.match(/OPS_PASS=(\S+)/)?.[1];
  assert.ok(opsPassword);

  engine.handleInput("su clarke");
  engine.handleInput(opsPassword!);
  assert.equal(engine.user?.username, "clarke");

  const mail = engine.handleInput("mail").lines.join("\n");
  const rootPassword = mail.match(/ROOT RECOVERY: (\S+)/)?.[1];
  assert.ok(rootPassword);

  engine.handleInput("su root");
  engine.handleInput(rootPassword!);
  assert.equal(engine.user?.username, "root");
  assert.ok(engine.state.rootedHosts.includes("relay9"));

  const briefing = engine.handleInput("cat /root/DARKLINE/briefing.txt").lines.join("\n");
  assert.match(briefing, /DARKLINE ACCESS LOGGED/);
  assert.equal(engine.state.ending?.id, "darkline");
  assert.ok(engine.state.achievements.includes("off-the-books"));
});
