/**
 * Duration input — hours / minutes (optional seconds) as a segmented control.
 *
 * Markup:
 *   <div class="duration-input" id="my-duration" data-duration-default="1:30">
 *     <span class="field-label" id="my-duration-label">Duration</span>
 *     <div class="duration-input-control" role="group" aria-labelledby="my-duration-label">
 *       <input type="text" class="input duration-input-hours" inputmode="numeric"
 *         aria-label="Hours" />
 *       <span class="duration-input-sep" aria-hidden="true">:</span>
 *       <input type="text" class="input duration-input-minutes" inputmode="numeric"
 *         aria-label="Minutes" maxlength="2" />
 *     </div>
 *     <input type="hidden" class="duration-input-value" name="duration" />
 *   </div>
 *
 * Optional seconds field: `.duration-input-seconds` or `data-duration-seconds`.
 *
 * data-duration-default — `H:MM`, `HH:MM`, or `HH:MM:SS` (or total seconds as a number string)
 * data-duration-max-hours — cap for hours (default 99)
 * data-duration-seconds — include a seconds segment
 * data-duration-disabled — disable the control
 */

import { parseBooleanAttr } from "../utils/dom.js";

/**
 * @typedef {{ hours: number, minutes: number, seconds: number }} DurationParts
 */

/**
 * @param {string | number | null | undefined} value
 * @param {{ showSeconds?: boolean }} [options]
 * @returns {DurationParts | null}
 */
export function parseDurationValue(value, { showSeconds = false } = {}) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    const total = Math.max(0, Math.trunc(value));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return { hours, minutes, seconds: showSeconds ? seconds : 0 };
  }

  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    return parseDurationValue(Number(text), { showSeconds });
  }

  const match = /^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/.exec(text);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] !== undefined ? Number(match[3]) : 0;
  if (![hours, minutes, seconds].every(Number.isFinite)) return null;

  return {
    hours,
    minutes,
    seconds: showSeconds ? seconds : 0,
  };
}

/**
 * @param {DurationParts} parts
 * @param {{ showSeconds?: boolean }} [options]
 */
export function formatDurationValue(parts, { showSeconds = false } = {}) {
  const hours = Math.max(0, Math.trunc(parts.hours || 0));
  const minutes = Math.min(59, Math.max(0, Math.trunc(parts.minutes || 0)));
  const seconds = Math.min(59, Math.max(0, Math.trunc(parts.seconds || 0)));
  const hh = String(hours);
  const mm = String(minutes).padStart(2, "0");
  if (showSeconds) {
    return `${hh}:${mm}:${String(seconds).padStart(2, "0")}`;
  }
  return `${hh}:${mm}`;
}

function partsToSeconds(parts, showSeconds) {
  return (
    Math.max(0, Math.trunc(parts.hours || 0)) * 3600 +
    Math.min(59, Math.max(0, Math.trunc(parts.minutes || 0))) * 60 +
    (showSeconds ? Math.min(59, Math.max(0, Math.trunc(parts.seconds || 0))) : 0)
  );
}

function clampHours(hours, maxHours) {
  return Math.min(maxHours, Math.max(0, Math.trunc(hours || 0)));
}

function resolveDisabled(durationEl, disabledOption) {
  if (typeof disabledOption === "boolean") return disabledOption;
  return parseBooleanAttr(durationEl?.dataset.durationDisabled) ?? false;
}

function resolveShowSeconds(durationEl, showSecondsOption) {
  if (typeof showSecondsOption === "boolean") return showSecondsOption;
  if (durationEl?.querySelector(".duration-input-seconds")) return true;
  return parseBooleanAttr(durationEl?.dataset.durationSeconds) ?? false;
}

/**
 * @param {HTMLElement | null} durationEl
 * @param {{
 *   defaultValue?: string | number,
 *   maxHours?: number,
 *   showSeconds?: boolean,
 *   disabled?: boolean,
 *   onChange?: (detail: object) => void,
 *   onInput?: (detail: object) => void,
 * }} [options]
 */
export function initDurationInput(
  durationEl,
  { defaultValue, maxHours, showSeconds, disabled, onChange, onInput } = {}
) {
  if (!durationEl) return null;

  const control = durationEl.querySelector(".duration-input-control");
  const hoursInput = durationEl.querySelector(".duration-input-hours");
  const minutesInput = durationEl.querySelector(".duration-input-minutes");
  let secondsInput = durationEl.querySelector(".duration-input-seconds");
  const valueInput = durationEl.querySelector(".duration-input-value");

  if (!control || !hoursInput || !minutesInput) return null;

  const withSeconds = resolveShowSeconds(durationEl, showSeconds);
  let isDisabled = resolveDisabled(durationEl, disabled);

  const resolvedMaxHours = (() => {
    const fromOption = Number(maxHours);
    if (Number.isFinite(fromOption) && fromOption >= 0) return Math.trunc(fromOption);
    const fromAttr = Number(durationEl.dataset.durationMaxHours);
    return Number.isFinite(fromAttr) && fromAttr >= 0 ? Math.trunc(fromAttr) : 99;
  })();

  if (withSeconds && !secondsInput) {
    const sep = document.createElement("span");
    sep.className = "duration-input-sep";
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = ":";

    secondsInput = document.createElement("input");
    secondsInput.type = "text";
    secondsInput.className = "input duration-input-seconds";
    secondsInput.inputMode = "numeric";
    secondsInput.maxLength = 2;
    secondsInput.setAttribute("aria-label", "Seconds");

    control.append(sep, secondsInput);
  }

  /** @type {DurationParts} */
  let parts = { hours: 0, minutes: 0, seconds: 0 };

  function syncFields({ padMinutes = false } = {}) {
    hoursInput.value = String(parts.hours);
    minutesInput.value = padMinutes
      ? String(parts.minutes).padStart(2, "0")
      : String(parts.minutes);
    if (secondsInput) {
      secondsInput.value = padMinutes
        ? String(parts.seconds).padStart(2, "0")
        : String(parts.seconds);
    }
  }

  function syncHidden() {
    if (valueInput) {
      valueInput.value = formatDurationValue(parts, { showSeconds: withSeconds });
    }
  }

  function emit(handler, source) {
    handler?.({
      durationEl,
      value: formatDurationValue(parts, { showSeconds: withSeconds }),
      hours: parts.hours,
      minutes: parts.minutes,
      seconds: withSeconds ? parts.seconds : 0,
      totalSeconds: partsToSeconds(parts, withSeconds),
      source,
    });
  }

  function applyParts(next, { emitEvent = true, source = "api", padMinutes = true } = {}) {
    parts = {
      hours: clampHours(next.hours, resolvedMaxHours),
      minutes: Math.min(59, Math.max(0, Math.trunc(next.minutes || 0))),
      seconds: withSeconds
        ? Math.min(59, Math.max(0, Math.trunc(next.seconds || 0)))
        : 0,
    };
    syncFields({ padMinutes });
    syncHidden();
    hoursInput.removeAttribute("aria-invalid");
    minutesInput.removeAttribute("aria-invalid");
    secondsInput?.removeAttribute("aria-invalid");
    if (emitEvent) emit(onChange, source);
  }

  function readField(inputEl, { max, allowEmpty = true } = {}) {
    const raw = inputEl.value.trim();
    if (raw === "") return allowEmpty ? 0 : null;
    if (!/^\d+$/.test(raw)) return null;
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    return Math.min(max, Math.max(0, Math.trunc(num)));
  }

  function commitFields({ emitEvent = true, source = "commit" } = {}) {
    const hours = readField(hoursInput, { max: resolvedMaxHours });
    const minutes = readField(minutesInput, { max: 59 });
    const seconds = withSeconds ? readField(secondsInput, { max: 59 }) : 0;

    if (hours === null || minutes === null || seconds === null) {
      if (hours === null) hoursInput.setAttribute("aria-invalid", "true");
      else hoursInput.removeAttribute("aria-invalid");
      if (minutes === null) minutesInput.setAttribute("aria-invalid", "true");
      else minutesInput.removeAttribute("aria-invalid");
      if (secondsInput) {
        if (seconds === null) secondsInput.setAttribute("aria-invalid", "true");
        else secondsInput.removeAttribute("aria-invalid");
      }
      syncFields({ padMinutes: true });
      return false;
    }

    applyParts({ hours, minutes, seconds }, { emitEvent, source, padMinutes: true });
    return true;
  }

  function onFieldInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    target.value = target.value.replace(/\D+/g, "");
    emit(onInput, "input");
  }

  function onFieldBlur() {
    commitFields({ source: "blur" });
  }

  function onFieldKeydown(event) {
    if (isDisabled) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (event.key === "Enter") {
      event.preventDefault();
      commitFields({ source: "enter" });
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      commitFields({ emitEvent: false, source: "nudge" });
      const delta = event.key === "ArrowUp" ? 1 : -1;
      if (target === hoursInput) {
        applyParts({ ...parts, hours: parts.hours + delta }, { source: "nudge" });
      } else if (target === minutesInput) {
        let minutes = parts.minutes + delta;
        let hours = parts.hours;
        if (minutes > 59) {
          minutes = 0;
          hours += 1;
        } else if (minutes < 0) {
          minutes = 59;
          hours -= 1;
        }
        applyParts({ ...parts, hours, minutes }, { source: "nudge" });
      } else if (target === secondsInput) {
        let seconds = parts.seconds + delta;
        let minutes = parts.minutes;
        let hours = parts.hours;
        if (seconds > 59) {
          seconds = 0;
          minutes += 1;
        } else if (seconds < 0) {
          seconds = 59;
          minutes -= 1;
        }
        if (minutes > 59) {
          minutes = 0;
          hours += 1;
        } else if (minutes < 0) {
          minutes = 59;
          hours -= 1;
        }
        applyParts({ hours, minutes, seconds }, { source: "nudge" });
      }
      target.select();
      return;
    }

    if (event.key === ":" || event.key === "ArrowRight") {
      const atEnd =
        target.selectionStart === target.selectionEnd &&
        target.selectionEnd === target.value.length;
      if (event.key === ":" || (event.key === "ArrowRight" && atEnd)) {
        const order = [hoursInput, minutesInput, secondsInput].filter(Boolean);
        const index = order.indexOf(target);
        if (index >= 0 && index < order.length - 1) {
          event.preventDefault();
          order[index + 1].focus();
          order[index + 1].select();
        }
      }
    }

    if (event.key === "ArrowLeft" || event.key === "Backspace") {
      const atStart =
        target.selectionStart === 0 && target.selectionEnd === 0;
      if (atStart && (event.key === "ArrowLeft" || (event.key === "Backspace" && target.value === ""))) {
        const order = [hoursInput, minutesInput, secondsInput].filter(Boolean);
        const index = order.indexOf(target);
        if (index > 0) {
          event.preventDefault();
          order[index - 1].focus();
          order[index - 1].select();
        }
      }
    }
  }

  function setDisabled(next) {
    isDisabled = Boolean(next);
    for (const el of [hoursInput, minutesInput, secondsInput]) {
      if (el) el.disabled = isDisabled;
    }
    if (valueInput) valueInput.disabled = isDisabled;
    durationEl.classList.toggle("duration-input--disabled", isDisabled);
  }

  const initial =
    parseDurationValue(defaultValue, { showSeconds: withSeconds }) ??
    parseDurationValue(durationEl.dataset.durationDefault, { showSeconds: withSeconds }) ??
    parseDurationValue(valueInput?.value, { showSeconds: withSeconds }) ??
    { hours: 0, minutes: 0, seconds: 0 };

  applyParts(initial, { emitEvent: false, padMinutes: true });
  setDisabled(isDisabled);

  const fields = [hoursInput, minutesInput, secondsInput].filter(Boolean);
  for (const field of fields) {
    field.addEventListener("input", onFieldInput);
    field.addEventListener("blur", onFieldBlur);
    field.addEventListener("keydown", onFieldKeydown);
  }

  return {
    getValue() {
      return formatDurationValue(parts, { showSeconds: withSeconds });
    },
    getSeconds() {
      return partsToSeconds(parts, withSeconds);
    },
    getParts() {
      return { ...parts, seconds: withSeconds ? parts.seconds : 0 };
    },
    setValue(value) {
      const parsed = parseDurationValue(value, { showSeconds: withSeconds });
      if (!parsed) {
        applyParts({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      applyParts(parsed);
    },
    setSeconds(totalSeconds) {
      const parsed = parseDurationValue(totalSeconds, { showSeconds: withSeconds });
      applyParts(parsed ?? { hours: 0, minutes: 0, seconds: 0 });
    },
    setDisabled,
    destroy() {
      for (const field of fields) {
        field.removeEventListener("input", onFieldInput);
        field.removeEventListener("blur", onFieldBlur);
        field.removeEventListener("keydown", onFieldKeydown);
      }
    },
  };
}

/** Wire every `.duration-input` block in `root`. */
export function initDurationInputs(root = document) {
  const instances = [];
  root.querySelectorAll(".duration-input").forEach((durationEl) => {
    const instance = initDurationInput(durationEl);
    if (instance) instances.push(instance);
  });
  return instances;
}
