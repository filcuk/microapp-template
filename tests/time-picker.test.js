import test from "node:test";
import assert from "node:assert/strict";
import { parseTimeValue } from "../app/components/time-picker.js";

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
