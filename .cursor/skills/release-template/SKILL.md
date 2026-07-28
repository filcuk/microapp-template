---
name: release-template
description: >-
  Release a microapp-template version: SemVer bump TEMPLATE_VERSION, update
  CHANGELOG.md, verify component-map matches the tree. Use when cutting a
  template release, bumping TEMPLATE_VERSION, or publishing changelog notes.
---

# Release template

For **template maintainers** shipping a new `TEMPLATE_VERSION`. Forks bumping their own app use `APP_VERSION` only — not this skill.

## SemVer (`TEMPLATE_VERSION`)

| Bump | When |
| ---- | ---- |
| **MAJOR** | Breaking changes for forks (renamed APIs, removed features, mandatory path moves without aliases) |
| **MINOR** | New backwards-compatible components or APIs |
| **PATCH** | Bug fixes, docs, non-breaking polish |

Update `TEMPLATE_VERSION` in `app/version.js` to match. Keep `APP_VERSION` at `0.0.0` on this repo.

## CHANGELOG

Maintain root `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/) style:

1. Move items from `[Unreleased]` into a new `## [X.Y.Z] - YYYY-MM-DD` section (today’s date).
2. Group under Added / Changed / Fixed / Removed as needed.
3. Leave an empty `[Unreleased]` section for the next cycle.

## Checklist

- [ ] `app/version.js` `TEMPLATE_VERSION` matches the new changelog section
- [ ] `.cursor/skills/_shared/component-map.md` matches the current component tree
- [ ] USAGE / AGENTS / demo updated for any shipped API (see `usage-docs.mdc`)
- [ ] `APP_VERSION` still `0.0.0`
- [ ] Remind user to tag `vX.Y.Z` if they use git tags (do not push unless asked)

## Finish

Run **`health-check`**. Summarize the release notes for the commit/PR body.
