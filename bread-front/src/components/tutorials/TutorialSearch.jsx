import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import SavedTutorialCard from "./SavedTutorialCard";

export default function TutorialSearch({ userEmail, onSaveTutorial }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: allTutorials = [] } = useQuery({
    queryKey: ["all-tutorials"],
    queryFn: () => base44.entities.Tutorial.list("-created_date", 200),
  });

  const { data: savedTutorialIds = [] } = useQuery({
    queryKey: ["saved-tutorials-ids", userEmail],
    queryFn: async () => {
      const saved = await base44.entities.SavedTutorial.filter({ user_email: userEmail });
      return Array.isArray(saved) ? saved.map((s) => s.tutorial_id) : [];
    },
    enabled: !!userEmail,
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    const results = (Array.isArray(allTutorials) ? allTutorials : []).filter((tutorial) => {
      const titleMatch = tutorial.title?.toLowerCase().includes(lowerQuery);
      const creatorMatch = tutorial.creator_name?.toLowerCase().includes(lowerQuery);
      const dishMatch = tutorial.dish_name?.toLowerCase().includes(lowerQuery);
      return titleMatch || creatorMatch || dishMatch;
    });
    setSearchResults(results);
  };

  const handleSave = async (tutorial) => {
    if (!userEmail) return;
    await base44.entities.SavedTutorial.create({
      user_email: userEmail,
      tutorial_id: tutorial.id,
      tutorial_title: tutorial.title,
      tutorial_thumbnail: tutorial.thumbnail_url,
      creator_name: tutorial.creator_name,
      creator_email: tutorial.creator_email,
      is_live: tutorial.is_live,
      video_url: tutorial.video_url,
      duration: tutorial.duration,
    });
    onSaveTutorial?.();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-[#C4C4BA]/50" />
        <input
          type="text"
          placeholder="Search tutorials by title, creator, or dish..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-[#1A2744] border border-[#243352] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-3 text-[#C4C4BA]/50 hover:text-[#C4C4BA]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearching && searchResults.length > 0 && (
        <div>
          <p className="text-xs text-[#C4C4BA]/60 mb-3">
            Found {searchResults.length} tutorial{searchResults.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {searchResults.map((tutorial) => {
              const isSaved = savedTutorialIds.includes(tutorial.id);
              return (
                <div key={tutorial.id} className="relative">
                  <div className="bg-[#1A2744] rounded-xl overflow-hidden">
                    {tutorial.thumbnail_url && (
                      <img
                        src={tutorial.thumbnail_url}
                        alt={tutorial.title}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-[#F5F5F0] truncate">
                        {tutorial.title}
                      </p>
                      <p className="text-[10px] text-[#C4C4BA]/60 truncate">
                        {tutorial.creator_name}
                      </p>
                    </div>
                  </div>
                  {!isSaved && (
                    <button
                      onClick={() => handleSave(tutorial)}
                      className="absolute top-2 right-2 bg-[#FF6B35] hover:bg-[#FF8555] text-white text-xs px-2 py-1 rounded"
                    >
                      Save
                    </button>
                  )}
                  {isSaved && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Saved
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isSearching && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-6 text-[#C4C4BA]/40">
          <p className="text-sm">No tutorials found</p>
        </div>
      )}
    </div>
  );
}