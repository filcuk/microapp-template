/**
 * Tabular input — editable grid with typed columns (text / number / logical),
 * addable and deletable rows and columns, and inline column renaming.
 *
 * Markup:
 *   <div class="tabular-input" id="my-grid" aria-label="Inventory"></div>
 *
 * data-tabular-input-disabled — disable the grid
 *
 * Seed via init options:
 *   initTabularInput(el, {
 *     columns: [{ id?, label, type }],
 *     rows: [{ id?, cells: { [columnId]: value } }],
 *     disabled?,
 *     onChange?,
 *   })
 *
 * Layout: row delete on the right (trailing column); column menu (type +
 * remove) on the column label; Add column in the header after the last
 * column; Add row in a footer row under the data.
 *
 * Paste: Excel/TSV clipboard paste expands from the focused body cell
 * (fallback top-left), overwrites that rectangle, auto-detects column types.
 * Reset (header): blank 3 text columns × 2 rows.
 */

import { parseBooleanAttr, setHidden, getFocusableElements, FOCUSABLE_SELECTOR } from "../utils/dom.js";
import { createIcon } from "../utils/icons.js";
import { initPopupMenu } from "../utils/menu.js";
import { initDialog } from "./dialog.js";

/** @typedef {"text" | "number" | "logical"} ColumnType */
/** @typedef {{ id: string, label: string, type: ColumnType }} Column */
/** @typedef {{ id: string, cells: Record<string, string | number | boolean | null> }} Row */

const COLUMN_TYPES = new Set(["text", "number", "logical"]);

const TYPE_OPTIONS = [
  ["text", "Text"],
  ["number", "Number"],
  ["logical", "Logical"],
];

/** @param {ColumnType | string} type */
function typeIconId(type) {
  return `type-${parseColumnType(type)}`;
}

/** Display label for a column type (`Text` / `Number` / `Logical`). */
function typeLabel(type) {
  const normalized = parseColumnType(type);
  const match = TYPE_OPTIONS.find(([value]) => value === normalized);
  return match ? match[1] : "Text";
}

/**
 * Normalize a column type string. Unknown values become `"text"`.
 * @param {unknown} raw
 * @returns {ColumnType}
 */
export function parseColumnType(raw) {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return COLUMN_TYPES.has(value) ? /** @type {ColumnType} */ (value) : "text";
}

/**
 * Default empty cell value for a column type.
 * @param {ColumnType} type
 * @returns {string | number | boolean | null}
 */
export function defaultValueForType(type) {
  if (type === "logical") return false;
  if (type === "number") return null;
  return "";
}

/**
 * Coerce a cell value to the target column type.
 * @param {unknown} value
 * @param {ColumnType} type
 * @returns {string | number | boolean | null}
 */
export function coerceCellValue(value, type) {
  const target = parseColumnType(type);

  if (target === "text") {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "true" : "false";
    return String(value);
  }

  if (target === "number") {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "boolean") return value ? 1 : 0;
    const parsed = Number(String(value).trim().replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  // logical
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0 && Number.isFinite(value);
  if (value === null || value === undefined) return false;
  const text = String(value).trim().toLowerCase();
  if (!text) return false;
  if (["true", "1", "yes", "y", "on"].includes(text)) return true;
  if (["false", "0", "no", "n", "off"].includes(text)) return false;
  return Boolean(text);
}

const LOGICAL_TRUE = new Set(["true", "1", "yes", "y", "on"]);
const LOGICAL_FALSE = new Set(["false", "0", "no", "n", "off"]);

/**
 * Whether a raw clipboard/cell string parses as a finite number.
 * @param {unknown} value
 */
export function isNumericCellValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  const text = String(value).trim();
  if (!text) return false;
  return Number.isFinite(Number(text.replace(/,/g, "")));
}

/**
 * Whether a raw value is a clear logical token (non-empty).
 * @param {unknown} value
 */
export function isLogicalCellValue(value) {
  if (typeof value === "boolean") return true;
  if (value === null || value === undefined) return false;
  const text = String(value).trim().toLowerCase();
  if (!text) return false;
  return LOGICAL_TRUE.has(text) || LOGICAL_FALSE.has(text);
}

/**
 * Infer column type from a list of cell values (empties ignored).
 * @param {unknown[]} values
 * @returns {ColumnType}
 */
export function detectColumnType(values) {
  const nonEmpty = (values ?? []).filter((value) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
  });
  if (!nonEmpty.length) return "text";
  if (nonEmpty.every(isNumericCellValue)) return "number";
  if (nonEmpty.every(isLogicalCellValue)) return "logical";
  return "text";
}

/**
 * Parse Excel-style TSV clipboard text into a rectangular string matrix.
 * @param {string} text
 * @returns {string[][]}
 */
export function parseClipboardTable(text) {
  let normalized = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (normalized.endsWith("\n")) {
    normalized = normalized.slice(0, -1);
  }
  if (!normalized) return [[""]];

  const rows = normalized.split("\n").map((line) => line.split("\t"));
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => {
    const next = row.slice();
    while (next.length < width) next.push("");
    return next;
  });
}

/**
 * True when clipboard text looks like a multi-cell table (TSV / multi-line).
 * @param {string} text
 */
export function isTabularClipboardText(text) {
  const value = String(text ?? "");
  if (!value) return false;
  if (value.includes("\t")) return true;
  return /[\r\n]/.test(value);
}

function resolveDisabled(rootEl, disabledOption) {
  if (typeof disabledOption === "boolean") return disabledOption;
  return parseBooleanAttr(rootEl?.dataset.tabularInputDisabled) ?? false;
}

function createIdFactory() {
  let seq = 0;
  return (prefix) => {
    seq += 1;
    return `${prefix}-${seq}`;
  };
}

/**
 * @param {unknown} columns
 * @param {(prefix: string) => string} nextId
 * @returns {Column[]}
 */
function normalizeColumns(columns, nextId) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return [{ id: nextId("col"), label: "Column 1", type: "text" }];
  }
  return columns.map((col, index) => {
    const raw = col && typeof col === "object" ? col : {};
    const id =
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : nextId("col");
    const label =
      typeof raw.label === "string" && raw.label.trim()
        ? raw.label.trim()
        : `Column ${index + 1}`;
    return { id, label, type: parseColumnType(raw.type) };
  });
}

/**
 * @param {unknown} rows
 * @param {Column[]} columns
 * @param {(prefix: string) => string} nextId
 * @returns {Row[]}
 */
function normalizeRows(rows, columns, nextId) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [
      {
        id: nextId("row"),
        cells: Object.fromEntries(
          columns.map((col) => [col.id, defaultValueForType(col.type)])
        ),
      },
    ];
  }
  return rows.map((row) => {
    const raw = row && typeof row === "object" ? row : {};
    const id =
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : nextId("row");
    const cells = {};
    const source =
      raw.cells && typeof raw.cells === "object" && !Array.isArray(raw.cells)
        ? raw.cells
        : {};
    for (const col of columns) {
      cells[col.id] =
        col.id in source
          ? coerceCellValue(source[col.id], col.type)
          : defaultValueForType(col.type);
    }
    return { id, cells };
  });
}

/**
 * @param {HTMLElement | null} rootEl
 */
export function initTabularInput(
  rootEl,
  { columns: columnsOption, rows: rowsOption, disabled, onChange } = {}
) {
  if (!rootEl) return null;

  const nextId = createIdFactory();
  let isDisabled = resolveDisabled(rootEl, disabled);
  /** @type {Column[]} */
  let columns = normalizeColumns(columnsOption, nextId);
  /** @type {Row[]} */
  let rows = normalizeRows(rowsOption, columns, nextId);

  /** @type {Map<string, string>} */
  const renameDrafts = new Map();
  /** @type {{ destroy: () => void }[]} */
  let typeMenus = [];

  const wrapEl = document.createElement("div");
  wrapEl.className = "table-wrap tabular-input-wrap";

  const tableEl = document.createElement("table");
  tableEl.className = "table table--compact tabular-input-table";

  const theadEl = document.createElement("thead");
  const tbodyEl = document.createElement("tbody");
  tableEl.append(theadEl, tbodyEl);
  wrapEl.append(tableEl);

  const addRowBtn = document.createElement("button");
  addRowBtn.type = "button";
  addRowBtn.className = "btn btn-icon tabular-input-add-row";
  addRowBtn.setAttribute("aria-label", "Add row");
  addRowBtn.dataset.tooltip = "Add row";
  addRowBtn.append(createIcon("plus", { className: "btn-icon-svg" }));

  const addColBtn = document.createElement("button");
  addColBtn.type = "button";
  addColBtn.className = "btn btn-icon tabular-input-add-column";
  addColBtn.setAttribute("aria-label", "Add column");
  addColBtn.dataset.tooltip = "Add column";
  addColBtn.append(createIcon("plus", { className: "btn-icon-svg" }));

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "btn btn-icon tabular-input-reset";
  resetBtn.setAttribute("aria-label", "Reset table");
  resetBtn.dataset.tooltip = "Reset table";
  resetBtn.append(createIcon("delete", { className: "btn-icon-svg" }));

  const liveEl = document.createElement("div");
  liveEl.className = "tabular-input-live";
  liveEl.setAttribute("aria-live", "polite");

  rootEl.replaceChildren(wrapEl, liveEl);
  rootEl.classList.add("tabular-input");

  const resetDialogTitleId = `tabular-input-reset-title-${nextId("dlg")}`;
  const resetDialogEl = document.createElement("div");
  resetDialogEl.className = "modal tabular-input-reset-dialog hidden";
  resetDialogEl.setAttribute("role", "dialog");
  resetDialogEl.setAttribute("aria-modal", "true");
  resetDialogEl.setAttribute("aria-labelledby", resetDialogTitleId);
  resetDialogEl.hidden = true;

  const resetBackdrop = document.createElement("div");
  resetBackdrop.className = "modal-backdrop";
  resetBackdrop.dataset.dialogClose = "";

  const resetPanel = document.createElement("div");
  resetPanel.className = "modal-panel";

  const resetHeader = document.createElement("div");
  resetHeader.className = "modal-header";
  const resetTitle = document.createElement("h2");
  resetTitle.id = resetDialogTitleId;
  resetTitle.textContent = "Reset table?";
  const resetCloseBtn = document.createElement("button");
  resetCloseBtn.type = "button";
  resetCloseBtn.className = "modal-close";
  resetCloseBtn.setAttribute("aria-label", "Close");
  resetCloseBtn.dataset.dialogClose = "";
  resetCloseBtn.textContent = "×";
  resetHeader.append(resetTitle, resetCloseBtn);

  const resetBody = document.createElement("div");
  resetBody.className = "modal-body";
  const resetMessage = document.createElement("p");
  resetMessage.textContent =
    "This clears all data and restores a blank table with 3 text columns and 2 rows. This cannot be undone.";
  resetBody.append(resetMessage);

  const resetFooter = document.createElement("div");
  resetFooter.className = "modal-footer";
  const resetActions = document.createElement("div");
  resetActions.className = "modal-footer-actions";
  const resetCancelBtn = document.createElement("button");
  resetCancelBtn.type = "button";
  resetCancelBtn.className = "btn";
  resetCancelBtn.dataset.dialogClose = "";
  resetCancelBtn.textContent = "Cancel";
  const resetConfirmBtn = document.createElement("button");
  resetConfirmBtn.type = "button";
  resetConfirmBtn.className = "btn btn-danger";
  resetConfirmBtn.textContent = "Reset table";
  resetActions.append(resetCancelBtn, resetConfirmBtn);
  resetFooter.append(resetActions);

  resetPanel.append(resetHeader, resetBody, resetFooter);
  resetDialogEl.append(resetBackdrop, resetPanel);
  document.body.append(resetDialogEl);

  const resetDialog = initDialog({ dialogEl: resetDialogEl });

  function snapshot() {
    return {
      columns: columns.map((col) => ({ ...col })),
      rows: rows.map((row) => ({
        id: row.id,
        cells: { ...row.cells },
      })),
    };
  }

  function emit(source) {
    const data = snapshot();
    onChange?.({
      rootEl,
      columns: data.columns,
      rows: data.rows,
      source,
    });
  }

  function announce(message) {
    liveEl.textContent = "";
    // Force a live region update when the same message repeats.
    requestAnimationFrame(() => {
      liveEl.textContent = message;
    });
  }

  function syncDisabled() {
    rootEl.classList.toggle("tabular-input--disabled", isDisabled);
    addRowBtn.disabled = isDisabled;
    addColBtn.disabled = isDisabled;
    resetBtn.disabled = isDisabled;
  }

  /**
   * @param {Column} column
   * @param {Row} row
   * @param {number} rowIndex
   */
  function createCellControl(column, row, rowIndex) {
    const value = row.cells[column.id];

    if (column.type === "logical") {
      const label = document.createElement("label");
      label.className = "checkbox tabular-input-logical";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "checkbox-input";
      input.checked = Boolean(value);
      input.disabled = isDisabled;
      input.setAttribute(
        "aria-label",
        `${column.label}, row ${rowIndex + 1}`
      );
      input.dataset.tabularInputCell = "";
      input.dataset.rowId = row.id;
      input.dataset.columnId = column.id;

      input.addEventListener("change", () => {
        if (isDisabled) return;
        row.cells[column.id] = input.checked;
        emit("input");
      });

      label.append(input);
      return label;
    }

    const input = document.createElement("input");
    input.className = "input tabular-input-cell";
    input.disabled = isDisabled;
    input.dataset.tabularInputCell = "";
    input.dataset.rowId = row.id;
    input.dataset.columnId = column.id;
    input.setAttribute("aria-label", `${column.label}, row ${rowIndex + 1}`);

    if (column.type === "number") {
      input.type = "number";
      input.inputMode = "decimal";
      input.value = value === null || value === undefined ? "" : String(value);
      input.classList.add("tabular-input-cell--number");
    } else {
      input.type = "text";
      input.value = value === null || value === undefined ? "" : String(value);
    }

    input.addEventListener("input", () => {
      if (isDisabled) return;
      if (column.type === "number") {
        if (input.value.trim() === "") {
          row.cells[column.id] = null;
        } else {
          const parsed = Number(input.value);
          if (Number.isFinite(parsed)) {
            row.cells[column.id] = parsed;
          }
        }
      } else {
        row.cells[column.id] = input.value;
      }
      emit("input");
    });

    input.addEventListener("blur", () => {
      if (isDisabled || column.type !== "number") return;
      const next = coerceCellValue(input.value, "number");
      const previous = row.cells[column.id];
      row.cells[column.id] = next;
      input.value = next === null ? "" : String(next);
      if (previous !== next) emit("input");
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      const nextRow = rows[rowIndex + 1];
      if (!nextRow) return;
      const next = tbodyEl.querySelector(
        `[data-row-id="${CSS.escape(nextRow.id)}"][data-column-id="${CSS.escape(column.id)}"]`
      );
      if (next instanceof HTMLElement) next.focus();
    });

    return input;
  }

  /**
   * @param {Column} column
   */
  function createHeaderCell(column) {
    const th = document.createElement("th");
    th.scope = "col";
    th.className = "tabular-input-col-header";
    th.dataset.columnId = column.id;

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "tabular-input-col-label";
    labelInput.value = column.label;
    labelInput.disabled = isDisabled;
    labelInput.setAttribute("aria-label", "Column name");
    labelInput.dataset.tabularInputRename = "";
    labelInput.dataset.columnId = column.id;

    labelInput.addEventListener("focus", () => {
      renameDrafts.set(column.id, column.label);
    });

    labelInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        const previous = renameDrafts.get(column.id) ?? column.label;
        labelInput.value = previous;
        labelInput.blur();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        labelInput.blur();
      }
    });

    labelInput.addEventListener("blur", () => {
      if (isDisabled) return;
      const previous = renameDrafts.get(column.id) ?? column.label;
      const next = labelInput.value.trim() || previous;
      labelInput.value = next;
      renameDrafts.delete(column.id);
      if (next === column.label) return;
      column.label = next;
      emit("rename");
      announce(`Column renamed to ${next}`);
      tbodyEl
        .querySelectorAll(`[data-column-id="${CSS.escape(column.id)}"]`)
        .forEach((el, index) => {
          if (el instanceof HTMLElement) {
            el.setAttribute("aria-label", `${column.label}, row ${index + 1}`);
          }
        });
      const typeTrigger = th.querySelector(".tabular-input-type-trigger");
      if (typeTrigger) {
        typeTrigger.setAttribute("aria-label", `Options for ${column.label}`);
        typeTrigger.dataset.tooltip = `${typeLabel(column.type)} type`;
      }
      const removeBtn = th.querySelector("[data-tabular-input-remove-column]");
      if (removeBtn) {
        removeBtn.setAttribute("aria-label", `Delete column ${column.label}`);
      }
    });

    const menuId = `tabular-input-col-menu-${column.id}`;

    const typeTrigger = document.createElement("button");
    typeTrigger.type = "button";
    typeTrigger.className = "tabular-input-type-trigger dropdown-trigger";
    typeTrigger.disabled = isDisabled;
    typeTrigger.setAttribute("aria-label", `Options for ${column.label}`);
    typeTrigger.dataset.tooltip = `${typeLabel(column.type)} type`;
    typeTrigger.setAttribute("aria-haspopup", "menu");
    typeTrigger.setAttribute("aria-expanded", "false");
    typeTrigger.setAttribute("aria-controls", menuId);
    typeTrigger.dataset.columnId = column.id;
    typeTrigger.append(
      createIcon(typeIconId(column.type), {
        className: "tabular-input-type-current-icon",
      }),
      createIcon("chevron-down", { className: "tabular-input-type-icon" })
    );

    const typeMenu = document.createElement("ul");
    typeMenu.id = menuId;
    typeMenu.className = "dropdown-menu tabular-input-type-menu hidden";
    typeMenu.setAttribute("role", "menu");
    setHidden(typeMenu, true);

    const typeGroupLi = document.createElement("li");
    typeGroupLi.setAttribute("role", "presentation");
    const typeGroup = document.createElement("div");
    typeGroup.className = "dropdown-menu-group";
    typeGroup.textContent = "Type";
    typeGroupLi.append(typeGroup);
    typeMenu.append(typeGroupLi);

    for (const [value, text] of TYPE_OPTIONS) {
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      const item = document.createElement("button");
      item.type = "button";
      item.className = "dropdown-menu-item tabular-input-type-item";
      item.setAttribute("role", "menuitem");
      item.dataset.value = value;
      item.append(
        createIcon(typeIconId(value), {
          className: "tabular-input-type-item-icon",
        })
      );
      const label = document.createElement("span");
      label.className = "tabular-input-type-item-label";
      label.textContent = text;
      item.append(label);
      if (value === column.type) item.classList.add("is-selected");
      li.append(item);
      typeMenu.append(li);
    }

    const columnGroupLi = document.createElement("li");
    columnGroupLi.setAttribute("role", "presentation");
    const columnGroup = document.createElement("div");
    columnGroup.className = "dropdown-menu-group";
    columnGroup.textContent = "Column";
    columnGroupLi.append(columnGroup);
    typeMenu.append(columnGroupLi);

    const removeLi = document.createElement("li");
    removeLi.setAttribute("role", "none");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className =
      "dropdown-menu-item tabular-input-type-item tabular-input-remove-column";
    removeBtn.setAttribute("role", "menuitem");
    removeBtn.dataset.value = "remove-column";
    removeBtn.dataset.tabularInputRemoveColumn = "";
    removeBtn.setAttribute("aria-label", `Delete column ${column.label}`);
    removeBtn.append(
      createIcon("remove", { className: "tabular-input-type-item-icon" })
    );
    const removeLabel = document.createElement("span");
    removeLabel.className = "tabular-input-type-item-label";
    removeLabel.textContent = "Remove";
    removeBtn.append(removeLabel);
    removeLi.append(removeBtn);
    typeMenu.append(removeLi);

    const typeSlot = document.createElement("div");
    typeSlot.className = "tabular-input-type-slot dropdown";
    typeSlot.append(typeTrigger, typeMenu);

    const typeMenuApi = initPopupMenu({
      containerEl: typeSlot,
      menuEl: typeMenu,
      toggleEl: typeTrigger,
      itemSelector: ".dropdown-menu-item",
      onSelect: ({ value }) => {
        if (isDisabled) return;
        if (value === "remove-column") {
          removeColumn(column.id, { source: "remove-column" });
          return;
        }
        const nextType = parseColumnType(value);
        if (nextType === column.type) return;
        column.type = nextType;
        for (const row of rows) {
          row.cells[column.id] = coerceCellValue(row.cells[column.id], nextType);
        }
        render();
        emit("type-change");
        announce(`Column ${column.label} type set to ${nextType}`);
      },
    });
    if (typeMenuApi) {
      typeMenus.push(typeMenuApi);
      // Close sibling column menus before this one toggles (only one open at a time).
      typeTrigger.addEventListener(
        "click",
        () => {
          for (const menu of typeMenus) {
            if (menu !== typeMenuApi) menu.closeMenu();
          }
        },
        true
      );
    }

    const field = document.createElement("div");
    field.className = "tabular-input-col-field";
    field.append(labelInput, typeSlot);
    th.append(field);
    return th;
  }

  function createRowActionsHeader() {
    const actionsTh = document.createElement("th");
    actionsTh.scope = "col";
    actionsTh.className = "tabular-input-row-move-col";
    actionsTh.append(resetBtn);
    return actionsTh;
  }

  function createTrailingHeader() {
    const th = document.createElement("th");
    th.scope = "col";
    th.className = "tabular-input-trailing-col";
    th.append(addColBtn);
    return th;
  }

  function createRowMoveCell(row, rowIndex) {
    const td = document.createElement("td");
    td.className = "tabular-input-row-move-col";

    const split = document.createElement("div");
    split.className = "tabular-input-row-move";
    split.setAttribute("role", "group");
    split.setAttribute("aria-label", `Move row ${rowIndex + 1}`);

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "tabular-input-row-move-btn";
    upBtn.tabIndex = -1;
    upBtn.dataset.tabularInputChrome = "";
    upBtn.setAttribute("aria-label", `Move row ${rowIndex + 1} up`);
    upBtn.disabled = isDisabled || rowIndex === 0;
    upBtn.append(
      createIcon("chevron-up", { className: "tabular-input-row-move-icon" })
    );
    upBtn.addEventListener("click", () => {
      moveRow(row.id, { delta: -1, source: "move-row" });
    });

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "tabular-input-row-move-btn";
    downBtn.tabIndex = -1;
    downBtn.dataset.tabularInputChrome = "";
    downBtn.setAttribute("aria-label", `Move row ${rowIndex + 1} down`);
    downBtn.disabled = isDisabled || rowIndex >= rows.length - 1;
    downBtn.append(
      createIcon("chevron-down", { className: "tabular-input-row-move-icon" })
    );
    downBtn.addEventListener("click", () => {
      moveRow(row.id, { delta: 1, source: "move-row" });
    });

    split.append(upBtn, downBtn);
    td.append(split);
    return td;
  }

  function createTrailingRemoveCell(row, rowIndex) {
    const td = document.createElement("td");
    td.className = "tabular-input-trailing-col";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-icon tabular-input-remove-row";
    removeBtn.tabIndex = -1;
    removeBtn.dataset.tabularInputChrome = "";
    removeBtn.disabled = isDisabled;
    removeBtn.setAttribute("aria-label", `Delete row ${rowIndex + 1}`);
    removeBtn.dataset.tooltip = "Remove row";
    removeBtn.append(createIcon("remove", { className: "btn-icon-svg" }));
    removeBtn.addEventListener("click", () => {
      removeRow(row.id, { source: "remove-row" });
    });

    td.append(removeBtn);
    return td;
  }

  function createTrailingSpacerCell() {
    const td = document.createElement("td");
    td.className = "tabular-input-trailing-col";
    return td;
  }

  function createAddRowFooter() {
    const tr = document.createElement("tr");
    tr.className = "tabular-input-add-row-tr";

    const lead = document.createElement("td");
    lead.className = "tabular-input-row-move-col";

    const cell = document.createElement("td");
    cell.className = "tabular-input-add-row-cell";
    cell.colSpan = Math.max(columns.length, 1);
    cell.append(addRowBtn);

    tr.append(lead, cell, createTrailingSpacerCell());
    return tr;
  }

  function render() {
    for (const menu of typeMenus) menu.destroy();
    typeMenus = [];
    syncDisabled();
    theadEl.replaceChildren();
    tbodyEl.replaceChildren();

    const headerRow = document.createElement("tr");
    headerRow.append(createRowActionsHeader());
    for (const column of columns) {
      headerRow.append(createHeaderCell(column));
    }
    headerRow.append(createTrailingHeader());
    theadEl.append(headerRow);

    rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      tr.dataset.rowId = row.id;
      tr.append(createRowMoveCell(row, rowIndex));

      for (const column of columns) {
        const td = document.createElement("td");
        if (column.type === "number") td.classList.add("table-num");
        if (column.type === "logical") {
          td.classList.add("tabular-input-logical-cell");
        }
        td.append(createCellControl(column, row, rowIndex));
        tr.append(td);
      }

      tr.append(createTrailingRemoveCell(row, rowIndex));
      tbodyEl.append(tr);
    });

    tbodyEl.append(createAddRowFooter());
  }

  function addRow({ emitEvent = true, source = "add-row" } = {}) {
    if (isDisabled) return null;
    const row = {
      id: nextId("row"),
      cells: Object.fromEntries(
        columns.map((col) => [col.id, defaultValueForType(col.type)])
      ),
    };
    rows.push(row);
    render();
    if (emitEvent) {
      emit(source);
      announce("Row added");
    }
    return row.id;
  }

  function removeRow(rowId, { emitEvent = true, source = "remove-row" } = {}) {
    if (isDisabled) return;
    const next = rows.filter((row) => row.id !== rowId);
    if (next.length === rows.length) return;
    rows = next;
    render();
    if (emitEvent) {
      emit(source);
      announce("Row deleted");
    }
  }

  function moveRow(
    rowId,
    { delta = 0, toIndex, emitEvent = true, source = "move-row" } = {}
  ) {
    if (isDisabled) return;
    const fromIndex = rows.findIndex((row) => row.id === rowId);
    if (fromIndex < 0) return;
    const targetIndex =
      typeof toIndex === "number" ? toIndex : fromIndex + Number(delta);
    if (
      !Number.isInteger(targetIndex) ||
      targetIndex < 0 ||
      targetIndex >= rows.length ||
      targetIndex === fromIndex
    ) {
      return;
    }
    const next = rows.slice();
    const [row] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, row);
    rows = next;
    render();
    if (emitEvent) {
      emit(source);
      announce(`Row moved to position ${targetIndex + 1}`);
    }
  }

  function addColumn(
    { label, type } = {},
    { emitEvent = true, source = "add-column" } = {}
  ) {
    if (isDisabled) return null;
    const column = {
      id: nextId("col"),
      label:
        typeof label === "string" && label.trim()
          ? label.trim()
          : `Column ${columns.length + 1}`,
      type: parseColumnType(type),
    };
    columns.push(column);
    for (const row of rows) {
      row.cells[column.id] = defaultValueForType(column.type);
    }
    render();
    if (emitEvent) {
      emit(source);
      announce(`Column ${column.label} added`);
    }
    return column.id;
  }

  function removeColumn(
    columnId,
    { emitEvent = true, source = "remove-column" } = {}
  ) {
    if (isDisabled) return;
    const column = columns.find((col) => col.id === columnId);
    if (!column) return;
    columns = columns.filter((col) => col.id !== columnId);
    for (const row of rows) {
      delete row.cells[columnId];
    }
    render();
    if (emitEvent) {
      emit(source);
      announce(`Column ${column.label} deleted`);
    }
  }

  function renameColumn(
    columnId,
    label,
    { emitEvent = true, source = "rename" } = {}
  ) {
    if (isDisabled) return;
    const column = columns.find((col) => col.id === columnId);
    if (!column) return;
    const next =
      typeof label === "string" && label.trim() ? label.trim() : column.label;
    if (next === column.label) return;
    column.label = next;
    render();
    if (emitEvent) emit(source);
  }

  function setColumnType(
    columnId,
    type,
    { emitEvent = true, source = "type-change" } = {}
  ) {
    if (isDisabled) return;
    const column = columns.find((col) => col.id === columnId);
    if (!column) return;
    const nextType = parseColumnType(type);
    if (nextType === column.type) return;
    column.type = nextType;
    for (const row of rows) {
      row.cells[column.id] = coerceCellValue(row.cells[column.id], nextType);
    }
    render();
    if (emitEvent) emit(source);
  }

  function resetToBlank({ emitEvent = true, source = "reset" } = {}) {
    if (isDisabled) return;
    columns = [
      { id: nextId("col"), label: "Column 1", type: "text" },
      { id: nextId("col"), label: "Column 2", type: "text" },
      { id: nextId("col"), label: "Column 3", type: "text" },
    ];
    rows = [0, 1].map(() => ({
      id: nextId("row"),
      cells: Object.fromEntries(
        columns.map((col) => [col.id, defaultValueForType(col.type)])
      ),
    }));
    render();
    if (emitEvent) {
      emit(source);
      announce("Table reset");
    }
  }

  function onAddRowClick() {
    addRow();
  }

  function onAddColClick() {
    addColumn();
  }

  function onResetClick() {
    if (isDisabled) return;
    resetDialog?.openDialog();
  }

  function onResetConfirmClick() {
    resetToBlank();
    resetDialog?.closeDialog();
  }

  /**
   * Resolve paste origin from the focused body cell, else (0, 0).
   * @returns {{ rowIndex: number, columnIndex: number }}
   */
  function resolvePasteOrigin(event) {
    const target =
      event.target instanceof Element
        ? event.target
        : document.activeElement instanceof Element
          ? document.activeElement
          : null;
    const cell = target?.closest?.("[data-tabular-input-cell]");
    if (!cell || !rootEl.contains(cell)) {
      return { rowIndex: 0, columnIndex: 0 };
    }
    const rowId = cell.dataset.rowId;
    const columnId = cell.dataset.columnId;
    const rowIndex = rows.findIndex((row) => row.id === rowId);
    const columnIndex = columns.findIndex((col) => col.id === columnId);
    return {
      rowIndex: rowIndex >= 0 ? rowIndex : 0,
      columnIndex: columnIndex >= 0 ? columnIndex : 0,
    };
  }

  /**
   * Grow the grid and overwrite cells from an origin with a string matrix.
   * @param {string[][]} matrix
   * @param {{ rowIndex: number, columnIndex: number }} origin
   */
  function applyPasteMatrix(matrix, origin) {
    const pasteRows = matrix.length;
    const pasteCols = matrix[0]?.length ?? 0;
    if (!pasteRows || !pasteCols) return;

    const needCols = origin.columnIndex + pasteCols;
    const needRows = origin.rowIndex + pasteRows;

    while (columns.length < needCols) {
      const column = {
        id: nextId("col"),
        label: `Column ${columns.length + 1}`,
        type: /** @type {ColumnType} */ ("text"),
      };
      columns.push(column);
      for (const row of rows) {
        row.cells[column.id] = defaultValueForType("text");
      }
    }

    while (rows.length < needRows) {
      rows.push({
        id: nextId("row"),
        cells: Object.fromEntries(
          columns.map((col) => [col.id, defaultValueForType(col.type)])
        ),
      });
    }

    for (let r = 0; r < pasteRows; r += 1) {
      const row = rows[origin.rowIndex + r];
      for (let c = 0; c < pasteCols; c += 1) {
        const column = columns[origin.columnIndex + c];
        row.cells[column.id] = matrix[r][c] ?? "";
      }
    }

    for (const column of columns) {
      const values = rows.map((row) => row.cells[column.id]);
      const nextType = detectColumnType(values);
      column.type = nextType;
      for (const row of rows) {
        row.cells[column.id] = coerceCellValue(row.cells[column.id], nextType);
      }
    }
  }

  function onPaste(event) {
    if (isDisabled) return;
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (!isTabularClipboardText(text)) return;
    event.preventDefault();
    const matrix = parseClipboardTable(text);
    const origin = resolvePasteOrigin(event);
    applyPasteMatrix(matrix, origin);
    render();
    emit("paste");
    announce("Pasted table data");
  }

  function isVisibleFocusable(el) {
    return el instanceof HTMLElement && el.offsetParent !== null && !el.closest(".hidden");
  }

  function getPrimaryFocusables() {
    return getFocusableElements(rootEl).filter(
      (el) => !el.closest("[data-tabular-input-chrome]")
    );
  }

  function getChromeFocusables() {
    return [...rootEl.querySelectorAll("[data-tabular-input-chrome]")].filter(
      (el) =>
        el instanceof HTMLElement &&
        !el.disabled &&
        isVisibleFocusable(el)
    );
  }

  function getDocumentTabbables() {
    return [...document.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) =>
      isVisibleFocusable(el)
    );
  }

  function handleTabNavigation(event) {
    if (resetDialog?.isDialogOpen()) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !rootEl.contains(active)) return;

    const primary = getPrimaryFocusables();
    const chrome = getChromeFocusables();
    const inChrome = Boolean(active.closest("[data-tabular-input-chrome]"));

    if (!event.shiftKey) {
      if (
        !inChrome &&
        primary.length &&
        active === primary[primary.length - 1] &&
        chrome.length
      ) {
        event.preventDefault();
        chrome[0].focus();
        return;
      }
      if (inChrome) {
        const idx = chrome.indexOf(active);
        if (idx >= 0 && idx < chrome.length - 1) {
          event.preventDefault();
          chrome[idx + 1].focus();
          return;
        }
        if (idx === chrome.length - 1) {
          event.preventDefault();
          const doc = getDocumentTabbables();
          const lastPrimary = primary[primary.length - 1];
          const start = lastPrimary ? doc.indexOf(lastPrimary) : -1;
          const next = doc.find(
            (el, i) => i > start && !rootEl.contains(el)
          );
          next?.focus();
        }
      }
      return;
    }

    if (inChrome) {
      const idx = chrome.indexOf(active);
      if (idx > 0) {
        event.preventDefault();
        chrome[idx - 1].focus();
        return;
      }
      if (idx === 0 && primary.length) {
        event.preventDefault();
        primary[primary.length - 1].focus();
      }
    }
  }

  function getCellGrid() {
    return rows.map((row) =>
      columns.map((col) =>
        rootEl.querySelector(
          `[data-tabular-input-cell][data-row-id="${CSS.escape(row.id)}"][data-column-id="${CSS.escape(col.id)}"]`
        )
      )
    );
  }

  function handleArrowNavigation(event) {
    if (resetDialog?.isDialogOpen()) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !rootEl.contains(active)) return;

    const cell = active.matches("[data-tabular-input-cell]")
      ? active
      : active.closest("[data-tabular-input-cell]");
    if (!(cell instanceof HTMLElement)) return;

    if (
      active instanceof HTMLInputElement &&
      (active.type === "text" || active.type === "number")
    ) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      const len = active.value.length;
      if (event.key === "ArrowLeft" && (start !== 0 || end !== 0)) return;
      if (event.key === "ArrowRight" && (start !== len || end !== len)) return;
    }

    const grid = getCellGrid();
    let rowIndex = -1;
    let colIndex = -1;
    for (let r = 0; r < grid.length; r += 1) {
      for (let c = 0; c < grid[r].length; c += 1) {
        if (grid[r][c] === cell) {
          rowIndex = r;
          colIndex = c;
        }
      }
    }
    if (rowIndex < 0) return;

    let nextRow = rowIndex;
    let nextCol = colIndex;
    if (event.key === "ArrowLeft") nextCol -= 1;
    else if (event.key === "ArrowRight") nextCol += 1;
    else if (event.key === "ArrowUp") nextRow -= 1;
    else if (event.key === "ArrowDown") nextRow += 1;
    else return;

    if (
      nextRow < 0 ||
      nextCol < 0 ||
      nextRow >= grid.length ||
      nextCol >= (grid[0]?.length ?? 0)
    ) {
      return;
    }

    const next = grid[nextRow][nextCol];
    if (!(next instanceof HTMLElement)) return;
    event.preventDefault();
    next.focus();
    if (
      next instanceof HTMLInputElement &&
      next.type !== "checkbox" &&
      typeof next.setSelectionRange === "function"
    ) {
      const len = next.value.length;
      try {
        next.setSelectionRange(len, len);
      } catch {
        /* number inputs may not support setSelectionRange in all browsers */
      }
    }
  }

  function onRootKeydown(event) {
    if (isDisabled) return;
    if (event.key === "Tab") {
      handleTabNavigation(event);
      return;
    }
    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown"
    ) {
      handleArrowNavigation(event);
    }
  }

  addRowBtn.addEventListener("click", onAddRowClick);
  addColBtn.addEventListener("click", onAddColClick);
  resetBtn.addEventListener("click", onResetClick);
  resetConfirmBtn.addEventListener("click", onResetConfirmClick);
  rootEl.addEventListener("paste", onPaste);
  rootEl.addEventListener("keydown", onRootKeydown);

  render();

  return {
    getData() {
      return snapshot();
    },
    setData(data, { emitEvent = true } = {}) {
      const nextColumns = normalizeColumns(data?.columns, nextId);
      const nextRows = normalizeRows(data?.rows, nextColumns, nextId);
      columns = nextColumns;
      rows = nextRows;
      render();
      if (emitEvent) emit("api");
    },
    addRow(options) {
      return addRow({ ...options, source: options?.source ?? "api" });
    },
    removeRow(rowId, options) {
      removeRow(rowId, { ...options, source: options?.source ?? "api" });
    },
    moveRow(rowId, options) {
      moveRow(rowId, { ...options, source: options?.source ?? "api" });
    },
    addColumn(column, options) {
      return addColumn(column, {
        ...options,
        source: options?.source ?? "api",
      });
    },
    removeColumn(columnId, options) {
      removeColumn(columnId, {
        ...options,
        source: options?.source ?? "api",
      });
    },
    renameColumn(columnId, label, options) {
      renameColumn(columnId, label, {
        ...options,
        source: options?.source ?? "api",
      });
    },
    setColumnType(columnId, type, options) {
      setColumnType(columnId, type, {
        ...options,
        source: options?.source ?? "api",
      });
    },
    reset(options) {
      resetToBlank({ ...options, source: options?.source ?? "api" });
    },
    setDisabled(next) {
      isDisabled = Boolean(next);
      render();
    },
    destroy() {
      for (const menu of typeMenus) menu.destroy();
      typeMenus = [];
      addRowBtn.removeEventListener("click", onAddRowClick);
      addColBtn.removeEventListener("click", onAddColClick);
      resetBtn.removeEventListener("click", onResetClick);
      resetConfirmBtn.removeEventListener("click", onResetConfirmClick);
      rootEl.removeEventListener("paste", onPaste);
      rootEl.removeEventListener("keydown", onRootKeydown);
      resetDialog?.destroy();
      resetDialogEl.remove();
      rootEl.replaceChildren();
      rootEl.classList.remove("tabular-input", "tabular-input--disabled");
    },
  };
}

/** Wire every `.tabular-input` in `root`. */
export function initTabularInputs(root = document) {
  const instances = [];
  root.querySelectorAll(".tabular-input").forEach((el) => {
    const instance = initTabularInput(el);
    if (instance) instances.push(instance);
  });
  return instances;
}
