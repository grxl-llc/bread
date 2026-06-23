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
