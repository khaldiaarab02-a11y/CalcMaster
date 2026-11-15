/* ==========================================================================
   CalcMaster Theme Controller (Light / Dark Mode)
   Loads early to apply saved theme without visual flicker.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "calcmaster_theme";

  function getPreferredTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (e) {
      // Ignore storage access errors in restricted browsing modes
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    var toggles = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < toggles.length; i++) {
      var isDark = theme === "dark";
      toggles[i].setAttribute("aria-pressed", String(isDark));
      toggles[i].setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
      toggles[i].setAttribute(
        "title",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Apply immediately before first paint
  var currentTheme = getPreferredTheme();
  document.documentElement.setAttribute("data-theme", currentTheme);

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(document.documentElement.getAttribute("data-theme") || "light");

    var toggles = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener("click", function () {
        var active = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        var next = active === "dark" ? "light" : "dark";
        saveTheme(next);
        applyTheme(next);
      });
    }
  });

  window.CalcMasterTheme = {
    getTheme: function () {
      return document.documentElement.getAttribute("data-theme") || "light";
    },
    setTheme: function (theme) {
      if (theme === "light" || theme === "dark") {
        saveTheme(theme);
        applyTheme(theme);
      }
    }
  };
})();
