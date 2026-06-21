import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Circle, TrendingUp, DollarSign, Video, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { checkCreatorEligibility } from "../components/creator/CreatorEligibilityChecker";
import BreadLogo from "../components/branding/BreadLogo";

export default function MonetizationInfo() {
  const [user, setUser] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadEligibility();
  }, []);

  const loadEligibility = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    const result = await checkCreatorEligibility(currentUser.email);
    setEligibility(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <p className="text-[#C4C4BA]">Loading...</p>
      </div>
    );
  }

  const isEligible = eligibility?.isEligible;
  const criteria = eligibility?.criteria || {};

  return (
    <div className="min-h-screen bg-[#15233A] pb-6">
      <div className="pt-6 px-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/5 transition mb-3"
        >
          <ArrowLeft className="w-5 h-5 text-[#C4C4BA]" />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <BreadLogo variant="light" size="md" />
          <span className="text-xl font-semibold text-[#F5F5F0]">Creator Hub</span>
        </div>
        <p className="text-sm text-[#C4C4BA]/60">Turn your cooking into income</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Eligibility Status */}
        <div className={`rounded-2xl p-6 ${isEligible ? "bg-gradient-to-br from-[#34D399]/20 to-[#34D399]/5" : "bg-[#1A2744]"}`}>
          <div className="flex items-center gap-2 mb-4">
            {isEligible ? (
              <CheckCircle className="w-6 h-6 text-[#34D399]" />
            ) : (
              <Circle className="w-6 h-6 text-[#C4C4BA]/40" />
            )}
            <h2 className="text-lg font-bold text-[#F5F5F0]">
              {isEligible ? "You're Eligible!" : "Not Eligible Yet"}
            </h2>
          </div>
          <p className="text-sm text-[#C4C4BA] leading-relaxed">
            {isEligible
              ? "Congratulations! You meet all requirements for creator monetization. Visit your Creator Dashboard to start earning."
              : "Complete the requirements below to unlock creator monetization and start earning from your content."}
          </p>
          {isEligible && (
            <Button
              onClick={() => navigate(createPageUrl("CreatorDashboard"))}
              className="w-full mt-4 bg-[#34D399] hover:bg-[#10B981] text-white rounded-xl h-12"
            >
              Go to Creator Dashboard
            </Button>
          )}
        </div>

        {/* Requirements Checklist */}
        <div className="bg-[#1A2744] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#F5F5F0] mb-4">Eligibility Checklist</h2>
          <div className="space-y-3">
            <RequirementItem
              completed={criteria.hasFollowers}
              title="100+ Followers"
              description="Build your audience"
            />
            <RequirementItem
              completed={criteria.hasPublicRecipes}
              title="5+ Public Recipes"
              description="Share recipes with the community"
            />
            <RequirementItem
              completed={criteria.hasCreatorBadges}
              title="3+ Creator Badges"
              description="Earn badges through engagement"
            />
            <RequirementItem
              completed={criteria.hasTutorial}
              title="1+ Tutorial Posted"
              description="Create your first live or recorded tutorial"
            />
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-[#1A2744] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-lg font-bold text-[#F5F5F0]">Revenue Breakdown</h2>
          </div>
          <div className="space-y-3">
            <RevenueItem
              title="Live Tutorial Ads"
              creatorSplit="55%"
              description="Ads shown during live cooking sessions"
            />
            <RevenueItem
              title="Replay Ads"
              creatorSplit="50%"
              description="Ads in recorded tutorial replays"
            />
            <RevenueItem
              title="Sponsored Tutorials"
              creatorSplit="70%"
              description="Brand partnerships and sponsored content"
            />
            <RevenueItem
              title="Creator Subscriptions"
              creatorSplit="85%"
              description="Monthly subscriptions from followers (coming soon)"
            />
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-[#1A2744] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-lg font-bold text-[#F5F5F0]">How It Works</h2>
          </div>
          <div className="space-y-4 text-sm text-[#C4C4BA]">
            <div>
              <h3 className="font-semibold text-[#F5F5F0] mb-1">Live Tutorials</h3>
              <p className="leading-relaxed">
                Host live cooking sessions with automatic ad breaks every 5 minutes. Earn 55% 
                of ad revenue based on viewer count and engagement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#F5F5F0] mb-1">Replay Content</h3>
              <p className="leading-relaxed">
                Your live sessions are saved as replays with ads at natural breaks. Earn 50% 
                of replay ad revenue as viewers watch your content.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#F5F5F0] mb-1">Sponsored Tutorials</h3>
              <p className="leading-relaxed">
                Partner with brands for sponsored cooking content. Keep 70% of sponsorship deals 
                negotiated through Bread.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#F5F5F0] mb-1">Payouts</h3>
              <p className="leading-relaxed">
                Earnings are calculated daily and paid monthly via direct deposit. Minimum payout 
                threshold is $25. Track all earnings in your Creator Dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Creator Badge */}
        <div className="bg-gradient-to-br from-[#FF6B35]/20 to-[#FF8555]/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-lg font-bold text-[#F5F5F0]">Creator Badge</h2>
          </div>
          <p className="text-sm text-[#C4C4BA] leading-relaxed mb-3">
            When you become eligible, you'll automatically receive the exclusive Creator badge. 
            This badge appears on your profile, posts, and tutorials, showing the community 
            you're a verified content creator.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35]/10 rounded-xl">
            <span className="text-xl">🎬</span>
            <span className="text-sm font-semibold text-[#FF6B35]">Creator</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequirementItem({ completed, title, description }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#15233A] rounded-xl">
      {completed ? (
        <CheckCircle className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
      ) : (
        <Circle className="w-5 h-5 text-[#C4C4BA]/30 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`text-sm font-semibold ${completed ? "text-[#34D399]" : "text-[#F5F5F0]"}`}>
          {title}
        </p>
        <p className="text-xs text-[#C4C4BA]/60 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function RevenueItem({ title, creatorSplit, description }) {
  return (
    <div className="p-3 bg-[#15233A] rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[#F5F5F0]">{title}</h3>
        <span className="text-sm font-bold text-[#FF6B35]">{creatorSplit}</span>
      </div>
      <p className="text-xs text-[#C4C4BA]/60">{description}</p>
    </div>
  );
}