import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronDown } from "lucide-react";

export default function BrandPartnersModal({ isOpen, onClose, userEmail }) {
  const [expandedBrand, setExpandedBrand] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: () => base44.entities.BrandSponsorship.filter({ is_active: true }, "-priority", 50),
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["user-recipes", userEmail],
    queryFn: () => base44.entities.Recipe.filter({ created_by: userEmail }, "-updated_date", 100),
    enabled: !!userEmail,
  });

  const { data: pantryItems = [] } = useQuery({
    queryKey: ["pantry", userEmail],
    queryFn: () => base44.entities.PantryItem.filter({ created_by: userEmail }, null, 500),
    enabled: !!userEmail,
  });

  const getDifficultyColor = (difficulty) => {
    if (difficulty < 3) return "bg-green-500";
    if (difficulty < 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMatchingRecipes = (brandItem) => {
    return recipes.filter((recipe) =>
      recipe.ingredients?.some(
        (ing) => ing.name?.toLowerCase().includes(brandItem?.toLowerCase())
      )
    );
  };

  const renderBrandCard = (brand, isExpanded) => (
    <div key={brand.id} className="bg-[#243352] rounded-xl overflow-hidden">
      <div
        onClick={() => setExpandedBrand(isExpanded ? null : brand.id)}
        className="p-4 cursor-pointer hover:bg-[#2A3F54] transition"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#F5F5F0]">{brand.brand_name}</h3>
            <p className="text-xs text-[#C4C4BA]/60 mt-1">{brand.generic_item}</p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#C4C4BA] transition ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#C4C4BA] mb-1">Difficulty</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i <= (brand.priority || 3)
                      ? getDifficultyColor(brand.priority || 3)
                      : "bg-[#15233A]"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#C4C4BA] mb-1">Payout</p>
            <p className="text-lg font-bold text-[#34D399]">${brand.priority * 50}</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[#15233A] p-4 space-y-4 bg-[#1A2744]">
          <div>
            <p className="text-xs font-semibold text-[#C4C4BA] uppercase mb-2">Requirements</p>
            <p className="text-sm text-[#F5F5F0]">
              Feature {brand.brand_name} prominently in your tutorial. Show the product, usage, and final result.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#C4C4BA] uppercase mb-2">Where to Purchase</p>
            <p className="text-sm text-[#34D399]">Available at major retailers or online stores</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#C4C4BA] uppercase mb-2">Payout Timeline</p>
            <p className="text-sm text-[#F5F5F0]">30 days after content approval</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#C4C4BA] uppercase mb-2">Recipe Suggestions</p>
            <select
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
              className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-3 py-2 text-[#C4C4BA] text-sm mb-2"
            >
              <option value="">Select a recipe...</option>
              {getMatchingRecipes(brand.generic_item).map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title}
                </option>
              ))}
              <option value="ai-generated">AI Generated Recipe</option>
            </select>
            {selectedRecipe === "ai-generated" && (
              <div className="bg-[#15233A] rounded-lg p-3 text-sm text-[#F5F5F0]">
                AI would suggest a recipe featuring {brand.brand_name}...
              </div>
            )}
          </div>

          <button className="w-full bg-[#FF6B35] text-white font-semibold py-2 rounded-lg hover:bg-[#FF8555] transition">
            Accept & Create Content
          </button>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A2744] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#243352]">
          <h2 className="text-xl font-bold text-[#F5F5F0]">Brand Partnership Opportunities</h2>
          <button onClick={onClose} className="text-[#C4C4BA] hover:text-[#F5F5F0]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {brands.length === 0 ? (
            <p className="text-center text-[#C4C4BA]/60 py-8">No brands available at the moment</p>
          ) : (
            brands.map((brand) => renderBrandCard(brand, expandedBrand === brand.id))
          )}
        </div>
      </div>
    </div>
  );
}