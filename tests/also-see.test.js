import test from "node:test";
import assert from "node:assert/strict";
import {
  alsoSeeHasItems,
  mergeAlsoSeeSections,
  normalizeAlsoSee,
  normalizeSiteUrl,
  renderAlsoSeeMarkup,
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

test("normalizeAlsoSee excludes the current appUrl from flat links", () => {
  const sections = normalizeAlsoSee(
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
    "https://filcuk.github.io/microapp-template",
    ["*"]
  );

  assert.equal(sections.length, 1);
  assert.equal(sections[0].topic, null);
  assert.equal(sections[0].items.length, 1);
  assert.equal(sections[0].items[0].label, "Other");
});

test("normalizeAlsoSee keeps topic sections and drops empty ones after appUrl filter", () => {
  const sections = normalizeAlsoSee(
    [
      {
        topic: "Power BI",
        items: [
          {
            label: "Self",
            url: "https://filcuk.github.io/pbi-tabulator/",
          },
          {
            label: "Other",
            url: "https://filcuk.github.io/pqm-stepper/",
          },
        ],
      },
      {
        topic: "Only self",
        items: [
          {
            label: "Self",
            url: "https://filcuk.github.io/pbi-tabulator/",
          },
        ],
      },
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
    ],
    "https://filcuk.github.io/pbi-tabulator/",
    ["*"]
  );

  assert.equal(sections.length, 2);
  assert.equal(sections[0].topic, "Power BI");
  assert.deepEqual(
    sections[0].items.map((item) => item.label),
    ["Other"]
  );
  assert.equal(sections[1].topic, null);
  assert.equal(sections[1].items[0].label, "Profile");
});

test("normalizeAlsoSee filters topics by whitelist (case-insensitive)", () => {
  const sections = normalizeAlsoSee(
    [
      {
        topic: "Power BI",
        items: [{ label: "A", url: "https://example.com/a" }],
      },
      {
        topic: "Database",
        items: [{ label: "B", url: "https://example.com/b" }],
      },
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
    ],
    "",
    ["power bi"]
  );

  assert.equal(sections.length, 1);
  assert.equal(sections[0].topic, "Power BI");
  assert.equal(sections[0].items[0].label, "A");
});

test("normalizeAlsoSee includes ungrouped links only when \"\" is whitelisted", () => {
  const without = normalizeAlsoSee(
    [
      {
        topic: "Embedded",
        items: [{ label: "A", url: "https://example.com/a" }],
      },
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
    ],
    "",
    ["Embedded"]
  );
  assert.equal(without.length, 1);
  assert.equal(without[0].topic, "Embedded");

  const withUngrouped = normalizeAlsoSee(
    [
      {
        topic: "Embedded",
        items: [{ label: "A", url: "https://example.com/a" }],
      },
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
    ],
    "",
    ["Embedded", ""]
  );
  assert.equal(withUngrouped.length, 2);
  assert.equal(withUngrouped[0].topic, "Embedded");
  assert.equal(withUngrouped[1].topic, null);
  assert.equal(withUngrouped[1].items[0].label, "Profile");
});

test("normalizeAlsoSee \"*\" keeps all topics; empty filter keeps none", () => {
  const data = [
    {
      topic: "Power BI",
      items: [{ label: "A", url: "https://example.com/a" }],
    },
    {
      label: "Profile",
      url: "https://github.com/filcuk",
    },
  ];

  const all = normalizeAlsoSee(data, "", ["*"]);
  assert.equal(all.length, 2);
  assert.equal(all[0].topic, "Power BI");
  assert.equal(all[1].topic, null);

  assert.equal(normalizeAlsoSee(data, "", []).length, 0);
  assert.equal(normalizeAlsoSee(data, "", ["-Power BI"]).length, 0);
});

test("normalizeAlsoSee \"*\" with exclusions drops listed topics", () => {
  const sections = normalizeAlsoSee(
    [
      {
        topic: "Power BI",
        items: [{ label: "A", url: "https://example.com/a" }],
      },
      {
        topic: "Database",
        items: [{ label: "B", url: "https://example.com/b" }],
      },
      {
        topic: "Embedded",
        items: [{ label: "C", url: "https://example.com/c" }],
      },
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
    ],
    "",
    ["*", "-Database", "-power bi"]
  );

  assert.equal(sections.length, 2);
  assert.equal(sections[0].topic, "Embedded");
  assert.equal(sections[1].topic, null);
  assert.equal(sections[1].items[0].label, "Profile");
});

test("normalizeAlsoSee \"-\" excludes ungrouped when using \"*\"", () => {
  const sections = normalizeAlsoSee(
    [
      {
        topic: "Embedded",
        items: [{ label: "A", url: "https://example.com/a" }],
      },
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
    ],
    "",
    ["*", "-"]
  );

  assert.equal(sections.length, 1);
  assert.equal(sections[0].topic, "Embedded");
});

test("normalizeAlsoSee empty topic whitelist keeps nothing", () => {
  const sections = normalizeAlsoSee(
    [
      {
        topic: "Power BI",
        items: [{ label: "A", url: "https://example.com/a" }],
      },
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
    ],
    "",
    []
  );

  assert.equal(sections.length, 0);
});

test("mergeAlsoSeeSections merges matching topics and dedupes by URL", () => {
  const merged = mergeAlsoSeeSections(
    [
      {
        topic: "Embedded",
        items: [
          {
            label: "Remote A",
            subtitle: "",
            url: "https://example.com/a",
            icon: "",
            iconLight: "",
            iconDark: "",
          },
        ],
      },
      {
        topic: null,
        items: [
          {
            label: "Profile",
            subtitle: "",
            url: "https://github.com/filcuk",
            icon: "",
            iconLight: "",
            iconDark: "",
          },
        ],
      },
    ],
    [
      {
        topic: "embedded",
        items: [
          {
            label: "Remote A dup",
            subtitle: "",
            url: "https://example.com/a/",
            icon: "",
            iconLight: "",
            iconDark: "",
          },
          {
            label: "Local B",
            subtitle: "",
            url: "https://example.com/b",
            icon: "",
            iconLight: "",
            iconDark: "",
          },
        ],
      },
      {
        topic: "Examples",
        items: [
          {
            label: "Local C",
            subtitle: "",
            url: "https://example.com/c",
            icon: "",
            iconLight: "",
            iconDark: "",
          },
        ],
      },
    ]
  );

  assert.equal(merged.length, 3);
  assert.equal(merged[0].topic, "Embedded");
  assert.deepEqual(
    merged[0].items.map((item) => item.label),
    ["Remote A", "Local B"]
  );
  assert.equal(merged[1].topic, "Examples");
  assert.equal(merged[1].items[0].label, "Local C");
  assert.equal(merged[2].topic, null);
  assert.equal(merged[2].items[0].label, "Profile");
});

test("normalizeAlsoSee places ungrouped section last", () => {
  const sections = normalizeAlsoSee(
    [
      {
        label: "Profile",
        url: "https://github.com/filcuk",
      },
      {
        topic: "Embedded",
        items: [{ label: "A", url: "https://example.com/a" }],
      },
      {
        label: "Extra",
        url: "https://example.com/extra",
      },
    ],
    "",
    ["*"]
  );

  assert.equal(sections.length, 2);
  assert.equal(sections[0].topic, "Embedded");
  assert.equal(sections[1].topic, null);
  assert.deepEqual(
    sections[1].items.map((item) => item.label),
    ["Profile", "Extra"]
  );
});

test("renderAlsoSeeMarkup emits group headers for topics", () => {
  const markup = renderAlsoSeeMarkup([
    {
      topic: "Database",
      items: [
        {
          label: "CS Builder",
          subtitle: "Zero-knowledge",
          url: "https://example.com/cs",
          icon: "",
          iconLight: "",
          iconDark: "",
        },
      ],
    },
  ]);

  assert.match(markup, /dropdown-menu-group">Database</);
  assert.match(markup, /href="https:\/\/example\.com\/cs"/);
  assert.match(markup, /CS Builder/);
  assert.equal(alsoSeeHasItems([]), false);
  assert.equal(
    alsoSeeHasItems([{ topic: "X", items: [] }]),
    false
  );
});

test("renderAlsoSeeMarkup adds a separator before ungrouped links", () => {
  const markup = renderAlsoSeeMarkup([
    {
      topic: "Database",
      items: [
        {
          label: "CS Builder",
          subtitle: "",
          url: "https://example.com/cs",
          icon: "",
          iconLight: "",
          iconDark: "",
        },
      ],
    },
    {
      topic: null,
      items: [
        {
          label: "Profile",
          subtitle: "",
          url: "https://github.com/filcuk",
          icon: "",
          iconLight: "",
          iconDark: "",
        },
      ],
    },
  ]);

  assert.match(
    markup,
    /dropdown-menu-group">Database[\s\S]*dropdown-menu-separator[\s\S]*Profile/
  );
});

test("normalizeAlsoSee keeps a single icon without inventing a theme pair", () => {
  const sections = normalizeAlsoSee(
    [
      {
        label: "Legacy",
        url: "https://example.com/legacy",
        icon: "https://example.com/icon.svg",
      },
    ],
    "",
    ["*"]
  );

  assert.equal(sections[0].items[0].icon, "https://example.com/icon.svg");
  assert.equal(sections[0].items[0].iconLight, "");
  assert.equal(sections[0].items[0].iconDark, "");
});

test("normalizeAlsoSee prefers iconLight/iconDark theme pair", () => {
  const sections = normalizeAlsoSee(
    [
      {
        label: "Modern",
        url: "https://example.com/modern",
        icon: "https://example.com/ignored.svg",
        iconLight: "https://example.com/app-light.svg",
        iconDark: "https://example.com/app-dark.svg",
      },
    ],
    "",
    ["*"]
  );

  const item = sections[0].items[0];
  assert.equal(item.icon, "");
  assert.equal(item.iconLight, "https://example.com/app-light.svg");
  assert.equal(item.iconDark, "https://example.com/app-dark.svg");
});

test("renderAlsoSeeMarkup uses one img for icon and a pair for light/dark", () => {
  const single = renderAlsoSeeMarkup([
    {
      topic: null,
      items: [
        {
          label: "Single",
          subtitle: "",
          url: "https://example.com/a",
          icon: "https://example.com/icon.svg",
          iconLight: "",
          iconDark: "",
        },
      ],
    },
  ]);
  assert.match(
    single,
    /dropdown-menu-item-icon" src="https:\/\/example\.com\/icon\.svg"/
  );
  assert.doesNotMatch(single, /brand-icon--light/);
  assert.doesNotMatch(single, /brand-icon--dark/);

  const pair = renderAlsoSeeMarkup([
    {
      topic: null,
      items: [
        {
          label: "Pair",
          subtitle: "",
          url: "https://example.com/b",
          icon: "",
          iconLight: "https://example.com/app-light.svg",
          iconDark: "https://example.com/app-dark.svg",
        },
      ],
    },
  ]);
  assert.match(
    pair,
    /brand-icon--light" src="https:\/\/example\.com\/app-light\.svg"/
  );
  assert.match(
    pair,
    /brand-icon--dark" src="https:\/\/example\.com\/app-dark\.svg"/
  );
});
