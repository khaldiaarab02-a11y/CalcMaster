/* ==========================================================================
   CalcMaster Site Configuration (Stage 9 SEO & Deployment Ready)
   Single-point domain & site configuration for InfinityFree subdomain launch
   and seamless migration to a custom domain without editing 80 HTML files.
   ========================================================================== */
(function (global) {
  "use strict";

  var PLACEHOLDER_BASE_URL = "https://your-subdomain.infinityfreeapp.com";

  var CALCMASTER_CONFIG = {
    siteName: "CalcMaster",
    tagline: "Free Online Calculators for Everyday Life",
    language: "en",
    defaultCurrency: "USD",
    supportedCurrencies: ["USD", "CAD", "GBP", "AUD", "EUR"],

    // HOW TO CONFIGURE AFTER RECEIVING YOUR INFINITYFREE OR CUSTOM DOMAIN:
    // Replace the placeholder URL below with your exact deployed HTTPS origin
    // (no trailing slash), e.g. "https://calcmaster.infinityfreeapp.com" or
    // "https://www.yourdomain.com". Also update sitemap.xml and robots.txt.
    baseUrl: PLACEHOLDER_BASE_URL,

    // AdSense remains inactive until official Google AdSense review & approval.
    // Do NOT add a fake publisher ID. Placeholders reserve CLS-safe layout space only.
    adsense: {
      enabled: false,
      publisherId: ""
    }
  };

  function getResolvedBaseUrl() {
    var configured = String(CALCMASTER_CONFIG.baseUrl || "").trim().replace(/\/+$/, "");
    var isPlaceholder =
      !configured ||
      configured === PLACEHOLDER_BASE_URL ||
      /example\.com/i.test(configured);

    if (!isPlaceholder) {
      return configured;
    }

    if (global.location && global.location.origin && global.location.origin !== "null") {
      return global.location.origin.replace(/\/+$/, "");
    }

    return configured || "";
  }

  function absolutizeRootUrls(node, base) {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        absolutizeRootUrls(node[i], base);
      }
      return node;
    }
    var keys = Object.keys(node);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var val = node[key];
      if ((key === "url" || key === "item" || key === "@id") && typeof val === "string" && val.charAt(0) === "/") {
        node[key] = base + val;
      } else if (val && typeof val === "object") {
        absolutizeRootUrls(val, base);
      }
    }
    return node;
  }

  function syncCanonicalAndOpenGraph() {
    if (typeof document === "undefined" || !global.location) return;
    var base = getResolvedBaseUrl();
    if (!base) return;

    var pathname = global.location.pathname || "/";
    var fullUrl = base + pathname;

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", fullUrl);
    }

    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", fullUrl);
    }

    var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < ldScripts.length; i++) {
      var raw = ldScripts[i].textContent;
      if (!raw || raw.indexOf('"/') === -1) continue;
      try {
        var parsed = JSON.parse(raw);
        absolutizeRootUrls(parsed, base);
        ldScripts[i].textContent = JSON.stringify(parsed);
      } catch (e) {
        // Ignore non-JSON structured data blocks safely
      }
    }
  }

  CALCMASTER_CONFIG.PLACEHOLDER_BASE_URL = PLACEHOLDER_BASE_URL;
  CALCMASTER_CONFIG.getResolvedBaseUrl = getResolvedBaseUrl;
  CALCMASTER_CONFIG.syncCanonicalAndOpenGraph = syncCanonicalAndOpenGraph;

  global.CALCMASTER_CONFIG = CALCMASTER_CONFIG;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", syncCanonicalAndOpenGraph);
    } else {
      syncCanonicalAndOpenGraph();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
