# Usage guide

How to fork this template into your own app, deploy it, and use the design system components.

## Creating a new app from this template

### 1. Create the repository

1. Click **Use this template** on GitHub (or clone this repo).
2. Rename the repository for your app.

### 2. Customize the homepage

Edit [`index.html`](index.html):

- `<title>`, header `<h1>`, and `.tagline`
- Replace the `<main>` content with your app UI
- Remove the link to `demo.html` when you drop the demo page (see below)
- Swap logo files under `app/res/` or update the `<img>` paths

Wire your page logic in [`app/main.js`](app/main.js). Every HTML entry point should follow the same boot pattern:

```html
<script src="app/theme-init.js"></script>
<link rel="stylesheet" href="app/styles.css" />
<!-- …your content… -->
<script type="module" src="app/main.js"></script>
```

```javascript
import { initShell } from "./shell.js";

initShell(); // footer, theme toggle, page nav, tooltips, icons, links
// …your app-specific inits…
```

Optional shell overrides (repo link, brand URL, page nav scan):

```javascript
initShell({
  repoUrl: "https://github.com/you/your-app",
  brandUrl: "https://yoursite.example",
  brandName: "Your name",
  pageNav: { headingSelector: "main h2[id]" },
});
```

### 3. Remove or keep the demo

The demo is for exploring components — not required for your app.

| Keep as reference | Remove when shipping |
| ----------------- | -------------------- |
| [`demo.html`](demo.html) | Delete `demo.html` |
| [`app/demo.js`](app/demo.js) | Delete `app/demo.js` |
| Prism vendor + `app/prism.css` (only if you do not use code blocks) | `app/vendor/prism/`, `app/prism.css`, `app/prism.js` |

If you **remove** `demo.html`, update [`.github/workflows/pages.yml`](.github/workflows/pages.yml) — drop `demo.html` from the `cp` line:

```yaml
cp index.html _site/
```

If you **keep** the demo, leave the workflow as-is and optionally link to it from `index.html` while developing.

### 4. Trim unused modules (optional)

All modules under `app/` are small and tree-shaken by the browser (only imported files load). You can delete files you will never use, for example:

- `app/code-block.js`, `app/expandable-surface.js`, `app/prism.js`, `app/vendor/prism/` — no syntax-highlighted code
- `app/combo.js`, `app/dropdown.js`, `app/dropdown-toggle.js` — no menus
- `app/dialog.js` — no modals

Do **not** delete shared infrastructure you still need: `shell.js`, `render-shell.js`, `theme-init.js`, `theme.js`, `icons.js`, `dom.js`, `document-listeners.js`, `menu.js` (if any popup menu remains).

### 5. Branding

| Asset | Purpose |
| ----- | ------- |
| `app/res/app-light.svg` / `app-dark.svg` | Header logo, favicon |
| `app/res/sig-light.svg` / `sig-dark.svg` | Footer signature icon |

Theme-aware swapping is handled in CSS and [`app/brand-icon.js`](app/brand-icon.js). Replace the SVG files or edit [`app/render-shell.js`](app/render-shell.js) defaults.

### 6. Checklist before first deploy

- [ ] `index.html` title, heading, and content updated
- [ ] `app/main.js` implements your app (not just `initShell()`)
- [ ] Demo removed or intentionally kept
- [ ] `pages.yml` matches published HTML files
- [ ] GitHub **Settings → Pages → Source** set to **GitHub Actions**

---

## Local preview

ES modules require a local server (opening `index.html` directly may block imports):

```bash
npx serve .
```

Then open `http://localhost:3000` and, if kept, `http://localhost:3000/demo.html`.

---

## GitHub Pages deployment

1. Push to `main` (includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml)).
2. In the repo **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. After the workflow runs, the site is at `https://<username>.github.io/<repo>/`.

The workflow copies only publishable files into `_site/` (`index.html`, optional `demo.html`, `.nojekyll`, `app/`). `README.md`, `USAGE.md`, and other repo files are not published.

---

## Project structure

```
index.html          # Your app homepage
demo.html           # Component showcase (optional)
.nojekyll           # Skip Jekyll on GitHub Pages
app/
  styles.css            # Imports tokens.css + components.css
  tokens.css            # Design tokens, base typography, reduced motion
  components.css        # Layout shell and UI components
  theme-init.js         # Theme before first paint
  theme.js              # Theme preference module
  render-shell.js       # Injects footer + page navigation markup
  shell.js              # Shared page boot (render, icons, theme, page nav)
  document-listeners.js # Single document click / Escape registry
  dom.js                # setHidden(), resolveElements(), prefersReducedMotion()
  menu.js               # Shared popup menu logic (combo, dropdown)
  dialog.js             # Modal controller
  combo.js              # Combo button controller
  dropdown.js           # Dropdown menu controller
  dropdown-toggle.js    # Multi-select toggle dropdown
  expand.js             # Expand / disclosure controller
  tabs.js               # Tabbed section controller
  page-nav.js           # In-page heading nav + jump up/down
  icons.js              # Inline SVG icon registry
  tooltip.js            # Instant tooltips
  banner.js             # showBanner / hideBanner with optional expiry
  external-link.js      # Arrow icon on outgoing links
  heading-link.js       # Copy section link on heading hover
  main.js               # index.html entry
  demo.js               # demo.html entry (optional)
  prism.css             # Prism token colours + line numbers (optional)
  prism.js              # initPrism() helper (optional)
  code-block.js         # Code block toggles + copy button
  expandable-surface.js # Hover maximise for code blocks, textareas, …
  vendor/prism/         # Vendored Prism core, languages, plugins (optional)
  res/                  # App logo and signature SVGs
```

---

## Available features and components

| Feature | Description |
| -------- | ----------- |
| **Design tokens** | CSS custom properties in [`app/tokens.css`](app/tokens.css) for background, surface, section panels, `--control-height` (single-line controls), text, borders, accent, banners, and code blocks. Light and dark values via `[data-theme="dark"]`. Component styles in [`app/components.css`](app/components.css). |
| **Theme toggle** | Footer control (injected by `initShell()`): light, dark, or system (`auto`). Stored in `localStorage` under `microapp-theme`. `app/theme-init.js` runs in `<head>` to avoid flash of wrong theme. |
| **Layout shell** | Semantic `header` / `main` / `footer` (footer rendered by JS), max-width 1200px, flex column page. |
| **Buttons** | `.btn` (default), `.btn-primary`, `.btn-icon`, `.btn-toggle` (`aria-pressed` — accent border when on), `.btn-link`, disabled state. |
| **Inputs** | `.field` / `.field-label` with `.input`, `.textarea`, and `.checkbox` / `.checkbox-input`. |
| **Section panel** | `.section-panel` three-column grid rows, divider, submit row with expiring banner. See [`demo.html`](demo.html). |
| **Combo button** | Split `.combo-btn` with main action + chevron menu; behaviour from [`app/combo.js`](app/combo.js). |
| **Dropdown** | `.dropdown` with `.dropdown-trigger` and `.dropdown-menu`; behaviour from [`app/dropdown.js`](app/dropdown.js). |
| **Toggle dropdown** | Multi-select dropdown; items toggle with `aria-checked`, menu stays open. [`app/dropdown-toggle.js`](app/dropdown-toggle.js). |
| **Expand** | `.expand` disclosure with notch + label trigger and collapsible `.expand-panel`; behaviour from [`app/expand.js`](app/expand.js). |
| **Tabs** | `.tabs` block with `.tabs-list` / `.tabs-tab` and `.tabs-panel` content; behaviour from [`app/tabs.js`](app/tabs.js). |
| **Page navigation** | Fixed `#page-nav`: always-visible jump up/down (shared progress ring), section links on hover. [`app/page-nav.js`](app/page-nav.js). |
| **Dialogs** | Accessible modal: backdrop, focus trap, Escape, focus restore. Markup uses `.modal` / `.modal-panel`; behaviour from [`app/dialog.js`](app/dialog.js). |
| **Heading links** | Hover a `main h2[id]` heading to reveal a link icon; tooltip says “Get link”, then “Copied!” on success. [`app/heading-link.js`](app/heading-link.js). |
| **External links** | Outgoing `http(s)` links get an arrow-outward icon via `initShell()` / [`app/external-link.js`](app/external-link.js). Opt out with `data-no-external-icon`. |
| **Tooltips** | Instant custom tooltips — no native `title` delay. Add `data-tooltip="…"` and optional `data-tooltip-position="top\|bottom\|left\|right"`. See [`app/tooltip.js`](app/tooltip.js). |
| **Banners** | `.banner.banner-*` variants with `data-icon`. Optional auto-hide via `data-banner-expire` (ms) and [`app/banner.js`](app/banner.js) (`showBanner` / `hideBanner`). Expire overlay + fade-out. |
| **Code blocks** | `.code-block` with Prism highlighting, line numbers, copy, view/select/edit modes. [`app/code-block.js`](app/code-block.js). |
| **Expandable surface** | Maximize code blocks or textareas to page width. [`app/expandable-surface.js`](app/expandable-surface.js). |
| **Icons** | Inline SVGs in [`app/icons.js`](app/icons.js); use `data-icon` in HTML or `createIcon()` in JS. Source from [Icônes — Material Icons (Round)](https://icones.js.org/collection/ic?s=info&variant=Round). Logo files stay in `app/res/`. |
| **Toolbar helper** | `.toolbar` flex row for button groups. See [`demo.html`](demo.html). |
| **Code highlighting** | Optional [Prism.js](https://prismjs.com/) via [`app/code-block.js`](app/code-block.js) and [`app/vendor/prism/`](app/vendor/prism/). See [`app/prism.js`](app/prism.js) for a minimal loader helper. |

For live examples of each component, open [`demo.html`](demo.html) on a local server or your deployed site.

---

## Using components

### Theme

```html
<script src="app/theme-init.js"></script>
<link rel="stylesheet" href="app/styles.css" />
<script type="module" src="app/main.js"></script>
```

```javascript
import { initShell } from "./shell.js";

initShell(); // footer + page nav + icons + theme in one call
```

Or wire individually:

```javascript
import { initTheme, initThemeToggle } from "./theme.js";
initTheme();
initThemeToggle(document.getElementById("theme-toggle"));
```

### Dialog

```javascript
import { initDialog } from "./dialog.js";

const dialog = initDialog({
  dialogEl: document.getElementById("my-dialog"),
  openTriggers: "#open-my-dialog",
});
// dialog.openDialog(), dialog.closeDialog(), dialog.isDialogOpen()
```

Close controls use `data-dialog-close` on backdrop, × button, or footer buttons.

### Tooltip

```html
<button type="button" data-tooltip="Help text" data-tooltip-position="top">?</button>
```

```javascript
import { initTooltips } from "./tooltip.js";
initTooltips(document);
```

`initShell()` already calls `initTooltips(document)`.

### Banners

Markup uses `.banner` plus a variant (`banner-success`, `banner-error`, …) and a `data-icon` for the left icon.

Auto-hide after a delay — set `data-banner-expire` (milliseconds) and call `showBanner()`. A light overlay drains across the banner for the duration of the timeout, then the banner fades out quickly.

```html
<div id="saved-banner" class="banner banner-success hidden" role="status" hidden
  data-banner-expire="1500">
  <span class="banner-icon" data-icon="success" data-icon-class="banner-icon-svg"></span>
  <span class="banner-body">Saved</span>
</div>
```

```javascript
import { showBanner, hideBanner } from "./banner.js";

showBanner(document.getElementById("saved-banner"));
// or override: showBanner(el, { expire: 3000 });
hideBanner(el);
```

Always use `hideBanner()` / `showBanner()` for banners with expiry — do not toggle `.hidden` directly, or timers may keep running.

### External links

Enabled by `initShell()`. Any `http(s)` link to another origin gets an arrow-outward icon appended automatically. Opt out on a specific link:

```html
<a href="https://example.com" data-no-external-icon>Stay plain</a>
```

### Heading links

Enabled by `initShell()`. Section headings (`main h2[id]`) show a link icon on hover with a “Get link” tooltip; click copies the full section URL and the tooltip switches to “Copied!”.

```javascript
import { initHeadingLinks } from "./heading-link.js";

initHeadingLinks(document, { selector: "main h3[id]" });
```

### Toolbar

Flex row for grouping related buttons. Wraps on narrow viewports.

```html
<div class="toolbar" role="toolbar" aria-label="Document actions">
  <button type="button" class="btn">Undo</button>
  <button type="button" class="btn">Redo</button>
  <button type="button" class="btn btn-primary">Save</button>
  <button type="button" class="btn btn-icon" aria-label="More options" data-icon="lines"
    data-icon-class="btn-icon-svg"></button>
</div>
```

### Inputs

```html
<label class="field" for="name">
  <span class="field-label">Name</span>
  <input type="text" id="name" class="input" placeholder="Enter text…" />
</label>

<label class="field" for="notes">
  <span class="field-label">Notes</span>
  <textarea id="notes" class="textarea" rows="4"></textarea>
</label>

<label class="checkbox" for="agree">
  <input type="checkbox" class="checkbox-input" id="agree" />
  <span>I agree</span>
</label>
```

### Section panel

Three-column grid rows for compact forms. Stack fields across rows; use `.section-panel__divider` before actions.

```html
<div class="section-panel">
  <div class="section-panel__grid">
    <label class="field section-panel__field" for="name">
      <span class="field-label">Label</span>
      <input type="text" id="name" class="input" />
    </label>
  </div>
  <div class="section-panel__grid">
    <button type="button" class="btn btn-toggle section-panel__toggle" aria-pressed="false">Toggle</button>
  </div>
  <div class="section-panel__grid">
    <label class="checkbox section-panel__checkbox" for="remember">
      <input type="checkbox" class="checkbox-input" id="remember" />
      <span>Remember settings</span>
    </label>
  </div>
  <hr class="section-panel__divider" />
  <div class="section-panel__row">
    <div class="section-panel__feedback">
      <div id="section-success" class="banner banner-success hidden" role="status" hidden
        data-banner-expire="1500">
        <span class="banner-icon" data-icon="success" data-icon-class="banner-icon-svg"></span>
        <span class="banner-body">Submitted</span>
      </div>
    </div>
    <button type="button" class="btn btn-primary section-panel__submit">Submit</button>
  </div>
</div>
```

```javascript
import { showBanner, hideBanner } from "./banner.js";

submitBtn.addEventListener("click", () => {
  hideBanner(successBanner);
  hideBanner(errorBanner);
  showBanner(hasText ? successBanner : errorBanner);
});
```

See the interactive example on [`demo.html`](demo.html).

### Combo button

```javascript
import { initCombo } from "./combo.js";

initCombo(document.getElementById("my-combo"), {
  onMainClick: () => { /* primary action */ },
  onSelect: ({ value, label }) => { /* menu item chosen */ },
});
```

Markup: `.combo-btn` > `.combo-btn-main` + `.combo-btn-toggle` + `ul.combo-menu` with `.combo-menu-item` buttons.

### Dropdown

```javascript
import { initDropdown } from "./dropdown.js";

initDropdown(document.getElementById("my-dropdown"), {
  onSelect: ({ value, label }) => { /* item chosen */ },
});
```

Markup: `.dropdown` > `.dropdown-trigger` + `ul.dropdown-menu` with `.dropdown-menu-item` buttons.

### Toggle dropdown

Multi-select variant: clicking an item toggles it; the menu stays open until you click away or press Escape. The trigger shows the selection count when any items are active (e.g. `Toggle items (3)`).

```javascript
import { initToggleDropdown } from "./dropdown-toggle.js";

const toggleDropdown = initToggleDropdown(document.getElementById("my-toggle-dropdown"), {
  onToggle: ({ value, label, selected, values, labels }) => {
    console.log(label, selected, values);
  },
});

toggleDropdown?.getSelected(); // [{ value, label, item }, …]
toggleDropdown?.setSelected(["alpha", "gamma"]);
```

```html
<div class="dropdown" id="my-toggle-dropdown">
  <button type="button" class="btn dropdown-trigger" aria-haspopup="menu" aria-expanded="false"
    aria-controls="my-toggle-dropdown-menu">
    <span class="dropdown-trigger-label">Toggle items</span>
    <span class="combo-btn-chevron" aria-hidden="true"></span>
  </button>
  <ul id="my-toggle-dropdown-menu" class="dropdown-menu hidden" role="menu">
    <li role="none">
      <button type="button" class="dropdown-menu-item" role="menuitemcheckbox" aria-checked="false"
        data-value="alpha">Alpha</button>
    </li>
  </ul>
</div>
```

### Expand

```html
<div class="expand">
  <button type="button" class="expand-trigger" aria-expanded="false" aria-controls="my-expand-panel">
    <span class="expand-notch" aria-hidden="true"></span>
    <span class="expand-label">Advanced options</span>
  </button>
  <div id="my-expand-panel" class="expand-panel hidden" hidden>
    <div class="expand-body">More content here.</div>
  </div>
</div>
```

```javascript
import { initExpand, initExpands } from "./expand.js";

initExpands(document); // all .expand blocks

// or one instance:
const expand = initExpand(document.getElementById("my-expand"));
// expand.open(), expand.close(), expand.toggle(), expand.isOpen()
```

### Tabs

```html
<div class="tabs">
  <div class="tabs-list" role="tablist" aria-label="Sections">
    <button type="button" class="tabs-tab" role="tab" id="tab-a" aria-selected="true" aria-controls="panel-a">Overview</button>
    <button type="button" class="tabs-tab" role="tab" id="tab-b" aria-selected="false" aria-controls="panel-b" tabindex="-1">Details</button>
  </div>
  <div id="panel-a" class="tabs-panel" role="tabpanel" aria-labelledby="tab-a">
    <div class="tabs-body">Overview content</div>
  </div>
  <div id="panel-b" class="tabs-panel hidden" role="tabpanel" aria-labelledby="tab-b" hidden>
    <div class="tabs-body">Details content</div>
  </div>
</div>
```

```javascript
import { initTabs, initTabsBlocks } from "./tabs.js";

initTabsBlocks(document); // all .tabs blocks

// or one instance:
const tabs = initTabs(document.getElementById("my-tabs"));
// tabs.selectTab(1), tabs.getActiveIndex()
```

Arrow keys move between tabs when the tab list is focused.

### Page navigation

Injected by `initShell()` via [`app/render-shell.js`](app/render-shell.js). Collects `main h2[id]` headings automatically and shows plain section-title links (same weight and colour as `.section-heading`). Give each section heading a unique `id` and optional `.section-heading` class (`scroll-margin-top` is included).

```javascript
import { initShell } from "./shell.js";

initShell(); // default: main h2[id]

// Custom heading scan (e.g. h3 under a docs root):
initShell({
  pageNav: {
    headingSelector: "main h3[id]",
    headingRoot: document.getElementById("docs"),
  },
});
```

Standalone use without the full shell — insert markup from `PAGE_NAV_MARKUP` in `render-shell.js`, then:

```javascript
import { initPageNavPanel } from "./page-nav.js";

const nav = initPageNavPanel(); // defaults to #page-nav
nav?.rebuild(); // call after adding/removing headings dynamically
nav?.destroy(); // remove listeners when tearing down
```

Jump up scrolls to the top; jump down scrolls to the bottom. Jump buttons are always visible at the bottom-right; the section list appears when you hover the right-edge trigger strip (or focus a section link inside the panel). The blue ring shows scroll progress. If no matching headings exist, the section list is hidden and only the jump buttons remain.

### Code highlighting (Prism)

Optional syntax highlighting for docs or demos. See [`demo.html`](demo.html) for examples with line numbers, highlight toggle, copy, and maximise.

```html
<link rel="stylesheet" href="app/prism.css" />
<script defer src="app/vendor/prism/prism.min.js"></script>
<script defer src="app/vendor/prism/prism-python.min.js"></script>
<script defer src="app/vendor/prism/prism-line-numbers.min.js"></script>
```

```html
<div class="code-block" data-code-mode="select" data-code-copy="true" data-expandable-surface data-expandable-surface-label="Code sample">
  <div class="code-block-toolbar" role="group" aria-label="Code block options">
    <button type="button" class="btn code-block-toggle" data-code-toggle="line-numbers" aria-pressed="true">Line numbers</button>
    <button type="button" class="btn code-block-toggle" data-code-toggle="highlight" aria-pressed="true">Highlight</button>
  </div>
  <div class="code-block-body" data-expandable-surface-trigger>
    <button type="button" class="code-block-copy btn" aria-label="Copy code">Copy</button>
    <pre class="line-numbers language-python"><code class="language-python">def greet(name: str) -> str:
    return f"Hello, {name}!"
</code></pre>
  </div>
</div>
```

```javascript
import { initCodeBlocks } from "./code-block.js";
import { initExpandableSurfaces } from "./expandable-surface.js";

initCodeBlocks(document);
initExpandableSurfaces(document);
```

Set `data-code-copy="false"` on `.code-block` to disable the copy button. Line numbers require highlighting to be on.

**Interaction modes** — set `data-code-mode` on `.code-block`:

| Mode | Behaviour |
| ---- | --------- |
| `view` | Read-only display; text cannot be selected; copy button hidden |
| `select` | Read-only; text selectable; copy and highlight toggles (default) |
| `edit` | Editable overlay on highlighted `<pre>`; line numbers and highlight toggles apply |

Switch modes at runtime via `initCodeBlock()` → `setMode("edit")`, `getMode()`, `getSource()`, `setSource(text)`.

### Expandable surface

Reusable expanded overlay for code blocks, multi-line inputs, or any block marked with `data-expandable-surface`. A maximise icon appears on hover (injected into the trigger element); click expands the surface to the page body width (`--page-width`), Escape or backdrop click closes it.

```html
<div class="field" data-expandable-surface data-expandable-surface-label="Notes">
  <span class="field-label">Notes</span>
  <div data-expandable-surface-trigger>
    <textarea class="textarea" rows="4"></textarea>
  </div>
</div>
```

```javascript
import { initExpandableSurfaces } from "./expandable-surface.js";

initExpandableSurfaces(document);
```

Add other language components under `app/vendor/prism/` as needed from [Prism](https://prismjs.com/).

### Icons

All inline UI icons live in [`app/icons.js`](app/icons.js). Edit paths there once; pages mount them at load via `initIcons()`.

Browse and copy SVG paths from [Icônes — Google Material Icons (Round variant)](https://icones.js.org/collection/ic?s=info&variant=Round) (`ic` collection, `variant=Round`).

HTML:

```html
<button type="button" data-icon="light-mode" data-icon-class="theme-icon" aria-label="Light"></button>
```

JavaScript:

```javascript
import { createIcon, initIcons } from "./icons.js";

initIcons(document); // mounts every [data-icon] in the page

const svg = createIcon("lines", { className: "btn-icon-svg" });
button.append(svg);
```

Add new icons to the `ICONS` object in `app/icons.js`. App logo (`app/res/app-light.svg`, `app/res/app-dark.svg`) and signature (`app/res/sig-light.svg`, `app/res/sig-dark.svg`) swap by theme via CSS; favicon syncs in `app/brand-icon.js`.

Licensed icon sets (e.g. Material Icons) can use optional metadata on each entry:

```javascript
import { ICON_ATTRIBUTIONS } from "./icons.js";

export const ICONS = {
  info: {
    viewBox: "0 0 24 24",
    markup: `<path fill="currentColor" d="…"/>`,
    attribution: ICON_ATTRIBUTIONS.materialIcons,
    name: "round-info", // source collection id (Icônes / Material Icons)
  },
};
```

- `name` — original icon name in the source collection (metadata only; not used at runtime)
- `attribution` — license notice, inserted as an HTML comment inside the SVG
- `ref` — alias to another `ICONS` key (e.g. `lines: { ref: "note" }`)

Pass `includeAttribution: false` to `createIcon()` if you need the SVG without the comment.
