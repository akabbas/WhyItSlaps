import assert from "node:assert/strict";
import test from "node:test";
import { consumeNdjsonRecord, type NdjsonAcc } from "./clientNdjson.ts";

test("ignores pings, records stages in order, then the result", () => {
  const stages: string[] = [];
  const acc: NdjsonAcc<{ ok: boolean; track?: string }> = { payload: null };
  const handlers = { onStage: (stage: string) => stages.push(stage) };

  consumeNdjsonRecord({ type: "ping" }, acc, handlers);
  consumeNdjsonRecord({ type: "stage", stage: "fetch" }, acc, handlers);
  consumeNdjsonRecord({ type: "stage", stage: "critique" }, acc, handlers);
  consumeNdjsonRecord({ type: "result", status: 200, ok: true, track: "x" }, acc, handlers);

  assert.deepEqual(stages, ["fetch", "critique"]);
  assert.deepEqual(acc.payload, { ok: true, track: "x" });
});

test("skips empty or non-string stages", () => {
  const stages: string[] = [];
  const acc: NdjsonAcc<{ ok: boolean }> = { payload: null };
  consumeNdjsonRecord({ type: "stage" }, acc, { onStage: (s) => stages.push(s) });
  consumeNdjsonRecord({ type: "stage", stage: "" }, acc, { onStage: (s) => stages.push(s) });
  consumeNdjsonRecord({ type: "stage", stage: 3 }, acc, { onStage: (s) => stages.push(s) });
  assert.deepEqual(stages, []);
  assert.equal(acc.payload, null);
});
