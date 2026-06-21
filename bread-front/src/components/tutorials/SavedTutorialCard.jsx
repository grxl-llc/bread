import React from "react";
import { Play, Radio, Clock, Trash2 } from "lucide-react";

export default function SavedTutorialCard({ saved, onDelete }) {
  return (
    <div className="bg-[#1A2744] rounded-2xl overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#15233A]">
        {saved.tutorial_thumbnail ? (
          <img src={saved.tutorial_thumbnail} alt={saved.tutorial_title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 text-[#C4C4BA]/20" />
          </div>
        )}

        {saved.is_live && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            <Radio className="w-3 h-3" />
            Saved Live
          </div>
        )}

        <button
          onClick={() => onDelete?.(saved.id)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold text-[#F5F5F0] line-clamp-2 mb-1">{saved.tutorial_title}</p>
        <p className="text-xs text-[#C4C4BA]/60 mb-1">by {saved.creator_name}</p>
        {saved.duration && (
          <span className="flex items-center gap-1 text-xs text-[#C4C4BA]/50">
            <Clock className="w-3 h-3" />{saved.duration}m
          </span>
        )}
      </div>
    </div>
  );
}