import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { calculateNutrition } from "./nutritionHelper";
import IngredientAutocomplete from "./IngredientAutocomplete";
import { UNITS, DEFAULT_UNIT } from "@/lib/units";
import { useEffectiveZip } from "@/lib/location";

export default function ManualRecipeModal({ open, onClose, onCreated, user }) {
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("4");
  const [isPublic, setIsPublic] = useState(false);
  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "", unit: DEFAULT_UNIT, product: null },
  ]);
  const [steps, setSteps] = useState([""]);
  const [saving, setSaving] = useState(false);
  const effectiveZip = useEffectiveZip(user);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: DEFAULT_UNIT, product: null }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, value) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    try {
      // Image upload is optional — don't block the save if S3 isn't configured
      let imageUrl = "";
      if (imageFile) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
          imageUrl = file_url;
        } catch (e) {
          console.warn("Image upload failed (S3 not configured?) — saving without image", e);
        }
      }

      const cleanIngredients = ingredients.filter((ing) => ing.name.trim());

      // Pantry names — items already owned are excluded from the cost.
      let pantryNames = [];
      try {
        const pantry = await base44.entities.PantryItem.list("-created_date", 200);
        pantryNames = (pantry || []).map((p) => (p.name || "").toLowerCase()).filter(Boolean);
      } catch { /* no pantry → everything is bought */ }
      const inPantry = (n) => {
        const x = (n || "").toLowerCase();
        return pantryNames.some((pn) => pn.length > 2 && (x.includes(pn) || pn.includes(x)));
      };

      // Build each stored ingredient with its chosen product's price/brand/image
      // flattened on, and sum the cheapest packages (skipping pantry items).
      let total = 0;
      const pricedIngredients = [];
      for (const ing of cleanIngredients) {
        const owned = inPantry(ing.name);
        let price = ing.product?.price ?? null;
        let brand = ing.product?.brand ?? ing.brand ?? null;
        let image_url = ing.product?.image_url ?? null;
        let product_id = ing.product?.product_id ?? null;

        // "Any brand" / typed-only with no selected product → look up cheapest package
        if (price == null && effectiveZip && !owned) {
          try {
            const found = await base44.pricing.search(ing.name.trim(), effectiveZip, 8);
            const priced = (found || []).filter((p) => (p.sale_price ?? p.price) != null);
            if (priced.length) {
              const cheapest = priced.reduce((a, b) =>
                (a.sale_price ?? a.price) <= (b.sale_price ?? b.price) ? a : b);
              price = cheapest.sale_price ?? cheapest.price;
              brand = brand || cheapest.brand;
              image_url = image_url || cheapest.image_url;
              product_id = product_id || cheapest.product_id;
            }
          } catch { /* leave unpriced */ }
        }

        if (!owned && price != null) total += price;

        pricedIngredients.push({
          name: ing.name.trim(),
          quantity: ing.quantity,
          unit: ing.unit,
          brand: brand || null,
          image_url: image_url || null,
          product_id: product_id || null,
          search_term: ing.product?.search_term || null,  // what the user typed → reused for brand swaps
          price: owned ? 0 : (price ?? null),
          already_have: owned,
        });
      }

      const recipeData = {
        title: title.trim(),
        image_url: imageUrl,
        ingredients: pricedIngredients,
        steps: steps.filter((s) => s.trim()),
        cook_time: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 4,
        is_public: isPublic,
        total_cost: Math.round(total * 100) / 100,
        cheapest_store: total > 0 ? "Kroger" : undefined,
      };

      // Nutrition is optional — needs the LLM key; never block the save on it
      try {
        recipeData.nutrition = await calculateNutrition(recipeData);
      } catch (e) {
        console.warn("Nutrition calc failed (LLM key not set?) — saving without nutrition", e);
        recipeData.nutrition = null;
      }

      await base44.entities.Recipe.create(recipeData);

      onCreated();
      onClose();
      resetForm();
    } catch (e) {
      console.error("Failed to save recipe", e);
      alert("Couldn't save the recipe. Check the backend terminal for details.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setImageFile(null);
    setImagePreview(null);
    setCookTime("");
    setServings("4");
    setIsPublic(false);
    setIngredients([{ name: "", quantity: "", unit: DEFAULT_UNIT, product: null }]);
    setSteps([""]);
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#15233A] rounded-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-[#15233A] px-6 py-4 border-b border-white/5 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#F5F5F0]">Add Recipe Manually</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
                <X className="w-5 h-5 text-[#C4C4BA]" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <Input
              placeholder="Recipe Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
            />

            <div>
              <label className="block text-sm text-[#C4C4BA] mb-2">Recipe Image</label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#1A2744]">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 bg-[#1A2744] rounded-2xl border-2 border-dashed border-[#243352] cursor-pointer hover:border-[#FF6B35]/40 transition">
                  <Upload className="w-6 h-6 text-[#C4C4BA]/40 mb-1" />
                  <span className="text-xs text-[#C4C4BA]/60">Upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Cook Time (min)"
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
              />
              <Input
                placeholder="Servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between bg-[#1A2744] rounded-xl p-3">
              <span className="text-sm text-[#F5F5F0]">Make recipe public</span>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#F5F5F0]">Ingredients</label>
                <Button onClick={addIngredient} size="sm" variant="ghost" className="text-[#FF6B35]">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <IngredientAutocomplete
                      value={ing.name}
                      userZip={effectiveZip}
                      onChange={(name) => updateIngredient(i, "name", name)}
                      onSelect={(product) => updateIngredient(i, "product", product)}
                    />
                    <Input
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                      className="w-16 bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
                    />
                    <Select
                      value={ing.unit}
                      onValueChange={(v) => updateIngredient(i, "unit", v)}
                    >
                      <SelectTrigger className="w-24 bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A2744] border-[#243352]">
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u} className="text-[#F5F5F0]">{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => removeIngredient(i)}
                      size="icon"
                      variant="ghost"
                      className="text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#F5F5F0]">Steps</label>
                <Button onClick={addStep} size="sm" variant="ghost" className="text-[#FF6B35]">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-2">
                    <Textarea
                      placeholder={`Step ${i + 1}`}
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                      className="flex-1 bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={() => removeStep(i)}
                      size="icon"
                      variant="ghost"
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Recipe"
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}