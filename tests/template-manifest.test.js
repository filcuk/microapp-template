import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  APP_OWNED,
  COMPONENTS,
  CSS_INDEX_ORDER,
  DERIVED_FILES,
} from "../scripts/lib/template-catalogue.mjs";
import { renderTemplateCssIndex } from "../scripts/lib/template-catalogue.mjs";
import {
  buildManifest,
  hashFile,
  isAppOwnedPath,
  readTemplateVersion,
  sha256Hex,
} from "../scripts/generate-template-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "template-manifest.json");

test("readTemplateVersion matches app/version.js", () => {
  assert.equal(readTemplateVersion(), "0.9.0");
});

test("isAppOwnedPath covers files and directory prefixes", () => {
  assert.equal(isAppOwnedPath("app/main.js"), true);
  assert.equal(isAppOwnedPath("app/res/app.svg"), true);
  assert.equal(isAppOwnedPath("app/components/dialog.js"), false);
  assert.equal(isAppOwnedPath("app/css/template.css"), false);
});

test("buildManifest excludes app-owned and derived from files hashes", () => {
  const manifest = buildManifest();
  for (const owned of APP_OWNED) {
    if (owned.endsWith("/")) {
      for (const key of Object.keys(manifest.files)) {
        assert.equal(key.startsWith(owned), false, key);
      }
    } else {
      assert.equal(owned in manifest.files, false, owned);
    }
  }
  for (const derived of DERIVED_FILES) {
    assert.equal(derived in manifest.files, false, derived);
    assert.ok(manifest.derived[derived]?.sha256);
  }
});

test("buildManifest hashes match on-disk bytes for every file entry", () => {
  const manifest = buildManifest();
  for (const [rel, meta] of Object.entries(manifest.files)) {
    assert.equal(meta.sha256, hashFile(rel), rel);
  }
});

test("checked-in template-manifest.json matches a fresh build (stable fields)", () => {
  assert.ok(fs.existsSync(MANIFEST_PATH), "template-manifest.json missing — run npm run manifest:template");
  const onDisk = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const fresh = buildManifest();

  assert.equal(onDisk.schemaVersion, 1);
  assert.equal(onDisk.templateVersion, fresh.templateVersion);
  assert.deepEqual(onDisk.appOwned, fresh.appOwned);
  assert.deepEqual(onDisk.appOwnedFields, fresh.appOwnedFields);
  assert.deepEqual(onDisk.core, fresh.core);
  assert.deepEqual(onDisk.cssIndexOrder, fresh.cssIndexOrder);
  assert.deepEqual(Object.keys(onDisk.components).sort(), Object.keys(COMPONENTS).sort());
  assert.deepEqual(onDisk.files, fresh.files);
  assert.deepEqual(onDisk.derived, fresh.derived);
});

test("renderTemplateCssIndex matches checked-in template.css", () => {
  const body = renderTemplateCssIndex(CSS_INDEX_ORDER);
  for (const name of CSS_INDEX_ORDER) {
    assert.match(body, new RegExp(`@import url\\("${name}"\\);`));
  }
  const diskText = fs
    .readFileSync(path.join(ROOT, "app/css/template.css"), "utf8")
    .replace(/\r\n/g, "\n");
  assert.equal(diskText, body);
  assert.equal(sha256Hex(body), hashFile("app/css/template.css"));
});
