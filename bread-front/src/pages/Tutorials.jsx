import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video } from "lucide-react";
import TutorialCard from "../components/tutorials/TutorialCard";

export default function Tutorials() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ["all-tutorials"],
    queryFn: () => base44.entities.Tutorial.list("-created_date", 100),
  });

  const liveTutorials = tutorials.filter((t) => t.is_live);
  const videoTutorials = tutorials.filter((t) => !t.is_live);

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["all-tutorials"] });

  return (
    <div className="min-h-screen bg-[#15233A]">
      <div className="pt-6 px-5 pb-4">
        <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1">Tutorials</h1>
        <p className="text-sm text-[#C4C4BA]/60">Watch & learn from creators</p>
      </div>

      {isLoading ? (
        <div className="px-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-[#1A2744] rounded-2xl aspect-video animate-pulse" />)}
        </div>
      ) : (
        <div className="px-4 space-y-6 pb-8">
          {/* Live Now */}
          {liveTutorials.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#F5F5F0] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Now
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {liveTutorials.map((t) => (
                  <TutorialCard
                    key={t.id}
                    tutorial={t}
                    currentUserEmail={user?.email}
                    onSaved={handleRefresh}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F0] mb-3">All Tutorials</h2>
            {videoTutorials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#C4C4BA]/40">
                <Video className="w-12 h-12 mb-3" />
                <p className="text-base font-medium">No tutorials yet</p>
                <p className="text-sm mt-1">Be the first to upload!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {videoTutorials.map((t) => (
                  <TutorialCard
                    key={t.id}
                    tutorial={t}
                    currentUserEmail={user?.email}
                    onSaved={handleRefresh}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}