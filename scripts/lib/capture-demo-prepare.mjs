/**
 * Browser-side prep for README demo scroll capture (injected by Playwright).
 * Dev-only — lives under scripts/, not app/.
 */

export const CAPTURE_STYLE = `
html[data-capture] body > header,
html[data-capture] #app-page-footer,
html[data-capture] #page-nav,
html[data-capture] #skip-to-main,
html[data-capture] #tooltip {
  display: none !important;
}

/* Sticky chrome is always off during capture (site + section/tier headers). */
html[data-capture] body > header,
html[data-capture] .content-tier-header,
html[data-capture] .section-title {
  position: static !important;
  top: auto !important;
}

html[data-capture] body > header::before,
html[data-capture] body > header::after,
html[data-capture] .content-tier-header::before,
html[data-capture] .content-tier-header::after,
html[data-capture] .section-title::before,
html[data-capture] .section-title::after {
  content: none !important;
  display: none !important;
}

html[data-capture],
html[data-capture] body {
  scrollbar-width: none;
}

html[data-capture]::-webkit-scrollbar,
html[data-capture] body::-webkit-scrollbar {
  display: none;
}

html[data-capture] #main-capture-clone {
  pointer-events: none;
  user-select: none;
}
`;

/** Default matches `APP_CONFIG.themeStorageKey` / demo.html `__MICROAPP__`. */
export const DEFAULT_THEME_STORAGE_KEY = "microapp-theme";

/**
 * Runs before page scripts so sticky chrome never boots and theme is forced.
 * Pass to `context.addInitScript`.
 *
 * @param {{ theme: string, storageKey: string }} opts
 */
export function captureInitScript({ theme, storageKey }) {
  const root = document.documentElement;
  root.removeAttribute("data-sticky-section-headings");
  root.removeAttribute("data-sticky-header");
  if (theme === "light" || theme === "dark") {
    localStorage.setItem(storageKey, theme);
  }
}

/**
 * Runs after demo load (icons painted). Hide chrome, optionally clone `#main`.
 * Pass to `page.evaluate`.
 *
 * @param {{ loop: boolean, styleText: string }} opts
 * @returns {number} Pixels to scroll for one seamless loop
 */
export function applyCaptureLayout({ loop, styleText }) {
  const root = document.documentElement;
  root.dataset.capture = "";
  root.removeAttribute("data-sticky-section-headings");
  root.removeAttribute("data-sticky-header");
  root.style.removeProperty("--sticky-header-offset");
  document
    .querySelectorAll("[data-sticky-stuck], [data-sticky-stuck-edge]")
    .forEach((el) => {
      el.removeAttribute("data-sticky-stuck");
      el.removeAttribute("data-sticky-stuck-edge");
    });
  document.querySelectorAll(".content-tier").forEach((tier) => {
    tier.style.removeProperty("--sticky-tier-offset");
  });

  if (!document.getElementById("capture-mode-style")) {
    const style = document.createElement("style");
    style.id = "capture-mode-style";
    style.textContent = styleText;
    document.head.appendChild(style);
  }

  const main = document.getElementById("main");
  if (!main) return 0;

  let scrollBy = main.offsetHeight;

  if (loop && !document.getElementById("main-capture-clone")) {
    const clone = main.cloneNode(true);
    clone.id = "main-capture-clone";
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("[id]").forEach((el) => {
      el.id = `capture-clone-${el.id}`;
    });
    main.after(clone);
    scrollBy = main.offsetHeight;
  }

  window.scrollTo(0, 0);
  return scrollBy;
}
