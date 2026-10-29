import assert from "node:assert/strict";
import { test } from "node:test";
import { clampUnit, moodMarkerPercent, moodQuadrant, moodQuadrantAxes } from "./mood-quadrant.ts";

test("moodQuadrant names energy × valence as character, not a rank", () => {
  assert.equal(moodQuadrant(0.82, 0.81), "UP");
  assert.equal(moodQuadrant(0.82, 0.41), "TENSE");
  assert.equal(moodQuadrant(0.22, 0.74), "SOFT");
  assert.equal(moodQuadrant(0.18, 0.2), "LOW");
});

test("moodQuadrant treats 0.5 as high so every track lands in a cell", () => {
  assert.equal(moodQuadrant(0.5, 0.5), "UP");
  assert.equal(moodQuadrant(0.5, 0.49), "TENSE");
  assert.equal(moodQuadrant(0.49, 0.5), "SOFT");
  assert.equal(moodQuadrant(0.49, 0.49), "LOW");
});

test("moodQuadrant clamps junk to LOW", () => {
  assert.equal(moodQuadrant(Number.NaN, Number.NaN), "LOW");
  assert.equal(moodQuadrant(-2, -1), "LOW");
  assert.equal(moodQuadrant(2, 2), "UP");
});

test("moodQuadrantAxes spells the two Spotify features", () => {
  assert.equal(moodQuadrantAxes("TENSE"), "high energy, low valence");
  assert.equal(moodQuadrantAxes("UP"), "high energy, high valence");
  assert.equal(moodQuadrantAxes("SOFT"), "low energy, high valence");
  assert.equal(moodQuadrantAxes("LOW"), "low energy, low valence");
});

test("moodMarkerPercent puts high energy at the top and high valence to the right", () => {
  assert.equal(clampUnit(1.4), 1);
  assert.deepEqual(moodMarkerPercent(1, 0), { left: 0, top: 0 });
  assert.deepEqual(moodMarkerPercent(0, 1), { left: 100, top: 100 });
  assert.deepEqual(moodMarkerPercent(0.5, 0.5), { left: 50, top: 50 });
});
