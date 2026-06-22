/**
 * Google Analytics 4 (GA4) — env-driven.
 *
 * Set VITE_GA4_ID (e.g. "G-XXXXXXXXXX") in the environment to enable. When it's
 * unset (local dev), all of this is a no-op, so analytics only run where you
 * configure them.
 *
 * SPA note: GA4's default page_view only fires on the initial load. Because
 * Bread is a single-page app (react-router), we disable the automatic page_view
 * and send one ourselves on each route change (see NavigationTracker).
 */
// Defaults to the live property; override per-environment with VITE_GA4_ID.
const GA_ID = import.meta.env.VITE_GA4_ID || "G-HFL8WB8MTL";
let initialized = false;

export function initAnalytics() {
  // Only track on the deployed production build — keeps local dev out of GA4.
  if (initialized || !GA_ID || !import.meta.env.PROD || typeof window === "undefined") return;
  initialized = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  // We send page_views manually on route change for accurate SPA tracking.
  gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageView(path) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Optional helper for custom events (e.g. trackEvent("recipe_saved", {...})). */
export function trackEvent(name, params = {}) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
