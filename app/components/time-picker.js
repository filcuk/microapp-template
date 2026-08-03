/**
 * Time-of-day picker (no date) — wraps a native `<input type="time">`.
 *
 * Markup:
 *   <div class="time-picker" id="my-time-picker" data-time-picker-default="14:30">
 *     <label class="field-label" for="my-time-picker-input">Time</label>
 *     <input type="time" id="my-time-picker-input" class="input date-picker-time" />
 *     <input type="hidden" class="time-picker-value" name="time" />
 *   </div>
 *
 * data-time-picker-default — initial `HH:MM` or `HH:MM:SS`
 * data-time-picker-min / data-time-picker-max — same format as native time min/max
 * data-time-picker-step — seconds step (native `step`)
 * data-time-picker-disabled — disable the control
 */

import { parseBooleanAttr } from "../utils/dom.js";

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/**
 * @param {string} value
 * @returns {string | null} Normalised `HH:MM` or `HH:MM:SS`, or null when invalid.
 */
export function parseTimeValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = TIME_PATTERN.exec(text);
  if (!match) return null;
  const hours = String(Number(match[1])).padStart(2, "0");
  const minutes = match[2];
  const seconds = match[3];
  return seconds !== undefined && seconds !== null
    ? `${hours}:${minutes}:${seconds}`
    : `${hours}:${minutes}`;
}

function resolveDisabled(pickerEl, disabledOption) {
  if (typeof disabledOption === "boolean") return disabledOption;
  return parseBooleanAttr(pickerEl?.dataset.timePickerDisabled) ?? false;
}

/**
 * Lexicographic compare works for zero-padded `HH:MM` / `HH:MM:SS`.
 * @param {string} value
 * @param {string | null} min
 * @param {string | null} max
 */
export function isTimeWithinBounds(value, min, max) {
  if (!value) return true;
  if (min && value < min) return false;
  if (max && value > max) return false;
  return true;
}

/**
 * @param {HTMLElement | null} pickerEl
 * @param {{
 *   defaultValue?: string,
 *   min?: string,
 *   max?: string,
 *   step?: number | string,
 *   disabled?: boolean,
 *   onChange?: (detail: object) => void,
 *   onInput?: (detail: object) => void,
 * }} [options]
 */
export function initTimePicker(
  pickerEl,
  { defaultValue, min, max, step, disabled, onChange, onInput } = {}
) {
  if (!pickerEl) return null;

  const input =
    pickerEl.querySelector(".time-picker-input") ||
    pickerEl.querySelector("input.date-picker-time") ||
    pickerEl.querySelector('input[type="time"]');
  const valueInput = pickerEl.querySelector(".time-picker-value");
  if (!input || input.type !== "time") return null;

  let isDisabled = resolveDisabled(pickerEl, disabled);

  const resolvedMin = parseTimeValue(min ?? pickerEl.dataset.timePickerMin);
  const resolvedMax = parseTimeValue(max ?? pickerEl.dataset.timePickerMax);
  const resolvedStep = step ?? pickerEl.dataset.timePickerStep;

  if (resolvedMin) input.min = resolvedMin;
  if (resolvedMax) input.max = resolvedMax;
  if (resolvedStep !== null && resolvedStep !== undefined && resolvedStep !== "") {
    input.step = String(resolvedStep);
  }

  function syncHidden(value) {
    if (valueInput) valueInput.value = value ?? "";
  }

  function syncValidity() {
    const value = input.value || "";
    const valid = isTimeWithinBounds(value, resolvedMin, resolvedMax);
    if (valid) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", "true");
    return valid;
  }

  function emit(handler, source) {
    handler?.({
      pickerEl,
      value: input.value || "",
      input: input.value,
      valid: isTimeWithinBounds(input.value || "", resolvedMin, resolvedMax),
      source,
    });
  }

  function setDisabled(next) {
    isDisabled = Boolean(next);
    input.disabled = isDisabled;
    if (valueInput) valueInput.disabled = isDisabled;
    pickerEl.classList.toggle("time-picker--disabled", isDisabled);
  }

  function setValue(next, { emitEvent = true, source = "api" } = {}) {
    const parsed = parseTimeValue(next);
    input.value = parsed ?? "";
    syncHidden(input.value);
    syncValidity();
    if (emitEvent) emit(onChange, source);
  }

  function onInputEvent() {
    syncHidden(input.value);
    syncValidity();
    emit(onInput, "input");
  }

  function onChangeEvent() {
    syncHidden(input.value);
    syncValidity();
    emit(onChange, "change");
  }

  const initial =
    parseTimeValue(defaultValue) ??
    parseTimeValue(pickerEl.dataset.timePickerDefault) ??
    parseTimeValue(valueInput?.value) ??
    parseTimeValue(input.value);

  if (initial) {
    input.value = initial;
  }
  syncHidden(input.value);
  syncValidity();

  setDisabled(isDisabled);

  input.addEventListener("input", onInputEvent);
  input.addEventListener("change", onChangeEvent);

  return {
    getValue() {
      return input.value || "";
    },
    setValue(value) {
      setValue(value);
    },
    setDisabled,
    destroy() {
      input.removeEventListener("input", onInputEvent);
      input.removeEventListener("change", onChangeEvent);
    },
  };
}

/** Wire every `.time-picker` block in `root`. */
export function initTimePickers(root = document) {
  const instances = [];
  root.querySelectorAll(".time-picker").forEach((pickerEl) => {
    const instance = initTimePicker(pickerEl);
    if (instance) instances.push(instance);
  });
  return instances;
}
