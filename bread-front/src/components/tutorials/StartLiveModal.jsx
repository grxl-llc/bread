import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Radio, Loader2 } from "lucide-react";

export default function StartLiveModal({ open, onClose, onCreated, user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dishName, setDishName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!title) return;
    setLoading(true);

    const tutorial = await base44.entities.Tutorial.create({
      creator_email: user.email,
      creator_name: user.full_name,
      title,
      description,
      dish_name: dishName,
      is_live: true,
      is_replay: false,
      visibility: "public",
      view_count: 0,
      like_count: 0,
      is_sponsored: false,
    });

    await base44.entities.LiveSession.create({
      tutorial_id: tutorial.id,
      creator_email: user.email,
      start_time: new Date().toISOString(),
      viewer_count: 0,
      peak_viewers: 0,
    });

    setLoading(false);
    setTitle(""); setDescription(""); setDishName("");
    onCreated?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F0] flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            Start Live Tutorial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <p className="text-sm text-red-400 font-medium">🔴 You'll be live once you start</p>
            <p className="text-xs text-[#C4C4BA]/60 mt-1">Viewers can watch and save your session</p>
          </div>

          <Input
            placeholder="What are you cooking? *"
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
            placeholder="Tell viewers what to expect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[#15233A] border-[#243352] text-[#F5F5F0] placeholder:text-[#C4C4BA]/40 h-20"
          />

          <Button
            onClick={handleStart}
            disabled={loading || !title}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</> : "🔴 Go Live"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}