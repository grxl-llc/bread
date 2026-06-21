import React from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function CollectionCard({ collection, recipeCount, thumbnail, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-[#1A2744] rounded-2xl overflow-hidden cursor-pointer hover:bg-[#243352] transition"
    >
      <div className="relative aspect-video bg-[#243352]">
        {thumbnail ? (
          <img src={thumbnail} alt={collection.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#C4C4BA]/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-2">
            {collection.emoji && <span className="text-xl">{collection.emoji}</span>}
            <h3 className="text-sm font-bold text-white truncate">{collection.name}</h3>
          </div>
          <p className="text-xs text-white/70 mt-0.5">{recipeCount} recipes</p>
        </div>
      </div>
    </motion.div>
  );
}