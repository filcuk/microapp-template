/**
 * Optional sticky site header and section headings.
 *
 * Opt in with attributes on `<html>`:
 *   data-sticky-header
 *   data-sticky-section-headings
 *
 * Or call setStickyHeader() / setStickySectionHeadings().
 * syncStickyOffsets() keeps --sticky-header-offset and per-tier
 * --sticky-local-tier-offset in sync (needed when both are on).
 */

function rootEl() {
  return document.documentElement;
}

/**
 * Measure sticky chrome and publish CSS offset variables.
 * Safe to call when stickiness is off (offsets reset to 0).
 */
export function syncStickyOffsets() {
  const root = rootEl();
  const headerSticky = root.hasAttribute("data-sticky-header");
  const sectionsSticky = root.hasAttribute("data-sticky-section-headings");

  const siteHeader = document.querySelector("body > header");
  const headerOffset =
    headerSticky && siteHeader ? siteHeader.getBoundingClientRect().height : 0;
  root.style.setProperty("--sticky-header-offset", `${Math.round(headerOffset)}px`);

  document.querySelectorAll(".demo-tier").forEach((tier) => {
    const band = tier.querySelector(":scope > .demo-tier-header");
    const bandHeight =
      sectionsSticky && band ? band.getBoundingClientRect().height : 0;
    tier.style.setProperty(
      "--sticky-local-tier-offset",
      `${Math.round(bandHeight)}px`
    );
  });
}

/** @param {boolean} enabled */
export function setStickyHeader(enabled) {
  rootEl().toggleAttribute("data-sticky-header", Boolean(enabled));
  requestAnimationFrame(syncStickyOffsets);
}

/** @param {boolean} enabled */
export function setStickySectionHeadings(enabled) {
  rootEl().toggleAttribute("data-sticky-section-headings", Boolean(enabled));
  requestAnimationFrame(syncStickyOffsets);
}

/** @returns {boolean} */
export function isStickyHeader() {
  return rootEl().hasAttribute("data-sticky-header");
}

/** @returns {boolean} */
export function isStickySectionHeadings() {
  return rootEl().hasAttribute("data-sticky-section-headings");
}

let resizeBound = false;

/**
 * Sync offsets now and on resize. Call once from `initShell()`.
 */
export function initStickyChrome() {
  syncStickyOffsets();
  if (resizeBound) return;
  resizeBound = true;
  window.addEventListener("resize", syncStickyOffsets);
}
