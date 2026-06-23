import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, XCircle, ChevronDown, Search } from "lucide-react";

const TIERS = ["starter", "pro", "elite"];

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function StatPill({ label, value, color = "text-[#C4C4BA]" }) {
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <span className={`text-sm font-bold ${color}`}>{value ?? "—"}</span>
      <span className="text-[10px] text-[#C4C4BA]/50 leading-tight text-center">{label}</span>
    </div>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["admin-all-posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 1000),
  });

  const { data: allRecipes = [] } = useQuery({
    queryKey: ["admin-all-recipes"],
    queryFn: () => base44.entities.Recipe.list("-created_date", 1000),
  });

  const { data: allTutorials = [] } = useQuery({
    queryKey: ["admin-all-tutorials"],
    queryFn: () => base44.entities.Tutorial.list("-created_date", 1000),
  });

  // Build email → counts map
  const statsByEmail = useMemo(() => {
    const map = {};
    for (const p of allPosts) {
      const e = p.created_by;
      if (!e) continue;
      map[e] = map[e] || {};
      map[e].posts = (map[e].posts || 0) + 1;
    }
    for (const r of allRecipes) {
      const e = r.created_by;
      if (!e) continue;
      map[e] = map[e] || {};
      map[e].recipes = (map[e].recipes || 0) + 1;
    }
    for (const t of allTutorials) {
      const e = t.creator_email;
      if (!e) continue;
      map[e] = map[e] || {};
      map[e].tutorials = (map[e].tutorials || 0) + 1;
    }
    return map;
  }, [allPosts, allRecipes, allTutorials]);

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  if (loadingUsers) {
    return (
      <div className="space-y-2 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1A2744] rounded-xl h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BA]/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="w-full bg-[#1A2744] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F5F5F0] placeholder-[#C4C4BA]/30 outline-none focus:border-[#FF6B35]/40"
        />
      </div>

      {/* Count */}
      <p className="text-xs text-[#C4C4BA]/40 px-0.5">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      {/* User cards */}
      <div className="space-y-2">
        {filtered.map((u) => {
          const stats = statsByEmail[u.email] || {};
          const joined = daysSince(u.account_created_at || u.created_date);
          const totalContributions =
            (stats.posts || 0) + (stats.recipes || 0) + (stats.tutorials || 0);

          return (
            <div
              key={u.id}
              className="bg-[#1A2744] rounded-xl px-4 py-3 space-y-3"
            >
              {/* Top row: avatar + name/email + creator badge */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    u.is_creator
                      ? "bg-[#FF6B35]/30 text-[#FF6B35]"
                      : "bg-[#243352] text-[#C4C4BA]"
                  }`}
                >
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (u.full_name || u.email || "U")[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-[#F5F5F0] font-medium truncate">
                      {u.full_name || "(no name)"}
                    </p>
                    {u.is_creator && (
                      <span className="text-[10px] bg-[#FF6B35]/20 text-[#FF6B35] px-1.5 py-0.5 rounded-full font-semibold">
                        Creator · {u.creator_tier || "starter"}
                      </span>
                    )}
                    {u.is_admin && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#C4C4BA]/40 truncate">{u.email}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-1 bg-[#15233A] rounded-lg px-3 py-2 justify-between">
                <StatPill
                  label="days ago"
                  value={joined}
                  color={joined != null && joined < 7 ? "text-[#34D399]" : "text-[#F5F5F0]"}
                />
                <div className="w-px h-6 bg-white/5" />
                <StatPill label="posts" value={stats.posts || 0} color="text-[#F5F5F0]" />
                <div className="w-px h-6 bg-white/5" />
                <StatPill label="recipes" value={stats.recipes || 0} color="text-[#F5F5F0]" />
                <div className="w-px h-6 bg-white/5" />
                <StatPill label="tutorials" value={stats.tutorials || 0} color="text-[#F5F5F0]" />
                <div className="w-px h-6 bg-white/5" />
                <StatPill
                  label="total"
                  value={totalContributions}
                  color={totalContributions > 0 ? "text-[#FF6B35]" : "text-[#C4C4BA]/50"}
                />
              </div>

              {/* Bottom row: creator controls */}
              <div className="flex items-center gap-2">
                {u.is_creator ? (
                  <>
                    <select
                      value={u.creator_tier || "starter"}
                      onChange={(e) => setTier(u, e.target.value)}
                      className="flex-1 bg-[#243352] text-[#F5F5F0] text-xs rounded-lg px-2 py-1.5 border border-white/10 outline-none"
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => toggleCreator(u, false)}
                      className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => toggleCreator(u, true)}
                    className="flex items-center gap-1.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-semibold px-3 py-1.5 rounded-lg transition ml-auto"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Make Creator
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
