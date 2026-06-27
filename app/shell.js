import { renderPageShell } from "./render-shell.js";
import { initIcons } from "./icons.js";
import { initTheme, initThemeToggle } from "./theme.js";
import { initPageNavPanel } from "./page-nav.js";
import { initTooltips } from "./tooltip.js";
import { initExternalLinks } from "./external-link.js";
import { initHeadingLinks } from "./heading-link.js";

/**
 * Render shared chrome, then boot icons, theme, and page navigation.
 * Call once per HTML entry point before page-specific inits.
 *
 * @param {object} [options]
 * @param {string} [options.repoUrl]
 * @param {string} [options.brandUrl]
 * @param {string} [options.brandName]
 * @param {import("./page-nav.js").PageNavOptions} [options.pageNav] Passed to `initPageNavPanel()`
 */
export function initShell(options = {}) {
  const { pageNav, ...shellOptions } = options;
  renderPageShell(shellOptions);
  initIcons();
  initExternalLinks(document);
  initHeadingLinks(document);
  initTheme();
  initThemeToggle(document.getElementById("theme-toggle"));
  initTooltips(document);
  initPageNavPanel("#page-nav", pageNav);
}
