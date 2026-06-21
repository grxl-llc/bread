import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, Bell, Settings, ShoppingBag, Users, Plus, Trash2, Globe, Lock, Video, TrendingUp, Info, DollarSign, LogOut, Eye, Clock, Award, ChevronDown, ChevronUp, Radio, Camera, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import BadgeDisplay from "../components/badges/BadgeDisplay";
import StartLiveModal from "../components/tutorials/StartLiveModal";
import UploadTutorialModal from "../components/tutorials/UploadTutorialModal";
import TutorialCard from "../components/tutorials/TutorialCard";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStartLive, setShowStartLive] = useState(false);
  const [showUploadTutorial, setShowUploadTutorial] = useState(false);
  const [showHousehold, setShowHousehold] = useState(false);
  const [showShoppingAccounts, setShowShoppingAccounts] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", age: "", serving_size: "1" });
  const navigate = useNavigate();

  const { data: tutorials = [] } = useQuery({
    queryKey: ["user-tutorials", user?.email],
    queryFn: () => base44.entities.Tutorial.filter({ creator_email: user.email }, "-created_date", 20),
    enabled: !!user,
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ["creator-earnings", user?.email],
    queryFn: () => base44.entities.CreatorEarnings.filter({ creator_email: user.email }, "-created_date", 500),
    enabled: !!user && user.badges?.includes("creator"),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["creator-sessions", user?.email],
    queryFn: () => base44.entities.LiveSession.filter({ creator_email: user.email }, "-created_date", 100),
    enabled: !!user && user.badges?.includes("creator"),
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setLoading(false);
  };

  const calculateAgeGroup = (age) => {
    if (age < 2) return "baby";
    if (age < 13) return "kid";
    if (age < 18) return "teen";
    return "adult";
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.age) return;

    const age = parseInt(newMember.age);
    const member = {
      name: newMember.name,
      age,
      age_group: calculateAgeGroup(age),
      serving_size: parseFloat(newMember.serving_size) || 1,
    };

    const members = [...(user.household_members || []), member];
    await base44.auth.updateMe({ household_members: members });
    await loadUser();
    setNewMember({ name: "", age: "", serving_size: "1" });
  };

  const handleRemoveMember = async (index) => {
    const members = user.household_members.filter((_, i) => i !== index);
    await base44.auth.updateMe({ household_members: members });
    await loadUser();
  };

  const toggleHouseholdPublic = async () => {
    await base44.auth.updateMe({ household_public: !user.household_public });
    await loadUser();
  };

  const toggleAccountConnection = async (provider) => {
    const connected = {
      ...user.connected_accounts,
      [provider]: !user.connected_accounts?.[provider],
    };
    await base44.auth.updateMe({ connected_accounts: connected });
    await loadUser();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    await loadUser();
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      base44.auth.logout();
    }
  };

  const calculateEarnings = (period) => {
    const now = new Date();
    let startDate;

    if (period === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === "week") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === "month") {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      return earnings.reduce((sum, e) => sum + e.amount, 0);
    }

    return earnings
      .filter((e) => new Date(e.created_date) >= startDate)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const earningsBySource = {
    live_ad: earnings.filter((e) => e.source_type === "live_ad").reduce((sum, e) => sum + e.amount, 0),
    replay_ad: earnings.filter((e) => e.source_type === "replay_ad").reduce((sum, e) => sum + e.amount, 0),
    sponsored: earnings.filter((e) => e.source_type === "sponsored").reduce((sum, e) => sum + e.amount, 0),
    subscription: earnings.filter((e) => e.source_type === "subscription").reduce((sum, e) => sum + e.amount, 0),
  };

  const totalViews = tutorials.reduce((sum, t) => sum + (t.view_count || 0), 0);
  const totalWatchTime = sessions.reduce((sum, s) => sum + (s.total_watch_time || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <p className="text-[#C4C4BA]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A] pb-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-[#1A2744] to-[#15233A] pt-6 px-5 pb-8">
        <div className="flex flex-col items-center">
          <label className="relative cursor-pointer group mb-3">
            <div className="w-24 h-24 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-3xl font-bold text-[#FF6B35] overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user.full_name?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
          <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1">{user.full_name}</h1>
          <p className="text-sm text-[#C4C4BA]/60 mb-3">{user.email}</p>
          {user.badges?.length > 0 && (
            <div className="mb-3">
              <BadgeDisplay badges={user.badges} />
            </div>
          )}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-xl font-bold text-[#F5F5F0]">{user.followers_count || 0}</p>
              <p className="text-xs text-[#C4C4BA]">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#F5F5F0]">{user.following_count || 0}</p>
              <p className="text-xs text-[#C4C4BA]">Following</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid gap-3" style={{ gridTemplateColumns: user.is_creator ? "repeat(3, 1fr)" : "repeat(2, 1fr)" }}>
          <Button
            onClick={() => navigate(createPageUrl("Messages"))}
            className="bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-14 flex-col gap-1"
          >
            <Mail className="w-5 h-5" />
            <span className="text-xs">Messages</span>
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("Notifications"))}
            className="bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-14 flex-col gap-1"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Notifications</span>
          </Button>
          {user.is_creator && (
            <Button
              onClick={() => navigate("/CreatorDashboard")}
              className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-14 flex-col gap-1"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Creator Hub</span>
            </Button>
          )}
        </div>

        {/* Bread+ Membership */}
        <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF8555] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🍞</span>
            <h2 className="text-lg font-bold text-white">Bread+ Membership</h2>
          </div>
          
          {user?.bread_plus_active || user?.subscription_status === "active" ? (
            <>
              <p className="text-sm text-white/90 mb-4">
                You're a Bread+ member! Enjoy unlimited features.
              </p>
              <Button
                onClick={() => {
                  // Open Base44's built-in subscription management
                  window.open('/settings/subscription', '_blank');
                }}
                className="w-full bg-white hover:bg-white/90 text-[#FF6B35] rounded-xl h-12 font-semibold"
              >
                Manage Bread+ Subscription
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-white/90 mb-3">
                Unlock premium features and enhance your cooking experience
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-white/90">
                  <span className="text-sm">✓</span>
                  <span className="text-xs">Smart Pantry Suggestions</span>
                </div>
                <div className="flex items-start gap-2 text-white/90">
                  <span className="text-sm">✓</span>
                  <span className="text-xs">Pantry access after 30-day trial</span>
                </div>
                <div className="flex items-start gap-2 text-white/90">
                  <span className="text-sm">✓</span>
                  <span className="text-xs">Exclusive coupons and deals</span>
                </div>
              </div>
              <Button
                onClick={async () => {
                  // Use Base44's subscription system
                  await base44.auth.updateMe({ subscription_status: "active", bread_plus_active: true });
                  await loadUser();
                }}
                className="w-full bg-white hover:bg-white/90 text-[#FF6B35] rounded-xl h-12 font-semibold"
              >
                Upgrade to Bread+
              </Button>
            </>
          )}
        </div>

        {/* Creator Tools */}
        {user.badges?.includes("creator") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
              <h2 className="text-sm font-semibold text-[#F5F5F0]">Creator Earnings</h2>
            </div>

            <Button
              onClick={() => navigate(createPageUrl("MonetizationInfo"))}
              className="w-full bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-12 gap-2"
            >
              <Info className="w-4 h-4" />
              Monetization Info
            </Button>

            {/* Earnings Overview */}
            <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF8555] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold text-white">Total Earnings</h3>
              </div>
              <p className="text-3xl font-bold text-white mb-4">
                ${calculateEarnings("lifetime").toFixed(2)}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-white/80">Today</p>
                  <p className="text-base font-bold text-white">${calculateEarnings("today").toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/80">Week</p>
                  <p className="text-base font-bold text-white">${calculateEarnings("week").toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/80">Month</p>
                  <p className="text-base font-bold text-white">${calculateEarnings("month").toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-[#1A2744] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-[#F5F5F0] mb-3">Revenue by Source</h3>
              <div className="space-y-2">
                {[
                  { key: "live_ad", label: "Live Tutorial Ads", color: "bg-green-500" },
                  { key: "replay_ad", label: "Replay Ads", color: "bg-blue-500" },
                  { key: "sponsored", label: "Sponsored Content", color: "bg-purple-500" },
                  { key: "subscription", label: "Subscriptions", color: "bg-yellow-500" },
                ].map((source) => (
                  <div key={source.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#C4C4BA]">{source.label}</span>
                      <span className="text-[#F5F5F0] font-semibold">
                        ${earningsBySource[source.key].toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-[#15233A] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${source.color}`}
                        style={{
                          width: `${
                            calculateEarnings("lifetime") > 0
                              ? (earningsBySource[source.key] / calculateEarnings("lifetime")) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1A2744] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-[#34D399]" />
                  <h3 className="text-xs font-semibold text-[#C4C4BA]">Total Views</h3>
                </div>
                <p className="text-2xl font-bold text-[#F5F5F0]">{totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-[#1A2744] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#FF6B35]" />
                  <h3 className="text-xs font-semibold text-[#C4C4BA]">Watch Time</h3>
                </div>
                <p className="text-2xl font-bold text-[#F5F5F0]">{totalWatchTime}m</p>
              </div>
            </div>

            {/* Creator Badges */}
            {user.badges?.length > 1 && (
              <div className="bg-[#1A2744] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-[#FF6B35]" />
                  <h3 className="text-sm font-semibold text-[#F5F5F0]">Your Badges</h3>
                </div>
                <BadgeDisplay badges={user.badges} />
              </div>
            )}
          </div>
        )}

        {/* Household Section - Collapsible */}
        <div className="bg-[#1A2744] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHousehold(!showHousehold)}
            className="w-full flex items-center justify-between px-4 py-4"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-sm font-semibold text-[#F5F5F0]">Household Members</span>
              {user.household_members?.length > 0 && (
                <span className="text-xs bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-0.5 rounded-full">
                  {user.household_members.length}
                </span>
              )}
            </div>
            {showHousehold ? (
              <ChevronUp className="w-4 h-4 text-[#C4C4BA]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#C4C4BA]" />
            )}
          </button>

          {showHousehold && (
            <div className="px-4 pb-4 space-y-3">
              {user.household_members?.length > 0 ? (
                <div className="space-y-2">
                  {user.household_members.map((member, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#15233A] rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm text-[#F5F5F0]">{member.name}</p>
                        <p className="text-xs text-[#C4C4BA]/60 capitalize">
                          {member.age_group} · {member.serving_size || 1} serving{(member.serving_size || 1) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button onClick={() => handleRemoveMember(i)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#C4C4BA]/60">No household members added yet</p>
              )}

              {/* Add member form */}
              <div className="space-y-2 pt-1">
                <Input
                  placeholder="Name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Age"
                    type="number"
                    value={newMember.age}
                    onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                    className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
                  />
                  <Input
                    placeholder="Serving size"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newMember.serving_size}
                    onChange={(e) => setNewMember({ ...newMember, serving_size: e.target.value })}
                    className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!newMember.name || !newMember.age}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <div className="flex items-center justify-between bg-[#15233A] rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  {user.household_public ? (
                    <Globe className="w-4 h-4 text-[#34D399]" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#C4C4BA]" />
                  )}
                  <span className="text-sm text-[#F5F5F0]">Public household</span>
                </div>
                <Switch checked={user.household_public} onCheckedChange={toggleHouseholdPublic} />
              </div>
            </div>
          )}
        </div>

        {/* Connected Shopping Accounts - Dropdown */}
        <div className="bg-[#1A2744] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowShoppingAccounts(!showShoppingAccounts)}
            className="w-full flex items-center justify-between px-4 py-4"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-sm font-semibold text-[#F5F5F0]">Connected Shopping Accounts</span>
            </div>
            {showShoppingAccounts ? (
              <ChevronUp className="w-4 h-4 text-[#C4C4BA]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#C4C4BA]" />
            )}
          </button>

          {showShoppingAccounts && (
            <div className="px-4 pb-4 space-y-2">
              {[
                { key: "walmart", label: "Walmart" },
                { key: "instacart", label: "Instacart" },
                { key: "kroger", label: "Kroger" },
                { key: "amazon_fresh", label: "Amazon Fresh" },
              ].map((provider) => (
                <button
                  key={provider.key}
                  onClick={() => toggleAccountConnection(provider.key)}
                  className={`w-full flex items-center justify-between bg-[#15233A] rounded-xl px-4 py-3 transition ${
                    user.connected_accounts?.[provider.key]
                      ? "ring-2 ring-[#34D399]"
                      : "hover:bg-[#243352]"
                  }`}
                >
                  <span className="text-sm text-[#F5F5F0]">{provider.label}</span>
                  {user.connected_accounts?.[provider.key] ? (
                    <span className="text-xs bg-[#34D399]/20 text-[#34D399] px-2 py-1 rounded-full">Connected</span>
                  ) : (
                    <span className="text-xs text-[#C4C4BA]/60">Connect</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Go Live / Upload */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowStartLive(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl h-14 flex-col gap-1"
          >
            <Radio className="w-5 h-5" />
            <span className="text-xs">Go Live</span>
          </Button>
          <Button
            onClick={() => setShowUploadTutorial(true)}
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF8555] hover:from-[#FF8555] hover:to-[#FF6B35] text-white rounded-xl h-14 flex-col gap-1"
          >
            <Video className="w-5 h-5" />
            <span className="text-xs">Upload Video</span>
          </Button>
        </div>

        {/* User's Uploaded Tutorials */}
        <div className="bg-[#1A2744] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#FF6B35]" />
              <h2 className="text-sm font-semibold text-[#F5F5F0]">My Content</h2>
            </div>
            <span className="text-xs text-[#C4C4BA]">{tutorials.length}</span>
          </div>
          {tutorials.length === 0 ? (
            <p className="text-sm text-[#C4C4BA]/60 text-center py-6">No uploads yet. Go live or upload a video!</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tutorials.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} onClick={() => {}} />
              ))}
            </div>
          )}
        </div>

        {/* Settings Section */}
        <Button
          onClick={() => navigate(createPageUrl("Settings"))}
          className="w-full bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-12"
        >
          <Settings className="w-4 h-4 mr-2" />
          App Settings
        </Button>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl h-12"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      <StartLiveModal
        open={showStartLive}
        onClose={() => setShowStartLive(false)}
        onCreated={() => {}}
        user={user}
      />
      <UploadTutorialModal
        open={showUploadTutorial}
        onClose={() => setShowUploadTutorial(false)}
        onCreated={() => {}}
        user={user}
      />
    </div>
  );
}