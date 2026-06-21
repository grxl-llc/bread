import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, BookOpen, Clock, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";

export default function RecipeSelector({ open, onClose, onSelect }) {
  const [search, setSearch] = useState("");

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => base44.entities.Recipe.list("-created_date", 100),
    enabled: open,
  });

  const filtered = recipes.filter((r) =>
    r.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#15233A] rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F5F5F0]">Select a Recipe</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BA]/40" />
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] pl-10 rounded-xl"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#1A2744] rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#C4C4BA]/40">
              <BookOpen className="w-10 h-10 mb-2" />
              <p className="text-sm">No recipes found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => {
                    onSelect(recipe);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 bg-[#1A2744] rounded-xl p-3 hover:bg-[#243352] transition text-left"
                >
                  <div className="w-16 h-16 rounded-lg bg-[#243352] flex-shrink-0 overflow-hidden">
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍳</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#F5F5F0] text-sm line-clamp-1 mb-1">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#C4C4BA]/60">
                      {recipe.cook_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.cook_time}m
                        </span>
                      )}
                      {recipe.total_cost > 0 && (
                        <span className="flex items-center gap-1 text-[#34D399]">
                          <DollarSign className="w-3 h-3" />
                          ${recipe.total_cost?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}