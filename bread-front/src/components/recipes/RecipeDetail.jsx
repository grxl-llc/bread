import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, DollarSign, MapPin, Heart, Copy, Edit, Trash2, ShoppingCart, Sparkles, RefreshCw, Check, Globe, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { calculateAndUpdateBadges } from "../badges/badgeUtils";
import SmartSubstitutionModal from "./SmartSubstitutionModal";
import NutritionCard from "./NutritionCard";
import { useRecipeCost } from "@/lib/useRecipeCost";
import { RATING_MAX } from "@/lib/featureConfig";

// ── Star Rating widget ────────────────────────────────────────────────────────

function StarRating({ recipeId, isPublic, isOwner, currentUser, initialRating, ratingCount, ratingSum, onRated }) {
  const [hovered, setHovered] = useState(0);
  const [myRating, setMyRating] = useState(initialRating || 0);
  const [submitting, setSubmitting] = useState(false);
  const [localSum, setLocalSum] = useState(ratingSum || 0);
  const [localCount, setLocalCount] = useState(ratingCount || 0);

  // Fetch the user's existing rating on open.
  useEffect(() => {
    if (!currentUser || !recipeId) return;
    base44.recipes.myRating(recipeId)
      .then((res) => { if (res?.rating) setMyRating(res.rating); })
      .catch(() => {});
  }, [currentUser, recipeId]);

  // Only show the rating widget to:
  // - public recipes: any logged-in user
  // - private recipes: the owner only
  const canRate = currentUser && (isPublic || isOwner);
  const showRating = localCount > 0 || canRate;

  if (!showRating) return null;

  const avgDisplay = localCount ? (localSum / localCount).toFixed(1) : null;
  const displayStars = hovered || myRating;

  const handleRate = async (star) => {
    if (!canRate || submitting) return;
    setSubmitting(true);
    try {
      const oldRating = myRating;
      const res = await base44.recipes.rate(recipeId, star);
      if (res?.ok) {
        // Update local tallies optimistically.
        if (oldRating) {
          setLocalSum((s) => s - oldRating + star);
          // count stays the same (update, not new)
        } else {
          setLocalSum((s) => s + star);
          setLocalCount((c) => c + 1);
        }
        setMyRating(star);
        onRated?.();
      }
    } catch (e) {
      console.warn("Rating failed:", e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1A2744] rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#F5F5F0] font-medium">
          {isPublic ? "Community rating" : "My rating"}
        </span>
        {avgDisplay && (
          <span className="text-xs text-[#C4C4BA]">
            {avgDisplay} / {RATING_MAX} · {localCount} {localCount === 1 ? "rating" : "ratings"}
          </span>
        )}
      </div>

      {canRate ? (
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => handleRate(star)}
              disabled={submitting}
              className="text-2xl leading-none transition-transform hover:scale-110 disabled:opacity-50"
            >
              <span className={star <= displayStars ? "text-yellow-400" : "text-[#C4C4BA]/25"}>★</span>
            </button>
          ))}
          {submitting && <Loader2 className="w-4 h-4 ml-1 animate-spin text-[#C4C4BA]/50" />}
          {myRating > 0 && !submitting && (
            <span className="text-xs text-[#C4C4BA]/60 ml-2">Your rating: {myRating}</span>
          )}
        </div>
      ) : localCount > 0 ? (
        // Read-only display for non-ratable viewers (e.g. not logged in on public recipe)
        <div className="flex items-center gap-0.5 mt-1">
          {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((star) => (
            <span key={star} className={`text-xl ${star <= Math.round(localSum / localCount) ? "text-yellow-400" : "text-[#C4C4BA]/25"}`}>★</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RecipeDetail({ recipe, open, onClose, onUpdate, onDelete, onAddToGrocery, userZip, pantryItems, readOnly }) {
  const [editMode, setEditMode] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const [saving, setSaving] = useState(false);
  const [findingAlternative, setFindingAlternative] = useState(null);
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [brandQuery, setBrandQuery] = useState("");
  const [brandResults, setBrandResults] = useState([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Live cost breakdown (recomputed each open — reflects current sales).
  const { data: costData, isLoading: costLoading } = useRecipeCost(recipe, userZip, pantryItems);

  // Keep the edit buffer in sync when a different recipe opens.
  useEffect(() => { setEditedRecipe(recipe); setEditMode(false); }, [recipe?.id]);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Live brand search for the picker — searches the GENERIC keyword so every
  // brand shows up (not just products matching the full marketing name).
  useEffect(() => {
    if (!substitutionModalOpen) return;
    if (!userZip || !brandQuery || brandQuery.trim().length < 2) {
      setBrandResults([]);
      return;
    }
    let cancelled = false;
    setBrandLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await base44.pricing.search(brandQuery.trim(), userZip, 15);
        if (!cancelled) setBrandResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setBrandResults([]);
      } finally {
        if (!cancelled) setBrandLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [brandQuery, substitutionModalOpen, userZip]);

  if (!open || !recipe) return null;

  const isOwner = currentUser && recipe.created_by === currentUser.email;

  // Per-ingredient cost lookup + "already have" set, keyed by name.
  const costByName = {};
  (costData?.ingredients || []).forEach((c) => { costByName[(c.name || "").toLowerCase()] = c; });
  const alreadyHaveSet = new Set((costData?.already_have || []).map((a) => (a.name || "").toLowerCase()));
  const liveTotal = costData?.total_cost;
  const displayTotal = liveTotal != null ? liveTotal : recipe.total_cost;

  // Best-effort generic keyword from a product name — the generic noun is
  // usually the last word or two ("…Premium Ground Beef" → "ground beef").
  const guessKeyword = (name) => {
    const words = (name || "").replace(/[®™]/g, "").split(/[\s,-]+/).filter(Boolean);
    return words.slice(-2).join(" ");
  };

  const handleIngredientClick = (index) => {
    if (readOnly) return;
    const ing = recipe.ingredients?.[index] || {};
    setSelectedIngredientIndex(index);
    setBrandQuery(ing.search_term || guessKeyword(ing.name));
    setBrandResults([]);
    setSubstitutionModalOpen(true);
  };

  // Swap the chosen product to a different brand from the live alternatives.
  const handleSwapBrand = async (product) => {
    const updated = [...(recipe.ingredients || [])];
    const cur = updated[selectedIngredientIndex] || {};
    updated[selectedIngredientIndex] = {
      ...cur,
      name: product.name,
      brand: product.brand,
      product_id: product.product_id,
      image_url: product.image_url,
      search_term: brandQuery.trim() || cur.search_term,  // remember the keyword used
    };
    await base44.entities.Recipe.update(recipe.id, { ingredients: updated });
    setSubstitutionModalOpen(false);
    onUpdate();
  };

  const handleReplaceIngredient = async (newIngredient) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[selectedIngredientIndex] = {
      ...updatedIngredients[selectedIngredientIndex],
      ...newIngredient,
    };
    await base44.entities.Recipe.update(recipe.id, { ingredients: updatedIngredients });
    onUpdate();
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditedRecipe((r) => ({ ...r, image_url: file_url }));
    } catch (err) {
      console.error("Photo upload failed", err);
      alert("Couldn't upload the photo. Make sure S3 is configured.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Recipe.update(recipe.id, editedRecipe);
    setSaving(false);
    setEditMode(false);
    onUpdate();
  };

  const handleDuplicate = async () => {
    const { id, created_date, updated_date, created_by, ...recipeData } = recipe;
    await base44.entities.Recipe.create({
      ...recipeData,
      title: `${recipe.title} (Copy)`,
    });
    onUpdate();
    onClose();
  };

  const handleDelete = async () => {
    await base44.entities.Recipe.delete(recipe.id);
    onDelete();
    onClose();
  };

  const togglePublic = async () => {
    if (readOnly) return;
    await base44.entities.Recipe.update(recipe.id, { is_public: !recipe.is_public });
    onUpdate();
    // Recalculate badges after making recipe public
    const user = await base44.auth.me();
    if (user) {
      await calculateAndUpdateBadges(user.email);
    }
  };

  const toggleFavoriteIngredient = async (index) => {
    if (readOnly) return;
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      is_favorite: !updatedIngredients[index].is_favorite,
    };
    await base44.entities.Recipe.update(recipe.id, { ingredients: updatedIngredients });
    onUpdate();
  };

  const findCheaperAlternative = async (ingredient, index) => {
    setFindingAlternative(index);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest a cheaper alternative ingredient for "${ingredient.name}" in cooking. Return the alternative name and estimated price.`,
      response_json_schema: {
        type: "object",
        properties: {
          alternative_name: { type: "string" },
          estimated_price: { type: "number" },
          reason: { type: "string" }
        }
      }
    });

    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      name: result.alternative_name,
      price: result.estimated_price,
    };
    await base44.entities.Recipe.update(recipe.id, { ingredients: updatedIngredients });
    setFindingAlternative(null);
    onUpdate();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="min-h-screen sm:min-h-0 sm:mt-10 sm:mb-10 sm:mx-auto sm:max-w-lg bg-[#15233A] sm:rounded-3xl overflow-hidden"
        >
          {/* Header Image */}
          <div className="relative aspect-video bg-[#1A2744]">
            {recipe.image_url ? (
              <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🍳</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D] via-transparent to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-sm rounded-full"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-6 -mt-8 relative">
            <h1 className="text-2xl font-bold text-[#F5F5F0] mb-3">{recipe.title}</h1>

            <div className="flex items-center gap-4 mb-6 text-sm">
              {recipe.cook_time && (
                <span className="flex items-center gap-1.5 text-[#C4C4BA]">
                  <Clock className="w-4 h-4" />
                  {recipe.cook_time} min
                </span>
              )}
              {costLoading && liveTotal == null ? (
                <span className="flex items-center gap-1.5 text-[#34D399]/70">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  pricing…
                </span>
              ) : costData?.pricing_unavailable ? (
                <span className="flex items-center gap-1.5 text-[#C4C4BA]/50 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  No local store pricing yet
                </span>
              ) : displayTotal > 0 ? (
                <span className="flex items-center gap-1.5 text-[#34D399]">
                  <DollarSign className="w-4 h-4" />
                  ${displayTotal?.toFixed(2)}
                </span>
              ) : null}
              {/* Show real store chain name from live pricing, fall back to stored */}
              {costData?.store_chain ? (
                <span className="flex items-center gap-1.5 text-[#C4C4BA]">
                  <MapPin className="w-4 h-4" />
                  {costData.store_chain}
                </span>
              ) : recipe.cheapest_store && !costData?.pricing_unavailable ? (
                <span className="flex items-center gap-1.5 text-[#C4C4BA]">
                  <MapPin className="w-4 h-4" />
                  {recipe.cheapest_store}
                </span>
              ) : null}
            </div>

            {/* ── Star Rating ── */}
            <StarRating
              recipeId={recipe.id}
              isPublic={recipe.is_public}
              isOwner={isOwner}
              currentUser={currentUser}
              ratingSum={recipe.rating_sum}
              ratingCount={recipe.rating_count}
              onRated={onUpdate}
            />

            {/* Public Toggle — owners only */}
            {!readOnly && isOwner && (
              <div className="bg-[#1A2744] rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#C4C4BA]" />
                    <span className="text-sm text-[#F5F5F0]">Make recipe public</span>
                  </div>
                  <Switch checked={recipe.is_public} onCheckedChange={togglePublic} />
                </div>
                <p className="text-xs text-[#C4C4BA]/60 mt-1">
                  Public recipes appear on your profile and in recipe search
                </p>
              </div>
            )}

            {/* Action Buttons — owners only */}
            {!readOnly && isOwner && (
              <div className="flex gap-2 mb-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDuplicate}
                  className="border-[#243352] text-[#C4C4BA] hover:bg-[#1A2744] rounded-xl"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(!editMode)}
                  className="border-[#243352] text-[#C4C4BA] hover:bg-[#1A2744] rounded-xl"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAddToGrocery(recipe)}
                  className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Grocery List
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Inline Edit Form */}
            {editMode && !readOnly && isOwner && (
              <div className="bg-[#1A2744] rounded-xl p-4 mb-6 space-y-3">
                <div>
                  <label className="text-xs text-[#C4C4BA]/60 mb-1 block">Photo</label>
                  {editedRecipe?.image_url ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-[#243352]">
                      <img src={editedRecipe.image_url} alt="" className="w-full h-full object-cover" />
                      <label className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer">
                        {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit className="w-3.5 h-3.5" />}
                        Change
                        <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-28 bg-[#243352] rounded-xl border-2 border-dashed border-[#34507a] cursor-pointer hover:border-[#FF6B35]/50 transition">
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#C4C4BA]/60" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-[#C4C4BA]/50 mb-1" />
                          <span className="text-xs text-[#C4C4BA]/60">Add photo</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                  )}
                </div>
                <div>
                  <label className="text-xs text-[#C4C4BA]/60 mb-1 block">Title</label>
                  <input
                    value={editedRecipe?.title || ""}
                    onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                    className="w-full bg-[#243352] border border-[#243352] rounded-lg px-3 py-2 text-[#F5F5F0] text-sm focus:outline-none focus:border-[#FF6B35]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#C4C4BA]/60 mb-1 block">Cook time (min)</label>
                    <input
                      type="number"
                      value={editedRecipe?.cook_time ?? ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, cook_time: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#243352] border border-[#243352] rounded-lg px-3 py-2 text-[#F5F5F0] text-sm focus:outline-none focus:border-[#FF6B35]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#C4C4BA]/60 mb-1 block">Servings</label>
                    <input
                      type="number"
                      value={editedRecipe?.servings ?? ""}
                      onChange={(e) => setEditedRecipe({ ...editedRecipe, servings: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#243352] border border-[#243352] rounded-lg px-3 py-2 text-[#F5F5F0] text-sm focus:outline-none focus:border-[#FF6B35]/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl flex-1"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditMode(false); setEditedRecipe(recipe); }}
                    className="border-[#243352] text-[#C4C4BA] hover:bg-[#243352] rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Ingredients */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-[#C4C4BA] uppercase tracking-wider mb-3">
                Ingredients
              </h2>
              <div className="space-y-2">
                {(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ing, i) => (
                  <div
                    key={i}
                    onClick={() => handleIngredientClick(i)}
                    className={`flex items-center justify-between bg-[#1A2744] rounded-xl px-4 py-3 ${!readOnly ? "cursor-pointer hover:bg-[#243352] transition" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {!readOnly && isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteIngredient(i);
                          }}
                        >
                          <Heart
                            className={`w-4 h-4 ${ing.is_favorite ? "fill-red-500 text-red-500" : "text-[#C4C4BA]/30"}`}
                          />
                        </button>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#F5F5F0]">{ing.name}</span>
                          <span className="text-xs text-[#C4C4BA]">
                            {ing.quantity} {ing.unit}
                          </span>
                        </div>
                        {ing.brand && (
                          <span className="text-xs text-[#C4C4BA]/50">{ing.brand}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const key = (ing.name || "").toLowerCase();
                        if (alreadyHaveSet.has(key)) {
                          return (
                            <span className="text-[10px] bg-[#34D399]/15 text-[#34D399] px-2 py-0.5 rounded-full">
                              Have it
                            </span>
                          );
                        }
                        const c = costByName[key];
                        if (c?.cost != null) {
                          return (
                            <div className="text-right">
                              <span className="text-xs text-[#34D399]">${c.cost?.toFixed(2)}</span>
                              {c.have_quantity > 0 && (
                                <div className="text-[10px] text-[#C4C4BA]/50">have {c.have_quantity}, buy {c.buy_quantity}</div>
                              )}
                            </div>
                          );
                        }
                        if (costLoading) {
                          return <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4C4BA]/40" />;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Card */}
            {recipe.nutrition && <NutritionCard nutrition={recipe.nutrition} servings={recipe.servings} />}

            {/* Steps */}
            {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-[#C4C4BA] uppercase tracking-wider mb-3">
                  Steps
                </h2>
                <div className="space-y-3">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-[#FF6B35]">{i + 1}</span>
                      </div>
                      <p className="text-sm text-[#C4C4BA] leading-relaxed pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Brand picker — search any keyword, swap to any brand (live prices) */}
          {substitutionModalOpen && selectedIngredientIndex != null && !readOnly && (() => {
            const ing = recipe.ingredients?.[selectedIngredientIndex] || {};
            const eff = (p) => (p.sale_price != null ? p.sale_price : p.price);
            const list = brandResults.filter((p) => eff(p) != null);
            return (
              <div
                className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                onClick={() => setSubstitutionModalOpen(false)}
              >
                <div
                  className="w-full max-w-md bg-[#15233A] rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-5 py-4 border-b border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#F5F5F0]">Choose a brand</h3>
                        <p className="text-xs text-[#C4C4BA]/60 line-clamp-1">{ing.name}</p>
                      </div>
                      <button onClick={() => setSubstitutionModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/5">
                        <X className="w-5 h-5 text-[#C4C4BA]" />
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        autoFocus
                        value={brandQuery}
                        onChange={(e) => setBrandQuery(e.target.value)}
                        placeholder="Search any brand (e.g. ground beef)"
                        className="w-full bg-[#1A2744] border border-[#243352] rounded-xl pl-3 pr-9 py-2.5 text-[#F5F5F0] text-sm focus:outline-none focus:border-[#FF6B35]/50"
                      />
                      {brandLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#C4C4BA]/50" />
                      )}
                    </div>
                  </div>
                  <div className="overflow-y-auto p-3 space-y-2">
                    {brandLoading && list.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-[#C4C4BA]/60">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching…
                      </div>
                    ) : list.length === 0 ? (
                      <div className="py-8 text-center text-sm text-[#C4C4BA]/60">
                        {brandQuery.trim().length < 2 ? "Type to search brands" : "No products found"}
                      </div>
                    ) : (
                      list.map((p) => {
                        const isCurrent = p.product_id === ing.product_id;
                        const onSale = p.sale_price != null && p.price != null && p.sale_price < p.price;
                        return (
                          <button
                            key={p.product_id || p.name}
                            onClick={() => handleSwapBrand(p)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                              isCurrent ? "bg-[#FF6B35]/15 ring-1 ring-[#FF6B35]/40" : "bg-[#1A2744] hover:bg-[#243352]"
                            }`}
                          >
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="w-11 h-11 rounded-lg object-cover bg-[#243352]" />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-[#243352]" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#F5F5F0] truncate">{p.name}</p>
                              <p className="text-xs text-[#C4C4BA]/60 truncate">{p.brand}{p.size ? ` · ${p.size}` : ""}</p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <span className="text-sm font-bold text-[#34D399]">${eff(p)?.toFixed(2)}</span>
                              {onSale && <span className="text-[10px] text-[#C4C4BA]/40 line-through ml-1">${p.price.toFixed(2)}</span>}
                              {isCurrent && <div className="text-[10px] text-[#FF6B35]">current</div>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
