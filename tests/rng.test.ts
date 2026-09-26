import assert from "node:assert/strict";import test from "node:test";import { rngStream, runIdFromSeed } from "../client/src/engine/rng/rng.js";
test("named RNG streams are deterministic",()=>{const a=rngStream("ABCDEF1234567890","project"),b=rngStream("ABCDEF1234567890","project");assert.deepEqual([a.next(),a.next(),a.next()],[b.next(),b.next(),b.next()]);});
test("different stream names diverge",()=>{assert.notEqual(rngStream("ABCDEF1234567890","project").next(),rngStream("ABCDEF1234567890","credentials").next());});
test("run id is stable",()=>{assert.equal(runIdFromSeed("ABCDEF1234567890"),"ABCD-EF12");});
