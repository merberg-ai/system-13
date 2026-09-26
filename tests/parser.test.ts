import assert from "node:assert/strict";import test from "node:test";import { parseCommand, tokenize } from "../client/src/engine/command/parser.js";
test("tokenizer handles quotes and escapes",()=>{assert.deepEqual(tokenize(`grep -i "project echo" '/tmp/a b'`),["grep","-i","project echo","/tmp/a b"]);assert.deepEqual(tokenize(`cat hello\\ world`),["cat","hello world"]);});
test("parser normalizes command name",()=>{assert.deepEqual(parseCommand("LS -la /tmp"),{raw:"LS -la /tmp",name:"ls",args:["-la","/tmp"]});});
