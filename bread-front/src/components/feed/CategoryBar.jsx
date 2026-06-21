import React from "react";
import { motion } from "framer-motion";

const categories = [
  { key: "all", label: "All", emoji: "🍞" },
  { key: "late_night_cravings", label: "Late Night", emoji: "🌙" },
  { key: "quick_for_kids", label: "Kids", emoji: "👶" },
  { key: "vegan", label: "Vegan", emoji: "🌱" },
  { key: "cheesy", label: "Cheesy", emoji: "🧀" },
  { key: "high_protein", label: "Protein", emoji: "💪" },
  { key: "budget_meals", label: "Budget", emoji: "💰" },
  { key: "15_minute_meals", label: "15 Min", emoji: "⚡" },
  { key: "desserts", label: "Desserts", emoji: "🍰" },
  { key: "meal_prep", label: "Meal Prep", emoji: "📦" },
];

export default function CategoryBar({ selected, onSelect }) {
  return (
    <div className="hide-scrollbar overflow-x-auto flex gap-2 px-4 py-3">
      {categories.map((cat) => (
        <motion.button
          key={cat.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat.key)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat.key
              ? "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20"
              : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
          }`}
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </motion.button>
      ))}
    </div>
  );
}