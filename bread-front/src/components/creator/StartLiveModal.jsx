import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { grantCreatorBadge } from "./CreatorEligibilityChecker";

export default function StartLiveModal({ open, onClose, onStarted, user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dishName, setDishName] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [starting, setStarting] = useState(false);

  const { data: recipes = [] } = base44.entities.Recipe.filter({ created_by: user?.email });

  const handleStart = async () => {
    if (!title.trim() || !dishName.trim()) return;
    setStarting(true);

    const tutorial = await base44.entities.Tutorial.create({
      creator_email: user.email,
      creator_name: user.full_name,
      title: title.trim(),
      description: description.trim(),
      dish_name: dishName.trim(),
      recipe_id: recipeId || null,
      is_live: true,
      is_replay: false,
      visibility: "public",
      view_count: 0,
      like_count: 0,
    });

    await base44.entities.LiveSession.create({
      tutorial_id: tutorial.id,
      creator_email: user.email,
      start_time: new Date().toISOString(),
      viewer_count: 0,
      peak_viewers: 0,
      ad_breaks_triggered: 0,
      total_watch_time: 0,
    });

    // Check and grant creator badge
    await grantCreatorBadge(user.email);

    setStarting(false);
    onStarted(tutorial);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDishName("");
    setRecipeId("");
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
          className="w-full max-w-md bg-[#15233A] rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-[#FF6B35]" />
              <h2 className="text-xl font-bold text-[#F5F5F0]">Go Live</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Tutorial title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
            />

            <Input
              placeholder="What dish are you cooking?"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
            />

            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl resize-none"
              rows={3}
            />

            <Select value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl">
                <SelectValue placeholder="Link a recipe (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2744] border-[#243352]">
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id} className="text-[#F5F5F0]">
                    {recipe.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleStart}
              disabled={starting || !title.trim() || !dishName.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-semibold"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Start Live Tutorial
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}