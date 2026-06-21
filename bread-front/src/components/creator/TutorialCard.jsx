import React from "react";
import { motion } from "framer-motion";
import { Eye, Heart, Clock, Play } from "lucide-react";

export default function TutorialCard({ tutorial, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#1A2744] rounded-2xl overflow-hidden cursor-pointer hover:bg-[#243352] transition"
    >
      <div className="relative aspect-video bg-[#243352]">
        {tutorial.thumbnail_url ? (
          <img src={tutorial.thumbnail_url} alt={tutorial.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-[#C4C4BA]/30" />
          </div>
        )}
        {tutorial.is_live && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
        {tutorial.duration && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {tutorial.duration}m
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[#F5F5F0] line-clamp-2 mb-2">{tutorial.title}</h3>
        <div className="flex items-center gap-3 text-xs text-[#C4C4BA]">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {tutorial.view_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {tutorial.like_count || 0}
          </span>
        </div>
      </div>
    </motion.div>
  );
}