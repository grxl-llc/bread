import React from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, MapPin, Sparkles, Loader2 } from "lucide-react";
import { useRecipeCost } from "@/lib/useRecipeCost";
import { RATING_MAX } from "@/lib/featureConfig";

function StarBadge({ ratingSum, ratingCount }) {
  if (!ratingCount) return null;
  const avg = ratingSum / ratingCount;
  const full = Math.round(avg);
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-yellow-400 leading-none">
      {"★".repeat(Math.min(full, RATING_MAX))}{"☆".repeat(Math.max(0, RATING_MAX - full))}
      <span className="text-[#C4C4BA] ml-0.5">{avg.toFixed(1)}</span>
    </span>
  );
}

export default function RecipeCard({ recipe, onClick, userZip, pantryItems }) {
  const { data: cost, isLoading: costLoading } = useRecipeCost(recipe, userZip, pantryItems);
  // Live cost when we can compute it; fall back to last-known stored cost.
  const liveCost = cost?.total_cost;
  const displayCost = liveCost != null ? liveCost : recipe.total_cost;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(recipe)}
      className="bg-[#1A2744] rounded-2xl overflow-hidden card-glow cursor-pointer"
    >
      <div className="relative aspect-[16/10] bg-[#243352]">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍳</div>
        )}
        {recipe.is_ai_generated && (
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 bg-[#FF6B35]/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[#F5F5F0] text-base mb-2 line-clamp-1">
          {recipe.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-[#C4C4BA]">
          {recipe.cook_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.cook_time}m
            </span>
          )}
          {costLoading && liveCost == null ? (
            <span className="flex items-center gap-1 text-[#34D399]/70">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              pricing…
            </span>
          ) : displayCost > 0 ? (
            <span className="flex items-center gap-1 text-[#34D399]">
              <DollarSign className="w-3.5 h-3.5" />
              ${displayCost?.toFixed(2)}
            </span>
          ) : null}
          {recipe.cheapest_store && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {recipe.cheapest_store}
            </span>
          )}
        </div>

        {/* Star rating — only shown when at least one rating exists */}
        <StarBadge ratingSum={recipe.rating_sum} ratingCount={recipe.rating_count} />
      </div>
    </motion.div>
  );
}
