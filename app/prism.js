/**
 * Highlight Prism code blocks. Load vendor scripts before calling:
 *   app/vendor/prism/prism.min.js
 *   app/vendor/prism/prism-python.min.js  (or other language components)
 *   app/vendor/prism/prism-line-numbers.min.js
 */
export function initPrism(root = document) {
  if (!window.Prism) return;

  const blocks = root.querySelectorAll('pre code[class*="language-"]');
  for (const block of blocks) {
    window.Prism.highlightElement(block);
  }
}
