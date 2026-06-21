import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { calculateNutrition } from "./nutritionHelper";

export default function ImportRecipeModal({ open, onClose, onCreated }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImport = async () => {
    const source = url.trim() || text.trim();
    if (!source) return;

    setImporting(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract recipe information from this source: ${source}. Parse the title, ingredients with quantities and units, cooking steps, cook time, and servings. Return structured data.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                unit: { type: "string" },
              },
            },
          },
          steps: { type: "array", items: { type: "string" } },
          cook_time: { type: "number" },
          servings: { type: "number" },
        },
      },
    });

    const recipeData = {
      title: result.title || "Imported Recipe",
      ingredients: result.ingredients || [],
      steps: result.steps || [],
      cook_time: result.cook_time || 0,
      servings: result.servings || 4,
      total_cost: 0,
      is_public: false,
    };

    // Calculate nutrition
    const nutrition = await calculateNutrition(recipeData);
    recipeData.nutrition = nutrition;

    await base44.entities.Recipe.create(recipeData);

    setImporting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onCreated();
      onClose();
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setUrl("");
    setText("");
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
          className="w-full max-w-lg bg-[#15233A] rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#F5F5F0]">Import Recipe</h2>
            {!importing && !success && (
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
                <X className="w-5 h-5 text-[#C4C4BA]" />
              </button>
            )}
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F0]">Recipe Imported!</h3>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#C4C4BA] mb-2 block">From URL</label>
                <Input
                  placeholder="https://example.com/recipe"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={importing}
                  className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
                />
              </div>

              <div className="text-center text-[#C4C4BA]/40 text-xs">OR</div>

              <div>
                <label className="text-sm text-[#C4C4BA] mb-2 block">Paste Recipe Text</label>
                <Textarea
                  placeholder="Paste the full recipe text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={importing}
                  className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl resize-none"
                  rows={6}
                />
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || (!url.trim() && !text.trim())}
                className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Recipe"
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}