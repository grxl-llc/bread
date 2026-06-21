import React from "react";
import { Award, ChefHat, Clock, DollarSign, Users, Utensils, Video } from "lucide-react";

const BADGE_CONFIG = {
  "Rising Chef": {
    icon: ChefHat,
    color: "text-[#FF6B35]",
    bgColor: "bg-[#FF6B35]/10",
    emoji: "👨‍🍳"
  },
  "Meal Prep Pro": {
    icon: Utensils,
    color: "text-[#34D399]",
    bgColor: "bg-[#34D399]/10",
    emoji: "🍱"
  },
  "Budget Master": {
    icon: DollarSign,
    color: "text-[#FBBF24]",
    bgColor: "bg-[#FBBF24]/10",
    emoji: "💰"
  },
  "Quick Cook": {
    icon: Clock,
    color: "text-[#3B82F6]",
    bgColor: "bg-[#3B82F6]/10",
    emoji: "⚡"
  },
  "Community Favorite": {
    icon: Users,
    color: "text-[#EC4899]",
    bgColor: "bg-[#EC4899]/10",
    emoji: "⭐"
  },
  "Creator": {
    icon: Video,
    color: "text-[#FF6B35]",
    bgColor: "bg-gradient-to-r from-[#FF6B35]/20 to-[#FF8555]/20",
    emoji: "🎬"
  },
  "creator": {
    icon: Video,
    color: "text-[#FF6B35]",
    bgColor: "bg-gradient-to-r from-[#FF6B35]/20 to-[#FF8555]/20",
    emoji: "🎬"
  }
};

export default function BadgeDisplay({ badges, compact = false, showTopOnly = false }) {
  if (!badges || badges.length === 0) return null;

  const displayBadges = showTopOnly ? [badges[0]] : badges;

  if (compact) {
    const topBadge = badges[0];
    const config = BADGE_CONFIG[topBadge];
    if (!config) return null;

    return (
      <div className="flex items-center gap-1">
        <span className="text-xs">{config.emoji}</span>
        <span className="text-xs font-medium text-[#C4C4BA]">{topBadge}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayBadges.map((badge) => {
        const config = BADGE_CONFIG[badge];
        if (!config) return null;

        return (
          <div
            key={badge}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor}`}
          >
            <span className="text-sm">{config.emoji}</span>
            <span className={`text-xs font-medium ${config.color}`}>{badge}</span>
          </div>
        );
      })}
    </div>
  );
}