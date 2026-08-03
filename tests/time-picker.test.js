import test from "node:test";
import assert from "node:assert/strict";
import { parseTimeValue, isTimeWithinBounds } from "../app/components/time-picker.js";

test("parseTimeValue normalises HH:MM and HH:MM:SS", () => {
  assert.equal(parseTimeValue("14:30"), "14:30");
  assert.equal(parseTimeValue("9:05"), "09:05");
  assert.equal(parseTimeValue("14:30:05"), "14:30:05");
  assert.equal(parseTimeValue("0:00"), "00:00");
});

test("parseTimeValue rejects invalid input", () => {
  assert.equal(parseTimeValue(""), null);
  assert.equal(parseTimeValue(null), null);
  assert.equal(parseTimeValue("25:00"), null);
  assert.equal(parseTimeValue("12:60"), null);
  assert.equal(parseTimeValue("12:30:99"), null);
  assert.equal(parseTimeValue("noon"), null);
});

test("isTimeWithinBounds respects min and max", () => {
  assert.equal(isTimeWithinBounds("14:30", "09:00", "17:00"), true);
  assert.equal(isTimeWithinBounds("08:00", "09:00", "17:00"), false);
  assert.equal(isTimeWithinBounds("18:00", "09:00", "17:00"), false);
  assert.equal(isTimeWithinBounds("", "09:00", "17:00"), true);
});
