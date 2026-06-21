import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, Zap, Crown } from "lucide-react";

const TIER_CONFIG = {
  starter: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Starter" },
  pro: { icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10", label: "Pro" },
  elite: { icon: Crown, color: "text-purple-400", bg: "bg-purple-400/10", label: "Elite" },
};

export default function AdminPartners() {
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list("-created_date", 200),
  });

  const creators = allUsers.filter((u) => u.is_creator && u.creator_tier);
  const byTier = { starter: [], pro: [], elite: [] };
  creators.forEach((u) => {
    if (byTier[u.creator_tier]) byTier[u.creator_tier].push(u);
  });

  if (isLoading) return <div className="text-[#C4C4BA]/60 text-sm py-10 text-center">Loading...</div>;

  return (
    <div className="space-y-5 pb-6">
      <p className="text-xs text-[#C4C4BA]/50">Creators organized by partnership tier. Assign tiers in the Creators tab.</p>
      {Object.entries(TIER_CONFIG).map(([tier, config]) => {
        const Icon = config.icon;
        const members = byTier[tier];
        return (
          <div key={tier} className="bg-[#1A2744] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-[#F5F5F0]">{config.label} Tier</h3>
              <span className="ml-auto text-xs text-[#C4C4BA]/50">{members.length} creators</span>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-[#C4C4BA]/30 py-2 text-center">No creators at this tier</p>
            ) : (
              <div className="space-y-2">
                {members.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 bg-[#15233A] rounded-xl px-3 py-2">
                    <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center text-xs font-bold ${config.color}`}>
                      {(u.full_name || u.email || "U")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F5F5F0] truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-[#C4C4BA]/40 truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}