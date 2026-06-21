import React from "react";
import { Activity } from "lucide-react";

export default function NutritionCard({ nutrition, servings = 4 }) {
  if (!nutrition) return null;

  const perServing = {
    calories: Math.round((nutrition.calories || 0) / servings),
    protein: Math.round((nutrition.protein || 0) / servings),
    carbs: Math.round((nutrition.carbs || 0) / servings),
    fat: Math.round((nutrition.fat || 0) / servings),
    fiber: Math.round((nutrition.fiber || 0) / servings),
    sugar: Math.round((nutrition.sugar || 0) / servings),
    sodium: Math.round((nutrition.sodium || 0) / servings),
  };

  return (
    <div className="bg-[#1A2744] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-[#FF6B35]" />
        <h3 className="text-sm font-semibold text-[#F5F5F0]">Nutrition per Serving</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#15233A] rounded-xl p-3">
          <p className="text-xs text-[#C4C4BA]/60 mb-1">Calories</p>
          <p className="text-lg font-bold text-[#F5F5F0]">{perServing.calories}</p>
        </div>
        <div className="bg-[#15233A] rounded-xl p-3">
          <p className="text-xs text-[#C4C4BA]/60 mb-1">Protein</p>
          <p className="text-lg font-bold text-[#34D399]">{perServing.protein}g</p>
        </div>
        <div className="bg-[#15233A] rounded-xl p-3">
          <p className="text-xs text-[#C4C4BA]/60 mb-1">Carbs</p>
          <p className="text-lg font-bold text-[#FF6B35]">{perServing.carbs}g</p>
        </div>
        <div className="bg-[#15233A] rounded-xl p-3">
          <p className="text-xs text-[#C4C4BA]/60 mb-1">Fat</p>
          <p className="text-lg font-bold text-[#FCD34D]">{perServing.fat}g</p>
        </div>
        <div className="bg-[#15233A] rounded-xl p-3">
          <p className="text-xs text-[#C4C4BA]/60 mb-1">Fiber</p>
          <p className="text-sm font-semibold text-[#C4C4BA]">{perServing.fiber}g</p>
        </div>
        <div className="bg-[#15233A] rounded-xl p-3">
          <p className="text-xs text-[#C4C4BA]/60 mb-1">Sugar</p>
          <p className="text-sm font-semibold text-[#C4C4BA]">{perServing.sugar}g</p>
        </div>
        <div className="bg-[#15233A] rounded-xl p-3 col-span-2">
          <p className="text-xs text-[#C4C4BA]/60 mb-1">Sodium</p>
          <p className="text-sm font-semibold text-[#C4C4BA]">{perServing.sodium}mg</p>
        </div>
      </div>
    </div>
  );
}