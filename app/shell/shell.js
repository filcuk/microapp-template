import { renderPageShell } from "./render-shell.js";
import { initAlsoSee } from "./also-see.js";
import { initIcons } from "../utils/icons.js";
import { initTheme, initThemeToggle } from "./theme.js";
import { initPageNavPanel } from "./page-nav.js";
import { initTooltips } from "../components/tooltip.js";
import { initExternalLinks } from "./external-link.js";
import { initHeadingLinks } from "./heading-link.js";
import { initStickyChrome } from "./sticky.js";
import { showBanner } from "../components/banner.js";

let errorHandlersBound = false;

function bindGlobalErrorHandlers(onError) {
  if (errorHandlersBound) return;
  errorHandlersBound = true;

  window.addEventListener("error", (event) => {
    onError?.({ type: "error", event });
    const banner = document.querySelector(".banner[data-app-error]");
    if (banner) showBanner(banner);
  });

  window.addEventListener("unhandledrejection", (event) => {
    onError?.({ type: "unhandledrejection", event });
    const banner = document.querySelector(".banner[data-app-error]");
    if (banner) showBanner(banner);
  });
}

/**
 * Render shared chrome, then boot icons, theme, and page navigation.
 * Call once per HTML entry point before page-specific inits.
 *
 * @param {object} [options]
 * @param {string} [options.repoUrl]
 * @param {string} [options.appUrl] Public site URL — entries matching this are omitted from “also see”
 * @param {string} [options.brandUrl]
 * @param {string} [options.brandName]
 * @param {false | { label: string, url: string, icon?: string, iconLight?: string, iconDark?: string }[]} [options.alsoSee]
 *   Related-app links for the footer “also see” menu. `false` or `[]` hides it
 *   when there is no remote list.
 * @param {string} [options.alsoSeeUrl] Remote JSON URL (array of link objects). Empty skips fetch.
 * @param {string} [options.appVersion] Override app SemVer (default from `app/version.js`)
 * @param {string} [options.templateVersion] Override template SemVer (default from `app/version.js`)
 * @param {import("./page-nav.js").PageNavOptions} [options.pageNav] Passed to `initPageNavPanel()`
 * @param {boolean} [options.showErrors=true] Show `.banner[data-app-error]` on uncaught errors
 * @param {(detail: object) => void} [options.onError] Called before the error banner is shown
 */
export function initShell(options = {}) {
  const {
    pageNav,
    showErrors = true,
    onError,
    alsoSeeUrl,
    alsoSee,
    appUrl,
    ...shellOptions
  } = options;
  renderPageShell({ ...shellOptions, alsoSee, alsoSeeUrl, appUrl });
  initIcons();
  initExternalLinks(document);
  initHeadingLinks(document);
  void initAlsoSee(document, { alsoSeeUrl, appUrl });
  initTheme();
  initThemeToggle(document.getElementById("theme-toggle"));
  initStickyChrome();
  initTooltips(document);
  initPageNavPanel("#page-nav", pageNav);

  if (showErrors && document.querySelector(".banner[data-app-error]")) {
    bindGlobalErrorHandlers(onError);
  }
}
