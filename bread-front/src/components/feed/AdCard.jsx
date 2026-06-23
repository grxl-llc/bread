import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, GraduationCap } from "lucide-react";
import { useApprovedAds, pickBannerAd } from "@/lib/useApprovedAds";

// House / fallback ad — shown when no live ads are configured yet.
const HOUSE_AD = {
  title: "Don't go from eating all this to eating jail food.",
  description: "Get your court-ordered education done today.",
  cta_label: "fullcirclecourse.org",
  cta_url: "https://fullcirclecourse.org",
  media_url: null,
  advertiser_name: "Full Circle Courses",
};

export default function AdCard({ index = 0 }) {
  const { data: liveAds = [] } = useApprovedAds();
  const liveAd = pickBannerAd(liveAds, index);
  const ad = liveAd || HOUSE_AD;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 bg-[#1A2744] rounded-xl overflow-hidden border border-[#243352] relative"
    >
      <span className="absolute top-1.5 right-2 text-[9px] text-[#C4C4BA]/40 z-10">
        Sponsored
      </span>

      <a
        href={ad.cta_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3"
      >
        {/* Thumbnail / icon */}
        <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-[#FF6B35]/15 flex items-center justify-center">
          {ad.media_url ? (
            <img
              src={ad.media_url}
              alt={ad.advertiser_name || "Ad"}
              className="w-full h-full object-cover"
            />
          ) : (
            <GraduationCap className="w-5 h-5 text-[#FF6B35]" />
          )}
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs font-semibold text-[#F5F5F0] leading-snug line-clamp-2">
            {ad.title}
          </p>
          <p className="text-[11px] text-[#C4C4BA]/60 leading-snug line-clamp-1">
            {ad.description || ad.advertiser_name}
          </p>
        </div>

        {/* CTA arrow */}
        <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-medium text-[#FF6B35] whitespace-nowrap">
          <ExternalLink className="w-3 h-3" />
        </span>
      </a>
    </motion.div>
  );
}
