/**
 * Record a seamless looping scroll of demo.html (content only — no site chrome).
 * Dev-only tooling under scripts/ — does not touch app/ runtime code.
 *
 * Captures screenshots only while scrolling (no load/settle in the file), so a
 * looping player reads as an infinite carousel through the demo sections.
 *
 * Prerequisites:
 *   npx playwright install chromium
 *   ffmpeg on PATH, or `npm i -D ffmpeg-static` (bundled binary)
 *
 * Usage:
 *   npm run capture:demo
 *   npm run capture:demo -- --format webm
 *   npm run capture:demo -- --format gif,webp
 *   npm run capture:demo -- --theme dark --duration 12000 --width 900
 *   npm run capture:demo -- --preview
 *
 * Default output: res/demo-scroll.webp (animated). Use --format for webm/gif.
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CAPTURE_STYLE,
  DEFAULT_THEME_STORAGE_KEY,
  applyCaptureLayout,
  captureInitScript,
} from "./lib/capture-demo-prepare.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT_DIR = path.join(ROOT, "res");

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const OUTPUT_FORMATS = new Set(["webp", "webm", "gif"]);

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean | string[]>} */
  const out = {
    theme: "dark",
    width: "1400",
    height: "1200",
    duration: "50000",
    fps: "24",
    dpr: "1",
    outDir: DEFAULT_OUT_DIR,
    basename: "demo-scroll",
    preview: false,
    formats: ["webp"],
    headless: true,
    loop: true,
    settleMs: "800",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--preview") out.preview = true;
    else if (arg === "--no-loop") out.loop = false;
    else if (arg === "--headed") out.headless = false;
    else if (arg === "--theme") out.theme = argv[++i] || "light";
    else if (arg === "--width") out.width = argv[++i] || out.width;
    else if (arg === "--height") out.height = argv[++i] || out.height;
    else if (arg === "--duration") out.duration = argv[++i] || out.duration;
    else if (arg === "--fps") out.fps = argv[++i] || out.fps;
    else if (arg === "--dpr") out.dpr = argv[++i] || out.dpr;
    else if (arg === "--out-dir") out.outDir = path.resolve(argv[++i] || out.outDir);
    else if (arg === "--basename") out.basename = argv[++i] || out.basename;
    else if (arg === "--settle-ms") out.settleMs = argv[++i] || out.settleMs;
    else if (arg === "--format" || arg === "--formats") {
      const raw = String(argv[++i] || "");
      out.formats = parseFormats(raw);
    } else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
function parseFormats(raw) {
  const list = raw
    .split(/[,+\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) {
    throw new Error("--format needs at least one of: webp, webm, gif");
  }
  for (const fmt of list) {
    if (!OUTPUT_FORMATS.has(fmt)) {
      throw new Error(
        `Unknown format "${fmt}". Use: webp, webm, gif (comma-separated ok)`
      );
    }
  }
  return [...new Set(list)];
}

/**
 * @param {string | boolean | undefined} value
 * @param {string} label
 * @returns {number}
 */
function parsePositiveInt(value, label) {
  const raw = String(value ?? "")
    .trim()
    .replace(/px$/i, "");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error(
      `${label} must be a positive integer (got ${JSON.stringify(value)})`
    );
  }
  return n;
}

function printHelp() {
  console.log(`Record a looping scroll of demo.html for README media.

Site header/footer/page-nav are removed. #main is duplicated so scrolling one
copy height overscrolls into the first section again (infinite carousel).
Frames are captured only during the scroll — no frozen lead-in/outro.

Options:
  --theme light|dark   Forced theme (default: dark)
  --width <px>         Viewport width (default: 1400; px suffix ok)
  --height <px>        Viewport height (default: 1200; px suffix ok)
  --duration <ms>      Scroll duration for one loop (default: 50000)
  --fps <n>            Capture / encode frame rate (default: 24)
  --dpr <n>            Device scale factor (default: 1)
  --out-dir <path>     Output directory (default: res/)
  --basename <name>    File basename (default: demo-scroll)
  --settle-ms <ms>     Wait after load before capture (default: 800; not in video)
  --format <list>      Output format(s): webp (default), webm, gif
                       Comma-separated for several, e.g. webp,gif or webm
  --preview            Open prepared page (no recording)
  --headed             Show the browser while capturing frames
  --no-loop            Do not duplicate #main
  -h, --help           Show this help

Requires ffmpeg (system PATH or the ffmpeg-static npm package).
`);
}

/**
 * @param {string} root
 * @returns {Promise<{ server: http.Server, port: number, close: () => Promise<void> }>}
 */
function startStaticServer(root) {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith("/")) rel += "index.html";
      const safeRel = rel.replace(/^\/+/, "");
      const resolved = path.resolve(root, safeRel);
      const relToRoot = path.relative(root, resolved);
      if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
        res.writeHead(404).end("Not found");
        return;
      }
      const ext = path.extname(resolved).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      fs.createReadStream(resolved).pipe(res);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to bind static server"));
        return;
      }
      resolve({
        server,
        port: address.port,
        close: () =>
          new Promise((resClose, rejClose) => {
            server.close((err) => (err ? rejClose(err) : resClose()));
          }),
      });
    });
    server.on("error", reject);
  });
}

/**
 * @returns {Promise<typeof import("playwright")>}
 */
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.error(`Playwright is not installed.

  npm i -D playwright
  npx playwright install chromium
`);
    process.exit(1);
  }
}

/**
 * Prefer system ffmpeg, else the `ffmpeg-static` npm binary.
 * @returns {string}
 */
function resolveFfmpeg() {
  const onPath = spawnSync("ffmpeg", ["-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (onPath.status === 0) return "ffmpeg";

  try {
    // Default export is the absolute path to the binary.
    const mod = requireResolveFfmpegStatic();
    if (mod && fs.existsSync(mod)) {
      const probe = spawnSync(mod, ["-version"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      if (probe.status === 0) return mod;
    }
  } catch {
    /* packaged binary missing */
  }

  console.error(`ffmpeg is required to encode the scroll capture.

  npm i -D ffmpeg-static
  # or: winget install ffmpeg  (then reopen the terminal)
`);
  process.exit(1);
}

/** @returns {string | null} */
function requireResolveFfmpegStatic() {
  // Synchronous resolve keeps the CLI simple; package exports a string path.
  const require = createRequire(import.meta.url);
  return require("ffmpeg-static");
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {import("playwright").BrowserContext} context
 * @param {string} theme
 */
async function installCaptureInit(context, theme) {
  await context.addInitScript(captureInitScript, {
    theme,
    storageKey: DEFAULT_THEME_STORAGE_KEY,
  });
}

/**
 * @param {import("playwright").Page} page
 * @param {string} demoUrl
 * @param {{ loop: boolean, settleMs: number }} options
 * @returns {Promise<number>}
 */
async function openPreparedDemo(page, demoUrl, { loop, settleMs }) {
  await page.goto(demoUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("#main");
  await delay(settleMs);
  const result = await page.evaluate(applyCaptureLayout, {
    loop,
    styleText: CAPTURE_STYLE,
  });
  const scrollBy =
    typeof result === "number" ? result : Number(result?.scrollBy);
  if (!scrollBy || !Number.isFinite(scrollBy)) {
    throw new Error("Could not determine capture scroll distance");
  }
  // Ensure paint after DOM chrome removal + clone.
  await delay(100);
  await page.evaluate(() => window.scrollTo(0, 0));
  return scrollBy;
}

/**
 * Capture only in-motion frames. Uses N frames at y = (i/N)*scrollBy so the
 * last frame is just before the seam; looping back to frame 0 continues the
 * carousel without a frozen hold at the top or bottom.
 *
 * @param {import("playwright").Page} page
 * @param {number} scrollBy
 * @param {number} durationMs
 * @param {number} fps
 * @param {string} framesDir
 * @returns {Promise<number>} frame count
 */
async function captureScrollFrames(page, scrollBy, durationMs, fps, framesDir) {
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const frameCount = Math.max(2, Math.round((durationMs / 1000) * fps));
  await page.evaluate((y) => window.scrollTo(0, y), 0);

  for (let i = 0; i < frameCount; i++) {
    const y = (scrollBy * i) / frameCount;
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    // Let layout/paint settle for this scroll position.
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        })
    );
    const file = path.join(
      framesDir,
      `frame-${String(i).padStart(5, "0")}.png`
    );
    await page.screenshot({
      path: file,
      type: "png",
      animations: "disabled",
      caret: "hide",
    });
    if (i === 0 || i === frameCount - 1 || (i + 1) % Math.max(1, Math.round(fps)) === 0) {
      console.log(`  frame ${i + 1}/${frameCount} @ y=${Math.round(y)}`);
    }
  }

  return frameCount;
}

/**
 * @param {string} ffmpegBin
 * @param {string} framesDir
 * @param {string} webpPath
 * @param {number} fps
 * @param {number} width
 */
function encodeWebpFromFrames(ffmpegBin, framesDir, webpPath, fps, width) {
  const pattern = path.join(framesDir, "frame-%05d.png");
  const result = spawnSync(
    ffmpegBin,
    [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      pattern,
      "-vf",
      `fps=${fps},scale=${width}:-1:flags=lanczos`,
      "-an",
      "-c:v",
      "libwebp",
      "-lossless",
      "0",
      "-compression_level",
      "4",
      "-q:v",
      "75",
      "-loop",
      "0",
      webpPath,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || "ffmpeg webp encode failed");
  }
}

/**
 * @param {string} ffmpegBin
 * @param {string} framesDir
 * @param {string} webmPath
 * @param {number} fps
 */
function encodeWebmFromFrames(ffmpegBin, framesDir, webmPath, fps) {
  const pattern = path.join(framesDir, "frame-%05d.png");
  const result = spawnSync(
    ffmpegBin,
    [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      pattern,
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "32",
      "-pix_fmt",
      "yuv420p",
      webmPath,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (result.status !== 0) {
    // Fallback if vp9 is unavailable.
    const fallback = spawnSync(
      ffmpegBin,
      [
        "-y",
        "-framerate",
        String(fps),
        "-i",
        pattern,
        "-an",
        "-c:v",
        "libvpx",
        "-b:v",
        "1M",
        "-pix_fmt",
        "yuv420p",
        webmPath,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    if (fallback.status !== 0) {
      throw new Error(
        fallback.stderr || result.stderr || "ffmpeg webm encode failed"
      );
    }
  }
}

/**
 * @param {string} ffmpegBin
 * @param {string} framesDir
 * @param {string} gifPath
 * @param {number} fps
 * @param {number} width
 */
function encodeGifFromFrames(ffmpegBin, framesDir, gifPath, fps, width) {
  const pattern = path.join(framesDir, "frame-%05d.png");
  const palette = path.join(framesDir, "palette.png");
  const gifFps = Math.min(fps, 12);

  const paletteResult = spawnSync(
    ffmpegBin,
    [
      "-y",
      "-framerate",
      String(gifFps),
      "-i",
      pattern,
      "-vf",
      `fps=${gifFps},scale=${width}:-1:flags=lanczos,palettegen=max_colors=192:stats_mode=full`,
      palette,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (paletteResult.status !== 0) {
    throw new Error(paletteResult.stderr || "ffmpeg palettegen failed");
  }

  const gifResult = spawnSync(
    ffmpegBin,
    [
      "-y",
      "-framerate",
      String(gifFps),
      "-i",
      pattern,
      "-i",
      palette,
      "-lavfi",
      `fps=${gifFps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
      "-loop",
      "0",
      gifPath,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (gifResult.status !== 0) {
    throw new Error(gifResult.stderr || "ffmpeg gif encode failed");
  }
}

/**
 * @param {string} filePath
 */
function logWrote(filePath) {
  const sizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
  console.log(`Wrote ${path.relative(ROOT, filePath)} (${sizeMb} MB)`);
}

/**
 * @param {object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} options.dpr
 * @param {string} options.theme
 * @param {boolean} [options.headless]
 */
async function createCaptureContext(playwright, options) {
  const { width, height, dpr, theme, headless = true } = options;

  const browser = await playwright.chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    colorScheme: theme === "dark" ? "dark" : "light",
    reducedMotion: "no-preference",
  });
  await installCaptureInit(context, theme);
  return { browser, context };
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(String(err instanceof Error ? err.message : err));
    printHelp();
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    return;
  }

  const theme = String(args.theme);
  if (theme !== "light" && theme !== "dark") {
    throw new Error("--theme must be light or dark");
  }

  const width = parsePositiveInt(args.width, "--width");
  const height = parsePositiveInt(args.height, "--height");
  const durationMs = parsePositiveInt(args.duration, "--duration");
  const fps = parsePositiveInt(args.fps, "--fps");
  const dpr = Number(String(args.dpr).trim());
  if (!Number.isFinite(dpr) || dpr <= 0) {
    throw new Error(
      `--dpr must be a positive number (got ${JSON.stringify(args.dpr)})`
    );
  }
  const settleMs = parsePositiveInt(args.settleMs, "--settle-ms");
  const outDir = String(args.outDir);
  const basename = String(args.basename);
  const loop = Boolean(args.loop);
  const formats = Array.isArray(args.formats) ? args.formats : ["webp"];

  fs.mkdirSync(outDir, { recursive: true });

  const staticServer = await startStaticServer(ROOT);
  const demoUrl = `http://127.0.0.1:${staticServer.port}/demo.html`;

  console.log(`Serving ${ROOT}`);
  console.log(`Demo URL: ${demoUrl}`);

  const playwright = await loadPlaywright();

  if (args.preview) {
    console.log(`
Preview mode — chrome removed, #main duplicated for the carousel seam.
Scroll one copy height to see the first section again after the last.
Press Ctrl+C to stop.
`);
    const { browser, context } = await createCaptureContext(playwright, {
      width,
      height,
      dpr,
      theme,
      headless: false,
    });
    const page = await context.newPage();
    const scrollBy = await openPreparedDemo(page, demoUrl, { loop, settleMs });
    console.log(`Loop scroll distance: ${Math.round(scrollBy)}px`);
    await new Promise(() => {
      /* keep server + browser until Ctrl+C */
    });
    await context.close();
    await browser.close();
    return;
  }

  const ffmpegBin = resolveFfmpeg();
  console.log(`Using ffmpeg: ${ffmpegBin}`);
  console.log(`Formats: ${formats.join(", ")}`);

  const framesDir = path.join(outDir, `.${basename}-frames`);

  const { browser, context } = await createCaptureContext(playwright, {
    width,
    height,
    dpr,
    theme,
    headless: Boolean(args.headless),
  });

  const page = await context.newPage();
  try {
    const scrollBy = await openPreparedDemo(page, demoUrl, { loop, settleMs });
    console.log(
      `Capturing ${Math.round(scrollBy)}px over ${durationMs}ms at ${fps} fps (scroll frames only)…`
    );
    const frameCount = await captureScrollFrames(
      page,
      scrollBy,
      durationMs,
      fps,
      framesDir
    );
    console.log(`Captured ${frameCount} frames`);
  } finally {
    await context.close();
    await browser.close();
  }

  try {
    for (const fmt of formats) {
      const outPath = path.join(outDir, `${basename}.${fmt}`);
      if (fmt === "webp") {
        encodeWebpFromFrames(ffmpegBin, framesDir, outPath, fps, width);
      } else if (fmt === "webm") {
        encodeWebmFromFrames(ffmpegBin, framesDir, outPath, fps);
      } else if (fmt === "gif") {
        encodeGifFromFrames(ffmpegBin, framesDir, outPath, fps, width);
      }
      logWrote(outPath);
    }
  } finally {
    fs.rmSync(framesDir, { recursive: true, force: true });
  }

  await staticServer.close();
  console.log(
    "Done. Loop the output in a player — start and end form a continuous carousel."
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
