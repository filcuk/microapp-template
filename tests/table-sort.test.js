import test from "node:test";
import assert from "node:assert/strict";
import { getCellValue, compareValues } from "../app/components/table.js";

test("getCellValue parses numbers", () => {
  const cell = { textContent: "$12.50" };
  assert.equal(getCellValue(cell, "number"), 12.5);
});

test("getCellValue parses dates", () => {
  const cell = { textContent: "2026-03-12" };
  assert.equal(getCellValue(cell, "date"), Date.parse("2026-03-12"));
});

test("compareValues sorts text with localeCompare", () => {
  assert.ok(compareValues("alpha", "beta", "text") < 0);
});

test("compareValues sorts numbers numerically", () => {
  assert.equal(compareValues(2, 10, "number"), -8);
});

test("compareValues sorts dates numerically", () => {
  const earlier = Date.parse("2026-01-09");
  const later = Date.parse("2026-03-12");
  assert.ok(compareValues(earlier, later, "date") < 0);
});
