/** Fork-sensitive defaults — edit when creating your app from this template. */
export const APP_CONFIG = {
  /** Public site URL (GitHub Pages / custom domain). Used to hide this app in “also see”. */
  appUrl: "https://filcuk.github.io/microapp-template/",
  repoUrl: "https://github.com/filcuk/microapp-template",
  themeStorageKey: "microapp-theme",
  themeChangeEvent: "microapp-theme-change",
  /**
   * Remote JSON for the footer “also see” menu.
   * Top-level array of `{ topic, items, order? }` sections and/or flat link objects.
   * Optional `order` on topics/links; `iconSvg` / `iconSvgLight` / `iconSvgDark` for
   * embedded SVG (wins over URL icons). Prefer a raw.githubusercontent.com or
   * GitHub Pages URL. Empty = skip fetch. On success, shows the remote list
   * (merged with local when `alsoSeeIncludeLocal` is true). Local is never used
   * as a fallback.
   */
  alsoSeeUrl:
    "https://raw.githubusercontent.com/filcuk/shared/refs/heads/main/apps/links.json",
  /**
   * Topic filter for the **remote** also-see list (`"*"`, `""`, `"Topic"`,
   * `"-Topic"`). Local `alsoSee` is not filtered when `alsoSeeIncludeLocal`
   * is true. Uncomment one example below.
   */
  alsoSeeTopics: ["*"], // all remote links
  // alsoSeeTopics: [], // no remote links
  // alsoSeeTopics: ["*", "-Power BI"], // all remote except Power BI
  // alsoSeeTopics: ["Embedded", ""], // only Embedded + ungrouped
  /**
   * When true, include local `alsoSee` in full (alone if there is no remote, or
   * merged with the filtered remote — same topic names share one section; items
   * de-duplicated by URL). When false, local is never shown.
   */
  alsoSeeIncludeLocal: true,
  alsoSee: [
    {
      topic: "Examples",
      order: 10,
      items: [
        {
          label: "Example App A",
          subtitle: "Sample related microapp",
          url: "https://example.com/app-a",
          iconLight: "app/res/app-light.svg",
          iconDark: "app/res/app-dark.svg",
          order: 10,
        },
        {
          label: "Example App B",
          subtitle: "Another demo destination",
          url: "https://example.com/app-b",
          iconLight: "app/res/app-light.svg",
          iconDark: "app/res/app-dark.svg",
          order: 20,
        },
      ],
    },
    {
      label: "Example App C",
      subtitle: "Ungrouped related project",
      url: "https://example.com/app-c",
      iconSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 7l10 5 10-5-10-5zm0 7.5L4.5 7 12 3.5 19.5 7 12 9.5zM2 17l10 5 10-5v-2.5l-10 5-10-5V17z"/></svg>',
      order: 10,
    },
  ],
};
