import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stylesPath = path.join(root, "app", "styles.css");
const templatePath = path.join(root, "app", "css", "template.css");
const appCssPath = path.join(root, "app", "css", "app.css");

const EXPECTED_PARTIALS = [
  "layout.css",
  "code-block.css",
  "controls-buttons.css",
  "controls-badges.css",
  "controls-chips.css",
  "controls-fields.css",
  "controls-widgets.css",
  "controls-section-panel.css",
  "controls-menus.css",
  "controls-disclosure.css",
  "controls-file.css",
  "overlays.css",
  "tutorial.css",
  "rich-text-editor.css",
  "table.css",
  "controls-tabular-input.css",
];

test("styles.css is a fork entry importing tokens, template, then app", () => {
  const css = fs.readFileSync(stylesPath, "utf8");
  assert.match(css, /@import url\("tokens\.css"\);/);
  assert.match(css, /@import url\("css\/template\.css"\);/);
  assert.match(css, /@import url\("css\/app\.css"\);/);
  assert.doesNotMatch(css, /@import url\("css\/layout\.css"\);/);
});

test("template.css indexes every catalogue partial", () => {
  const css = fs.readFileSync(templatePath, "utf8");
  for (const partial of EXPECTED_PARTIALS) {
    assert.match(css, new RegExp(`@import url\\("${partial}"\\);`));
    assert.ok(fs.existsSync(path.join(root, "app", "css", partial)), partial);
  }
});

test("app.css exists as a fork-owned stub", () => {
  assert.ok(fs.existsSync(appCssPath));
  const css = fs.readFileSync(appCssPath, "utf8");
  assert.doesNotMatch(css, /@import/);
});
