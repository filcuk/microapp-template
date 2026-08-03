/**
 * Shared resolve / verify helpers for template lock + manifest.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { DERIVED_FILES, renderTemplateCssIndex } from "./template-catalogue.mjs";

/**
 * @param {string} posixPath
 */
export function toPosix(posixPath) {
  return posixPath.split(path.sep).join("/");
}

/**
 * @param {string} root
 * @param {string} relativePosix
 */
export function resolveUnder(root, relativePosix) {
  return path.join(root, ...relativePosix.split("/"));
}

/**
 * @param {Buffer | string} data
 */
export function sha256Hex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * @param {string} root
 * @param {string} relativePosix
 */
export function hashFileUnder(root, relativePosix) {
  return sha256Hex(fs.readFileSync(resolveUnder(root, relativePosix)));
}

/**
 * @param {string} relativePosix
 * @param {string[]} patterns
 */
export function isAppOwnedPath(relativePosix, patterns) {
  const p = toPosix(relativePosix);
  return patterns.some((pattern) => {
    if (pattern.endsWith("/")) {
      return p === pattern.slice(0, -1) || p.startsWith(pattern);
    }
    return p === pattern;
  });
}

/**
 * @param {object} lock
 * @param {object} manifest
 * @returns {string[]}
 */
export function resolveSelectedComponentIds(lock, manifest) {
  const requested = lock.components;
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new Error("template.lock.json must include a non-empty components array");
  }

  const allIds = Object.keys(manifest.components);
  const cssOnlyIds = Object.keys(manifest.cssOnly || {});
  const selected = new Set();

  if (requested.includes("*")) {
    for (const id of allIds) selected.add(id);
    for (const id of cssOnlyIds) selected.add(id);
  } else {
    for (const id of requested) {
      if (!(id in manifest.components) && !(id in (manifest.cssOnly || {}))) {
        throw new Error(`Unknown component in lock: ${id}`);
      }
      selected.add(id);
    }
  }

  // Always-on catalogue components
  for (const [id, def] of Object.entries(manifest.components)) {
    if (def.always) selected.add(id);
  }
  for (const [id, def] of Object.entries(manifest.cssOnly || {})) {
    if (def.always) selected.add(id);
  }

  return [...selected].sort();
}

/**
 * @param {object} manifest
 * @param {string[]} selectedIds
 * @returns {string[]}
 */
export function resolveCssIndex(manifest, selectedIds) {
  const needed = new Set(manifest.core?.css || []);

  for (const id of selectedIds) {
    const comp = manifest.components[id];
    if (comp) {
      for (const css of comp.css || []) needed.add(css);
    }
    const cssOnly = manifest.cssOnly?.[id];
    if (cssOnly) {
      for (const css of cssOnly.css || []) needed.add(css);
    }
  }

  const order = manifest.cssIndexOrder || [];
  return order.filter((name) => needed.has(name));
}

/**
 * Concrete template-owned paths required for the lock selection.
 * @param {object} lock
 * @param {object} manifest
 * @returns {{ components: string[], files: string[], css: string[] }}
 */
export function resolveSelection(lock, manifest) {
  const components = resolveSelectedComponentIds(lock, manifest);
  /** @type {Set<string>} */
  const files = new Set(manifest.core?.files || []);

  for (const id of components) {
    const comp = manifest.components[id];
    if (comp) {
      for (const file of comp.files || []) files.add(file);
      for (const file of comp.vendorFiles || []) files.add(file);
      for (const infraId of comp.infra || []) {
        for (const file of manifest.infra?.[infraId] || []) {
          // config.js is app-owned; skip copying even if listed as infra
          if (!isAppOwnedPath(file, manifest.appOwned || [])) {
            files.add(file);
          }
        }
      }
    }
  }

  const css = resolveCssIndex(manifest, components);
  for (const basename of css) {
    files.add(`app/css/${basename}`);
  }

  // Manifest itself is part of a synced tree so verify can run offline
  files.add("template-manifest.json");

  return {
    components,
    files: [...files].sort(),
    css,
  };
}

/**
 * Preserve APP_VERSION while updating TEMPLATE_VERSION.
 * @param {string} existingSource
 * @param {string} upstreamSource
 */
export function mergeVersionJs(existingSource, upstreamSource) {
  const appMatch = /export const APP_VERSION = "([^"]+)"/.exec(existingSource);
  const templateMatch = /export const TEMPLATE_VERSION = "([^"]+)"/.exec(upstreamSource);
  if (!templateMatch) {
    throw new Error("Upstream version.js missing TEMPLATE_VERSION");
  }

  let next = upstreamSource;
  if (appMatch) {
    if (/export const APP_VERSION = "[^"]*"/.test(next)) {
      next = next.replace(
        /export const APP_VERSION = "[^"]*"/,
        `export const APP_VERSION = "${appMatch[1]}"`
      );
    }
  }
  return next;
}

/**
 * @param {string} root
 * @param {object} lock
 * @param {object} manifest
 */
export function verifyTemplateTree(root, lock, manifest) {
  const selection = resolveSelection(lock, manifest);
  const appOwned = manifest.appOwned || [];

  /** @type {{ path: string, status: string, expected?: string, actual?: string }[]} */
  const results = [];

  for (const rel of selection.files) {
    if (rel === "template-manifest.json") {
      const abs = resolveUnder(root, rel);
      if (!fs.existsSync(abs)) {
        results.push({ path: rel, status: "missing" });
      } else {
        results.push({ path: rel, status: "identical" });
      }
      continue;
    }

    if (isAppOwnedPath(rel, appOwned)) continue;

    // version.js: only TEMPLATE_VERSION must match; APP_VERSION is fork-owned
    if (rel === "app/version.js") {
      const abs = resolveUnder(root, rel);
      if (!fs.existsSync(abs)) {
        results.push({ path: rel, status: "missing" });
        continue;
      }
      const src = fs.readFileSync(abs, "utf8");
      const match = /export const TEMPLATE_VERSION = "([^"]+)"/.exec(src);
      if (match?.[1] === manifest.templateVersion) {
        results.push({ path: rel, status: "identical" });
      } else {
        results.push({
          path: rel,
          status: "modified",
          expected: manifest.templateVersion,
          actual: match?.[1],
        });
      }
      continue;
    }

    const meta = manifest.files[rel];
    const abs = resolveUnder(root, rel);
    if (!meta) {
      // Expected path not hashed upstream (should not happen for catalogue files)
      if (!fs.existsSync(abs)) {
        results.push({ path: rel, status: "missing" });
      } else {
        results.push({ path: rel, status: "identical" });
      }
      continue;
    }

    if (!fs.existsSync(abs)) {
      results.push({ path: rel, status: "missing", expected: meta.sha256 });
      continue;
    }

    const actual = hashFileUnder(root, rel);
    if (actual === meta.sha256) {
      results.push({ path: rel, status: "identical", expected: meta.sha256, actual });
    } else {
      results.push({
        path: rel,
        status: "modified",
        expected: meta.sha256,
        actual,
      });
    }
  }

  // Derived template.css
  const expectedCss = renderTemplateCssIndex(selection.css);
  const derivedPath = "app/css/template.css";
  const derivedAbs = resolveUnder(root, derivedPath);
  if (!fs.existsSync(derivedAbs)) {
    results.push({ path: derivedPath, status: "missing" });
  } else {
    const disk = fs.readFileSync(derivedAbs, "utf8").replace(/\r\n/g, "\n");
    if (disk === expectedCss) {
      results.push({
        path: derivedPath,
        status: "identical",
        expected: sha256Hex(expectedCss),
        actual: sha256Hex(disk),
      });
    } else {
      results.push({
        path: derivedPath,
        status: "modified",
        expected: sha256Hex(expectedCss),
        actual: sha256Hex(disk),
      });
    }
  }

  // Unexpected: known template files present but not selected
  const expectedSet = new Set(selection.files);
  expectedSet.add(derivedPath);
  for (const rel of Object.keys(manifest.files)) {
    if (expectedSet.has(rel)) continue;
    if (isAppOwnedPath(rel, appOwned)) continue;
    if (DERIVED_FILES.includes(rel)) continue;
    const abs = resolveUnder(root, rel);
    if (fs.existsSync(abs)) {
      results.push({ path: rel, status: "unexpected" });
    }
  }

  const summary = {
    identical: results.filter((r) => r.status === "identical").length,
    modified: results.filter((r) => r.status === "modified").length,
    missing: results.filter((r) => r.status === "missing").length,
    unexpected: results.filter((r) => r.status === "unexpected").length,
  };

  const ok =
    summary.modified === 0 && summary.missing === 0 && summary.unexpected === 0;

  return {
    ok,
    templateVersion: lock.templateVersion,
    components: selection.components,
    css: selection.css,
    summary,
    results,
    expectedCss,
  };
}

/**
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = "true";
    }
  }
  return out;
}
