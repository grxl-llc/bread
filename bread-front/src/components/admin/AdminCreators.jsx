import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, UserCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIERS = ["starter", "pro", "elite"];

export default function AdminCreators() {
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list("-created_date", 200),
  });

  const creators = allUsers.filter((u) => u.is_creator);
  const nonCreators = allUsers.filter((u) => !u.is_creator);

  const toggleCreator = async (user, makeCreator) => {
    await base44.entities.User.update(user.id, {
      is_creator: makeCreator,
      creator_tier: makeCreator ? (user.creator_tier || "starter") : null,
    });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const setTier = async (user, tier) => {
    await base44.entities.User.update(user.id, { creator_tier: tier });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  if (isLoading) return <div className="text-[#C4C4BA]/60 text-sm py-10 text-center">Loading users...</div>;

  return (
    <div className="space-y-6 pb-6">
      {/* Active Creators */}
      <div>
        <h2 className="text-sm font-semibold text-[#F5F5F0] mb-3">Active Creators ({creators.length})</h2>
        {creators.length === 0 ? (
          <p className="text-xs text-[#C4C4BA]/40 py-4 text-center">No creators yet</p>
        ) : (
          <div className="space-y-2">
            {creators.map((u) => (
              <div key={u.id} className="bg-[#1A2744] rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-sm font-bold text-[#FF6B35] flex-shrink-0">
                  {(u.full_name || u.email || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F5F5F0] font-medium truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-[#C4C4BA]/50 truncate">{u.email}</p>
                </div>
                {/* Tier selector */}
                <select
                  value={u.creator_tier || "starter"}
                  onChange={(e) => setTier(u, e.target.value)}
                  className="bg-[#243352] text-[#F5F5F0] text-xs rounded-lg px-2 py-1.5 border border-white/10 outline-none"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleCreator(u, false)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition"
                  title="Remove creator"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Users - add as creator */}
      <div>
        <h2 className="text-sm font-semibold text-[#F5F5F0] mb-3">All Users</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {nonCreators.map((u) => (
            <div key={u.id} className="bg-[#1A2744]/60 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#243352] flex items-center justify-center text-xs font-bold text-[#C4C4BA] flex-shrink-0">
                {(u.full_name || u.email || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F5F5F0] truncate">{u.full_name || u.email}</p>
                <p className="text-xs text-[#C4C4BA]/40 truncate">{u.email}</p>
              </div>
              <button
                onClick={() => toggleCreator(u, true)}
                className="flex items-center gap-1.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Make Creator
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}