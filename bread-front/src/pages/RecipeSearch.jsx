import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Clock, ChefHat, Star, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FREE_RECIPE_VIEWS, ANON_RECIPE_VIEW_KEY } from "@/lib/featureConfig";
import RecipeDetail from "@/components/recipes/RecipeDetail";
import { useEffectiveZip } from "@/lib/location";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAnonViewCount() {
  return parseInt(localStorage.getItem(ANON_RECIPE_VIEW_KEY) || "0", 10);
}

function incrementAnonViewCount() {
  const next = getAnonViewCount() + 1;
  localStorage.setItem(ANON_RECIPE_VIEW_KEY, String(next));
  return next;
}

function StarDisplay({ avg, count }) {
  if (!count) return null;
  const full = Math.round(avg);
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
      {"★".repeat(full)}{"☆".repeat(5 - full)}
      <span className="text-[#C4C4BA] ml-0.5">{avg?.toFixed(1)} ({count})</span>
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RecipeSearch() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [user, setUser] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus search input on mount.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch current user (may be null for anonymous visitors).
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Clear anon counter when user signs in.
  useEffect(() => {
    if (user) localStorage.removeItem(ANON_RECIPE_VIEW_KEY);
  }, [user]);

  // Debounce the search term by 350 ms.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const effectiveZip = useEffectiveZip(user);

  const { data, isLoading } = useQuery({
    queryKey: ["recipe-search", debouncedQ],
    queryFn: () => base44.recipes.search(debouncedQ, 50),
    keepPreviousData: true,
  });

  const results = data?.results ?? [];

  const handleOpenRecipe = (recipe) => {
    // Logged-in users always get full access.
    if (user) {
      setSelectedRecipe(recipe);
      return;
    }

    // Anon users get FREE_RECIPE_VIEWS views before the soft paywall.
    const count = incrementAnonViewCount();
    if (count > FREE_RECIPE_VIEWS) {
      setShowPaywall(true);
    } else {
      setSelectedRecipe(recipe);
    }
  };

  return (
    <div className="min-h-screen bg-[#15233A]">
      {/* Header */}
      <div className="pt-6 px-5 pb-3">
        <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1">Recipe Search</h1>
        <p className="text-sm text-[#C4C4BA]/60">Discover recipes shared by the community</p>
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-20 bg-[#15233A]/95 backdrop-blur px-4 pb-3 pt-1">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BA]/50 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, cuisine, difficulty…"
            className="w-full bg-[#1A2744] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors text-sm"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4C4BA]/50 hover:text-[#C4C4BA]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Anon view count hint */}
        {!user && (
          <p className="text-[10px] text-[#C4C4BA]/40 mt-2 text-center">
            {Math.max(0, FREE_RECIPE_VIEWS - getAnonViewCount())} free views remaining ·{" "}
            <button onClick={() => navigate("/signup")} className="text-[#FF6B35] hover:underline">
              Sign up for unlimited
            </button>
          </p>
        )}
      </div>

      {/* Results */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#1A2744] rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
            <ChefHat className="w-10 h-10 mb-3" />
            <p className="text-base font-medium">
              {debouncedQ ? `No public recipes for "${debouncedQ}"` : "No public recipes yet"}
            </p>
            <p className="text-sm mt-1">
              {debouncedQ ? "Try a different search term" : "Be the first to share one!"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#C4C4BA]/40 mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((recipe) => (
                <PublicRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleOpenRecipe(recipe)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          open={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUpdate={() => {}}
          onDelete={() => {}}
          onAddToGrocery={() => {}}
          userZip={effectiveZip}
          pantryItems={[]}
          readOnly={!user || selectedRecipe.created_by !== user?.email}
        />
      )}

      {/* Soft paywall overlay */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2744] rounded-2xl max-w-sm w-full p-6 text-center border border-white/5">
            <div className="w-14 h-14 rounded-full bg-[#FF6B35]/15 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#FF6B35]" />
            </div>
            <h2 className="text-xl font-bold text-[#F5F5F0] mb-2">You've hit {FREE_RECIPE_VIEWS} free views</h2>
            <p className="text-[#C4C4BA] text-sm mb-6">
              Create a free Bread account to keep browsing community recipes — and to save, plan, and price them too.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/signup")}
                className="w-full bg-[#FF6B35] text-white font-semibold py-3 rounded-xl hover:bg-[#FF8555] transition"
              >
                Sign Up — It's Free
              </button>
              <button
                onClick={() => navigate("/signin")}
                className="w-full bg-transparent border border-white/20 text-[#C4C4BA] font-medium py-3 rounded-xl hover:bg-white/5 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full text-[#C4C4BA]/50 text-sm py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Public recipe thumbnail card ──────────────────────────────────────────────

function PublicRecipeCard({ recipe, onClick }) {
  const avg = recipe.rating_count ? recipe.avg_rating : null;
  return (
    <button
      onClick={onClick}
      className="bg-[#1A2744] rounded-2xl overflow-hidden text-left hover:bg-[#1E2E52] transition-colors active:scale-[0.98]"
    >
      <div className="relative aspect-[16/10] bg-[#243352]">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍳</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-[#F5F5F0] text-sm line-clamp-1 mb-1">{recipe.title}</h3>
        <div className="flex items-center gap-2 text-[10px] text-[#C4C4BA]">
          {recipe.cook_time && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {recipe.cook_time}m
            </span>
          )}
          {recipe.difficulty && (
            <span className="flex items-center gap-0.5">
              <ChefHat className="w-3 h-3" />
              {recipe.difficulty}
            </span>
          )}
        </div>
        {avg != null && (
          <div className="mt-1">
            <StarDisplay avg={avg} count={recipe.rating_count} />
          </div>
        )}
      </div>
    </button>
  );
}
