import { base44 } from "@/api/base44Client";

export const AdService = {
  // Log ad impression
  async logImpression(userId, adType) {
    try {
      await base44.entities.AdAnalytics.create({
        user_id: userId,
        ad_type: adType,
        event_type: "impression",
      });
    } catch (error) {
      console.error("Failed to log ad impression:", error);
    }
  },

  // Log rewarded ad completion
  async logCompletion(userId, adType) {
    try {
      await base44.entities.AdAnalytics.create({
        user_id: userId,
        ad_type: adType,
        event_type: "completion",
      });
    } catch (error) {
      console.error("Failed to log ad completion:", error);
    }
  },

  // Simulate watching a rewarded ad
  async watchRewardedAd() {
    return new Promise((resolve) => {
      // Simulate ad playback (3 seconds)
      setTimeout(() => {
        resolve(true);
      }, 3000);
    });
  },
};