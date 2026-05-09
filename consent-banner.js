/*
 * babycakes-consent-banner.js — universal CCPA/CPRA-compliant consent banner.
 *
 * Drop-in: include this script + the matching CSS in any HTML site. It will
 *   1. Show a consent banner on first visit (if no decision is recorded)
 *   2. Detect Global Privacy Control (GPC) signal and auto-opt-out
 *   3. Block tracking scripts (Google Analytics, etc.) until consent given
 *   4. Display "Opt-Out Request Honored" confirmation per 2026 CCPA rules
 *   5. Persist choice in localStorage; respect across visits
 *
 * Configure via window.BABYCAKES_CONSENT before loading the script:
 *   window.BABYCAKES_CONSENT = {
 *     siteName: "LPEAI",
 *     privacyUrl: "/privacy",
 *     privacyChoicesUrl: "/privacy-choices",
 *     gaTrackingId: "G-XXXXXXXXXX",  // optional — only if site uses GA
 *   };
 *
 * The site's <head> should include GA via this banner's loadAnalytics() call,
 * NOT directly via gtag.js — otherwise GA fires before consent is checked.
 */

(function () {
  "use strict";

  const cfg = Object.assign(
    {
      siteName: "this site",
      privacyUrl: "/privacy",
      privacyChoicesUrl: "/privacy-choices",
      gaTrackingId: null,
      storageKey: "babycakes-consent-v1",
    },
    window.BABYCAKES_CONSENT || {}
  );

  const STATE_KEY = cfg.storageKey;

  function getStoredState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify(Object.assign({}, state, { recordedAt: new Date().toISOString() }))
      );
    } catch (e) {
      /* ignore */
    }
  }

  function detectGPC() {
    return navigator.globalPrivacyControl === true;
  }

  function loadAnalytics() {
    if (!cfg.gaTrackingId) return;
    if (document.getElementById("babycakes-ga-loader")) return; // already loaded
    const s = document.createElement("script");
    s.id = "babycakes-ga-loader";
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + cfg.gaTrackingId;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.gaTrackingId, { anonymize_ip: true });
  }

  function buildBanner() {
    const banner = document.createElement("div");
    banner.id = "babycakes-consent-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Privacy preferences");
    banner.innerHTML =
      '<div class="bcb-inner">' +
        '<div class="bcb-text">' +
          "<strong>Your privacy choices.</strong> " +
          "We use minimal cookies to operate this site and (optionally) basic, " +
          "anonymized analytics to understand traffic. We do not sell or share your " +
          "personal information. You can accept analytics, reject them, or learn " +
          'more in our <a href="' + cfg.privacyUrl + '">Privacy Policy</a>.' +
        "</div>" +
        '<div class="bcb-actions">' +
          '<button class="bcb-btn bcb-btn-secondary" id="bcb-reject" type="button">Reject analytics</button>' +
          '<button class="bcb-btn bcb-btn-primary" id="bcb-accept" type="button">Accept</button>' +
        "</div>" +
      "</div>";
    return banner;
  }

  function buildToast(message) {
    const t = document.createElement("div");
    t.id = "babycakes-consent-toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    t.textContent = message;
    return t;
  }

  function showToast(message, durationMs) {
    document.querySelectorAll("#babycakes-consent-toast").forEach((n) => n.remove());
    const t = buildToast(message);
    document.body.appendChild(t);
    setTimeout(() => {
      t.classList.add("bcb-toast-fade");
      setTimeout(() => t.remove(), 600);
    }, durationMs || 4000);
  }

  function applyDecision(decision, source) {
    saveState({ decision: decision, source: source || "user" });
    document.querySelectorAll("#babycakes-consent-banner").forEach((n) => n.remove());

    if (decision === "accept") {
      loadAnalytics();
      showToast("Analytics enabled. You can change this anytime in our Privacy Choices.");
    } else {
      // 2026 CCPA — explicit confirmation that opt-out has been processed
      showToast("Opt-Out Request Honored — analytics blocked, no sale or sharing.");
    }
  }

  function init() {
    // Always honor GPC — auto-opt-out, even on first visit
    if (detectGPC()) {
      const state = getStoredState();
      if (!state || state.source !== "gpc") {
        applyDecision("reject", "gpc");
      }
      return; // never show banner if GPC is active
    }

    const state = getStoredState();
    if (state && state.decision) {
      // Already decided — honor the existing choice
      if (state.decision === "accept") loadAnalytics();
      return;
    }

    // First visit, no GPC — show the banner
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", init);
      return;
    }
    const banner = buildBanner();
    document.body.appendChild(banner);
    document.getElementById("bcb-accept").addEventListener("click", function () {
      applyDecision("accept", "user");
    });
    document.getElementById("bcb-reject").addEventListener("click", function () {
      applyDecision("reject", "user");
    });
  }

  // Expose a helper so the privacy-choices page can flip the toggle
  window.babycakesConsent = {
    optOut: function () { applyDecision("reject", "user-privacy-choices"); },
    optIn: function () { applyDecision("accept", "user-privacy-choices"); },
    state: getStoredState,
    isGPCActive: detectGPC,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
