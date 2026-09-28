import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyLocalClientState,
  executeLocalCommand,
  normalizePhoneNumber,
  recordDial,
  registerTarget
} from "../client/src/local/shell.js";

test("local shell normalizes seven digit phone numbers", () => {
  assert.equal(normalizePhoneNumber("555-1313"), "555-1313");
  assert.equal(normalizePhoneNumber("5551313"), "555-1313");
  assert.equal(normalizePhoneNumber("55513"), null);
});

test("local shell exposes scan and dial actions", () => {
  const state = emptyLocalClientState();
  assert.deepEqual(executeLocalCommand("scan", state).action, { type: "scan" });
  assert.deepEqual(executeLocalCommand("dial 555-1313", state).action, { type: "dial", number: "555-1313" });
});

test("local target phonebook keeps multiple runs", () => {
  const state = emptyLocalClientState();
  registerTarget(state, "555-1313", "AAAA-BBBB", "american-meridian");
  registerTarget(state, "555-1776", "CCCC-DDDD", "american-meridian");
  recordDial(state, "555-1776", "CONNECTED", "CCCC-DDDD");

  assert.equal(Object.keys(state.targets).length, 2);
  assert.equal(state.lastNumber, "555-1776");
  const targets = executeLocalCommand("targets", state).lines.join("\n");
  assert.match(targets, /555-1313/);
  assert.match(targets, /555-1776/);
});
