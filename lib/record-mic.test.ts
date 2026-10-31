import assert from "node:assert/strict";
import { test } from "node:test";

import { micErrorMessage, pickRecorderMime, recorderFileMeta } from "./record-mic.ts";

test("micErrorMessage maps permission, missing device, and cancel", () => {
  const denied = new Error("Permission denied");
  denied.name = "NotAllowedError";
  assert.equal(
    micErrorMessage(denied),
    "Microphone blocked. Allow mic in the browser, or upload a file.",
  );

  const missing = new Error("Requested device not found");
  missing.name = "NotFoundError";
  assert.equal(micErrorMessage(missing), "No microphone found. Plug one in, or upload a file.");

  const cancelled = new Error("Listening cancelled.");
  cancelled.name = "AbortError";
  assert.equal(micErrorMessage(cancelled), "");
});

test("micErrorMessage covers insecure page and empty audio", () => {
  const insecure = new Error("Microphone needs https (or localhost). Upload a file instead.");
  insecure.name = "NotSupportedError";
  assert.equal(
    micErrorMessage(insecure),
    "This browser cannot listen from the mic. Upload a file instead.",
  );
  assert.match(micErrorMessage(new Error("")), /upload a file/i);
});

test("recorderFileMeta stays on the identify-audio audio path", () => {
  assert.deepEqual(recorderFileMeta("audio/webm;codecs=opus"), {
    type: "audio/webm",
    name: "listen.opus",
  });
  assert.deepEqual(recorderFileMeta("audio/mp4"), { type: "audio/mp4", name: "listen.m4a" });
  assert.deepEqual(recorderFileMeta("audio/ogg;codecs=opus"), { type: "audio/ogg", name: "listen.ogg" });
});

test("pickRecorderMime is empty without MediaRecorder", () => {
  assert.equal(typeof MediaRecorder, "undefined");
  assert.equal(pickRecorderMime(), "");
});
