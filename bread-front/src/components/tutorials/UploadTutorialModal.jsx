import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Video } from "lucide-react";

export default function UploadTutorialModal({ open, onClose, onCreated, user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dishName, setDishName] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title || !videoFile) return;
    setLoading(true);

    const [videoRes, thumbRes] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: videoFile }),
      thumbnailFile ? base44.integrations.Core.UploadFile({ file: thumbnailFile }) : Promise.resolve(null),
    ]);

    await base44.entities.Tutorial.create({
      creator_email: user.email,
      creator_name: user.full_name,
      title,
      description,
      dish_name: dishName,
      video_url: videoRes.file_url,
      thumbnail_url: thumbRes?.file_url || null,
      is_live: false,
      is_replay: false,
      visibility: "public",
      view_count: 0,
      like_count: 0,
      is_sponsored: false,
    });

    setLoading(false);
    setTitle(""); setDescription(""); setDishName("");
    setVideoFile(null); setThumbnailFile(null); setThumbnailPreview(null);
    onCreated?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F0] flex items-center gap-2">
            <Video className="w-5 h-5 text-[#FF6B35]" />
            Upload Cooking Tutorial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Tutorial title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#15233A] border-[#243352] text-[#F5F5F0] placeholder:text-[#C4C4BA]/40"
          />
          <Input
            placeholder="Dish name"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            className="bg-[#15233A] border-[#243352] text-[#F5F5F0] placeholder:text-[#C4C4BA]/40"
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[#15233A] border-[#243352] text-[#F5F5F0] placeholder:text-[#C4C4BA]/40 h-20"
          />

          {/* Video Upload */}
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-[#243352] hover:border-[#FF6B35]/50 rounded-xl p-4 text-center transition">
              {videoFile ? (
                <p className="text-sm text-[#34D399]">✓ {videoFile.name}</p>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#C4C4BA]/40 mx-auto mb-1" />
                  <p className="text-sm text-[#C4C4BA]/60">Upload video *</p>
                </>
              )}
            </div>
            <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files[0])} />
          </label>

          {/* Thumbnail Upload */}
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-[#243352] hover:border-[#FF6B35]/50 rounded-xl p-4 text-center transition">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="thumb" className="h-20 mx-auto rounded-lg object-cover" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-[#C4C4BA]/40 mx-auto mb-1" />
                  <p className="text-sm text-[#C4C4BA]/60">Upload thumbnail (optional)</p>
                </>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
          </label>

          <Button
            onClick={handleSubmit}
            disabled={loading || !title || !videoFile}
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : "Upload Tutorial"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}