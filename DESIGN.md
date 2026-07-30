# Design philosophy

Visual and interaction principles for this microapp template. Implementation details live in `USAGE.md`, tokens in `app/tokens.css`, and agent rules in `AGENTS.md`.

Aesthetics follow a GitHub-inspired palette (based on [pqm-stepper](https://github.com/filcuk/pqm-stepper)): 6px radii, system UI font, light / dark / auto theme.

## Action feedback

When a control reacts to a user action (copy succeeded, save failed, and similar):

1. **Default — in-place** on the control when it can show the outcome itself (e.g. labeled **Copy** → **Copied** / **Failed** for a short duration). Prefer this over a reaction tooltip.
2. **Fallback — timer tooltip** when in-place is not practical (icon-only controls such as the floating code-block copy button). Use success/error tones with check / × icons.
3. **When requested — banner** for page-level or persistent status messaging.

**Also in-place:** clipboard paste-arming (prompting “Press Ctrl+V” / showing `Ctrl+V` on the button for up to ~15s) is a waiting state on the control, not only a one-shot flash.

Success and error **tooltips** (when used) use bold green / red styling (banner success/error tokens) and a small leading icon: check for success, clear (×) for error. Info tooltips stay neutral with text only.

## Tooltip modes

| Mode | Role | Lifetime |
| ---- | ---- | -------- |
| **Hover** (default) | Describe a control on pointer over or focus | Until pointer/focus leaves |
| **Timer** | Reaction feedback when in-place is not an option (e.g. icon-only copy → “Copied”) | Fixed duration; stays visible without hover |
| **Persistent** | Tutorials / guided highlight | Until explicitly dismissed (e.g. user activates the highlighted control) |

### Mutual exclusion

- Hover and timer share one slot: **at most one** of them is active.
- Starting a hover tip cancels an active timer tip (and vice versa).
- Persistent tips are separate instances. They may coexist with each other and are **not** cancelled by hover/timer. Dismiss only via the intended action or dismiss API.

With the exception of persistent tooltips, never show multiple tooltips at once.
