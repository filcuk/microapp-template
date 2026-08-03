import assert from "node:assert/strict";
import test from "node:test";

import { ICONS, ICON_ATTRIBUTIONS } from "../app/utils/icons.js";
import { TEMPLATE_ICONS } from "../app/utils/icons-template.js";
import { APP_ICONS } from "../app/utils/icons-app.js";

test("template ships a non-empty TEMPLATE_ICONS catalogue", () => {
  assert.ok(Object.keys(TEMPLATE_ICONS).length >= 20);
  assert.ok(TEMPLATE_ICONS["light-mode"]?.markup);
  assert.deepEqual(TEMPLATE_ICONS.lines, { ref: "note" });
});

test("APP_ICONS is empty in the template itself", () => {
  assert.deepEqual(APP_ICONS, {});
});

test("merged ICONS includes every template id", () => {
  for (const key of Object.keys(TEMPLATE_ICONS)) {
    assert.equal(ICONS[key], TEMPLATE_ICONS[key], key);
  }
});

test("ICON_ATTRIBUTIONS is re-exported from icons.js", () => {
  assert.match(ICON_ATTRIBUTIONS.materialIcons, /Material Icons/);
  assert.match(ICON_ATTRIBUTIONS.materialSymbols, /Material Symbols/);
});
