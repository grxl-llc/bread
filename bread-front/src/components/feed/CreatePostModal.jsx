import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, Upload, BookOpen, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import RecipeSelector from "./RecipeSelector";
import VideoClipCropper from "./VideoClipCropper";

const categories = [
  { key: "late_night_cravings", label: "Late Night Cravings" },
  { key: "quick_for_kids", label: "Quick for the Kids" },
  { key: "vegan", label: "Vegan" },
  { key: "cheesy", label: "Cheesy" },
  { key: "high_protein", label: "High-Protein" },
  { key: "budget_meals", label: "Budget Meals" },
  { key: "15_minute_meals", label: "15-Minute Meals" },
  { key: "desserts", label: "Desserts" },
  { key: "meal_prep", label: "Meal Prep" },
];

export default function CreatePostModal({ open, onClose, onCreated, userName, editPost = null }) {
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  // Clip from tutorial
  const [mediaTab, setMediaTab] = useState("upload"); // "upload" | "clip"
  const [showCropper, setShowCropper] = useState(false);
  const [cropperTutorial, setCropperTutorial] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null); // { videoUrl, startTime, endTime, tutorialId, tutorialTitle }

  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myTutorials = [] } = useQuery({
    queryKey: ["my-tutorials-for-post", user?.email],
    queryFn: () => base44.entities.Tutorial.filter({ creator_email: user.email }, "-created_date", 30),
    enabled: !!user && open,
  });

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editPost) {
      setCaption(editPost.caption || "");
      setCategory(editPost.category || "");
      setMediaPreview(editPost.media_url || null);
      setSelectedRecipe(editPost.recipe_id ? { id: editPost.recipe_id } : null);
    } else {
      setCaption("");
      setCategory("");
      setMediaFile(null);
      setMediaPreview(null);
      setSelectedRecipe(null);
      setSelectedClip(null);
      setMediaTab("upload");
    }
  }, [editPost, open]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For videos, we enforce ≤20s on the client by checking duration
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      const vid = document.createElement("video");
      vid.src = url;
      vid.onloadedmetadata = () => {
        if (vid.duration > 20) {
          alert("Videos must be 20 seconds or less. Use the 'My Clip' tab to crop a longer video.");
          return;
        }
        setMediaFile(file);
        setMediaPreview(url);
        setSelectedClip(null);
      };
    } else {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setSelectedClip(null);
    }
  };

  const openCropper = (tutorial) => {
    setCropperTutorial(tutorial);
    setShowCropper(true);
  };

  const handleCropConfirm = (clipData) => {
    setSelectedClip({
      ...clipData,
      tutorialId: cropperTutorial.id,
      tutorialTitle: cropperTutorial.title,
    });
    setMediaPreview(clipData.videoUrl);
    setMediaFile(null); // will use URL directly with clip metadata
    setShowCropper(false);
  };

  const handlePost = async () => {
    if (!caption && !mediaFile && !editPost && !selectedClip) return;
    setPosting(true);

    let media_url = editPost?.media_url || "";
    if (mediaFile) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      media_url = file_url;
      setUploading(false);
    } else if (selectedClip) {
      media_url = selectedClip.videoUrl;
    }

    const postData = {
      media_url,
      caption,
      category: category || "budget_meals",
      recipe_id: selectedRecipe?.id || null,
      author_name: userName || "Anonymous",
      likes_count: editPost?.likes_count || 0,
      // clip metadata
      tutorial_id: selectedClip?.tutorialId || editPost?.tutorial_id || null,
      clip_start: selectedClip?.startTime ?? null,
      clip_end: selectedClip?.endTime ?? null,
    };

    if (editPost) {
      await base44.entities.Post.update(editPost.id, postData);
    } else {
      await base44.entities.Post.create(postData);
    }

    setCaption("");
    setCategory("");
    setMediaFile(null);
    setMediaPreview(null);
    setSelectedRecipe(null);
    setSelectedClip(null);
    setPosting(false);
    onCreated();
    onClose();
  };

  if (!open) return null;

  const hasMedia = mediaPreview || selectedClip;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#15233A] rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#F5F5F0]">{editPost ? "Edit Post" : "Share a Meal"}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          </div>

          {/* Media Tabs */}
          {!editPost && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMediaTab("upload")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${
                  mediaTab === "upload"
                    ? "bg-[#FF6B35] text-white"
                    : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
                }`}
              >
                <Camera className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => setMediaTab("clip")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${
                  mediaTab === "clip"
                    ? "bg-[#FF6B35] text-white"
                    : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
                }`}
              >
                <Film className="w-4 h-4" />
                My Clip
              </button>
            </div>
          )}

          {/* Upload tab */}
          {(mediaTab === "upload" || editPost) && (
            <div className="mb-4">
              {mediaPreview && !selectedClip ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#1A2744]">
                  {mediaPreview.includes(".mp4") || (mediaFile && mediaFile.type.startsWith("video/")) ? (
                    <video src={mediaPreview} className="w-full h-full object-cover" controls playsInline />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-44 bg-[#1A2744] rounded-2xl border-2 border-dashed border-[#243352] cursor-pointer hover:border-[#FF6B35]/40 transition">
                  <Camera className="w-8 h-8 text-[#C4C4BA]/40 mb-2" />
                  <span className="text-sm text-[#C4C4BA]/60">Tap to add a photo or video</span>
                  <span className="text-xs text-[#C4C4BA]/40 mt-1">Videos must be ≤ 20 seconds</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Clip tab */}
          {mediaTab === "clip" && !editPost && (
            <div className="mb-4">
              {selectedClip ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#1A2744]">
                  <video
                    src={`${selectedClip.videoUrl}#t=${selectedClip.startTime},${selectedClip.endTime}`}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                    <p className="text-xs text-white truncate">📎 {selectedClip.tutorialTitle}</p>
                    <p className="text-xs text-[#C4C4BA]/70">{selectedClip.clipLength}s clip · "Watch full tutorial" link included</p>
                  </div>
                  <button
                    onClick={() => setSelectedClip(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : myTutorials.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-44 bg-[#1A2744] rounded-2xl border-2 border-dashed border-[#243352]">
                  <Film className="w-8 h-8 text-[#C4C4BA]/40 mb-2" />
                  <span className="text-sm text-[#C4C4BA]/60">No uploaded tutorials yet</span>
                  <span className="text-xs text-[#C4C4BA]/40 mt-1">Upload a tutorial from your profile first</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  <p className="text-xs text-[#C4C4BA]/60 mb-2">Select a tutorial to crop a 20s clip:</p>
                  {myTutorials.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => openCropper(t)}
                      className="w-full flex items-center gap-3 bg-[#1A2744] hover:bg-[#243352] rounded-xl px-3 py-3 text-left transition"
                    >
                      {t.thumbnail_url ? (
                        <img src={t.thumbnail_url} className="w-12 h-9 rounded-lg object-cover flex-shrink-0" alt="" />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-[#243352] flex items-center justify-center flex-shrink-0">
                          <Film className="w-4 h-4 text-[#C4C4BA]/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F5F5F0] truncate">{t.title}</p>
                        <p className="text-xs text-[#C4C4BA]/50">{t.duration ? `${t.duration}m` : "Video"}</p>
                      </div>
                      <span className="text-xs text-[#FF6B35] font-medium flex-shrink-0">Crop</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Textarea
            placeholder="What are you eating today?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] placeholder:text-[#C4C4BA]/40 rounded-xl mb-4 min-h-[80px] resize-none"
          />

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl mb-4">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A2744] border-[#243352]">
              {categories.map((cat) => (
                <SelectItem key={cat.key} value={cat.key} className="text-[#F5F5F0]">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Recipe Attachment */}
          <button
            onClick={() => setShowRecipeSelector(true)}
            className="w-full flex items-center justify-between bg-[#1A2744] border border-[#243352] text-[#F5F5F0] rounded-xl px-4 py-3 mb-4 hover:bg-[#243352] transition"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C4C4BA]" />
              <span className="text-sm">
                {selectedRecipe ? selectedRecipe.title : "Select from My Recipes (Optional)"}
              </span>
            </div>
            {selectedRecipe && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedRecipe(null); }}
                className="p-1 hover:bg-white/5 rounded-full"
              >
                <X className="w-3 h-3 text-[#C4C4BA]" />
              </button>
            )}
          </button>

          <Button
            onClick={handlePost}
            disabled={posting || (!caption && !mediaFile && !editPost && !selectedClip)}
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12 text-base font-semibold"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
            ) : posting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editPost ? "Updating..." : "Posting..."}</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />{editPost ? "Update" : "Share"}</>
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* Recipe Selector */}
      <RecipeSelector
        open={showRecipeSelector}
        onClose={() => setShowRecipeSelector(false)}
        onSelect={setSelectedRecipe}
      />

      {/* Video Clip Cropper */}
      {cropperTutorial && (
        <VideoClipCropper
          open={showCropper}
          videoUrl={cropperTutorial.video_url}
          tutorialTitle={cropperTutorial.title}
          onCrop={handleCropConfirm}
          onClose={() => setShowCropper(false)}
        />
      )}
    </AnimatePresence>
  );
}