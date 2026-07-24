import test from "node:test";
import assert from "node:assert/strict";
import {
  parseColumnType,
  coerceCellValue,
  defaultValueForType,
} from "../app/components/tabular-input.js";

test("parseColumnType accepts known types and defaults unknown to text", () => {
  assert.equal(parseColumnType("text"), "text");
  assert.equal(parseColumnType("NUMBER"), "number");
  assert.equal(parseColumnType("logical"), "logical");
  assert.equal(parseColumnType("date"), "text");
  assert.equal(parseColumnType(""), "text");
  assert.equal(parseColumnType(undefined), "text");
});

test("defaultValueForType matches each column type", () => {
  assert.equal(defaultValueForType("text"), "");
  assert.equal(defaultValueForType("number"), null);
  assert.equal(defaultValueForType("logical"), false);
});

test("coerceCellValue to text", () => {
  assert.equal(coerceCellValue(null, "text"), "");
  assert.equal(coerceCellValue(true, "text"), "true");
  assert.equal(coerceCellValue(12, "text"), "12");
  assert.equal(coerceCellValue("hello", "text"), "hello");
});

test("coerceCellValue to number", () => {
  assert.equal(coerceCellValue("", "number"), null);
  assert.equal(coerceCellValue(null, "number"), null);
  assert.equal(coerceCellValue("12.5", "number"), 12.5);
  assert.equal(coerceCellValue("1,000", "number"), 1000);
  assert.equal(coerceCellValue(true, "number"), 1);
  assert.equal(coerceCellValue("nope", "number"), null);
});

test("coerceCellValue to logical", () => {
  assert.equal(coerceCellValue(true, "logical"), true);
  assert.equal(coerceCellValue(0, "logical"), false);
  assert.equal(coerceCellValue("yes", "logical"), true);
  assert.equal(coerceCellValue("off", "logical"), false);
  assert.equal(coerceCellValue("", "logical"), false);
  assert.equal(coerceCellValue("maybe", "logical"), true);
});
