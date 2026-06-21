import { initPageNav, initPageNavPanel } from "./page-nav.js";

export { initPageNav, initPageNavPanel } from "./page-nav.js";

/** @deprecated Use initPageNavPanel() — kept for older examples. */
export function initJumpUpButton(selector = "#page-nav", options = {}) {
  return initPageNavPanel(selector, options);
}

export function initJumpUp(buttonEl, options = {}) {
  return initPageNav(buttonEl?.closest?.("#page-nav") ?? buttonEl, options);
}
