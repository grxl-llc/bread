import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Clock, DollarSign, ShoppingCart, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function SmartPantrySuggestionsModal({ open, onClose, recipes, user }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (open) {
      analyzePantry();
    }
  }, [open]);

  const analyzePantry = async () => {
    setLoading(true);

    // Fetch pantry items
    const pantryItems = await base44.entities.PantryItem.list("-created_date", 100);
    
    if (pantryItems.length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const pantryIngredients = pantryItems.map((item) => item.item_name).join(", ");
    const recipesList = recipes.map((r) => ({
      id: r.id,
      title: r.title,
      ingredients: r.ingredients?.map((ing) => ing.name) || [],
    }));

    // AI analysis
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze which recipes can be made with these pantry ingredients: ${pantryIngredients}. Match against these recipes: ${JSON.stringify(recipesList)}. For each match, indicate if it requires zero shopping (all ingredients available) or list missing ingredients. ${user?.smart_pricing_enabled && user?.zip_code ? `For missing ingredients, estimate prices for ZIP ${user.zip_code} and stores: ${user.preferred_stores?.join(", ")}.` : ""}`,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                recipe_id: { type: "string" },
                match_type: { type: "string", enum: ["perfect", "near"] },
                missing_ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                      store: { type: "string" },
                    },
                  },
                },
                total_missing_cost: { type: "number" },
              },
            },
          },
        },
      },
    });

    const enrichedSuggestions = result.matches?.map((match) => {
      const recipe = recipes.find((r) => r.id === match.recipe_id);
      return {
        ...match,
        recipe,
      };
    }) || [];

    setSuggestions(enrichedSuggestions);
    setLoading(false);
  };

  const handleAddMissingToGrocery = async (match) => {
    if (!match.missing_ingredients || match.missing_ingredients.length === 0) return;

    const items = match.missing_ingredients.map((ing) => ({
      name: ing.name,
      quantity: "1",
      unit: "unit",
      price: ing.price || 0,
      store: ing.store || "",
      checked: false,
      recipe_source: match.recipe.title,
    }));

    await base44.entities.GroceryList.create({
      name: `${match.recipe.title} - Missing Items`,
      items,
      store: items[0]?.store || "",
      total_cost: match.total_missing_cost || 0,
      recipe_ids: [match.recipe.id],
    });

    alert("Missing items added to grocery list!");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#15233A] rounded-3xl max-h-[85vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-[#15233A] px-6 py-4 border-b border-white/5 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#FF6B35]" />
                <h2 className="text-xl font-bold text-[#F5F5F0]">Smart Pantry Suggestions</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
                <X className="w-5 h-5 text-[#C4C4BA]" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mb-3" />
                <p className="text-sm text-[#C4C4BA]/60">Analyzing your pantry...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 text-[#C4C4BA]/40">
                <p className="text-sm">No recipes match your current pantry</p>
                <p className="text-xs mt-1">Try adding more ingredients to your pantry</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Perfect Matches */}
                {suggestions.filter((s) => s.match_type === "perfect").length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#34D399] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                      Ready to Cook (No Shopping Needed)
                    </h3>
                    <div className="space-y-3">
                      {suggestions
                        .filter((s) => s.match_type === "perfect")
                        .map((match, index) => (
                          <RecipeSuggestionCard key={index} match={match} isPerfect />
                        ))}
                    </div>
                  </div>
                )}

                {/* Near Matches */}
                {suggestions.filter((s) => s.match_type === "near").length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#FF6B35] mb-3 flex items-center gap-2 mt-6">
                      <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                      Almost Ready (Just a Few Items Needed)
                    </h3>
                    <div className="space-y-3">
                      {suggestions
                        .filter((s) => s.match_type === "near")
                        .map((match, index) => (
                          <RecipeSuggestionCard
                            key={index}
                            match={match}
                            onAddMissing={() => handleAddMissingToGrocery(match)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RecipeSuggestionCard({ match, isPerfect, onAddMissing }) {
  const recipe = match.recipe;
  if (!recipe) return null;

  return (
    <div className="bg-[#1A2744] rounded-2xl overflow-hidden hover:bg-[#243352] transition">
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 flex-shrink-0 bg-[#243352] rounded-xl overflow-hidden">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍳</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#F5F5F0] truncate">{recipe.title}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-[#C4C4BA]">
            {recipe.cook_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.cook_time}m
              </span>
            )}
            {!isPerfect && match.total_missing_cost > 0 && (
              <span className="flex items-center gap-1 text-[#FF6B35]">
                <DollarSign className="w-3 h-3" />
                +${match.total_missing_cost.toFixed(2)}
              </span>
            )}
          </div>
          {!isPerfect && match.missing_ingredients?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-[#C4C4BA]/60 mb-1">
                Missing: {match.missing_ingredients.map((ing) => ing.name).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
      {!isPerfect && onAddMissing && (
        <div className="px-3 pb-3">
          <Button
            onClick={onAddMissing}
            size="sm"
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
          >
            <ShoppingCart className="w-3 h-3 mr-2" />
            Add Missing Items to Grocery List
          </Button>
        </div>
      )}
    </div>
  );
}