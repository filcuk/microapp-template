/**
 * Generate `template-manifest.json` from the live tree + catalogue.
 *
 * Usage: node scripts/generate-template-manifest.mjs
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  APP_OWNED,
  APP_OWNED_FIELDS,
  COMPONENTS,
  CORE,
  CSS_INDEX_ORDER,
  CSS_ONLY,
  CSS_PARTIAL_FEATURES,
  DEFAULT_SOURCE,
  DERIVED_FILES,
  INFRA,
  renderTemplateCssIndex,
} from "./lib/template-catalogue.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "template-manifest.json");
const VERSION_PATH = path.join(ROOT, "app", "version.js");

/**
 * @param {string} posixPath
 */
export function toPosix(posixPath) {
  return posixPath.split(path.sep).join("/");
}

/**
 * @param {string} relativePosix
 */
export function resolveRepoPath(relativePosix) {
  return path.join(ROOT, ...relativePosix.split("/"));
}

/**
 * @param {Buffer | string} data
 */
export function sha256Hex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * @param {string} relativePosix
 */
export function hashFile(relativePosix) {
  const abs = resolveRepoPath(relativePosix);
  return sha256Hex(fs.readFileSync(abs));
}

/**
 * @param {string} relativePosix
 * @param {string[]} patterns
 */
export function isAppOwnedPath(relativePosix, patterns = APP_OWNED) {
  const p = toPosix(relativePosix);
  return patterns.some((pattern) => {
    if (pattern.endsWith("/")) {
      return p === pattern.slice(0, -1) || p.startsWith(pattern);
    }
    return p === pattern;
  });
}

/**
 * @param {string} dirPosix
 * @returns {string[]}
 */
export function listFilesRecursive(dirPosix) {
  const abs = resolveRepoPath(dirPosix);
  if (!fs.existsSync(abs)) return [];
  /** @type {string[]} */
  const out = [];
  const walk = (dirAbs) => {
    for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
      const childAbs = path.join(dirAbs, entry.name);
      if (entry.isDirectory()) {
        walk(childAbs);
      } else if (entry.isFile()) {
        out.push(toPosix(path.relative(ROOT, childAbs)));
      }
    }
  };
  walk(abs);
  return out.sort();
}

/**
 * Expand a path or directory prefix into concrete file paths.
 * @param {string} entry
 */
export function expandPathEntry(entry) {
  if (entry.endsWith("/")) {
    return listFilesRecursive(entry.slice(0, -1));
  }
  return [entry];
}

/**
 * @returns {string}
 */
export function readTemplateVersion() {
  const src = fs.readFileSync(VERSION_PATH, "utf8");
  const match = /export const TEMPLATE_VERSION = "([^"]+)"/.exec(src);
  if (!match) {
    throw new Error("Could not parse TEMPLATE_VERSION from app/version.js");
  }
  return match[1];
}

/**
 * @returns {string[]}
 */
export function listAppFiles() {
  return listFilesRecursive("app");
}

export { renderTemplateCssIndex };

/**
 * @returns {object}
 */
export function buildManifest() {
  const templateVersion = readTemplateVersion();
  const appFiles = listAppFiles();

  /** @type {Record<string, { sha256: string }>} */
  const files = {};
  for (const rel of appFiles) {
    if (isAppOwnedPath(rel)) continue;
    if (DERIVED_FILES.includes(rel)) continue;
    files[rel] = { sha256: hashFile(rel) };
  }

  /** @type {Record<string, { generator: string, sha256: string }>} */
  const derived = {};
  for (const rel of DERIVED_FILES) {
    if (!fs.existsSync(resolveRepoPath(rel))) continue;
    derived[rel] = {
      generator: "css-index",
      sha256: hashFile(rel),
    };
  }

  /** @type {Record<string, object>} */
  const components = {};
  for (const [id, def] of Object.entries(COMPONENTS)) {
    const expandedVendor = def.vendor.flatMap((entry) => expandPathEntry(entry));
    components[id] = {
      files: [...def.files],
      css: [...def.css],
      vendor: [...def.vendor],
      vendorFiles: expandedVendor,
      icons: [...def.icons],
      infra: [...def.infra],
      ...(def.always ? { always: true } : {}),
      ...(def.notes ? { notes: def.notes } : {}),
    };
  }

  return {
    schemaVersion: 1,
    templateVersion,
    generatedAt: new Date().toISOString(),
    source: DEFAULT_SOURCE,
    appOwned: [...APP_OWNED],
    appOwnedFields: { ...APP_OWNED_FIELDS },
    derived,
    files,
    core: {
      files: [...CORE.files],
      css: [...CORE.css],
      icons: [...CORE.icons],
    },
    infra: { ...INFRA },
    components,
    cssOnly: { ...CSS_ONLY },
    cssPartialFeatures: { ...CSS_PARTIAL_FEATURES },
    cssIndexOrder: [...CSS_INDEX_ORDER],
  };
}

/**
 * @param {string} [outPath]
 */
export function writeManifest(outPath = MANIFEST_PATH) {
  const manifest = buildManifest();
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const manifest = writeManifest();
  const fileCount = Object.keys(manifest.files).length;
  const derivedCount = Object.keys(manifest.derived).length;
  console.log(
    `Wrote ${toPosix(path.relative(ROOT, MANIFEST_PATH))} ` +
      `(${manifest.templateVersion}, ${fileCount} files, ${derivedCount} derived)`
  );
}
