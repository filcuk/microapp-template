/**
 * Browser-side prep for README demo scroll capture (injected by Playwright).
 * Dev-only — lives under scripts/, not app/.
 *
 * Builds an infinite-carousel layout: site chrome removed, `#main` duplicated,
 * scroll distance = one copy so the last frame matches the first when looped.
 */

export const CAPTURE_STYLE = `
html[data-capture],
html[data-capture] body {
  margin: 0 !important;
  padding: 0 !important;
  scrollbar-width: none;
  overflow-x: hidden;
}

html[data-capture]::-webkit-scrollbar,
html[data-capture] body::-webkit-scrollbar {
  display: none;
}

/* Content-only: no site chrome, no sticky, tight vertical rhythm at the seam. */
html[data-capture] main,
html[data-capture] #main-capture-clone {
  max-width: var(--page-width);
  margin-left: auto;
  margin-right: auto;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: var(--page-padding-y);
  padding-bottom: var(--page-padding-y);
  padding-left: var(--page-padding-x);
  padding-right: var(--page-padding-x);
  width: 100%;
  box-sizing: border-box;
}

html[data-capture] .content-tier-header,
html[data-capture] .section-title {
  position: static !important;
  top: auto !important;
}

html[data-capture] .content-tier-header::before,
html[data-capture] .content-tier-header::after,
html[data-capture] .section-title::before,
html[data-capture] .section-title::after {
  content: none !important;
  display: none !important;
}

html[data-capture] #main-capture-clone {
  pointer-events: none;
  user-select: none;
}

html[data-capture] #tooltip {
  display: none !important;
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
 * Runs after demo load (icons painted). Strip chrome, clone `#main` for a
 * seamless carousel loop. Pass to `page.evaluate`.
 *
 * @param {{ loop: boolean, styleText: string }} opts
 * @returns {{ scrollBy: number, mainHeight: number }}
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

  // Remove from the tree (not just hide) so they cannot appear mid-scroll.
  for (const selector of [
    "body > header",
    "#app-page-footer",
    "#page-nav",
    "#skip-to-main",
    "#tooltip",
  ]) {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  }

  if (!document.getElementById("capture-mode-style")) {
    const style = document.createElement("style");
    style.id = "capture-mode-style";
    style.textContent = styleText;
    document.head.appendChild(style);
  }

  const main = document.getElementById("main");
  if (!main) return { scrollBy: 0, mainHeight: 0 };

  // Collapse margins so main | clone share a hard seam.
  main.style.marginTop = "0";
  main.style.marginBottom = "0";

  let scrollBy = 0;
  let mainHeight = main.getBoundingClientRect().height;

  if (loop) {
    let clone = document.getElementById("main-capture-clone");
    if (!clone) {
      clone = main.cloneNode(true);
      clone.id = "main-capture-clone";
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("[id]").forEach((el) => {
        el.id = `capture-clone-${el.id}`;
      });
      main.after(clone);
    }
    clone.style.marginTop = "0";
    clone.style.marginBottom = "0";

    // Distance from the top of #main to the top of the clone in document space.
    // Scrolling this far puts the clone (first section again) where #main started.
    const mainTop = main.getBoundingClientRect().top + window.scrollY;
    const cloneTop = clone.getBoundingClientRect().top + window.scrollY;
    scrollBy = cloneTop - mainTop;
    mainHeight = main.getBoundingClientRect().height;
  } else {
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    scrollBy = maxScroll;
    mainHeight = main.getBoundingClientRect().height;
  }

  window.scrollTo(0, 0);
  return { scrollBy, mainHeight };
}
