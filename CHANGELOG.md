# Changelog

All notable changes to **microapp-template** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for `TEMPLATE_VERSION` in `app/version.js`.

## [Unreleased]

### Added

- Agent lifecycle skills under `.cursor/skills/` (init-app, migrate-template, sync-shell, restore-component, finalize-app, author-component, release-template, handle-assets, health-check).
- Shared `.cursor/skills/_shared/component-map.md` and `invariants.md` for trim/restore/migrate.

## [0.9.0] - 2026-07-26

### Added

- App icon modes: light/dark pair or single logo via `APP_ICON_SRC` / `__MICROAPP__` (`appIcon`, `appIconLight`, `appIconDark`).
- Improved related-links (also-see) icon handling for light/dark assets.

## [0.8.0] - 2026-07-26

### Added

- Remote `alsoSeeUrl` JSON for the footer related-apps menu, with local `alsoSee` fallback.
- Also-see topic whitelist (`alsoSeeTopics`).
- Tabular input copy/paste options (in-place and replace), wider canvas breakout, and related demo/docs/tests.

### Fixed

- Also-see menu opening under the page body.
- Tooltip appearing when removing tabular-input columns.
- Missing icon placeholders for new actions.

## [0.7.0] - 2026-07-25

### Added

- Tabular input (editable typed grid, row/column controls, clipboard helpers, keyboard nav).
- Badge and chips components.
- Footer related-apps (“also see”) menu.
- Sticky site header and sticky section headings.
- Tri-state toggle and tri-state checkbox.
- Theme / colour documentation blocks in the demo.
- Progress bar error and disabled states; optional shine.
- Dropdown menu group headers and richer dropdown demos.

### Changed

- Control reorganisation and header styling (including header bottom border).
- Improved table interaction and input filtering.

### Fixed

- Sticky header blocking content and sticky interaction issues.
- Dropdowns remaining open incorrectly.

## [0.6.0] - 2026-06-29

### Added

- Colour picker, data table, rich text editor (Toast UI + merged-cell plugin).
- Spinner, progress bar, pagination, segmented control, toggle.
- Slider, stepper, progress indicator.
- Reworked demo layout and clearer page-nav category headers.

### Changed

- Codebase review refactor: components under `app/components/`, shell under `app/shell/`, utils under `app/utils/`; demo modules reorganised.

### Fixed

- Progress indicator buttons, table checkbox alignment, page jumps on reload.
- Date picker calendar week start (Monday) and assorted demo polish.

## [0.5.0] - 2026-06-28

### Added

- Initial template: theme toggle, layout shell, buttons, banners, tooltips, dialogs.
- Code blocks (Prism), expandable surfaces, page navigation, heading links, external-link icons.
- Section panel, toolbar, USAGE.md, disclaimer, SemVer `TEMPLATE_VERSION` / `APP_VERSION`.
- Checkbox, expand, tabs, combo / dropdown / toggle-dropdown.
- File dropzone and file download.
- Accordion, date/time picker, combobox.
- Radio and related form control polish; banner lifetime / expire indicator.

[Unreleased]: https://github.com/filcuk/microapp-template/compare/4990e86...HEAD
[0.9.0]: https://github.com/filcuk/microapp-template/compare/v0.8.0...4990e86
[0.8.0]: https://github.com/filcuk/microapp-template/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/filcuk/microapp-template/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/filcuk/microapp-template/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/filcuk/microapp-template/releases/tag/v0.5.0
