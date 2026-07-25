/** Fork-sensitive defaults — edit when creating your app from this template. */
export const APP_CONFIG = {
  repoUrl: "https://github.com/filcuk/microapp-template",
  brandUrl: "https://github.com/filcuk",
  brandName: "Filcuk",
  themeStorageKey: "microapp-theme",
  themeChangeEvent: "microapp-theme-change",
  /**
   * Related apps shown in the footer “also see” menu.
   * Set to `[]` or `false` to hide the control.
   * Each entry: `{ label, url, subtitle?, icon? | iconLight?, iconDark? }`.
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
