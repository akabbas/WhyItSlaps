import assert from "node:assert/strict";
import test from "node:test";
import { loadingBarFloor, loadingStatus, nextLoadingBar } from "./loading-stage.ts";

test("status stays on one idle line until a real stage arrives", () => {
  assert.equal(loadingStatus("music", null), "starting the track read");
  assert.equal(loadingStatus("music", "nope"), "starting the track read");
  assert.equal(loadingStatus("analyze", "fetch"), "fetching the clip");
  assert.equal(loadingStatus("analyze", "critique"), "writing the critique");
  assert.equal(loadingStatus("still", null), "reading the image");
});

test("bar never decreases and never claims 100", () => {
  const a = nextLoadingBar(8, 0, null);
  const b = nextLoadingBar(a, 4000, "fetch");
  const c = nextLoadingBar(b, 8000, "critique");
  const d = nextLoadingBar(c, 60_000, "critique");
  assert.ok(b >= a);
  assert.ok(c >= b);
  assert.ok(d >= c);
  assert.equal(d <= 90, true);
  assert.ok(loadingBarFloor("critique") >= loadingBarFloor("fetch"));
  assert.ok(c >= loadingBarFloor("critique"));
});
