/**
 * Sync template-owned files from an upstream revision into this app tree.
 *
 * Usage:
 *   node scripts/sync-template.mjs --from ../microapp-template
 *   node scripts/sync-template.mjs --version 0.9.0
 *   node scripts/sync-template.mjs --from . --dry-run
 *
 * Reads `template.lock.json` for version + component selection. Never overwrites
 * app-owned paths. Regenerates `app/css/template.css`. Merges `APP_VERSION` when
 * updating `app/version.js`.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderTemplateCssIndex } from "./lib/template-catalogue.mjs";
import {
  isAppOwnedPath,
  mergeVersionJs,
  parseArgs,
  resolveSelection,
  resolveUnder,
  toPosix,
} from "./lib/template-resolve.mjs";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {string} root
 * @param {string} relative
 */
function readJson(root, relative) {
  const abs = resolveUnder(root, relative);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing ${relative}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

/**
 * @param {string} absPath
 * @param {unknown} value
 */
function writeJson(absPath, value) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/**
 * @param {string} source owner/repo
 * @param {string} version X.Y.Z
 * @param {string} destDir
 */
async function fetchTaggedTree(source, version, destDir) {
  const tag = version.startsWith("v") ? version : `v${version}`;
  const url = `https://github.com/${source}/archive/refs/tags/${tag}.tar.gz`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const archivePath = path.join(destDir, "upstream.tar.gz");
  fs.writeFileSync(archivePath, Buffer.from(await response.arrayBuffer()));

  const extractDir = path.join(destDir, "extract");
  fs.mkdirSync(extractDir, { recursive: true });
  execFileSync("tar", ["-xzf", archivePath, "-C", extractDir], { stdio: "pipe" });

  const entries = fs.readdirSync(extractDir).filter((name) => {
    return fs.statSync(path.join(extractDir, name)).isDirectory();
  });
  if (entries.length !== 1) {
    throw new Error(`Expected one top-level directory in archive, found: ${entries.join(", ")}`);
  }
  return path.join(extractDir, entries[0]);
}

/**
 * @param {string} fromRoot
 * @param {string} toRoot
 * @param {string} relativePosix
 * @param {{ dryRun?: boolean }} [options]
 */
function copyFileRelative(fromRoot, toRoot, relativePosix, { dryRun = false } = {}) {
  const from = resolveUnder(fromRoot, relativePosix);
  const to = resolveUnder(toRoot, relativePosix);
  if (!fs.existsSync(from)) {
    throw new Error(`Upstream missing file: ${relativePosix}`);
  }
  if (dryRun) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

/**
 * @param {string[]} argv
 */
export async function runSync(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const root = path.resolve(args.root || DEFAULT_ROOT);
  const dryRun = args["dry-run"] === "true";
  const lockPath = args.lock || "template.lock.json";

  /** @type {object} */
  let lock = readJson(root, lockPath);
  if (args.version) {
    lock = { ...lock, templateVersion: args.version.replace(/^v/, "") };
  }

  const source = lock.source || "filcuk/microapp-template";
  let upstreamRoot;
  /** @type {string | null} */
  let tempDir = null;

  try {
    if (args.from) {
      upstreamRoot = path.resolve(args.from);
    } else {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "microapp-template-sync-"));
      console.log(`Fetching ${source}@v${lock.templateVersion}…`);
      upstreamRoot = await fetchTaggedTree(source, lock.templateVersion, tempDir);
    }

    const manifestPath = resolveUnder(upstreamRoot, "template-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error(
        `Upstream tree has no template-manifest.json (${toPosix(upstreamRoot)}). ` +
          `Use a template revision that includes the manifest, or pass --from a local checkout.`
      );
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const selection = resolveSelection(lock, manifest);
    const appOwned = manifest.appOwned || lock.appOwned || [];

    /** @type {string[]} */
    const copied = [];
    /** @type {string[]} */
    const skipped = [];

    for (const rel of selection.files) {
      if (isAppOwnedPath(rel, appOwned)) {
        skipped.push(rel);
        continue;
      }

      if (rel === "app/version.js") {
        const upstream = fs.readFileSync(resolveUnder(upstreamRoot, rel), "utf8");
        const localAbs = resolveUnder(root, rel);
        const local = fs.existsSync(localAbs) ? fs.readFileSync(localAbs, "utf8") : upstream;
        const merged = mergeVersionJs(local, upstream);
        if (!dryRun) {
          fs.mkdirSync(path.dirname(localAbs), { recursive: true });
          fs.writeFileSync(localAbs, merged, "utf8");
        }
        copied.push(rel);
        continue;
      }

      if (rel === "template-manifest.json") {
        copyFileRelative(upstreamRoot, root, rel, { dryRun });
        copied.push(rel);
        continue;
      }

      copyFileRelative(upstreamRoot, root, rel, { dryRun });
      copied.push(rel);
    }

    const cssBody = renderTemplateCssIndex(selection.css);
    const cssAbs = resolveUnder(root, "app/css/template.css");
    if (!dryRun) {
      fs.mkdirSync(path.dirname(cssAbs), { recursive: true });
      fs.writeFileSync(cssAbs, cssBody, "utf8");
    }

    if (!dryRun) {
      writeJson(resolveUnder(root, lockPath), {
        schemaVersion: 1,
        templateVersion: lock.templateVersion,
        source,
        components: lock.components,
      });
    }

    console.log(
      `Template sync ${dryRun ? "(dry-run) " : ""}` +
        `v${lock.templateVersion}: ${copied.length} files, ` +
        `${selection.css.length} css partials, skipped app-owned=${skipped.length}`
    );
    console.log(`  components: ${selection.components.join(", ")}`);

    return {
      ok: true,
      dryRun,
      templateVersion: lock.templateVersion,
      copied,
      skipped,
      selection,
    };
  } finally {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runSync().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
