import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Lock, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import RecipeSelector from "../feed/RecipeSelector";

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const mealTypes = ["breakfast", "lunch", "dinner"];

export default function MealPlanner({ user, recipes }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const queryClient = useQueryClient();

  const { data: mealPlans = [] } = useQuery({
    queryKey: ["mealPlans"],
    queryFn: () => base44.entities.MealPlan.list("-created_date", 10),
  });

  const currentPlan = mealPlans[0];
  const plannedMeals = currentPlan?.meals || [];
  const isBreadPlus = user?.subscription_status === "active";
  const mealCount = plannedMeals.length;
  const canAddMore = isBreadPlus || mealCount < 3;

  const addMealMutation = useMutation({
    mutationFn: async ({ day, mealType, recipe }) => {
      // Calculate recipe cost from pricing engine
      let recipeCost = recipe.total_cost || 0;
      
      if (recipe.ingredients?.length > 0 && recipeCost === 0) {
        try {
          const user = await base44.auth.me();
          const pricingPromises = recipe.ingredients.slice(0, 5).map(async (ing) => {
            const response = await base44.functions.invoke('pricingEngine', {
              product_name: ing.name,
              user_zip: user.zip_code,
              preferred_stores: user.preferred_stores
            });
            return response.data.cheapest_price;
          });
          
          const prices = await Promise.all(pricingPromises);
          recipeCost = prices.reduce((sum, p) => sum + p, 0);
        } catch (error) {
          console.error('Failed to calculate recipe cost:', error);
        }
      }
      
      const meal = {
        day,
        meal_type: mealType,
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        recipe_cost: recipeCost,
      };

      if (currentPlan) {
        await base44.entities.MealPlan.update(currentPlan.id, {
          meals: [...plannedMeals, meal],
        });
      } else {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        await base44.entities.MealPlan.create({
          week_start_date: monday.toISOString().split("T")[0],
          meals: [meal],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      setShowRecipeSelector(false);
      setSelectedDay(null);
      setSelectedMealType(null);
    },
  });

  const removeMealMutation = useMutation({
    mutationFn: async (index) => {
      const updatedMeals = plannedMeals.filter((_, i) => i !== index);
      await base44.entities.MealPlan.update(currentPlan.id, { meals: updatedMeals });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mealPlans"] }),
  });

  const handleAddMeal = (day, mealType) => {
    if (!canAddMore) return;
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setShowRecipeSelector(true);
  };

  const handleRecipeSelect = (recipe) => {
    addMealMutation.mutate({
      day: selectedDay,
      mealType: selectedMealType,
      recipe,
    });
  };

  const getMealForSlot = (day, mealType) => {
    return plannedMeals.find((m) => m.day === day && m.meal_type === mealType);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F5F5F0]">Meal Planner</h2>
          <p className="text-xs text-[#C4C4BA]/60">
            {isBreadPlus ? "Unlimited planning" : `${mealCount}/3 meals planned`}
          </p>
        </div>
        <Calendar className="w-5 h-5 text-[#FF6B35]" />
      </div>

      {/* Meal Grid */}
      <div className="space-y-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="bg-[#1A2744] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-[#F5F5F0] mb-2 capitalize">{day}</h3>
            <div className="grid grid-cols-3 gap-2">
              {mealTypes.map((mealType) => {
                const meal = getMealForSlot(day, mealType);
                const mealIndex = plannedMeals.findIndex(
                  (m) => m.day === day && m.meal_type === mealType
                );

                return (
                  <div key={mealType}>
                    {meal ? (
                      <div className="bg-[#15233A] rounded-xl p-2 relative group">
                        <p className="text-[10px] text-[#C4C4BA]/60 mb-1 capitalize">{mealType}</p>
                        <p className="text-xs text-[#F5F5F0] font-medium line-clamp-2">
                          {meal.recipe_title}
                        </p>
                        <button
                          onClick={() => removeMealMutation.mutate(mealIndex)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddMeal(day, mealType)}
                        disabled={!canAddMore}
                        className={`w-full bg-[#243352] rounded-xl p-2 text-center transition ${
                          canAddMore ? "hover:bg-[#2d4060]" : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <p className="text-[10px] text-[#C4C4BA]/60 mb-1 capitalize">{mealType}</p>
                        {canAddMore ? (
                          <Plus className="w-4 h-4 text-[#C4C4BA]/60 mx-auto" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#C4C4BA]/60 mx-auto" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade prompt */}
      {!isBreadPlus && mealCount >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#FF6B35]/20 to-[#FF8555]/20 rounded-2xl p-4 border border-[#FF6B35]/30"
        >
          <p className="text-sm text-[#F5F5F0] font-medium mb-2">Unlock Unlimited Meal Planning</p>
          <p className="text-xs text-[#C4C4BA]/60 mb-3">
            Upgrade to Bread+ to plan as many meals as you want
          </p>
          <Button className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-10">
            Upgrade to Bread+
          </Button>
        </motion.div>
      )}

      {/* Recipe Selector Modal */}
      {showRecipeSelector && (
        <RecipeSelector
          open={showRecipeSelector}
          onClose={() => setShowRecipeSelector(false)}
          onSelect={handleRecipeSelect}
          recipes={recipes}
        />
      )}
    </div>
  );
}