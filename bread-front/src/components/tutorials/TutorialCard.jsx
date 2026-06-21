import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Play, Bookmark, BookmarkCheck, Radio, Clock, Eye } from "lucide-react";

export default function TutorialCard({ tutorial, currentUserEmail, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!currentUserEmail || saved || saving) return;
    setSaving(true);

    await base44.entities.SavedTutorial.create({
      user_email: currentUserEmail,
      tutorial_id: tutorial.id,
      tutorial_title: tutorial.title,
      tutorial_thumbnail: tutorial.thumbnail_url || null,
      creator_name: tutorial.creator_name,
      creator_email: tutorial.creator_email,
      is_live: tutorial.is_live,
      video_url: tutorial.video_url || null,
      duration: tutorial.duration || null,
    });

    setSaved(true);
    setSaving(false);
    onSaved?.();
  };

  return (
    <div className="bg-[#1A2744] rounded-2xl overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#15233A]">
        {tutorial.thumbnail_url ? (
          <img src={tutorial.thumbnail_url} alt={tutorial.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 text-[#C4C4BA]/20" />
          </div>
        )}

        {/* Live badge */}
        {tutorial.is_live && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            <Radio className="w-3 h-3" />
            LIVE
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
        </div>

        {/* Save button */}
        {currentUserEmail !== tutorial.creator_email && (
          <button
            onClick={handleSave}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            {saved ? (
              <BookmarkCheck className="w-4 h-4 text-[#FF6B35]" />
            ) : (
              <Bookmark className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-[#F5F5F0] line-clamp-2 mb-1">{tutorial.title}</p>
        <p className="text-xs text-[#C4C4BA]/60 mb-2">{tutorial.creator_name}</p>
        <div className="flex items-center gap-3 text-xs text-[#C4C4BA]/50">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{tutorial.view_count || 0}</span>
          {tutorial.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tutorial.duration}m</span>}
        </div>
      </div>
    </div>
  );
}