import { APP_CONFIG } from "../config.js";
import { createIcon } from "../utils/icons.js";
import { initPopupMenu } from "../utils/menu.js";
import {
  mountAlsoSee,
  normalizeAlsoSee,
} from "./render-shell.js";

/**
 * @param {ParentNode} [root=document]
 * @returns {ReturnType<typeof initPopupMenu> | null}
 */
function wireAlsoSeeMenu(root = document) {
  const containerEl =
    root.querySelector?.("#footer-also-see") ??
    document.getElementById("footer-also-see");
  if (!containerEl) return null;

  const trigger = containerEl.querySelector(".footer-also-see-trigger");
  const menuEl = containerEl.querySelector(".footer-also-see-menu");
  if (!trigger || !menuEl) return null;

  if (!trigger.querySelector(".external-link-icon")) {
    trigger.classList.add("external-link");
    trigger.append(createIcon("arrow-outward", { className: "external-link-icon" }));
  }

  return initPopupMenu({
    containerEl,
    menuEl,
    toggleEl: trigger,
    itemSelector: ".dropdown-menu-item",
    onSelect: ({ item }) => {
      const url = item.dataset.url;
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    },
  });
}

/**
 * @param {string} url
 * @returns {Promise<unknown>}
 */
async function fetchAlsoSeeJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`alsoSee fetch failed (${response.status})`);
  }
  return response.json();
}

/**
 * Wire the footer “also see” dropdown (opens related-app links).
 * No-op when `#footer-also-see` is absent and there is no remote URL to load.
 *
 * When `alsoSeeUrl` is set, fetches that JSON (top-level array of link objects)
 * and replaces the menu (excluding `appUrl`). On failure, keeps the local fallback.
 *
 * @param {ParentNode} [root=document]
 * @param {object} [options]
 * @param {string} [options.alsoSeeUrl]
 * @param {string} [options.appUrl]
 * @returns {Promise<ReturnType<typeof initPopupMenu> | null>}
 */
export async function initAlsoSee(root = document, options = {}) {
  const alsoSeeUrl =
    typeof options.alsoSeeUrl === "string"
      ? options.alsoSeeUrl.trim()
      : typeof APP_CONFIG.alsoSeeUrl === "string"
        ? APP_CONFIG.alsoSeeUrl.trim()
        : "";
  const appUrl =
    typeof options.appUrl === "string"
      ? options.appUrl.trim()
      : typeof APP_CONFIG.appUrl === "string"
        ? APP_CONFIG.appUrl.trim()
        : "";

  let menuApi = wireAlsoSeeMenu(root);

  if (!alsoSeeUrl) return menuApi;

  try {
    const data = await fetchAlsoSeeJson(alsoSeeUrl);
    const links = normalizeAlsoSee(data, appUrl);
    if (!links.length) {
      menuApi?.destroy?.();
      mountAlsoSee(root, []);
      return null;
    }

    menuApi?.destroy?.();
    mountAlsoSee(root, links);
    menuApi = wireAlsoSeeMenu(root);
  } catch {
    // Keep local fallback already in the footer host.
  }

  return menuApi;
}
