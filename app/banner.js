import { setHidden } from "./dom.js";

/** @type {WeakMap<HTMLElement, ReturnType<typeof setTimeout>>} */
const expireTimers = new WeakMap();

function parseExpireMs(value) {
  if (value === undefined || value === "") return 0;
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

function resolveExpireMs(bannerEl, expire) {
  if (expire !== undefined) return parseExpireMs(expire);
  return parseExpireMs(bannerEl.dataset.bannerExpire);
}

function clearExpireTimer(bannerEl) {
  const timerId = expireTimers.get(bannerEl);
  if (timerId === undefined) return;
  clearTimeout(timerId);
  expireTimers.delete(bannerEl);
}

/** Hide a banner and cancel any pending expiry. */
export function hideBanner(bannerEl) {
  if (!bannerEl) return;
  clearExpireTimer(bannerEl);
  setHidden(bannerEl, true);
}

/**
 * Show a banner. Auto-hides when `expire` is set (ms) or `data-banner-expire` is on the element.
 *
 * @param {HTMLElement | null} bannerEl
 * @param {{ expire?: number | string }} [options]
 */
export function showBanner(bannerEl, { expire } = {}) {
  if (!bannerEl) return;

  clearExpireTimer(bannerEl);
  setHidden(bannerEl, false);

  const ms = resolveExpireMs(bannerEl, expire);
  if (ms <= 0) return;

  expireTimers.set(
    bannerEl,
    setTimeout(() => hideBanner(bannerEl), ms)
  );
}

/**
 * Wire banners with `data-banner-expire` inside `root` (optional helper for declarative markup).
 * Does not show them — use {@link showBanner} when ready to display.
 *
 * @param {ParentNode} [root=document]
 */
export function initBanners(root = document) {
  return [...root.querySelectorAll(".banner[data-banner-expire]")];
}
