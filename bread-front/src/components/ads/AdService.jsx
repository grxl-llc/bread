import { base44 } from "@/api/base44Client";

export const AdService = {
  /** Log an ad impression. user_id and post_id are both optional (anon viewers allowed). */
  async logImpression(userId, adType, postId = null) {
    try {
      await base44.entities.AdAnalytics.create({
        user_id: userId || null,
        post_id: postId || null,
        ad_type: adType,
        event_type: "impression",
      });
    } catch (error) {
      // Never let analytics logging break the ad flow.
      console.warn("Ad impression log failed (non-fatal):", error?.message);
    }
  },

  /** Log ad completion. user_id and post_id are both optional. */
  async logCompletion(userId, adType, postId = null) {
    try {
      await base44.entities.AdAnalytics.create({
        user_id: userId || null,
        post_id: postId || null,
        ad_type: adType,
        event_type: "completion",
      });
    } catch (error) {
      console.warn("Ad completion log failed (non-fatal):", error?.message);
    }
  },

  /** Simulate watching a rewarded ad (3 seconds). Returns true on success. */
  async watchRewardedAd() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 3000);
    });
  },
};
