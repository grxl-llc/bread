import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Image, Video } from "lucide-react";

export default function AdminPendingAds() {
  const queryClient = useQueryClient();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["pending-ads"],
    queryFn: () => base44.entities.AdvertiserRequest.filter({ status: "pending_human" }, "-created_date", 100),
  });

  const { data: pendingAi = [] } = useQuery({
    queryKey: ["pending-ai-ads"],
    queryFn: () => base44.entities.AdvertiserRequest.filter({ status: "pending_ai" }, "-created_date", 100),
  });

  const approveAd = async (req) => {
    // Create an ApprovedAd record
    await base44.entities.ApprovedAd.create({
      title: req.advertiser_name + " Ad",
      description: req.target_audience || "",
      media_url: req.media_url || "",
      ad_type: ["feed_ad", "live_tutorial_ad", "replay_ad"].includes(req.ad_type) ? "banner" : "video",
      advertiser_name: req.advertiser_name,
      cta_label: "Learn More",
      source_request_id: req.id,
      is_active: true,
    });
    await base44.entities.AdvertiserRequest.update(req.id, { status: "approved" });
    queryClient.invalidateQueries({ queryKey: ["pending-ads"] });
    queryClient.invalidateQueries({ queryKey: ["approved-ads"] });
  };

  const rejectAd = async (id) => {
    await base44.entities.AdvertiserRequest.update(id, { status: "rejected" });
    queryClient.invalidateQueries({ queryKey: ["pending-ads"] });
  };

  const allPending = [...pending, ...pendingAi];

  if (isLoading) return <div className="text-[#C4C4BA]/60 text-sm py-10 text-center">Loading...</div>;

  return (
    <div className="space-y-3 pb-6">
      <p className="text-xs text-[#C4C4BA]/50 mb-4">{allPending.length} pending submission{allPending.length !== 1 ? "s" : ""}</p>
      {allPending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/30">
          <CheckCircle className="w-10 h-10 mb-3" />
          <p className="text-sm">All caught up! No pending ads.</p>
        </div>
      ) : (
        allPending.map((req) => (
          <div key={req.id} className="bg-[#1A2744] rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#F5F5F0]">{req.advertiser_name}</p>
                <p className="text-xs text-[#C4C4BA]/50">{req.company} • {req.ad_type?.replace("_", " ")}</p>
                <p className="text-xs text-[#C4C4BA]/40 mt-0.5">{req.email}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${req.status === "pending_ai" ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"}`}>
                {req.status === "pending_ai" ? "AI Review" : "Needs Human"}
              </span>
            </div>
            {req.target_audience && (
              <p className="text-xs text-[#C4C4BA]/60 bg-[#15233A] rounded-lg px-3 py-2">
                Target: {req.target_audience}
              </p>
            )}
            {req.ai_review_notes && (
              <p className="text-xs text-[#C4C4BA]/60 bg-[#243352] rounded-lg px-3 py-2 italic">
                AI: {req.ai_review_notes}
              </p>
            )}
            {req.media_url && (
              <img src={req.media_url} alt="Ad preview" className="w-full h-32 object-cover rounded-xl" />
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => approveAd(req)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-semibold py-2 rounded-xl transition"
              >
                <CheckCircle className="w-4 h-4" /> Approve & Publish
              </button>
              <button
                onClick={() => rejectAd(req.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold py-2 rounded-xl transition"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}