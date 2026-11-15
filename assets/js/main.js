/* ==========================================================================
   CalcMaster Main UI Interactions
   Handles navigation dropdowns, mobile drawer, header search toggle, and FAQs.
   ========================================================================== */
(function () {
  "use strict";

  function initDropdowns() {
    var dropdownButtons = document.querySelectorAll("[data-dropdown-toggle]");
    if (!dropdownButtons.length) return;

    function closeAllDropdowns() {
      for (var i = 0; i < dropdownButtons.length; i++) {
        var btn = dropdownButtons[i];
        var targetId = btn.getAttribute("aria-controls");
        var menu = targetId ? document.getElementById(targetId) : null;
        btn.setAttribute("aria-expanded", "false");
        if (menu) menu.classList.remove("is-open");
      }
    }

    for (var i = 0; i < dropdownButtons.length; i++) {
      (function (btn) {
        var targetId = btn.getAttribute("aria-controls");
        var menu = targetId ? document.getElementById(targetId) : null;
        if (!menu) return;

        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          var isOpen = btn.getAttribute("aria-expanded") === "true";
          closeAllDropdowns();
          if (!isOpen) {
            btn.setAttribute("aria-expanded", "true");
            menu.classList.add("is-open");
          }
        });
      })(dropdownButtons[i]);
    }

    document.addEventListener("click", function (event) {
      var insideDropdown = event.target.closest("[data-dropdown-container]");
      if (!insideDropdown) {
        closeAllDropdowns();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeAllDropdowns();
      }
    });
  }

  function initMobileMenu() {
    var toggleBtn = document.querySelector("[data-mobile-menu-toggle]");
    var drawer = document.getElementById("mobile-nav-drawer");
    if (!toggleBtn || !drawer) return;

    function setDrawerOpen(open) {
      toggleBtn.setAttribute("aria-expanded", String(open));
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    }

    toggleBtn.addEventListener("click", function () {
      var isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
      setDrawerOpen(!isOpen);
    });

    var links = drawer.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        setDrawerOpen(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) {
        setDrawerOpen(false);
        toggleBtn.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 820 && drawer.classList.contains("is-open")) {
        setDrawerOpen(false);
      }
    });
  }

  function initHeaderSearchToggle() {
    var searchToggle = document.querySelector("[data-header-search-toggle]");
    var searchBar = document.getElementById("header-search-bar");
    if (!searchToggle || !searchBar) return;

    var searchInput = searchBar.querySelector("[data-search-input]");

    searchToggle.addEventListener("click", function () {
      var isOpen = searchBar.classList.contains("is-open");
      searchBar.classList.toggle("is-open", !isOpen);
      searchToggle.setAttribute("aria-expanded", String(!isOpen));
      if (!isOpen && searchInput) {
        searchInput.focus();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && searchBar.classList.contains("is-open")) {
        searchBar.classList.remove("is-open");
        searchToggle.setAttribute("aria-expanded", "false");
        searchToggle.focus();
      }
    });
  }

  function initFaqAccordions() {
    var triggers = document.querySelectorAll("[data-faq-trigger]");
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener("click", function () {
        var expanded = this.getAttribute("aria-expanded") === "true";
        var panelId = this.getAttribute("aria-controls");
        var panel = panelId ? document.getElementById(panelId) : null;
        this.setAttribute("aria-expanded", String(!expanded));
        if (panel) {
          panel.hidden = expanded;
        }
      });
    }
  }

  function setFooterYear() {
    var yearEls = document.querySelectorAll("[data-current-year]");
    var year = String(new Date().getFullYear());
    for (var i = 0; i < yearEls.length; i++) {
      yearEls[i].textContent = year;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initDropdowns();
    initMobileMenu();
    initHeaderSearchToggle();
    initFaqAccordions();
    setFooterYear();
  });
})();
