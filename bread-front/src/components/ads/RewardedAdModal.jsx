import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdService } from "./AdService";
import { useApprovedAds, pickRewardedAd } from "@/lib/useApprovedAds";

const AD_DURATION = 5; // seconds before unlock button appears

export default function RewardedAdModal({ open, onClose, onComplete, userId, postId }) {
  const [phase, setPhase] = useState("prompt"); // prompt | watching | completed
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION);
  const [canSkip, setCanSkip] = useState(false);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const { data: liveAds = [] } = useApprovedAds();
  const currentAd = pickRewardedAd(liveAds);
  const isVideo = currentAd?.ad_type === "video";

  // Reset state whenever modal opens/closes
  useEffect(() => {
    if (open) {
      setPhase("prompt");
      setSecondsLeft(AD_DURATION);
      setCanSkip(false);
    }
    return () => clearInterval(timerRef.current);
  }, [open]);

  const startCountdown = () => {
    setSecondsLeft(AD_DURATION);
    setCanSkip(false);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setCanSkip(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleWatchAd = async () => {
    setPhase("watching");
    await AdService.logImpression(userId, "rewarded_ad", postId);
    startCountdown();
    // autoplay video ad
    setTimeout(() => {
      if (videoRef.current) videoRef.current.play().catch(() => {});
    }, 100);
  };

  const handleAdFinish = async () => {
    clearInterval(timerRef.current);
    await AdService.logCompletion(userId, "rewarded_ad", postId);
    setPhase("completed");
    setTimeout(() => {
      onComplete();
      onClose();
      setPhase("prompt");
    }, 1200);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={phase === "prompt" ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#1A2744] rounded-3xl overflow-hidden relative"
        >
          {/* ── PROMPT ── */}
          {phase === "prompt" && (
            <div className="p-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition"
              >
                <X className="w-5 h-5 text-[#C4C4BA]" />
              </button>
              <div className="w-16 h-16 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-[#FF6B35]" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F0] mb-2">
                Unlock AI Best Guess Recipe
              </h3>
              <p className="text-sm text-[#C4C4BA]/60 mb-6">
                Watch a short ad to reveal your AI-generated recipe.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleWatchAd}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Ad to Unlock
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full text-[#C4C4BA] hover:bg-white/5 rounded-xl h-12"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── WATCHING ── */}
          {phase === "watching" && (
            <div>
              {/* Ad creative */}
              {currentAd ? (
                isVideo ? (
                  <video
                    ref={videoRef}
                    src={currentAd.media_url}
                    autoPlay
                    playsInline
                    className="w-full aspect-video object-cover bg-black"
                    onEnded={() => { if (canSkip) handleAdFinish(); else setCanSkip(true); }}
                  />
                ) : (
                  <img
                    src={currentAd.media_url}
                    alt={currentAd.title}
                    className="w-full aspect-video object-cover"
                  />
                )
              ) : (
                <div className="w-full aspect-video bg-[#15233A] flex flex-col items-center justify-center gap-2">
                  <span className="text-5xl">🍞</span>
                  <p className="text-xs text-[#C4C4BA]/40">Advertisement</p>
                </div>
              )}

              {/* Ad info */}
              {currentAd && (
                <div className="flex items-center gap-3 px-4 py-2 bg-[#15233A]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#F5F5F0] truncate">{currentAd.title}</p>
                    <p className="text-[10px] text-[#C4C4BA]/50 truncate">{currentAd.advertiser_name}</p>
                  </div>
                  {currentAd.cta_url && (
                    <a
                      href={currentAd.cta_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-[#FF6B35] font-semibold flex-shrink-0"
                    >
                      {currentAd.cta_label || "Learn More"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Countdown / unlock button */}
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] text-[#C4C4BA]/40 uppercase tracking-wide">Sponsored</span>
                {canSkip ? (
                  <button
                    onClick={handleAdFinish}
                    className="flex items-center gap-1.5 bg-[#FF6B35] text-white text-xs font-semibold px-4 py-2 rounded-xl active:scale-95 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Unlock Recipe →
                  </button>
                ) : (
                  <span className="text-xs text-[#C4C4BA]/60 bg-[#15233A] px-3 py-1.5 rounded-lg tabular-nums">
                    {secondsLeft}s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── COMPLETED ── */}
          {phase === "completed" && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F0] mb-2">Unlocked!</h3>
              <p className="text-sm text-[#C4C4BA]/60">Enjoy your AI recipe</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
