import { createIcon } from "../utils/icons.js";
import { initPopupMenu } from "../utils/menu.js";

/**
 * Wire the footer “also see” dropdown (opens related-app links).
 * No-op when `#footer-also-see` is absent (feature disabled).
 *
 * @param {ParentNode} [root=document]
 */
export function initAlsoSee(root = document) {
  const containerEl = root.querySelector?.("#footer-also-see") ?? document.getElementById("footer-also-see");
  if (!containerEl) return null;

  const trigger = containerEl.querySelector(".footer-also-see-trigger");
  const menuEl = containerEl.querySelector(".footer-also-see-menu");
  if (!trigger || !menuEl) return null;

  trigger.classList.add("external-link");
  trigger.append(createIcon("arrow-outward", { className: "external-link-icon" }));

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
