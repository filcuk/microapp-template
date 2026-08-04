/**
 * Record a seamless looping scroll of demo.html (no site header/footer).
 * Dev-only tooling under scripts/ — does not touch app/ runtime code.
 *
 * Prerequisites:
 *   npx playwright install chromium
 *   ffmpeg on PATH (optional — used to write a GIF for README)
 *
 * Usage:
 *   npm run capture:demo
 *   npm run capture:demo -- --theme dark --duration 12000 --width 900
 *   npm run capture:demo -- --preview   # open prepared page; record yourself
 *
 * Outputs (default):
 *   res/demo-scroll.webm
 *   res/demo-scroll.gif   (when ffmpeg is available)
 */

import { spawnSync } from "node:child_process";
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

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = {
    theme: "light",
    width: "900",
    height: "560",
    duration: "14000",
    dpr: "1",
    outDir: DEFAULT_OUT_DIR,
    basename: "demo-scroll",
    preview: false,
    gif: true,
    headless: true,
    loop: true,
    settleMs: "1200",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--preview") out.preview = true;
    else if (arg === "--no-gif") out.gif = false;
    else if (arg === "--no-loop") out.loop = false;
    else if (arg === "--headed") out.headless = false;
    else if (arg === "--theme") out.theme = argv[++i] || "light";
    else if (arg === "--width") out.width = argv[++i] || out.width;
    else if (arg === "--height") out.height = argv[++i] || out.height;
    else if (arg === "--duration") out.duration = argv[++i] || out.duration;
    else if (arg === "--dpr") out.dpr = argv[++i] || out.dpr;
    else if (arg === "--out-dir") out.outDir = path.resolve(argv[++i] || out.outDir);
    else if (arg === "--basename") out.basename = argv[++i] || out.basename;
    else if (arg === "--settle-ms") out.settleMs = argv[++i] || out.settleMs;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

function printHelp() {
  console.log(`Record a looping scroll of demo.html for README media.

Options:
  --theme light|dark   Forced theme (default: light)
  --width <px>         Viewport width (default: 900)
  --height <px>        Viewport height (default: 560)
  --duration <ms>      Scroll duration for one loop (default: 14000)
  --dpr <n>            Device scale factor (default: 1)
  --out-dir <path>     Output directory (default: res/)
  --basename <name>    File basename (default: demo-scroll)
  --settle-ms <ms>     Wait after load before recording (default: 1200)
  --preview            Open prepared page and keep server up (no recording)
  --headed             Show the browser window while recording
  --no-loop            Do not duplicate #main (no seamless seam target)
  --no-gif             Skip ffmpeg GIF conversion
  -h, --help           Show this help
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

function ffmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return result.status === 0;
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} webmPath
 * @param {string} gifPath
 * @param {number} width
 */
function convertWebmToGif(webmPath, gifPath, width) {
  const vf = [
    `fps=12`,
    `scale=${width}:-1:flags=lanczos`,
    `split[s0][s1];[s0]palettegen=max_colors=192:stats_mode=full[p]`,
    `[s1][p]paletteuse=dither=bayer:bayer_scale=3`,
  ].join(",");

  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", webmPath, "-vf", vf, "-loop", "0", gifPath],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || "ffmpeg failed");
  }
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
  const scrollBy = await page.evaluate(applyCaptureLayout, {
    loop,
    styleText: CAPTURE_STYLE,
  });
  if (!scrollBy || !Number.isFinite(scrollBy)) {
    throw new Error("Could not determine capture scroll distance");
  }
  return scrollBy;
}

/**
 * @param {import("playwright").Page} page
 * @param {number} distance
 * @param {number} durationMs
 */
async function smoothScrollBy(page, distance, durationMs) {
  await page.evaluate(
    async ({ distance: dist, durationMs: dur }) => {
      const startY = window.scrollY;
      const start = performance.now();
      await new Promise((resolve) => {
        const step = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased =
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          window.scrollTo(0, startY + dist * eased);
          if (t < 1) requestAnimationFrame(step);
          else {
            window.scrollTo(0, startY + dist);
            resolve(undefined);
          }
        };
        requestAnimationFrame(step);
      });
    },
    { distance, durationMs }
  );
}

/**
 * @param {object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} options.dpr
 * @param {string} options.theme
 * @param {boolean} [options.headless]
 * @param {string} [options.videoDir]
 */
async function createCaptureContext(playwright, options) {
  const {
    width,
    height,
    dpr,
    theme,
    headless = true,
    videoDir,
  } = options;

  const browser = await playwright.chromium.launch({ headless });
  /** @type {import("playwright").BrowserContextOptions} */
  const contextOptions = {
    viewport: { width, height },
    deviceScaleFactor: dpr,
    colorScheme: theme === "dark" ? "dark" : "light",
    reducedMotion: "no-preference",
  };
  if (videoDir) {
    contextOptions.recordVideo = {
      dir: videoDir,
      size: { width, height },
    };
  }
  const context = await browser.newContext(contextOptions);
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

  const width = Number(args.width);
  const height = Number(args.height);
  const durationMs = Number(args.duration);
  const dpr = Number(args.dpr);
  const settleMs = Number(args.settleMs);
  const outDir = String(args.outDir);
  const basename = String(args.basename);
  const loop = Boolean(args.loop);

  fs.mkdirSync(outDir, { recursive: true });

  const staticServer = await startStaticServer(ROOT);
  const demoUrl = `http://127.0.0.1:${staticServer.port}/demo.html`;

  console.log(`Serving ${ROOT}`);
  console.log(`Demo URL: ${demoUrl}`);

  const playwright = await loadPlaywright();

  if (args.preview) {
    console.log(`
Preview mode — browser opens with capture chrome applied (injected by this script).
Scroll tip: one full #main height lands on the duplicate for a seamless loop.
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
    await openPreparedDemo(page, demoUrl, { loop, settleMs });
    await new Promise(() => {
      /* keep server + browser until Ctrl+C */
    });
    await context.close();
    await browser.close();
    return;
  }

  const webmPath = path.join(outDir, `${basename}.webm`);
  const gifPath = path.join(outDir, `${basename}.gif`);
  const videoDir = path.join(outDir, `.${basename}-video-tmp`);
  fs.rmSync(videoDir, { recursive: true, force: true });
  fs.mkdirSync(videoDir, { recursive: true });

  const { browser, context } = await createCaptureContext(playwright, {
    width,
    height,
    dpr,
    theme,
    headless: Boolean(args.headless),
    videoDir,
  });

  const page = await context.newPage();
  try {
    const scrollBy = await openPreparedDemo(page, demoUrl, { loop, settleMs });
    console.log(`Scrolling ${scrollBy}px over ${durationMs}ms…`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(400);
    await smoothScrollBy(page, scrollBy, durationMs);
    await delay(400);
  } finally {
    await context.close();
    await browser.close();
  }

  const recorded = fs
    .readdirSync(videoDir)
    .filter((name) => name.endsWith(".webm"))
    .map((name) => path.join(videoDir, name));

  if (recorded.length === 0) {
    throw new Error("Playwright did not produce a WebM recording");
  }

  fs.renameSync(recorded[0], webmPath);
  fs.rmSync(videoDir, { recursive: true, force: true });
  console.log(`Wrote ${path.relative(ROOT, webmPath)}`);

  if (args.gif) {
    if (ffmpegAvailable()) {
      try {
        convertWebmToGif(webmPath, gifPath, width);
        const sizeMb = (fs.statSync(gifPath).size / (1024 * 1024)).toFixed(2);
        console.log(`Wrote ${path.relative(ROOT, gifPath)} (${sizeMb} MB)`);
      } catch (err) {
        console.warn(
          `GIF conversion failed: ${err instanceof Error ? err.message : err}`
        );
        printFfmpegHint(webmPath, gifPath, width);
      }
    } else {
      console.warn("ffmpeg not found on PATH — skipped GIF.");
      printFfmpegHint(webmPath, gifPath, width);
    }
  }

  await staticServer.close();
  console.log("Done.");
}

/**
 * @param {string} webmPath
 * @param {string} gifPath
 * @param {number} width
 */
function printFfmpegHint(webmPath, gifPath, width) {
  console.log(`
Convert manually (install ffmpeg, then):

  ffmpeg -y -i "${webmPath}" -vf "fps=12,scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=192[p];[s1][p]paletteuse=dither=bayer" -loop 0 "${gifPath}"
`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
