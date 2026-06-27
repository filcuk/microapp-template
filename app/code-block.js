/**
 * Interactive code blocks: optional line numbers, Prism highlight toggle, copy button.
 *
 * Markup:
 *   <div class="code-block" data-code-copy="true">
 *     <div class="code-block-toolbar">…toggles…</div>
 *     <div class="code-block-body">
 *       <button type="button" class="code-block-copy btn">Copy</button>
 *       <pre class="line-numbers language-python"><code>…</code></pre>
 *     </div>
 *   </div>
 *
 * Options via data attributes on `.code-block`:
 *   data-code-copy="false"     — omit copy button behaviour
 *   data-code-line-numbers="false" — start without line numbers
 *   data-code-highlight="false"    — start without highlighting
 *
 * Optional fullscreen: add `data-expandable-surface` on `.code-block` and
 * `data-expandable-surface-trigger` on `.code-block-body`; wire with
 * `initExpandableSurfaces()` from `app/expandable-surface.js`.
 */

const LANGUAGE_RE = /language-([\w-]+)/;

function parseLanguage(codeEl) {
  for (const cls of codeEl.classList) {
    const match = cls.match(LANGUAGE_RE);
    if (match) return match[1];
  }
  return null;
}

function removeLineNumberMarkup(codeEl) {
  codeEl.querySelector(".line-numbers-rows")?.remove();
  codeEl.querySelector(".line-numbers-sizer")?.remove();
}

function getSource(codeEl) {
  return codeEl.dataset.source ?? codeEl.textContent;
}

function setCopyEnabled(container, enabled) {
  const copyBtn = container.querySelector(".code-block-copy");
  if (!copyBtn) return;
  copyBtn.hidden = !enabled;
  copyBtn.disabled = !enabled;
}

function updateLineNumbersToggle(toggle, highlightEnabled) {
  toggle.disabled = !highlightEnabled;
  toggle.setAttribute("aria-disabled", highlightEnabled ? "false" : "true");
}

/**
 * @param {HTMLElement} container
 * @param {{
 *   copyButton?: boolean,
 *   lineNumbers?: boolean,
 *   highlight?: boolean,
 * }} [options]
 */
export function initCodeBlock(container, options = {}) {
  const pre = container.querySelector("pre");
  const code = pre?.querySelector("code");
  if (!pre || !code) return null;

  const copyButton =
    options.copyButton ??
    container.dataset.codeCopy !== "false";
  const lineNumbersDefault =
    options.lineNumbers ??
    container.dataset.codeLineNumbers !== "false";
  const highlightDefault =
    options.highlight ??
    container.dataset.codeHighlight !== "false";

  const language = parseLanguage(code);
  const source = code.textContent;
  code.dataset.source = source;

  let lineNumbersEnabled = lineNumbersDefault;
  let highlightEnabled = highlightDefault;

  const lineNumbersToggle = container.querySelector('[data-code-toggle="line-numbers"]');
  const highlightToggle = container.querySelector('[data-code-toggle="highlight"]');
  const copyBtn = container.querySelector(".code-block-copy");

  setCopyEnabled(container, copyButton);

  function applyLineNumbersClass() {
    pre.classList.toggle("line-numbers", lineNumbersEnabled && highlightEnabled);
  }

  function renderPlain() {
    removeLineNumberMarkup(code);
    pre.className = "";
    code.className = "";
    code.textContent = source;
  }

  function renderHighlighted() {
    if (!window.Prism || !language) {
      renderPlain();
      return;
    }

    removeLineNumberMarkup(code);
    code.textContent = source;
    code.className = `language-${language}`;
    pre.className = `language-${language}`;
    applyLineNumbersClass();
    window.Prism.highlightElement(code);
  }

  function syncToggleStates() {
    lineNumbersToggle?.setAttribute(
      "aria-pressed",
      lineNumbersEnabled ? "true" : "false"
    );
    highlightToggle?.setAttribute(
      "aria-pressed",
      highlightEnabled ? "true" : "false"
    );
    if (lineNumbersToggle) {
      updateLineNumbersToggle(lineNumbersToggle, highlightEnabled);
    }
  }

  function refresh() {
    if (highlightEnabled) {
      renderHighlighted();
    } else {
      renderPlain();
    }
    syncToggleStates();
  }

  lineNumbersToggle?.addEventListener("click", () => {
    if (!highlightEnabled) return;
    lineNumbersEnabled = !lineNumbersEnabled;
    refresh();
  });

  highlightToggle?.addEventListener("click", () => {
    highlightEnabled = !highlightEnabled;
    refresh();
  });

  copyBtn?.addEventListener("click", async () => {
    if (!copyButton || copyBtn.disabled) return;

    try {
      await navigator.clipboard.writeText(source);
      const label = copyBtn.getAttribute("aria-label") || "Copy code";
      copyBtn.textContent = "Copied";
      copyBtn.setAttribute("aria-label", "Copied");
      window.setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.setAttribute("aria-label", label);
      }, 2000);
    } catch {
      copyBtn.textContent = "Failed";
      window.setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 2000);
    }
  });

  refresh();

  return {
    setLineNumbers(enabled) {
      lineNumbersEnabled = enabled;
      refresh();
    },
    setHighlight(enabled) {
      highlightEnabled = enabled;
      refresh();
    },
    getSource: () => source,
  };
}

/** Wire every `.code-block` in `root`. */
export function initCodeBlocks(root = document) {
  const instances = [];
  for (const container of root.querySelectorAll(".code-block")) {
    const instance = initCodeBlock(container);
    if (instance) instances.push(instance);
  }
  return instances;
}
