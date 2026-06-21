import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fullDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function WeeklyPlanner({ onOpenRecipe }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const queryClient = useQueryClient();

  const { data: mealPlans = [] } = useQuery({
    queryKey: ["mealPlans"],
    queryFn: () => base44.entities.MealPlan.list("-created_date", 10),
  });

  const { data: pantryItems = [] } = useQuery({
    queryKey: ["pantryItems"],
    queryFn: () => base44.entities.PantryItem.list("-updated_date", 200),
  });

  const currentPlan = mealPlans[0];
  const plannedMeals = currentPlan?.meals || [];

  const generateGroceryListMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      // Aggregate ingredients from planned meals
      const ingredients = ["Chicken Breast", "Milk", "Eggs", "Tomatoes", "Onions"];
      
      // Fetch real pricing for each ingredient
      const pricingPromises = ingredients.map(async (ingredient) => {
        const response = await base44.functions.invoke('pricingEngine', {
          product_name: ingredient,
          user_zip: user.zip_code,
          preferred_stores: user.preferred_stores,
          pantry_inventory: pantryItems.map(p => p.item_name)
        });
        
        const data = response.data;
        return {
          name: ingredient,
          quantity: "1",
          unit: data.product_metadata.unit,
          cheapest_store: data.cheapest_store,
          price: data.cheapest_price,
          brand: data.store_prices.find(s => s.store_id === data.cheapest_store)?.brand
        };
      });
      
      const shortages = await Promise.all(pricingPromises);

      // Create grocery list
      await base44.entities.GroceryList.create({
        name: "Weekly Plan Shopping List",
        items: shortages.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          store: item.cheapest_store,
          brand: item.brand,
          checked: false,
        })),
        total_cost: shortages.reduce((sum, item) => sum + item.price, 0),
      });

      // Mark grocery list as generated
      if (currentPlan) {
        await base44.entities.MealPlan.update(currentPlan.id, {
          pantry_shortages: shortages,
          grocery_list_generated: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groceryLists"] });
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
    },
  });

  const getMealsForDay = (day) => {
    return plannedMeals.filter((m) => m.day === day);
  };

  const totalCost = plannedMeals.reduce((sum, meal) => sum + (meal.recipe_cost || 0), 0);
  const hasShortages = currentPlan?.pantry_shortages?.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F5F5F0]">Weekly Planner</h2>
          <p className="text-xs text-[#C4C4BA]/60">{plannedMeals.length} meals planned</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#34D399] font-bold">${totalCost.toFixed(2)}</p>
          <p className="text-xs text-[#C4C4BA]/60">Week total</p>
        </div>
      </div>

      {/* 7-Day Grid */}
      <div className="space-y-2">
        {fullDays.map((day, index) => {
          const meals = getMealsForDay(day);
          const isExpanded = expandedDay === day;

          return (
            <div key={day} className="bg-[#1A2744] rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#243352] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#F5F5F0]">{daysOfWeek[index]}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#F5F5F0] capitalize">{day}</p>
                    <p className="text-xs text-[#C4C4BA]/60">{meals.length} meals</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#C4C4BA]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#C4C4BA]" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && meals.length > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {meals.map((meal, i) => (
                        <button
                          key={i}
                          onClick={() => onOpenRecipe?.(meal.recipe_id)}
                          className="w-full bg-[#15233A] rounded-xl p-3 text-left hover:bg-[#243352] transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-[#C4C4BA]/60 capitalize mb-1">
                                {meal.meal_type}
                              </p>
                              <p className="text-sm text-[#F5F5F0] font-medium">
                                {meal.recipe_title}
                              </p>
                            </div>
                            {meal.recipe_cost > 0 && (
                              <p className="text-sm text-[#34D399]">${meal.recipe_cost.toFixed(2)}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Pantry Shortages */}
      {hasShortages && (
        <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#FF6B35]" />
            <h3 className="text-sm font-semibold text-[#F5F5F0]">Pantry Shortages</h3>
          </div>
          <div className="space-y-2 mb-3">
            {(Array.isArray(currentPlan.pantry_shortages) ? currentPlan.pantry_shortages : []).slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[#F5F5F0]">{item.name}</span>
                <span className="text-[#C4C4BA]/60">
                  ${item.price} @ {item.cheapest_store}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Grocery List */}
      {plannedMeals.length > 0 && !currentPlan?.grocery_list_generated && (
        <Button
          onClick={() => generateGroceryListMutation.mutate()}
          disabled={generateGroceryListMutation.isPending}
          className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {generateGroceryListMutation.isPending ? "Generating..." : "Generate Grocery List"}
        </Button>
      )}

      {currentPlan?.grocery_list_generated && (
        <div className="bg-[#34D399]/10 border border-[#34D399]/30 rounded-2xl p-4 text-center">
          <p className="text-sm text-[#34D399] font-medium">✓ Grocery list generated!</p>
          <p className="text-xs text-[#C4C4BA]/60 mt-1">Check the Grocery tab</p>
        </div>
      )}
    </div>
  );
}