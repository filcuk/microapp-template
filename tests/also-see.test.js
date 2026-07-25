import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeAlsoSee,
  normalizeSiteUrl,
} from "../app/shell/render-shell.js";

test("normalizeSiteUrl strips trailing slash, query, and hash", () => {
  assert.equal(
    normalizeSiteUrl("https://Example.com/app/?x=1#y"),
    "https://example.com/app"
  );
  assert.equal(
    normalizeSiteUrl("https://example.com/app/"),
    "https://example.com/app"
  );
});

test("normalizeAlsoSee excludes the current appUrl", () => {
  const links = normalizeAlsoSee(
    [
      {
        label: "Self",
        url: "https://filcuk.github.io/microapp-template/",
      },
      {
        label: "Other",
        url: "https://pqms.gh.fitec.dev/",
      },
    ],
    "https://filcuk.github.io/microapp-template"
  );

  assert.equal(links.length, 1);
  assert.equal(links[0].label, "Other");
});
