/**
 * Optional sticky site header and section headings.
 *
 * Opt in with attributes on `<html>`:
 *   data-sticky-header
 *   data-sticky-section-headings
 *
 * Or call setStickyHeader() / setStickySectionHeadings().
 *
 * Stack model (top → bottom while pinned):
 *   site header (top: 0)
 *   → tier header / .segment-title (top: headerOffset + gap)
 *   → .section-title (top: headerOffset + sticky-gap + tierOffset)
 *
 * syncStickyOffsets() recollects participants, remasures offsets, and
 * refreshes stuck state. On scroll, only stuck state is updated (rAF-throttled).
 *
 * While pinned, each participant gets `data-sticky-stuck`; the bottom-most
 * pinned element also gets `data-sticky-stuck-edge` (single hairline + shadow).
 *
 * CSS variables:
 *   --sticky-header-offset  on :root — live bottom of the site header (no gap)
 *   --sticky-tier-offset    on each .content-tier — tier header height + gap
 *
 * Below SHORT_VIEWPORT_MAX, tier headers leave the stack (offset forced to 0).
 */

/** Match the short-viewport CSS guard that drops tier headers from the stack. */
const SHORT_VIEWPORT_MAX = 700;

const STUCK_ATTR = "data-sticky-stuck";
const STUCK_EDGE_ATTR = "data-sticky-stuck-edge";

function rootEl() {
  return document.documentElement;
}

/** Resolve a root CSS length custom property to CSS pixels. */
function cssPx(root, prop) {
  const raw = getComputedStyle(root).getPropertyValue(prop).trim();
  if (!raw) return 0;
  if (raw.endsWith("px")) return parseFloat(raw) || 0;
  if (raw.endsWith("rem")) {
    const fontSize = parseFloat(getComputedStyle(root).fontSize) || 16;
    return (parseFloat(raw) || 0) * fontSize;
  }
  return parseFloat(raw) || 0;
}

/**
 * @typedef {Object} StickyParticipants
 * @property {HTMLElement | null} siteHeader
 * @property {HTMLElement[]} tierHeaders
 * @property {HTMLElement[]} sectionHeadings
 * @property {HTMLElement[]} tiers
 */

/** @type {StickyParticipants} */
let participants = {
  siteHeader: null,
  tierHeaders: [],
  sectionHeadings: [],
  tiers: [],
};

/** @type {ResizeObserver | null} */
let resizeObserver = null;

let listenersBound = false;
let scrollTicking = false;
/** Cached `--sticky-gap` in px; refreshed on collect / resize. */
let cachedGapPx = 0;
/** Cached `--sticky-nest-gap` in px (tier → section). */
let cachedNestGapPx = 0;

function collectParticipants() {
  const root = rootEl();
  const headerOn = root.hasAttribute("data-sticky-header");
  const sectionsOn = root.hasAttribute("data-sticky-section-headings");

  participants = {
    siteHeader:
      headerOn ? document.querySelector("body > header") : null,
    tierHeaders: sectionsOn
      ? [...document.querySelectorAll(".content-tier-header")]
      : [],
    sectionHeadings: sectionsOn
      ? [...document.querySelectorAll(".section-title")]
      : [],
    tiers: [...document.querySelectorAll(".content-tier")],
  };

  cachedGapPx = cssPx(root, "--sticky-gap");
  cachedNestGapPx = cssPx(root, "--sticky-nest-gap");
  observeResizeTargets();
}

function observeResizeTargets() {
  if (!resizeObserver) return;

  resizeObserver.disconnect();

  const { siteHeader, tierHeaders } = participants;
  if (siteHeader) resizeObserver.observe(siteHeader);
  for (const el of tierHeaders) {
    resizeObserver.observe(el);
  }
}

/**
 * Publish `--sticky-header-offset` (border-box bottom of the site header, no gap).
 * @returns {number} offset in CSS pixels
 */
function publishHeaderOffset() {
  const root = rootEl();
  const { siteHeader } = participants;
  let offset = 0;

  if (siteHeader && root.hasAttribute("data-sticky-header")) {
    offset = Math.max(0, siteHeader.getBoundingClientRect().bottom);
  }

  const next = `${Math.round(offset)}px`;
  if (root.style.getPropertyValue("--sticky-header-offset") !== next) {
    root.style.setProperty("--sticky-header-offset", next);
  }
  return offset;
}

/**
 * Publish `--sticky-tier-offset` on each `.content-tier`.
 * Value is pinned title height + `--sticky-nest-gap` (not the site `--sticky-gap`).
 * Remeasured on collect / resize and after stuck-state changes.
 */
function publishTierOffsets() {
  const root = rootEl();
  const sectionsOn = root.hasAttribute("data-sticky-section-headings");
  const shortViewport = window.innerHeight < SHORT_VIEWPORT_MAX;
  const nestGap = cachedNestGapPx;

  for (const tier of participants.tiers) {
    const header = tier.querySelector(":scope > .content-tier-header");
    let offset = 0;
    if (sectionsOn && header && !shortViewport) {
      offset = measureTierPinnedHeight(header) + nestGap;
    }
    const next = `${Math.round(offset)}px`;
    if (tier.style.getPropertyValue("--sticky-tier-offset") !== next) {
      tier.style.setProperty("--sticky-tier-offset", next);
    }
  }
}

/**
 * Height of a tier header as it appears while pinned (title + stuck padding/border,
 * no lead). When already stuck the lead is `display: none`, so offsetHeight matches.
 * @param {HTMLElement} header
 * @returns {number}
 */
function measureTierPinnedHeight(header) {
  if (header.hasAttribute(STUCK_ATTR)) {
    return header.offsetHeight;
  }

  const title = header.querySelector(".segment-title");
  if (!title) return header.offsetHeight;

  const styles = getComputedStyle(header);
  const border =
    (parseFloat(styles.borderTopWidth) || 0) +
    (parseFloat(styles.borderBottomWidth) || 0);
  /* Match `.content-tier-header[data-sticky-stuck] { padding-bottom: 0.25rem }`. */
  const fontSize = parseFloat(getComputedStyle(rootEl()).fontSize) || 16;
  const stuckPadBottom = 0.25 * fontSize;
  return title.offsetHeight + stuckPadBottom + border;
}

/**
 * Resolved sticky `top` for a participant, matching the CSS stack.
 * @param {HTMLElement} el
 * @param {number} headerOffset
 * @returns {number}
 */
function resolvedTopFor(el, headerOffset) {
  const gap = cachedGapPx;

  if (el === participants.siteHeader) {
    return 0;
  }

  if (el.classList.contains("content-tier-header")) {
    return headerOffset + gap;
  }

  // .section-title — site gap + tier band (height + nest gap inside the var)
  const tier = el.closest(".content-tier");
  const tierOffset = tier
    ? parseFloat(tier.style.getPropertyValue("--sticky-tier-offset")) || 0
    : 0;
  return headerOffset + cachedGapPx + tierOffset;
}

/**
 * Toggle stuck / stuck-edge attributes from live geometry.
 * @param {number} headerOffset
 */
function syncStuckState(headerOffset) {
  const root = rootEl();
  const headerOn = root.hasAttribute("data-sticky-header");
  const sectionsOn = root.hasAttribute("data-sticky-section-headings");
  const shortViewport = window.innerHeight < SHORT_VIEWPORT_MAX;

  /** @type {HTMLElement[]} */
  const active = [];
  if (headerOn && participants.siteHeader) {
    active.push(participants.siteHeader);
  }
  if (sectionsOn) {
    if (!shortViewport) {
      active.push(...participants.tierHeaders);
    }
    active.push(...participants.sectionHeadings);
  }

  for (const el of active) {
    const top = resolvedTopFor(el, headerOffset);
    const rect = el.getBoundingClientRect();
    const stuck = rect.top <= top + 0.5;
    el.toggleAttribute(STUCK_ATTR, stuck);
    el.removeAttribute(STUCK_EDGE_ATTR);
  }

  // Clear attributes on participants that are no longer in the active set
  // (e.g. tier headers after a short-viewport transition).
  const activeSet = new Set(active);
  for (const el of [
    participants.siteHeader,
    ...participants.tierHeaders,
    ...participants.sectionHeadings,
  ]) {
    if (!el || activeSet.has(el)) continue;
    el.removeAttribute(STUCK_ATTR);
    el.removeAttribute(STUCK_EDGE_ATTR);
  }

  // Tier leads collapse while stuck — remasure clearance, then pick the edge
  // from post-collapse geometry.
  publishTierOffsets();

  /** @type {HTMLElement | null} */
  let edgeEl = null;
  let edgeBottom = -Infinity;
  for (const el of active) {
    if (!el.hasAttribute(STUCK_ATTR)) continue;
    const bottom = el.getBoundingClientRect().bottom;
    if (bottom >= edgeBottom) {
      edgeBottom = bottom;
      edgeEl = el;
    }
  }

  if (edgeEl) {
    edgeEl.setAttribute(STUCK_EDGE_ATTR, "");
  }
}

/** Reset all sticky state and offset variables. */
function clearStickyState() {
  const root = rootEl();
  root.removeAttribute("data-sticky-header-stuck");
  root.style.setProperty("--sticky-header-offset", "0px");

  for (const el of [
    participants.siteHeader,
    ...participants.tierHeaders,
    ...participants.sectionHeadings,
  ]) {
    if (!el) continue;
    el.removeAttribute(STUCK_ATTR);
    el.removeAttribute(STUCK_EDGE_ATTR);
    el.style.top = "";
  }

  for (const tier of participants.tiers) {
    tier.style.setProperty("--sticky-tier-offset", "0px");
  }
}

/**
 * Full sync: recollect, remasure offsets, refresh stuck state.
 * Safe to call when stickiness is off (offsets and attributes reset).
 */
export function syncStickyOffsets() {
  collectParticipants();

  const root = rootEl();
  const anyOn =
    root.hasAttribute("data-sticky-header") ||
    root.hasAttribute("data-sticky-section-headings");

  if (!anyOn) {
    clearStickyState();
    return;
  }

  // Drop the legacy root attribute if a previous version left it behind.
  root.removeAttribute("data-sticky-header-stuck");

  publishTierOffsets();
  const headerOffset = publishHeaderOffset();
  syncStuckState(headerOffset);
}

/** Scroll-path update: offsets that move with scroll + stuck flags. */
function onScrollFrame() {
  scrollTicking = false;

  const root = rootEl();
  if (
    !root.hasAttribute("data-sticky-header") &&
    !root.hasAttribute("data-sticky-section-headings")
  ) {
    return;
  }

  const headerOffset = publishHeaderOffset();
  syncStuckState(headerOffset);
}

function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(onScrollFrame);
}

function onResize() {
  syncStickyOffsets();
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

/**
 * Sync offsets now and on resize/scroll. Call once from `initShell()`.
 */
export function initStickyChrome() {
  if (typeof ResizeObserver !== "undefined" && !resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      publishTierOffsets();
      const headerOffset = publishHeaderOffset();
      syncStuckState(headerOffset);
    });
  }

  syncStickyOffsets();

  if (listenersBound) return;
  listenersBound = true;
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
}
