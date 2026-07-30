# Design philosophy

Visual and interaction principles for this microapp template. Implementation details live in `USAGE.md`, tokens in `app/tokens.css`, and agent rules in `AGENTS.md`.

Aesthetics follow a GitHub-inspired palette (based on [pqm-stepper](https://github.com/filcuk/pqm-stepper)): 6px radii, system UI font, light / dark / auto theme.

## Action feedback

When a control reacts to a user action (copy succeeded, save failed, and similar):

1. **Default — tooltip** on the control that was used.
2. **When requested — banner** for page-level or persistent status messaging.
3. **Not standard — rewriting the control itself** (e.g. changing a “Copy” label to “Copied”). Keep in-place label/icon swaps available only when a prolonged mode must stay visible on the control.

**Exception:** clipboard paste-arming (prompting “Press Ctrl+V” / showing `Ctrl+V` on the button for up to ~15s) may rewrite the control. That is a waiting state, not a one-shot success/fail reaction. Momentary outcomes (Copied / Failed / Pasted) use timer-mode tooltips.

Success and error tooltips use bold green / red styling (banner success/error tokens) and a small leading icon: check for success, clear (×) for error. Info tooltips stay neutral with text only.

## Tooltip modes

| Mode | Role | Lifetime |
| ---- | ---- | -------- |
| **Hover** (default) | Describe a control on pointer over or focus | Until pointer/focus leaves |
| **Timer** | Reaction feedback (e.g. click Copy → “Copied”) | Fixed duration; stays visible without hover |
| **Persistent** | Tutorials / guided highlight | Until explicitly dismissed (e.g. user activates the highlighted control) |

### Mutual exclusion

- Hover and timer share one slot: **at most one** of them is active.
- Starting a hover tip cancels an active timer tip (and vice versa).
- Persistent tips are separate instances. They may coexist with each other and are **not** cancelled by hover/timer. Dismiss only via the intended action or dismiss API.

With the exception of persistent tooltips, never show multiple tooltips at once.
