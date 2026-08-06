/**
 * Machine-readable template inventory (source of truth for manifests / sync).
 * Keep in sync with `.cursor/skills/_shared/component-map.md`.
 *
 * Paths are repo-root relative, POSIX-style.
 */

/** Paths (and directory prefixes ending in `/`) sync must never overwrite. */
export const APP_OWNED = [
  "app/main.js",
  "app/demo.js",
  "app/config.js",
  "app/styles.css",
  "app/css/app.css",
  "app/utils/icons-app.js",
  "app/res/",
  "index.html",
  "demo.html",
];

/** Fields inside otherwise-shared files that remain fork-owned. */
export const APP_OWNED_FIELDS = {
  "app/version.js": ["APP_VERSION"],
};

/**
 * CSS partial basenames in `@import` order for the full catalogue
 * (`app/css/template.css`).
 */
export const CSS_INDEX_ORDER = [
  "layout.css",
  "code-block.css",
  "controls-buttons.css",
  "controls-badges.css",
  "controls-chips.css",
  "controls-fields.css",
  "controls-widgets.css",
  "controls-section-panel.css",
  "controls-menus.css",
  "controls-disclosure.css",
  "controls-file.css",
  "overlays.css",
  "rich-text-editor.css",
  "table.css",
  "controls-tabular-input.css",
];

/** Always shipped with `initShell` (plus core CSS / icons below). */
export const CORE = {
  files: [
    "app/theme-init.js",
    "app/version.js",
    "app/tokens.css",
    "app/shell/shell.js",
    "app/shell/render-shell.js",
    "app/shell/theme.js",
    "app/shell/page-nav.js",
    "app/shell/sticky.js",
    "app/shell/title-numbering.js",
    "app/shell/also-see.js",
    "app/shell/external-link.js",
    "app/shell/heading-link.js",
    "app/utils/dom.js",
    "app/utils/document-listeners.js",
    "app/utils/clipboard.js",
    "app/utils/icons.js",
    "app/utils/icons-template.js",
    "app/utils/brand-icon.js",
    "app/utils/also-see-svg.js",
    "app/utils/menu.js",
    "app/components/tooltip.js",
    "app/components/banner.js",
  ],
  css: ["layout.css", "controls-buttons.css", "overlays.css"],
  icons: [
    "light-mode",
    "dark-mode",
    "auto-mode",
    "chevron-up",
    "chevron-down",
    "arrow-outward",
    "link",
  ],
};

/**
 * Shared infra ids referenced by components (`infra` arrays below).
 * `icons-app.js` is app-owned and omitted here.
 */
export const INFRA = {
  dom: ["app/utils/dom.js"],
  "document-listeners": ["app/utils/document-listeners.js"],
  clipboard: ["app/utils/clipboard.js"],
  icons: ["app/utils/icons.js", "app/utils/icons-template.js"],
  menu: ["app/utils/menu.js"],
  config: ["app/config.js"],
  "brand-icon": ["app/utils/brand-icon.js"],
  "also-see-svg": ["app/utils/also-see-svg.js"],
};

/**
 * Optional catalogue features. `css` entries are basenames under `app/css/`.
 * `vendor` entries may be files or directories (trailing `/`).
 */
export const COMPONENTS = {
  tooltip: {
    files: ["app/components/tooltip.js"],
    css: ["overlays.css"],
    vendor: [],
    icons: [],
    infra: [],
    always: true,
  },
  banner: {
    files: ["app/components/banner.js"],
    css: ["overlays.css"],
    vendor: [],
    icons: ["note", "info", "success", "important", "warning", "error"],
    infra: ["dom"],
    always: true,
  },
  dialog: {
    files: ["app/components/dialog.js"],
    css: ["overlays.css"],
    vendor: [],
    icons: [],
    infra: ["dom", "document-listeners"],
  },
  badge: {
    files: ["app/components/badge.js"],
    css: ["controls-badges.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  chip: {
    files: ["app/components/chip.js"],
    css: ["controls-chips.css"],
    vendor: [],
    icons: ["error"],
    infra: ["dom", "icons"],
  },
  combobox: {
    files: ["app/components/combobox.js"],
    css: ["controls-fields.css", "controls-badges.css"],
    vendor: [],
    icons: [],
    infra: ["dom", "document-listeners"],
    notes: "Multi via data-combobox-multi; multi also uses badge",
  },
  "date-picker": {
    files: [
      "app/components/date-picker/index.js",
      "app/components/date-picker/calendar.js",
      "app/components/date-picker/parse.js",
    ],
    css: ["controls-fields.css"],
    vendor: [],
    icons: ["calendar"],
    infra: ["dom", "document-listeners"],
  },
  "time-picker": {
    files: ["app/components/time-picker.js"],
    css: ["controls-fields.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  "duration-input": {
    files: ["app/components/duration-input.js"],
    css: ["controls-fields.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  "color-input": {
    files: ["app/components/color-input.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  toggle: {
    files: ["app/components/toggle.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: ["check", "remove"],
    infra: ["dom", "icons"],
  },
  checkbox: {
    files: ["app/components/checkbox.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  "segmented-control": {
    files: ["app/components/segmented-control.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  pagination: {
    files: ["app/components/pagination.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  "progress-bar": {
    files: ["app/components/progress-bar.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  spinner: {
    files: ["app/components/spinner.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  slider: {
    files: ["app/components/slider.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  stepper: {
    files: ["app/components/stepper.js"],
    css: ["controls-widgets.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  combo: {
    files: ["app/components/combo.js"],
    css: ["controls-menus.css"],
    vendor: [],
    icons: [],
    infra: ["menu"],
  },
  dropdown: {
    files: ["app/components/dropdown.js"],
    css: ["controls-menus.css"],
    vendor: [],
    icons: [],
    infra: ["menu"],
  },
  "dropdown-toggle": {
    files: ["app/components/dropdown-toggle.js"],
    css: ["controls-menus.css"],
    vendor: [],
    icons: [],
    infra: ["menu"],
    notes: "Uses badge for selection count",
  },
  expand: {
    files: ["app/components/expand.js"],
    css: ["controls-disclosure.css"],
    vendor: [],
    icons: ["chevron-right"],
    infra: ["dom", "icons"],
  },
  accordion: {
    files: ["app/components/accordion.js"],
    css: ["controls-disclosure.css"],
    vendor: [],
    icons: ["chevron-right"],
    infra: ["dom", "icons"],
  },
  tabs: {
    files: ["app/components/tabs.js"],
    css: ["controls-disclosure.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  "progress-indicator": {
    files: ["app/components/progress-indicator.js"],
    css: ["controls-disclosure.css"],
    vendor: [],
    icons: [],
    infra: ["dom"],
  },
  "file-dropzone": {
    files: ["app/components/file-dropzone.js"],
    css: ["controls-file.css"],
    vendor: [],
    icons: ["upload", "error"],
    infra: ["dom", "icons"],
  },
  "file-download": {
    files: ["app/components/file-download.js"],
    css: ["controls-file.css"],
    vendor: [],
    icons: ["upload"],
    infra: ["icons"],
  },
  "code-block": {
    files: ["app/components/code-block.js"],
    css: ["code-block.css"],
    vendor: ["app/vendor/prism/", "app/prism.css"],
    icons: ["clear", "copy", "paste", "lines", "highlight", "fullscreen"],
    infra: ["dom", "clipboard", "icons"],
  },
  "expandable-surface": {
    files: ["app/components/expandable-surface.js"],
    css: ["code-block.css"],
    vendor: [],
    icons: ["fullscreen", "fullscreen-exit"],
    infra: ["dom", "document-listeners", "icons"],
  },
  table: {
    files: ["app/components/table.js"],
    css: ["table.css"],
    vendor: [],
    icons: ["chevron-up"],
    infra: ["dom", "icons"],
  },
  "tabular-input": {
    files: ["app/components/tabular-input.js"],
    css: ["controls-tabular-input.css"],
    vendor: [],
    icons: [
      "copy",
      "paste",
      "paste-special",
      "plus",
      "delete",
      "remove",
      "chevron-up",
      "chevron-down",
    ],
    infra: ["dom", "document-listeners", "menu", "icons", "clipboard"],
  },
  "rich-text-editor": {
    files: [
      "app/components/rich-text-editor.js",
      "app/components/toastui-editor.js",
      "app/components/segmented-control.js",
    ],
    css: ["rich-text-editor.css", "controls-widgets.css"],
    vendor: [
      "app/vendor/toastui-editor/",
      "app/vendor/toastui-editor-plugin-table-merged-cell/",
      "app/toastui-editor.css",
    ],
    icons: [],
    infra: ["config", "dom"],
    notes: "Mode switch uses segmented-control",
  },
};

/** CSS-only / shell patterns (no dedicated component JS beyond shell). */
export const CSS_ONLY = {
  buttons: { css: ["controls-buttons.css"], always: true },
  toolbar: { css: ["controls-buttons.css"], always: true },
  fields: { css: ["controls-fields.css"] },
  "section-panel": { css: ["controls-section-panel.css"] },
  callout: { css: ["overlays.css"] },
};

/** Which features need each CSS partial (for trim / index generation). */
export const CSS_PARTIAL_FEATURES = {
  "layout.css": ["shell", "page-nav", "sticky", "title-numbering", "theme-toggle"],
  "controls-buttons.css": ["buttons", "toolbar"],
  "overlays.css": ["tooltip", "banner", "dialog", "callout"],
  "code-block.css": ["code-block", "expandable-surface"],
  "controls-badges.css": ["badge", "combobox", "dropdown-toggle"],
  "controls-chips.css": ["chip"],
  "controls-fields.css": [
    "fields",
    "combobox",
    "date-picker",
    "time-picker",
    "duration-input",
  ],
  "controls-widgets.css": [
    "toggle",
    "checkbox",
    "segmented-control",
    "pagination",
    "progress-bar",
    "spinner",
    "slider",
    "stepper",
    "color-input",
    "rich-text-editor",
  ],
  "controls-section-panel.css": ["section-panel"],
  "controls-menus.css": ["combo", "dropdown", "dropdown-toggle"],
  "controls-disclosure.css": [
    "expand",
    "accordion",
    "tabs",
    "progress-indicator",
  ],
  "controls-file.css": ["file-dropzone", "file-download"],
  "rich-text-editor.css": ["rich-text-editor"],
  "table.css": ["table"],
  "controls-tabular-input.css": ["tabular-input"],
};

/** Regenerated by sync/verify; not treated as a durable hand-edited file. */
export const DERIVED_FILES = ["app/css/template.css"];

export const DEFAULT_SOURCE = "filcuk/microapp-template";

/**
 * Build the full or trimmed `template.css` body (LF endings).
 * @param {string[]} [cssBasenames]
 */
export function renderTemplateCssIndex(cssBasenames = CSS_INDEX_ORDER) {
  const lines = [
    "/**",
    " * Template CSS index — lists shared partials under this directory.",
    " * Regenerated by template sync/verify from the selected component set;",
    " * do not treat hand edits as durable in forks.",
    " */",
    ...cssBasenames.map((name) => `@import url("${name}");`),
    "",
  ];
  return lines.join("\n");
}
