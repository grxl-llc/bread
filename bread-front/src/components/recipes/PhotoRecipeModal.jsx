import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { calculateNutrition } from "./nutritionHelper";

export default function PhotoRecipeModal({ open, onClose, onCreated }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleConvert = async () => {
    if (!photoFile) return;
    setProcessing(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract the recipe from this photo of a handwritten or printed recipe. Parse the title, all ingredients with their quantities and units, cooking instructions/steps, cook time, and servings. Be thorough and accurate.`,
      file_urls: [file_url],
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
      title: result.title || "Recipe from Photo",
      image_url: file_url,
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

    setProcessing(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onCreated();
      onClose();
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
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
            <h2 className="text-xl font-bold text-[#F5F5F0]">Convert Recipe from Photo</h2>
            {!processing && !success && (
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
              <h3 className="text-lg font-bold text-[#F5F5F0]">Recipe Extracted!</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#1A2744]">
                  <img src={photoPreview} alt="Recipe" className="w-full h-full object-cover" />
                  {!processing && (
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-64 bg-[#1A2744] rounded-2xl border-2 border-dashed border-[#243352] cursor-pointer hover:border-[#FF6B35]/40 transition">
                  <Camera className="w-12 h-12 text-[#C4C4BA]/40 mb-2" />
                  <span className="text-sm text-[#C4C4BA]/60">Take or upload a photo</span>
                  <span className="text-xs text-[#C4C4BA]/40 mt-1">
                    of a handwritten or printed recipe
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
              )}

              {photoPreview && (
                <Button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting Recipe...
                    </>
                  ) : (
                    "Convert to Recipe"
                  )}
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}