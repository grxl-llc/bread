import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, DollarSign, MapPin, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function SmartSubstitutionModal({ open, onClose, ingredient, originalPrice = 0, onReplace }) {
  const [loading, setLoading] = useState(false);
  const [substitutions, setSubstitutions] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && ingredient) {
      loadSubstitutions();
    }
  }, [open, ingredient]);

  const loadSubstitutions = async () => {
    setLoading(true);

    const hasPantryAccess = user?.pantry_subscription;
    const hasSmartPricing = user?.smart_pricing_enabled && user?.zip_code;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest 4-5 smart substitutions for this ingredient: "${ingredient?.name}" (${ingredient?.quantity} ${ingredient?.unit}). Include: 1) Cheaper alternatives, 2) Healthier alternatives, 3) ${hasPantryAccess ? "Pantry-based alternatives (common pantry items)" : "Common alternatives"}, 4) ${user?.preferred_brands?.length > 0 ? `Brand-specific alternatives from: ${user.preferred_brands.map(b => b.brand).join(", ")}` : "Popular brand alternatives"}. ${hasSmartPricing ? `For ZIP code ${user.zip_code} and stores ${user.preferred_stores?.join(", ")}, provide price estimates and cheapest store for each.` : ""} Return structured data.`,
      response_json_schema: {
        type: "object",
        properties: {
          substitutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                unit: { type: "string" },
                price: { type: "number" },
                store: { type: "string" },
                category: { type: "string", enum: ["cheaper", "healthier", "pantry", "brand"] },
                reason: { type: "string" },
              },
            },
          },
        },
      },
    });

    setSubstitutions(result.substitutions || []);
    setLoading(false);
  };

  const handleReplace = (substitution) => {
    onReplace({
      name: substitution.name,
      quantity: substitution.quantity || ingredient.quantity,
      unit: substitution.unit || ingredient.unit,
      price: substitution.price || 0,
      cheapest_store: substitution.store || "",
    });
    onClose();
  };

  if (!open) return null;

  const categoryColors = {
    cheaper: "bg-green-500/20 text-green-400",
    healthier: "bg-blue-500/20 text-blue-400",
    pantry: "bg-purple-500/20 text-purple-400",
    brand: "bg-orange-500/20 text-orange-400",
  };

  const categoryLabels = {
    cheaper: "Cheaper",
    healthier: "Healthier",
    pantry: "Pantry",
    brand: "Brand",
  };

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
              <div>
                <h2 className="text-xl font-bold text-[#F5F5F0]">Smart Substitutions</h2>
                <p className="text-sm text-[#C4C4BA]/60 mt-0.5">
                  {ingredient?.quantity} {ingredient?.unit} {ingredient?.name}
                </p>
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
                <p className="text-sm text-[#C4C4BA]/60">Finding substitutions...</p>
              </div>
            ) : substitutions.length === 0 ? (
              <div className="text-center py-8 text-[#C4C4BA]/40">
                <p className="text-sm">No substitutions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {substitutions.map((sub, index) => {
                  const savings = originalPrice > 0 && sub.price > 0 ? originalPrice - sub.price : 0;
                  return (
                    <div
                      key={index}
                      className="bg-[#1A2744] rounded-2xl p-4 hover:bg-[#243352] transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-[#F5F5F0]">{sub.name}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                categoryColors[sub.category] || "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {categoryLabels[sub.category] || sub.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#C4C4BA]/60 mb-2">
                            {sub.quantity} {sub.unit} • {sub.reason}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            {sub.price > 0 && (
                              <span className="flex items-center gap-1 text-[#34D399]">
                                <DollarSign className="w-3 h-3" />
                                ${sub.price.toFixed(2)}
                              </span>
                            )}
                            {sub.store && (
                              <span className="flex items-center gap-1 text-[#C4C4BA]/60">
                                <MapPin className="w-3 h-3" />
                                {sub.store}
                              </span>
                            )}
                            {savings > 0 && (
                              <span className="flex items-center gap-1 text-green-400">
                                <TrendingDown className="w-3 h-3" />
                                Save ${savings.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleReplace(sub)}
                        size="sm"
                        className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl mt-2"
                      >
                        Replace Ingredient
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}