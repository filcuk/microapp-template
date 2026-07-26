/** Fork-sensitive defaults — edit when creating your app from this template. */
export const APP_CONFIG = {
  /** Public site URL (GitHub Pages / custom domain). Used to hide this app in “also see”. */
  appUrl: "https://filcuk.github.io/microapp-template/",
  repoUrl: "https://github.com/filcuk/microapp-template",
  brandUrl: "https://github.com/filcuk",
  brandName: "Filcuk",
  themeStorageKey: "microapp-theme",
  themeChangeEvent: "microapp-theme-change",
  /**
   * Remote JSON for the footer “also see” menu (array of link objects).
   * Prefer a raw.githubusercontent.com or GitHub Pages URL. Empty = skip fetch.
   * On success, replaces local `alsoSee`. On failure, keeps `alsoSee` as fallback.
   */
  alsoSeeUrl:
    "https://raw.githubusercontent.com/filcuk/shared/refs/heads/main/apps/links/dna.json",
  /**
   * Local related apps (fallback when `alsoSeeUrl` is empty or fetch fails).
   * Set to `[]` or `false` to hide the control when there is no remote list.
   * Each entry: `{ label, url, subtitle?, icon? | iconLight?, iconDark? }`.
   * Icon paths may be local (`app/res/…`) or absolute URLs (e.g. GitHub Pages / raw assets).
   */
  alsoSee: [
    {
      label: "Example App A",
      subtitle: "Sample related microapp",
      url: "https://example.com/app-a",
      iconLight: "app/res/app-light.svg",
      iconDark: "app/res/app-dark.svg",
    },
    {
      label: "Example App B",
      subtitle: "Another demo destination",
      url: "https://example.com/app-b",
      iconLight: "app/res/app-light.svg",
      iconDark: "app/res/app-dark.svg",
    },
    {
      label: "Example App C",
      subtitle: "Third related project",
      url: "https://example.com/app-c",
      iconLight: "app/res/app-light.svg",
      iconDark: "app/res/app-dark.svg",
    },
  ],
};
