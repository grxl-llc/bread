import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

const emojiOptions = ["📚", "❤️", "⭐", "🍕", "🥗", "🍰", "🍜", "🌮", "🍔", "🥘"];

export default function CreateCollectionModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    await base44.entities.RecipeCollection.create({
      name: name.trim(),
      emoji: selectedEmoji,
      recipe_ids: [],
    });

    setSaving(false);
    onCreated();
    onClose();
    setName("");
    setSelectedEmoji("");
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
            <h2 className="text-xl font-bold text-[#F5F5F0]">New Collection</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Collection name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl"
            />

            <div>
              <label className="text-sm text-[#C4C4BA] mb-2 block">Choose an emoji (optional)</label>
              <div className="grid grid-cols-5 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji === selectedEmoji ? "" : emoji)}
                    className={`text-2xl p-3 rounded-xl transition ${
                      selectedEmoji === emoji
                        ? "bg-[#FF6B35]/20 ring-2 ring-[#FF6B35]"
                        : "bg-[#1A2744] hover:bg-[#243352]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Collection"
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}