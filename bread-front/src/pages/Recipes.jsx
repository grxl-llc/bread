import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, CalendarDays, Video } from "lucide-react";

import RecipeCard from "../components/recipes/RecipeCard";
import RecipeDetail from "../components/recipes/RecipeDetail";
import AddRecipeMenu from "../components/recipes/AddRecipeMenu";
import ManualRecipeModal from "../components/recipes/ManualRecipeModal";
import ImportRecipeModal from "../components/recipes/ImportRecipeModal";
import PhotoRecipeModal from "../components/recipes/PhotoRecipeModal";
import AdCard from "../components/feed/AdCard";
import CollectionCard from "../components/recipes/CollectionCard";
import CreateCollectionModal from "../components/recipes/CreateCollectionModal";
import SmartPantrySuggestionsModal from "../components/recipes/SmartPantrySuggestionsModal";
import MealPlanner from "../components/recipes/MealPlanner";
import WeeklyPlanner from "../components/recipes/WeeklyPlanner";
import SavedTutorialCard from "../components/tutorials/SavedTutorialCard";
import TutorialSearch from "../components/tutorials/TutorialSearch";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PullToRefresh from "../components/shared/PullToRefresh";
import { useEffectiveZip } from "@/lib/location";

export default function Recipes() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [user, setUser] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showPantryModal, setShowPantryModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveZip = useEffectiveZip(user);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => base44.entities.Recipe.list("-created_date", 100),
  });

  const { data: pantryItems = [] } = useQuery({
    queryKey: ["pantryItems-names"],
    queryFn: () => base44.entities.PantryItem.list("-created_date", 200),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["collections"],
    queryFn: () => base44.entities.RecipeCollection.list("-created_date", 50),
  });

  const { data: savedTutorials = [] } = useQuery({
    queryKey: ["saved-tutorials", user?.email],
    queryFn: () => base44.entities.SavedTutorial.filter({ user_email: user.email }, "-created_date", 100),
    enabled: !!user,
  });

  const handleDeleteSavedTutorial = async (id) => {
    await base44.entities.SavedTutorial.delete(id);
    queryClient.invalidateQueries({ queryKey: ["saved-tutorials", user?.email] });
  };

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

  const refreshSelectedRecipe = () => {
    queryClient.invalidateQueries({ queryKey: ["recipes"] });
    if (selectedRecipe) {
      base44.entities.Recipe.list("-created_date", 100).then((all) => {
        const updated = all.find((r) => r.id === selectedRecipe.id);
        if (updated) setSelectedRecipe(updated);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#15233A]">
      <div className="pt-6 px-5 pb-4">
        <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1">My Recipes</h1>
        <p className="text-sm text-[#C4C4BA]/60">Save, plan, and cook</p>
      </div>

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries()}>
      <Tabs defaultValue="recipes" className="px-4">
        <TabsList className="bg-[#1A2744] border border-[#243352] rounded-xl p-1 mb-4 w-full grid grid-cols-4">
        <TabsTrigger
          value="recipes"
          className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white rounded-lg text-xs"
        >
          Recipes
        </TabsTrigger>
        <TabsTrigger
          value="meal-planner"
          className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white rounded-lg text-xs"
        >
          <Calendar className="w-3 h-3 mr-1" />
          Plan
        </TabsTrigger>
        <TabsTrigger
          value="weekly"
          className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white rounded-lg text-xs"
        >
          <CalendarDays className="w-3 h-3 mr-1" />
          Week
        </TabsTrigger>
        <TabsTrigger
          value="collections"
          className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white rounded-lg text-xs"
        >
          Collections
        </TabsTrigger>
        </TabsList>

        <TabsContent value="recipes">
          <div className="space-y-4 pb-6">
            <AddRecipeMenu
              onManual={() => setShowManualModal(true)}
              onImport={() => setShowImportModal(true)}
              onPhoto={() => setShowPhotoModal(true)}
            />
            
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[#1A2744] rounded-2xl h-48 animate-pulse" />
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
                <p className="text-base font-medium">No recipes yet</p>
                <p className="text-sm mt-1">Add your first recipe to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={setSelectedRecipe}
                    userZip={effectiveZip}
                    pantryItems={pantryItems}
                  />
                ))}
              </div>
            )}

            {/* Ad Block */}
             <div className="mb-6">
               <AdCard index={0} />
             </div>

             {/* Saved Tutorials Section */}
             <div>
               <div className="flex items-center gap-2 mb-4">
                 <Video className="w-4 h-4 text-[#FF6B35]" />
                 <h2 className="text-lg font-bold text-[#F5F5F0]">Saved Tutorials</h2>
                 {savedTutorials.length > 0 && (
                   <span className="text-xs text-[#C4C4BA]/50">({savedTutorials.length})</span>
                 )}
               </div>

               {/* Tutorial Search */}
               <div className="mb-6 pb-6 border-b border-[#243352]">
                 <h3 className="text-xs font-semibold text-[#C4C4BA]/70 mb-3 uppercase tracking-wide">Discover New Tutorials</h3>
                 <TutorialSearch userEmail={user?.email} onSaveTutorial={() => queryClient.invalidateQueries({ queryKey: ["saved-tutorials", user?.email] })} />
               </div>

               {/* Saved Tutorials Grid */}
               {savedTutorials.length > 0 ? (
                 <div className="grid grid-cols-2 gap-3">
                   {savedTutorials.map((saved) => (
                     <SavedTutorialCard
                       key={saved.id}
                       saved={saved}
                       onDelete={handleDeleteSavedTutorial}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-8 text-[#C4C4BA]/40">
                   <Video className="w-8 h-8 mb-2" />
                   <p className="text-sm">No saved tutorials yet</p>
                   <p className="text-xs mt-1">Search and save tutorials from above!</p>
                 </div>
               )}
             </div>
          </div>
        </TabsContent>

        <TabsContent value="meal-planner">
          <div className="pb-6">
            <MealPlanner user={user} recipes={recipes} />
          </div>
        </TabsContent>

        <TabsContent value="weekly">
          <div className="pb-6">
            <WeeklyPlanner onOpenRecipe={(id) => setSelectedRecipe(recipes.find(r => r.id === id))} />
          </div>
        </TabsContent>

        <TabsContent value="collections">
           <div className="space-y-4 pb-6">
             {collections.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
                 <p className="text-base font-medium">No collections yet</p>
                 <p className="text-sm mt-1">Create your first collection!</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-3">
                 {collections.map((collection) => {
                   const safeRecipeIds = Array.isArray(collection.recipe_ids) ? collection.recipe_ids : [];
                     const collectionRecipes = (Array.isArray(recipes) ? recipes : []).filter((r) =>
                       safeRecipeIds.includes(r.id)
                     );
                   return (
                     <CollectionCard
                       key={collection.id}
                       collection={collection}
                       recipeCount={collectionRecipes.length}
                       thumbnail={collectionRecipes[0]?.image_url}
                       onClick={() => navigate(createPageUrl("CollectionDetail") + `?id=${collection.id}`)}
                     />
                   );
                 })}
               </div>
             )}

             <button
               onClick={() => setShowCreateCollection(true)}
               className="w-full bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-12 flex items-center justify-center gap-2"
             >
               <Plus className="w-4 h-4" />
               Create Collection
             </button>
           </div>
         </TabsContent>
      </Tabs>
      </PullToRefresh>
      {/* Recipe Detail Modal */}
      <RecipeDetail
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onUpdate={refreshSelectedRecipe}
        onDelete={() => {
          queryClient.invalidateQueries({ queryKey: ["recipes"] });
        }}
        onAddToGrocery={handleAddToGrocery}
        userZip={effectiveZip}
        pantryItems={pantryItems}
      />

      {/* Add Recipe Modals */}
      <ManualRecipeModal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["recipes"] })}
        user={user}
      />
      <ImportRecipeModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["recipes"] })}
      />

      <PhotoRecipeModal
        open={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["recipes"] })}
      />
      <CreateCollectionModal
        open={showCreateCollection}
        onClose={() => setShowCreateCollection(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["collections"] })}
      />
      <SmartPantrySuggestionsModal
        open={showPantryModal}
        onClose={() => setShowPantryModal(false)}
        recipes={recipes}
        user={user}
      />
    </div>
  );
}