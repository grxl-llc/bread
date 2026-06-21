import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, Target, DollarSign, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import BreadLogo from "../components/branding/BreadLogo";

export default function AdvertiserPortal() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    advertiser_name: "",
    email: "",
    company: "",
    ad_type: "",
    budget: "",
    target_audience: "",
    media_url: "",
  });
  const navigate = useNavigate();

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, media_url: file_url });
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // AI pre-approval
    const aiReview = await base44.integrations.Core.InvokeLLM({
      prompt: `Review this advertising request for appropriateness and fit with a family-friendly food app. Advertiser: ${formData.company}, Ad Type: ${formData.ad_type}, Budget: $${formData.budget}, Target: ${formData.target_audience}. Determine if this is appropriate content and provide brief notes.`,
      response_json_schema: {
        type: "object",
        properties: {
          approved: { type: "boolean" },
          notes: { type: "string" },
        },
      },
    });

    await base44.entities.AdvertiserRequest.create({
      ...formData,
      budget: parseFloat(formData.budget),
      status: aiReview.approved ? "pending_human" : "rejected",
      ai_review_notes: aiReview.notes,
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#34D399]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#34D399]" />
          </div>
          <h2 className="text-xl font-bold text-[#F5F5F0] mb-2">Request Submitted!</h2>
          <p className="text-sm text-[#C4C4BA] mb-6">
            We'll review your request and get back to you within 2 business days.
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
          >
            Go Back
          </Button>
        </div>
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
        <div className="flex items-center gap-3 mb-2">
          <BreadLogo variant="light" size="md" />
          <span className="text-xl font-semibold text-[#F5F5F0]">Advertiser Portal</span>
        </div>
        <p className="text-sm text-[#C4C4BA]/60">Reach food lovers and home chefs</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Ad Formats */}
        <div className="bg-[#1A2744] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-lg font-bold text-[#F5F5F0]">Ad Formats</h2>
          </div>
          <div className="space-y-3">
            <AdFormatItem
              title="AI Best Guess Recommendations"
              description="Get your brand featured when our AI suggests recipes from food photos"
              price="$3.00 CPM"
            />
            <AdFormatItem
              title="Feed Ads"
              description="Native ads in the main content feed"
              price="$0.50 CPM"
            />
            <AdFormatItem
              title="Rewarded Ads"
              description="Optional ads that unlock premium features"
              price="$2.00 per completion"
            />
            <AdFormatItem
              title="Live Tutorial Ads"
              description="Ads during live cooking sessions"
              price="$1.50 CPM"
            />
            <AdFormatItem
              title="Replay Ads"
              description="Ads in recorded tutorial content"
              price="$1.00 CPM"
            />
            <AdFormatItem
              title="Sponsored Tutorials"
              description="Full creator partnerships"
              price="Custom pricing"
            />
          </div>
        </div>

        {/* Audience */}
        <div className="bg-[#1A2744] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-lg font-bold text-[#F5F5F0]">Audience Demographics</h2>
          </div>
          <div className="space-y-2 text-sm text-[#C4C4BA]">
            <p>• Home chefs and cooking enthusiasts</p>
            <p>• Budget-conscious grocery shoppers</p>
            <p>• Parents planning family meals</p>
            <p>• Health-focused meal preppers</p>
            <p>• Food content creators</p>
          </div>
        </div>

        {/* Targeting */}
        <div className="bg-[#1A2744] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-lg font-bold text-[#F5F5F0]">Targeting Options</h2>
          </div>
          <div className="space-y-2 text-sm text-[#C4C4BA]">
            <p>• Household age groups (baby, kid, teen, adult)</p>
            <p>• Dietary preferences (vegan, high-protein, etc.)</p>
            <p>• Geographic location</p>
            <p>• Shopping behavior</p>
            <p>• Recipe categories</p>
          </div>
        </div>

        {/* Request Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Purchase Ad Slot
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#1A2744] rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#F5F5F0] mb-4">Request Ad Slot</h3>
            
            <Input
              placeholder="Your Name"
              value={formData.advertiser_name}
              onChange={(e) => setFormData({ ...formData, advertiser_name: e.target.value })}
              required
              className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
            />
            
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
            />
            
            <Input
              placeholder="Company Name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
              className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
            />
            
            <Select value={formData.ad_type} onValueChange={(value) => setFormData({ ...formData, ad_type: value })}>
              <SelectTrigger className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl">
                <SelectValue placeholder="Select ad type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2744] border-[#243352]">
                <SelectItem value="ai_recommendations" className="text-[#F5F5F0]">AI Best Guess Recommendations</SelectItem>
                <SelectItem value="feed_ad" className="text-[#F5F5F0]">Feed Ad</SelectItem>
                <SelectItem value="rewarded_ad" className="text-[#F5F5F0]">Rewarded Ad</SelectItem>
                <SelectItem value="live_tutorial_ad" className="text-[#F5F5F0]">Live Tutorial Ad</SelectItem>
                <SelectItem value="replay_ad" className="text-[#F5F5F0]">Replay Ad</SelectItem>
                <SelectItem value="sponsored_tutorial" className="text-[#F5F5F0]">Sponsored Tutorial</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="Budget (USD)"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              required
              className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
            />
            
            <Textarea
              placeholder="Target Audience Description"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              className="bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl resize-none"
              rows={3}
            />

            <div>
              <label className="block text-sm font-medium text-[#F5F5F0] mb-2">
                Upload Ad Media (Image or Video)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                onChange={handleMediaUpload}
                className="block w-full text-sm text-[#C4C4BA] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#FF6B35] file:text-white hover:file:bg-[#FF8555] file:cursor-pointer"
              />
              {uploading && (
                <p className="text-xs text-[#C4C4BA] mt-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading...
                </p>
              )}
              {formData.media_url && (
                <p className="text-xs text-[#34D399] mt-2">✓ Media uploaded</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 border-[#243352] text-[#C4C4BA] hover:bg-[#15233A] rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AdFormatItem({ title, description, price }) {
  return (
    <div className="p-3 bg-[#15233A] rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[#F5F5F0]">{title}</h3>
        <span className="text-sm font-bold text-[#FF6B35]">{price}</span>
      </div>
      <p className="text-xs text-[#C4C4BA]/60">{description}</p>
    </div>
  );
}