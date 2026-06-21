import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, Eye, Clock, Users, Video, Award, Play, Upload, Handshake } from "lucide-react";
import BadgeDisplay from "../components/badges/BadgeDisplay";
import VideoEditorModal from "../components/creator/VideoEditorModal";
import BrandPartnersModal from "../components/creator/BrandPartnersModal";
import ContentPerformance from "../components/creator/ContentPerformance";

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);
  const [timeframe, setTimeframe] = useState("month");
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [showBrandPartners, setShowBrandPartners] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: earnings = [] } = useQuery({
    queryKey: ["creator-earnings", user?.email],
    queryFn: () => base44.entities.CreatorEarnings.filter({ creator_email: user.email }, "-created_date", 500),
    enabled: !!user,
  });

  const { data: tutorials = [] } = useQuery({
    queryKey: ["creator-tutorials", user?.email],
    queryFn: () => base44.entities.Tutorial.filter({ creator_email: user.email }, "-created_date", 100),
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["creator-sessions", user?.email],
    queryFn: () => base44.entities.LiveSession.filter({ creator_email: user.email }, "-created_date", 100),
    enabled: !!user,
  });

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
  const followersGained = user?.followers_count || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <p className="text-[#C4C4BA]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A] pb-6">
      <div className="pt-6 px-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/5 transition mb-3"
        >
          <ArrowLeft className="w-5 h-5 text-[#C4C4BA]" />
        </button>
        <h1 className="text-2xl font-bold text-[#F5F5F0] mb-3">Creator Dashboard</h1>
        <p className="text-sm text-[#C4C4BA]/60 mb-4">Track your content performance</p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowVideoEditor(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold py-2 rounded-lg hover:bg-[#FF8555] transition"
          >
            <Play className="w-4 h-4" />
            Go Live
          </button>
          <button
            onClick={() => setShowVideoEditor(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold py-2 rounded-lg hover:bg-[#FF8555] transition"
          >
            <Upload className="w-4 h-4" />
            Upload Content
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Earnings Overview */}
        <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF8555] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Total Earnings</h2>
          </div>
          <p className="text-4xl font-bold text-white mb-4">
            ${calculateEarnings("lifetime").toFixed(2)}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-sm text-white/80">Today</p>
              <p className="text-lg font-bold text-white">${calculateEarnings("today").toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Week</p>
              <p className="text-lg font-bold text-white">${calculateEarnings("week").toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Month</p>
              <p className="text-lg font-bold text-white">${calculateEarnings("month").toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown & Brand Partners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1A2744] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-[#F5F5F0] mb-3">Revenue by Source</h3>
            <div className="space-y-2">
              {[
                { key: "live_ad", label: "Live Tutorial Ads", color: "bg-green-500" },
                { key: "replay_ad", label: "Replay Ads", color: "bg-blue-500" },
                { key: "sponsored", label: "Sponsored Content", color: "bg-orange-500" },
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

          <div className="bg-[#1A2744] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Handshake className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="text-sm font-bold text-[#F5F5F0]">Brand Partners</h3>
              </div>
              <p className="text-sm text-[#C4C4BA]/80">Discover sponsorship opportunities</p>
            </div>
            <button
              onClick={() => setShowBrandPartners(true)}
              className="w-full bg-[#FF6B35] text-white font-semibold py-2 rounded-lg hover:bg-[#FF8555] transition"
            >
              View Opportunities
            </button>
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
          <div className="bg-[#1A2744] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-xs font-semibold text-[#C4C4BA]">Followers</h3>
            </div>
            <p className="text-2xl font-bold text-[#F5F5F0]">{followersGained}</p>
          </div>
          <div className="bg-[#1A2744] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-xs font-semibold text-[#C4C4BA]">Tutorials</h3>
            </div>
            <p className="text-2xl font-bold text-[#F5F5F0]">{tutorials.length}</p>
          </div>
        </div>

        {/* Badges */}
        {user.badges?.length > 0 && (
          <div className="bg-[#1A2744] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-sm font-semibold text-[#F5F5F0]">Your Badges</h3>
            </div>
            <BadgeDisplay badges={user.badges} />
          </div>
        )}

        {/* Content Performance */}
        <div className="bg-[#1A2744] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-[#F5F5F0] mb-3">Content Performance</h3>
          {tutorials.length === 0 ? (
            <p className="text-sm text-[#C4C4BA]/60">No content yet</p>
          ) : (
            <ContentPerformance
              content={tutorials.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <VideoEditorModal
        isOpen={showVideoEditor}
        onClose={() => setShowVideoEditor(false)}
        onSave={(data) => {
          console.log("Video saved:", data);
          setShowVideoEditor(false);
        }}
      />
      <BrandPartnersModal
        isOpen={showBrandPartners}
        onClose={() => setShowBrandPartners(false)}
        userEmail={user?.email}
      />
    </div>
  );
}