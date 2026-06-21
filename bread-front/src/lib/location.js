import { useState, useEffect } from "react";

/**
 * Location resolution for pricing.
 *
 * The app prices groceries by zipcode. A user has a saved home `zipcode`, plus
 * an opt-in `use_live_location` preference. When live location is ON, we use
 * the device's current location (so prices follow them on vacation); when OFF,
 * we use their saved home zip. Live location ALWAYS falls back to the saved zip
 * if permission is denied or lookup fails — pricing never breaks.
 *
 * The resolved live zip is cached in sessionStorage so we only hit geolocation
 * once per browser session, keeping searches instant and avoiding repeat prompts.
 */

const SESSION_KEY = "bread_live_zip";

export function getCachedLiveZip() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
  }
}

function cacheLiveZip(zip) {
  try {
    if (zip) sessionStorage.setItem(SESSION_KEY, zip);
  } catch {
    /* ignore */
  }
}

/**
 * Resolve the device's current zipcode via the Geolocation API + a keyless
 * reverse-geocode. Resolves to a zip string, or null if unavailable.
 */
export function getLiveZip({ force = false } = {}) {
  return new Promise((resolve) => {
    if (!force) {
      const cached = getCachedLiveZip();
      if (cached) return resolve(cached);
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return resolve(null);
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const zip = data?.postcode || null;
          if (zip) cacheLiveZip(zip);
          resolve(zip);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 600000 }
    );
  });
}

/**
 * React hook: returns the zipcode that should be used for pricing right now.
 *
 *   const zip = useEffectiveZip(user);
 *
 * - live location OFF → saved home zip
 * - live location ON  → device zip (falls back to saved zip until/if resolved)
 */
export function useEffectiveZip(user) {
  const savedZip = user?.zipcode || "";
  const wantsLive = !!user?.use_live_location;
  const [liveZip, setLiveZip] = useState(getCachedLiveZip());

  useEffect(() => {
    let cancelled = false;
    if (wantsLive) {
      getLiveZip().then((zip) => {
        if (!cancelled && zip) setLiveZip(zip);
      });
    }
    return () => { cancelled = true; };
  }, [wantsLive]);

  if (wantsLive) return liveZip || savedZip;
  return savedZip;
}
