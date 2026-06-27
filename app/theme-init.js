(function () {
  var preference = localStorage.getItem("microapp-theme");
  if (preference !== "light" && preference !== "dark" && preference !== "auto") {
    preference = "auto";
  }

  var dark =
    preference === "dark" ||
    (preference === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePreference = preference;

  var iconLink = document.querySelector("link[data-brand-icon]");
  if (iconLink) {
    iconLink.href = dark ? "app/res/app-dark.svg" : "app/res/app-light.svg";
  }
})();
