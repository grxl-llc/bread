/**
 * featureConfig.js — tunable constants for gating and paywall logic.
 *
 * Change these values here to adjust behavior everywhere at once.
 */

// Best Guess recipe ad-gate
// localStorage key prefix: one unlock entry per post ID per browser.
export const AD_UNLOCK_STORAGE_PREFIX = 'bread_guess_unlocked_';

// Public recipe search soft paywall
// Number of recipe detail views a logged-out user gets before being prompted to sign up.
export const FREE_RECIPE_VIEWS = 5;
// localStorage key tracking the anon view count.
export const ANON_RECIPE_VIEW_KEY = 'bread_anon_recipe_views';

// Recipe ratings
export const RATING_MAX = 5;

// Google IMA SDK — rewarded video ad (Best Guess unlock)
// Replace VAST_TAG_URL with your real Google Ad Manager tag once your account is approved.
// The test tag below plays a real Google test ad so you can verify the flow works today.
// Production tag format:
//   https://pubads.g.doubleclick.net/gampad/ads?iu=/NETWORK_CODE/AD_UNIT_PATH&sz=640x480&...
export const VAST_TAG_URL =
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
