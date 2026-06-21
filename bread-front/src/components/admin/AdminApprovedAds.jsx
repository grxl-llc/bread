import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Image, Video, ToggleLeft, ToggleRight, Upload, Loader2 } from "lucide-react";

const EMPTY_AD = { title: "", description: "", media_url: "", ad_type: "banner", cta_label: "Learn More", cta_url: "", advertiser_name: "", is_active: true };

export default function AdminApprovedAds() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_AD);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["approved-ads"],
    queryFn: () => base44.entities.ApprovedAd.list("-created_date", 100),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, media_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.advertiser_name || !form.media_url) return alert("Title, advertiser, and media are required.");
    await base44.entities.ApprovedAd.create(form);
    queryClient.invalidateQueries({ queryKey: ["approved-ads"] });
    setForm(EMPTY_AD);
    setShowForm(false);
  };

  const toggleActive = async (ad) => {
    await base44.entities.ApprovedAd.update(ad.id, { is_active: !ad.is_active });
    queryClient.invalidateQueries({ queryKey: ["approved-ads"] });
  };

  const deleteAd = async (id) => {
    if (!confirm("Delete this ad?")) return;
    await base44.entities.ApprovedAd.delete(id);
    queryClient.invalidateQueries({ queryKey: ["approved-ads"] });
  };

  const banners = ads.filter((a) => a.ad_type === "banner");
  const videos = ads.filter((a) => a.ad_type === "video");

  return (
    <div className="space-y-5 pb-6">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#FF6B35] font-semibold text-sm py-3 rounded-xl transition border border-[#FF6B35]/20"
      >
        <Plus className="w-4 h-4" /> Add New Ad
      </button>

      {showForm && (
        <div className="bg-[#1A2744] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#F5F5F0]">New Ad</h3>
          {[
            { key: "title", placeholder: "Ad title" },
            { key: "advertiser_name", placeholder: "Advertiser / brand name" },
            { key: "description", placeholder: "Description (optional)" },
            { key: "cta_label", placeholder: "CTA button label" },
            { key: "cta_url", placeholder: "CTA URL (https://...)" },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full bg-[#15233A] text-[#F5F5F0] text-sm rounded-xl px-4 py-2.5 border border-white/10 outline-none placeholder:text-[#C4C4BA]/30"
            />
          ))}
          <div className="flex gap-2">
            {["banner", "video"].map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, ad_type: t }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition border ${form.ad_type === t ? "bg-[#FF6B35] text-white border-[#FF6B35]" : "bg-[#15233A] text-[#C4C4BA]/60 border-white/10"}`}
              >
                {t === "banner" ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {/* Media upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-24 bg-[#15233A] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B35]/40 transition"
          >
            {uploading ? <Loader2 className="w-5 h-5 text-[#FF6B35] animate-spin" /> :
              form.media_url ? (
                form.ad_type === "video"
                  ? <Video className="w-8 h-8 text-green-400" />
                  : <img src={form.media_url} className="h-full w-full object-cover rounded-xl" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-[#C4C4BA]/40 mb-1" />
                  <span className="text-xs text-[#C4C4BA]/40">Upload {form.ad_type}</span>
                </>
              )
            }
          </div>
          <input ref={fileRef} type="file" accept={form.ad_type === "video" ? "video/*" : "image/*"} className="hidden" onChange={handleFileUpload} />
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="flex-1 bg-[#FF6B35] hover:bg-[#FF8555] text-white font-semibold py-2.5 rounded-xl text-sm transition">Save Ad</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-[#15233A] text-[#C4C4BA]/60 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Banner Ads */}
      <AdSection title="Banner Ads" icon={Image} ads={banners} onToggle={toggleActive} onDelete={deleteAd} isLoading={isLoading} />
      {/* Video Ads */}
      <AdSection title="Video Ads" icon={Video} ads={videos} onToggle={toggleActive} onDelete={deleteAd} isLoading={isLoading} />
    </div>
  );
}

function AdSection({ title, icon: Icon, ads, onToggle, onDelete, isLoading }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#FF6B35]" />
        <h3 className="text-sm font-semibold text-[#F5F5F0]">{title}</h3>
        <span className="text-xs text-[#C4C4BA]/40">{ads.length}</span>
      </div>
      {isLoading ? <div className="bg-[#1A2744] rounded-xl h-20 animate-pulse" /> :
        ads.length === 0 ? (
          <p className="text-xs text-[#C4C4BA]/30 py-4 text-center">No {title.toLowerCase()} yet</p>
        ) : (
          <div className="space-y-2">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-[#1A2744] rounded-xl px-4 py-3 flex items-center gap-3">
                {ad.media_url && ad.ad_type === "banner" && (
                  <img src={ad.media_url} alt={ad.title} className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
                )}
                {ad.ad_type === "video" && (
                  <div className="w-14 h-10 bg-[#243352] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-[#C4C4BA]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F5F5F0] font-medium truncate">{ad.title}</p>
                  <p className="text-xs text-[#C4C4BA]/50 truncate">{ad.advertiser_name}</p>
                </div>
                <button onClick={() => onToggle(ad)} className={`p-1 transition ${ad.is_active ? "text-green-400" : "text-[#C4C4BA]/30"}`}>
                  {ad.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => onDelete(ad.id)} className="p-1 text-red-400/60 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}