import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Fetches all active approved ads and caches them for 10 minutes.
 * Both AdCard (banners) and RewardedAdModal (video/interstitial) share this cache.
 */
export function useApprovedAds() {
  return useQuery({
    queryKey: ["approved-ads-live"],
    queryFn: () =>
      base44.entities.ApprovedAd.filter({ is_active: true }, "-created_date", 100),
    staleTime: 10 * 60 * 1000, // re-fetch at most every 10 min
    retry: 1,
  });
}

/** Pick a banner ad by rotation index. Returns null if none configured yet. */
export function pickBannerAd(ads = [], index = 0) {
  const banners = ads.filter((a) => a.ad_type === "banner" && a.media_url && a.cta_url);
  if (!banners.length) return null;
  return banners[index % banners.length];
}

/** Pick the best interstitial/rewarded ad. Prefers video, falls back to banner. */
export function pickRewardedAd(ads = []) {
  const videos = ads.filter((a) => a.ad_type === "video" && a.media_url);
  if (videos.length) return videos[Math.floor(Math.random() * videos.length)];
  const banners = ads.filter((a) => a.ad_type === "banner" && a.media_url);
  if (banners.length) return banners[Math.floor(Math.random() * banners.length)];
  return null;
}
