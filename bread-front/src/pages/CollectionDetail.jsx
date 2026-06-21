import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RecipeCard from "../components/recipes/RecipeCard";
import RecipeDetail from "../components/recipes/RecipeDetail";

export default function CollectionDetailPage() {
  const navigate = useNavigate();
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("id");

  const { data: collection } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: () => base44.entities.RecipeCollection.filter({ id: collectionId }).then((c) => c[0]),
    enabled: !!collectionId,
  });

  const { data: allRecipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => base44.entities.Recipe.list("-created_date", 100),
  });

  const collectionRecipes = allRecipes.filter((r) =>
    collection?.recipe_ids?.includes(r.id)
  );

  const handleAddToGrocery = async (recipe) => {
    const items = recipe.ingredients?.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      brand: ing.brand || "",
      price: ing.price || 0,
      store: ing.cheapest_store || "",
      checked: false,
      recipe_source: recipe.title,
    })) || [];

    await base44.entities.GroceryList.create({
      name: `${recipe.title} - Groceries`,
      items,
      store: recipe.cheapest_store || "",
      total_cost: recipe.total_cost || 0,
      recipe_ids: [recipe.id],
    });

    alert("Added to grocery list!");
  };

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <p className="text-[#C4C4BA]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A]">
      <div className="pt-6 px-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/5 transition mb-3"
        >
          <ArrowLeft className="w-5 h-5 text-[#C4C4BA]" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          {collection.emoji && <span className="text-2xl">{collection.emoji}</span>}
          <h1 className="text-2xl font-bold text-[#F5F5F0]">{collection.name}</h1>
        </div>
        <p className="text-sm text-[#C4C4BA]/60">
          {collectionRecipes.length} {collectionRecipes.length === 1 ? "recipe" : "recipes"}
        </p>
      </div>

      <div className="px-4 pb-6">
        {collectionRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
            <p className="text-base font-medium">No recipes yet</p>
            <p className="text-sm mt-1">Add recipes to this collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collectionRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={setSelectedRecipe} />
            ))}
          </div>
        )}
      </div>

      <RecipeDetail
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: ["recipes"] })}
        onDelete={() => queryClient.invalidateQueries({ queryKey: ["recipes"] })}
        onAddToGrocery={handleAddToGrocery}
      />
    </div>
  );
}