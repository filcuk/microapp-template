import { initShell } from "./shell/shell.js";
import { setStickyHeader, setStickySectionHeadings } from "./shell/sticky.js";
import { initDialog } from "./components/dialog.js";
import { initCombobox } from "./components/combobox.js";
import { initCombo } from "./components/combo.js";
import { initDropdown } from "./components/dropdown.js";
import { initToggleDropdown } from "./components/dropdown-toggle.js";
import { initExpands } from "./components/expand.js";
import { initAccordion } from "./components/accordion.js";
import { initTabs } from "./components/tabs.js";
import { initCodeBlocks } from "./components/code-block.js";
import { initExpandableSurfaces } from "./components/expandable-surface.js";
import { showBanner, hideBanner } from "./components/banner.js";
import {
  flashTooltip,
  showPersistentTooltip,
  dismissPersistentTooltip,
} from "./components/tooltip.js";
import { initFileDropzone } from "./components/file-dropzone.js";
import { initFileDownload } from "./components/file-download.js";
import { initDatePicker } from "./components/date-picker/index.js";
import { initSlider } from "./components/slider.js";
import { initStepper } from "./components/stepper.js";
import { initColorPicker } from "./components/color-picker.js";
import { initToggle } from "./components/toggle.js";
import { initTriStateCheckbox } from "./components/checkbox.js";
import { initSegmentedControl } from "./components/segmented-control.js";
import { initPagination } from "./components/pagination.js";
import { initProgressBar } from "./components/progress-bar.js";
import { initSpinner } from "./components/spinner.js";
import { initProgressIndicator } from "./components/progress-indicator.js";
import { initRichTextEditor } from "./components/rich-text-editor.js";
import { initTable } from "./components/table.js";
import { initTabularInput } from "./components/tabular-input.js";
import { initBadge } from "./components/badge.js";
import { initChipGroup, initChipInput } from "./components/chip.js";

initShell();
initExpands(document);
initTabs(document);
const codeBlockInstances = initCodeBlocks(document);
initExpandableSurfaces(document);

const demoCodeBlock = codeBlockInstances[0] ?? null;

initSegmentedControl(document.getElementById("demo-code-mode"), {
  onChange: ({ value }) => {
    demoCodeBlock?.setMode(value);
  },
});

initSegmentedControl(document.getElementById("demo-code-toolbar"), {
  onChange: ({ value }) => {
    demoCodeBlock?.setToolbarPosition(value);
  },
});

const fileDropzoneSingleResult = document.getElementById("demo-file-dropzone-single-result");
const fileDropzoneMultiResult = document.getElementById("demo-file-dropzone-multi-result");
const demoRadioGroup = document.getElementById("demo-radio-group");
const demoRadioResult = document.getElementById("demo-radio-result");
const demoCheckboxGroup = document.getElementById("demo-checkbox-group");
const demoCheckboxResult = document.getElementById("demo-checkbox-result");
const fileDownloadResult = document.getElementById("demo-file-download-result");
const demoAccordionResult = document.getElementById("demo-accordion-result");
const demoDatePickerResult = document.getElementById("demo-date-picker-result");
const demoDatePickerTimeResult = document.getElementById("demo-date-picker-time-result");
const demoSliderResult = document.getElementById("demo-slider-result");
const demoStepperResult = document.getElementById("demo-stepper-result");
const demoColorPickerResult = document.getElementById("demo-color-picker-result");
const demoToggleResult = document.getElementById("demo-toggle-result");
const demoSegmentedViewResult = document.getElementById("demo-segmented-view-result");
const demoSegmentedPanelsResult = document.getElementById("demo-segmented-panels-result");
const demoPaginationResult = document.getElementById("demo-pagination-result");
const demoTableResult = document.getElementById("demo-table-result");
const demoTabularInputResult = document.getElementById("demo-tabular-input-result");
const demoProgressBarResult = document.getElementById("demo-progress-bar-result");
const demoSpinnerResult = document.getElementById("demo-spinner-result");
const demoProgressIndicatorResult = document.getElementById("demo-progress-indicator-result");
const demoProgressIndicatorVerticalResult = document.getElementById("demo-progress-indicator-vertical-result");
const demoRichTextResult = document.getElementById("demo-rich-text-result");

const demoRichTextEditor = initRichTextEditor(
  document.getElementById("demo-rich-text-editor-block")
);

document.getElementById("demo-rich-text-get-markdown")?.addEventListener("click", () => {
  if (!demoRichTextResult || !demoRichTextEditor) return;
  const markdown = demoRichTextEditor.getMarkdown();
  demoRichTextResult.textContent = markdown
    ? `Markdown (${markdown.length} chars): ${markdown.slice(0, 120)}${markdown.length > 120 ? "…" : ""}`
    : "Markdown is empty.";
});

document.getElementById("demo-rich-text-get-html")?.addEventListener("click", () => {
  if (!demoRichTextResult || !demoRichTextEditor) return;
  const html = demoRichTextEditor.getHTML();
  demoRichTextResult.textContent = html
    ? `HTML (${html.length} chars): ${html.slice(0, 120)}${html.length > 120 ? "…" : ""}`
    : "HTML is empty.";
});

function buildDemoTextFile(title) {
  return [
    title,
    "================",
    "",
    "Generated by the microapp template demo.",
    `Created: ${new Date().toLocaleString()}`,
    "",
    "Replace this with your own export logic.",
  ].join("\n");
}

function formatFileDropzoneResult(files) {
  if (!files.length) return "No files selected.";
  return files.map((file) => file.name).join(", ");
}

initFileDropzone(document.getElementById("demo-file-dropzone-single"), {
  onFiles: ({ files }) => {
    if (!fileDropzoneSingleResult) return;
    fileDropzoneSingleResult.textContent = files.length
      ? `Selected: ${files[0].name}`
      : "No file selected.";
  },
  onClear: () => {
    if (fileDropzoneSingleResult) {
      fileDropzoneSingleResult.textContent = "No file selected.";
    }
  },
});

initFileDropzone(document.getElementById("demo-file-dropzone-multi"), {
  onFiles: ({ files }) => {
    if (fileDropzoneMultiResult) {
      fileDropzoneMultiResult.textContent = formatFileDropzoneResult(files);
    }
  },
  onError: ({ message }) => {
    if (fileDropzoneMultiResult) {
      fileDropzoneMultiResult.textContent = message;
    }
  },
  onClear: () => {
    if (fileDropzoneMultiResult) {
      fileDropzoneMultiResult.textContent = "No files selected.";
    }
  },
});

initFileDownload(document.getElementById("demo-file-download"), {
  files: [
    {
      filename: "hello.txt",
      getContent: () => buildDemoTextFile("Hello"),
    },
    {
      filename: "notes.txt",
      getContent: () => buildDemoTextFile("Notes"),
    },
    {
      filename: "summary.txt",
      getContent: () => buildDemoTextFile("Summary"),
    },
  ],
  onDownload: ({ filename, size }) => {
    if (fileDownloadResult) {
      fileDownloadResult.textContent = `Downloaded ${filename} (${size} B).`;
    }
  },
});

initDatePicker(document.getElementById("demo-date-picker"), {
  onChange: ({ display }) => {
    if (demoDatePickerResult) {
      demoDatePickerResult.textContent = display || "No date selected.";
    }
  },
});

initDatePicker(document.getElementById("demo-date-picker-time"), {
  onChange: ({ display }) => {
    if (demoDatePickerTimeResult) {
      demoDatePickerTimeResult.textContent = display || "No date or time selected.";
    }
  },
});

function updateSliderResult() {
  if (!demoSliderResult) return;
  const integer = document.getElementById("demo-slider-integer");
  const decimal = document.getElementById("demo-slider-decimal");
  const percentage = document.getElementById("demo-slider-percentage");
  const parts = [
    integer ? `Integer: ${integer.querySelector(".slider-value")?.value ?? "—"}` : null,
    decimal ? `Decimal: ${decimal.querySelector(".slider-value")?.value ?? "—"}` : null,
    percentage ? `Percentage: ${percentage.querySelector(".slider-value")?.value ?? "—"}%` : null,
  ].filter(Boolean);
  demoSliderResult.textContent = parts.join(" · ");
}

const sliderOnChange = () => updateSliderResult();

initSlider(document.getElementById("demo-slider-integer"), { onChange: sliderOnChange });
initSlider(document.getElementById("demo-slider-decimal"), { onChange: sliderOnChange });
initSlider(document.getElementById("demo-slider-percentage"), { onChange: sliderOnChange });
initSlider(document.getElementById("demo-slider-disabled"));
updateSliderResult();

function updateStepperResult() {
  if (!demoStepperResult) return;
  const integer = document.getElementById("demo-stepper");
  const decimal = document.getElementById("demo-stepper-decimal");
  const parts = [
    integer ? `Integer: ${integer.querySelector(".stepper-value")?.value ?? "—"}` : null,
    decimal ? `Decimal: ${decimal.querySelector(".stepper-value")?.value ?? "—"}` : null,
  ].filter(Boolean);
  demoStepperResult.textContent = parts.join(" · ");
}

const stepperOnChange = () => updateStepperResult();

initStepper(document.getElementById("demo-stepper"), { onChange: stepperOnChange });
initStepper(document.getElementById("demo-stepper-decimal"), { onChange: stepperOnChange });
updateStepperResult();

function updateColorPickerResult() {
  if (!demoColorPickerResult) return;
  const withDefault = document.getElementById("demo-color-picker");
  const empty = document.getElementById("demo-color-picker-empty");
  const defaultValue = withDefault?.querySelector(".color-picker-value")?.value;
  const emptyValue = empty?.querySelector(".color-picker-value")?.value;
  demoColorPickerResult.textContent = [
    `Colour: ${defaultValue || "—"}`,
    `Empty: ${emptyValue || "—"}`,
  ].join(" · ");
}

const colorPickerOnChange = () => updateColorPickerResult();

initColorPicker(document.getElementById("demo-color-picker"), { onChange: colorPickerOnChange });
initColorPicker(document.getElementById("demo-color-picker-empty"), { onChange: colorPickerOnChange });
updateColorPickerResult();

const demoProgressIndicatorLabels = ["Account", "Settings", "Review"];
const demoProgressIndicatorVerticalLabels = ["Details", "Options", "Confirm"];

function wireProgressIndicatorDemo(el, resultEl, labels, finishMessage) {
  initProgressIndicator(el, {
    onChange: ({ index }) => {
      if (!resultEl) return;
      const label = labels[index] ?? `Step ${index + 1}`;
      resultEl.textContent = `Step ${index + 1} of ${labels.length}: ${label}`;
    },
    onFinish: () => {
      if (resultEl) resultEl.textContent = finishMessage;
    },
  });
}

wireProgressIndicatorDemo(
  document.getElementById("demo-progress-indicator"),
  demoProgressIndicatorResult,
  demoProgressIndicatorLabels,
  "Finished on Review."
);
wireProgressIndicatorDemo(
  document.getElementById("demo-progress-indicator-vertical"),
  demoProgressIndicatorVerticalResult,
  demoProgressIndicatorVerticalLabels,
  "Finished on Confirm."
);

initAccordion(document.getElementById("demo-accordion"), {
  onToggle: ({ trigger, isOpen }) => {
    if (!demoAccordionResult) return;
    const label = trigger.querySelector(".accordion-label")?.textContent?.trim();
    if (isOpen && label) {
      demoAccordionResult.textContent = `Open: ${label}`;
      return;
    }
    const accordion = document.getElementById("demo-accordion");
    const openLabel = accordion?.querySelector(".accordion-item.is-open .accordion-label")?.textContent?.trim();
    demoAccordionResult.textContent = openLabel ? `Open: ${openLabel}` : "All sections collapsed.";
  },
});

demoRadioGroup?.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "radio") return;

  const label = input.closest("label")?.querySelector("span")?.textContent?.trim();
  if (demoRadioResult) {
    demoRadioResult.textContent = label ? `Selected: ${label}` : `Selected: ${input.value}`;
  }
});

function checkboxStateLabel(input) {
  const label =
    input.closest("label")?.querySelector("span")?.textContent?.trim() || input.value;
  if (input.indeterminate || input.getAttribute("aria-checked") === "mixed") {
    return `${label} (mixed)`;
  }
  if (input.checked) return label;
  return null;
}

function updateCheckboxResult() {
  if (!demoCheckboxGroup || !demoCheckboxResult) return;

  const selected = [...demoCheckboxGroup.querySelectorAll(".checkbox-input:not(:disabled)")]
    .map(checkboxStateLabel)
    .filter(Boolean);

  demoCheckboxResult.textContent = selected.length
    ? `Selected: ${selected.join(", ")}`
    : "Selected: none";
}

demoCheckboxGroup?.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
  updateCheckboxResult();
});

initTriStateCheckbox(document.getElementById("demo-checkbox-tristate"), {
  onChange: () => updateCheckboxResult(),
});
updateCheckboxResult();

function toggleValueLabel(value) {
  if (value === "true") return "on";
  if (value === "mixed") return "mixed";
  return "off";
}

function updateToggleResult() {
  if (!demoToggleResult) return;
  const off = document.getElementById("demo-toggle-off");
  const on = document.getElementById("demo-toggle-on");
  const tri = document.getElementById("demo-toggle-tristate");
  const parts = [
    off ? `Notifications: ${toggleValueLabel(off.querySelector(".toggle-value")?.value)}` : null,
    on ? `Preview: ${toggleValueLabel(on.querySelector(".toggle-value")?.value)}` : null,
    tri ? `Tri-state: ${toggleValueLabel(tri.querySelector(".toggle-value")?.value)}` : null,
  ].filter(Boolean);
  demoToggleResult.textContent = parts.join(" · ");
}

const toggleOnChange = () => updateToggleResult();

initToggle(document.getElementById("demo-toggle-off"), { onChange: toggleOnChange });
initToggle(document.getElementById("demo-toggle-on"), { onChange: toggleOnChange });
initToggle(document.getElementById("demo-toggle-tristate"), { onChange: toggleOnChange });
initToggle(document.getElementById("demo-toggle-disabled"));
updateToggleResult();

initSegmentedControl(document.getElementById("demo-segmented-view"), {
  onChange: ({ value }) => {
    if (demoSegmentedViewResult) {
      demoSegmentedViewResult.textContent = `View: ${value}`;
    }
  },
});

const demoChipFiltersResult = document.getElementById("demo-chip-filters-result");
const demoChipFilterResults = document.getElementById("demo-chip-filter-results");
const demoChipInputResult = document.getElementById("demo-chip-input-result");

function syncChipFilterList(values) {
  if (!demoChipFilterResults) return;
  const selected = new Set(values);
  const items = [...demoChipFilterResults.querySelectorAll("[data-chip-category]")];
  let visible = 0;
  for (const item of items) {
    const show = selected.size === 0 || selected.has(item.dataset.chipCategory);
    item.hidden = !show;
    if (show) visible += 1;
  }
  if (demoChipFiltersResult) {
    demoChipFiltersResult.textContent =
      selected.size === 0
        ? `Showing all ${items.length} items`
        : `Showing ${visible} of ${items.length} · Filters: ${[...selected].join(", ")}`;
  }
}

initChipGroup(document.getElementById("demo-chip-filters"), {
  onChange: ({ values }) => syncChipFilterList(values),
});
syncChipFilterList(
  [...document.querySelectorAll("#demo-chip-filters .chip[aria-pressed='true']")].map(
    (chip) => chip.dataset.chipValue
  )
);

function updateChipInputResult(values) {
  if (!demoChipInputResult) return;
  demoChipInputResult.textContent = values.length
    ? `Active filters: ${values.join(", ")}`
    : "Active filters: none";
}

initChipInput(document.getElementById("demo-chip-input"), {
  onChange: ({ values }) => updateChipInputResult(values),
});
updateChipInputResult(
  (document.querySelector("#demo-chip-input .chip-input-value")?.value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
);

initSegmentedControl(document.getElementById("demo-segmented-panels"), {
  onChange: ({ value }) => {
    if (demoSegmentedPanelsResult) {
      demoSegmentedPanelsResult.textContent = `Range: ${value}`;
    }
  },
});

initPagination(document.getElementById("demo-pagination"), {
  onChange: ({ page, pageCount }) => {
    if (demoPaginationResult) {
      demoPaginationResult.textContent = `Page ${page} of ${pageCount}`;
    }
  },
});

initTable(document.getElementById("demo-table"), {
  onSort: ({ columnIndex, direction, sortType }) => {
    if (!demoTableResult) return;
    demoTableResult.textContent = `Sorted column ${columnIndex + 1} (${sortType}, ${direction}).`;
  },
  onSelectionChange: ({ selectedIds }) => {
    if (!demoTableResult) return;
    demoTableResult.textContent = selectedIds.length
      ? `Selected: ${selectedIds.join(", ")}`
      : "No rows selected.";
  },
});

function formatTabularInputResult(columns, rows, source) {
  const types = columns.map((col) => col.type).join(", ");
  return `${columns.length} columns (${types}) · ${rows.length} rows · ${source}`;
}

initTabularInput(document.getElementById("demo-tabular-input"), {
  columns: [
    { id: "name", label: "Name", type: "text" },
    { id: "sku", label: "SKU", type: "text" },
    { id: "qty", label: "Qty", type: "number" },
    { id: "price", label: "Price", type: "number" },
    { id: "category", label: "Category", type: "text" },
    { id: "location", label: "Location", type: "text" },
    { id: "supplier", label: "Supplier", type: "text" },
    { id: "active", label: "Active", type: "logical" },
  ],
  rows: [
    {
      id: "r1",
      cells: {
        name: "Widget",
        sku: "W-100",
        qty: 12,
        price: 9.5,
        category: "Parts",
        location: "A1",
        supplier: "Acme",
        active: true,
      },
    },
    {
      id: "r2",
      cells: {
        name: "Gadget",
        sku: "G-200",
        qty: 3,
        price: 24,
        category: "Tools",
        location: "B2",
        supplier: "Globex",
        active: false,
      },
    },
    {
      id: "r3",
      cells: {
        name: "Doohickey",
        sku: "D-300",
        qty: 7,
        price: 15.25,
        category: "Parts",
        location: "A3",
        supplier: "Acme",
        active: true,
      },
    },
    {
      id: "r4",
      cells: {
        name: "Thingamajig",
        sku: "T-400",
        qty: 1,
        price: 42,
        category: "Kits",
        location: "C1",
        supplier: "Initech",
        active: false,
      },
    },
    {
      id: "r5",
      cells: {
        name: "Whatsit",
        sku: "W-500",
        qty: 24,
        price: 3.75,
        category: "Parts",
        location: "B4",
        supplier: "Globex",
        active: true,
      },
    },
  ],
  onChange: ({ columns, rows, source }) => {
    if (!demoTabularInputResult) return;
    demoTabularInputResult.textContent = formatTabularInputResult(columns, rows, source);
  },
});

let demoProgressBar;
let demoProgressBarPercent;
let demoProgressBarFraction;
let demoProgressBarError;
let demoProgressBarDisabled;

function updateProgressBarResult() {
  if (!demoProgressBarResult) return;
  const bar = demoProgressBar?.getPercent();
  const percent = demoProgressBarPercent?.getPercent();
  const fractionValue = demoProgressBarFraction?.getValue();
  const fractionMax = demoProgressBarFraction?.getMax();
  const errorPercent = demoProgressBarError?.getPercent();
  const errorStuck = demoProgressBarError?.isError();
  const disabledPercent = demoProgressBarDisabled?.getPercent();
  demoProgressBarResult.textContent = [
    bar !== undefined ? `Bar: ${Math.round(bar)}%` : null,
    percent !== undefined ? `Percent: ${Math.round(percent)}%` : null,
    fractionValue !== undefined && fractionMax !== undefined
      ? `Fraction: ${Math.round(fractionValue)}/${Math.round(fractionMax)}`
      : null,
    errorPercent !== undefined
      ? `Error: ${Math.round(errorPercent)}%${errorStuck ? " (stuck)" : ""}`
      : null,
    disabledPercent !== undefined ? `Disabled: ${Math.round(disabledPercent)}%` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const progressBarOnChange = () => updateProgressBarResult();

demoProgressBar = initProgressBar(document.getElementById("demo-progress-bar"), {
  onChange: progressBarOnChange,
});
demoProgressBarPercent = initProgressBar(document.getElementById("demo-progress-bar-percent"), {
  onChange: progressBarOnChange,
});
demoProgressBarFraction = initProgressBar(document.getElementById("demo-progress-bar-fraction"), {
  onChange: progressBarOnChange,
});
demoProgressBarError = initProgressBar(document.getElementById("demo-progress-bar-error"), {
  onChange: progressBarOnChange,
});
demoProgressBarDisabled = initProgressBar(document.getElementById("demo-progress-bar-disabled"), {
  onChange: progressBarOnChange,
});
updateProgressBarResult();

document.getElementById("demo-progress-bar-advance")?.addEventListener("click", () => {
  demoProgressBar?.setValue(Math.min(100, (demoProgressBar.getValue() ?? 0) + 10));
  demoProgressBarPercent?.setValue(Math.min(100, (demoProgressBarPercent.getValue() ?? 0) + 8));
  demoProgressBarFraction?.setValue(Math.min(12, (demoProgressBarFraction.getValue() ?? 0) + 1));
});

document.getElementById("demo-progress-bar-reset")?.addEventListener("click", () => {
  demoProgressBar?.setValue(40);
  demoProgressBarPercent?.setValue(75);
  demoProgressBarFraction?.setValue(7);
  demoProgressBarError?.setValue(55);
  demoProgressBarError?.setError(true);
  demoProgressBarDisabled?.setValue(30);
  demoProgressBarDisabled?.setDisabled(true);
});

let demoSpinnerInline;
const demoSpinnerHost = initSpinner(document.getElementById("demo-spinner-host"), {
  onChange: ({ visible }) => {
    if (demoSpinnerResult) {
      demoSpinnerResult.textContent = visible ? "Loading panel…" : "Panel ready.";
    }
  },
});

demoSpinnerInline = initSpinner(document.getElementById("demo-spinner-inline"), {
  visible: false,
});

document.getElementById("demo-spinner-toggle")?.addEventListener("click", () => {
  demoSpinnerInline?.toggle();
});

document.getElementById("demo-spinner-load")?.addEventListener("click", () => {
  if (demoSpinnerHost?.isVisible()) return;
  demoSpinnerHost?.show();
  window.setTimeout(() => {
    demoSpinnerHost?.hide();
  }, 2000);
});

const comboResultEl = document.getElementById("demo-combo-result");
const comboboxResultEl = document.getElementById("demo-combobox-result");
const dropdownResultEl = document.getElementById("demo-dropdown-result");
const dropdownIconsResultEl = document.getElementById("demo-dropdown-icons-result");
const toggleDropdownResultEl = document.getElementById("demo-toggle-dropdown-result");

const comboOptions = [
  { value: "example-1", label: "Example 1" },
  { value: "example-2", label: "Example 2" },
  { value: "example-3", label: "Example 3" },
];

function pickRandomOption(options, excludeValue) {
  const pool = excludeValue
    ? options.filter((option) => option.value !== excludeValue)
    : options;
  if (!pool.length) return options[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

let lastComboValue = null;

initCombobox(document.getElementById("demo-combobox"), {
  onSelect: ({ value, label }) => {
    if (comboboxResultEl) {
      comboboxResultEl.textContent = `Selected: ${label} (${value})`;
    }
  },
  onChange: ({ value, label }) => {
    if (!comboboxResultEl) return;
    comboboxResultEl.textContent = value ? `Selected: ${label} (${value})` : "No city selected.";
  },
});

initCombo(document.getElementById("demo-combo"), {
  onMainClick: () => {
    const picked = pickRandomOption(comboOptions, lastComboValue);
    lastComboValue = picked.value;
    if (comboResultEl) {
      comboResultEl.textContent = `Main action picked: ${picked.label}`;
    }
  },
  onSelect: ({ label, value }) => {
    lastComboValue = value;
    if (comboResultEl) {
      comboResultEl.textContent = `Menu selected: ${label}`;
    }
  },
});

initDropdown(document.getElementById("demo-dropdown"), {
  onSelect: ({ label }) => {
    if (dropdownResultEl) {
      dropdownResultEl.textContent = `Selected: ${label}`;
    }
  },
});

initDropdown(document.getElementById("demo-dropdown-icons"), {
  onSelect: ({ label }) => {
    if (dropdownIconsResultEl) {
      dropdownIconsResultEl.textContent = `Selected: ${label}`;
    }
  },
});

initToggleDropdown(document.getElementById("demo-toggle-dropdown"), {
  onToggle: ({ label, selected, labels }) => {
    if (!toggleDropdownResultEl) return;
    const state = selected ? "on" : "off";
    const summary = labels.length ? labels.join(", ") : "none";
    toggleDropdownResultEl.textContent = `Toggled ${label} ${state}. Selected: ${summary}`;
  },
});

const iconToggleBtn = document.getElementById("icon-toggle-btn");
if (iconToggleBtn) {
  iconToggleBtn.addEventListener("click", () => {
    const pressed = iconToggleBtn.getAttribute("aria-pressed") === "true";
    iconToggleBtn.setAttribute("aria-pressed", pressed ? "false" : "true");
  });
}

document.getElementById("demo-tooltip-flash-success")?.addEventListener("click", (e) => {
  const btn = e.currentTarget;
  if (!(btn instanceof HTMLElement)) return;
  flashTooltip(btn, { text: "Copied", tone: "success" });
});

document.getElementById("demo-tooltip-flash-error")?.addEventListener("click", (e) => {
  const btn = e.currentTarget;
  if (!(btn instanceof HTMLElement)) return;
  flashTooltip(btn, { text: "Failed to copy", tone: "error" });
});

/** @type {string | null} */
let demoPersistentTipId = null;
const demoPersistentTarget = document.getElementById("demo-tooltip-persistent-dismiss");

document.getElementById("demo-tooltip-persistent")?.addEventListener("click", () => {
  if (!(demoPersistentTarget instanceof HTMLElement)) return;
  if (demoPersistentTipId) {
    dismissPersistentTooltip(demoPersistentTipId);
  }
  demoPersistentTipId = showPersistentTooltip(demoPersistentTarget, {
    text: "Click this button to dismiss",
    tone: "info",
  });
});

demoPersistentTarget?.addEventListener("click", () => {
  if (demoPersistentTipId) {
    dismissPersistentTooltip(demoPersistentTipId);
    demoPersistentTipId = null;
  }
});

const demoBadge = initBadge(document.getElementById("demo-badge-host"));
document.getElementById("demo-badge-btn")?.addEventListener("click", () => {
  demoBadge?.increment();
});

const demoBadgeDot = initBadge(document.getElementById("demo-badge-dot-host"), {
  value: true,
});
document.getElementById("demo-badge-dot-btn")?.addEventListener("click", () => {
  const on = demoBadgeDot?.getValue();
  demoBadgeDot?.setValue(!on);
});

const sectionToggleBtn = document.getElementById("demo-section-toggle");
if (sectionToggleBtn) {
  sectionToggleBtn.addEventListener("click", () => {
    const pressed = sectionToggleBtn.getAttribute("aria-pressed") === "true";
    sectionToggleBtn.setAttribute("aria-pressed", pressed ? "false" : "true");
  });
}

initToggle(document.getElementById("demo-section-switch"));

const demoStickyChromeResult = document.getElementById("demo-sticky-chrome-result");

function updateStickyChromeResult() {
  if (!demoStickyChromeResult) return;
  const headerOn = document.documentElement.hasAttribute("data-sticky-header");
  const sectionsOn = document.documentElement.hasAttribute("data-sticky-section-headings");
  demoStickyChromeResult.textContent = `Header: ${headerOn ? "on" : "off"} · Section headings: ${
    sectionsOn ? "on" : "off"
  }`;
}

initToggle(document.getElementById("demo-sticky-header"), {
  onChange: ({ checked }) => {
    setStickyHeader(checked);
    updateStickyChromeResult();
  },
});

initToggle(document.getElementById("demo-sticky-section-headings"), {
  onChange: ({ checked }) => {
    setStickySectionHeadings(checked);
    updateStickyChromeResult();
  },
});

const sectionInput = document.getElementById("demo-section-input");
const sectionSuccessBanner = document.getElementById("demo-section-success");
const sectionErrorBanner = document.getElementById("demo-section-error");

document.getElementById("demo-section-submit")?.addEventListener("click", () => {
  const hasText = Boolean(sectionInput?.value.trim());

  hideBanner(sectionSuccessBanner);
  hideBanner(sectionErrorBanner);

  if (hasText) {
    showBanner(sectionSuccessBanner);
  } else {
    showBanner(sectionErrorBanner);
  }
});

initDialog({
  dialogEl: document.getElementById("info-dialog"),
  openTriggers: "#open-info-dialog",
});

const confirmDialog = initDialog({
  dialogEl: document.getElementById("confirm-dialog"),
  openTriggers: "#open-confirm-dialog",
});

document.getElementById("confirm-dialog-ok")?.addEventListener("click", () => {
  confirmDialog?.closeDialog();
});

const bannerIds = [
  "demo-important-banner",
  "demo-info-banner",
  "demo-success-banner",
  "demo-note-banner",
  "demo-warning-banner",
  "demo-error-banner",
];

const bannerToggles = [
  ["toggle-important-banner", "demo-important-banner"],
  ["toggle-info-banner", "demo-info-banner"],
  ["toggle-success-banner", "demo-success-banner"],
  ["toggle-note-banner", "demo-note-banner"],
  ["toggle-warning-banner", "demo-warning-banner"],
  ["toggle-error-banner", "demo-error-banner"],
];

const bannerTriggers = [
  ["trigger-note-banner", "demo-note-banner"],
  ["trigger-info-banner", "demo-info-banner"],
  ["trigger-success-banner", "demo-success-banner"],
  ["trigger-important-banner", "demo-important-banner"],
  ["trigger-warning-banner", "demo-warning-banner"],
  ["trigger-error-banner", "demo-error-banner"],
];

const BANNER_TRIGGER_EXPIRE_MS = 3000;

function isBannerHidden(bannerEl) {
  return bannerEl.classList.contains("hidden") || bannerEl.hidden;
}

function getBannerElements() {
  return bannerIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);
}

for (const [buttonId, bannerId] of bannerToggles) {
  document.getElementById(buttonId)?.addEventListener("click", () => {
    const bannerEl = document.getElementById(bannerId);
    if (!bannerEl) return;
    if (isBannerHidden(bannerEl)) {
      showBanner(bannerEl);
    } else {
      hideBanner(bannerEl);
    }
  });
}

for (const [buttonId, bannerId] of bannerTriggers) {
  document.getElementById(buttonId)?.addEventListener("click", () => {
    const bannerEl = document.getElementById(bannerId);
    if (!bannerEl) return;
    showBanner(bannerEl, { expire: BANNER_TRIGGER_EXPIRE_MS });
  });
}

document.getElementById("toggle-all-banners")?.addEventListener("click", () => {
  const banners = getBannerElements();
  const anyVisible = banners.some((banner) => !isBannerHidden(banner));
  const hideAll = anyVisible;

  for (const banner of banners) {
    if (hideAll) {
      hideBanner(banner);
    } else {
      showBanner(banner);
    }
  }
});
