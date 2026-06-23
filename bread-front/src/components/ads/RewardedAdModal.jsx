import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdService } from "./AdService";

export default function RewardedAdModal({ open, onClose, onComplete, userId, postId, title, subtitle }) {
  const [watching, setWatching] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  const handleWatchAd = async () => {
    setWatching(true);
    setAdFailed(false);

    try {
      await AdService.logImpression(userId, "rewarded_ad", postId);

      // Simulate ad watching
      const adSuccess = await AdService.watchRewardedAd();

      if (!adSuccess) {
        setAdFailed(true);
        setWatching(false);
        return;
      }

      await AdService.logCompletion(userId, "rewarded_ad", postId);
      setWatching(false);
      setCompleted(true);

      // Auto-close and unlock after 1 second
      setTimeout(() => {
        onComplete();
        onClose();
        setCompleted(false);
      }, 1000);
    } catch (error) {
      setAdFailed(true);
      setWatching(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={!watching ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#1A2744] rounded-3xl p-6 relative"
        >
          {!watching && !completed && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition"
            >
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          )}

          <div className="text-center">
            {watching ? (
              <>
                <div className="w-16 h-16 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F0] mb-2">
                  Playing Ad...
                </h3>
                <p className="text-sm text-[#C4C4BA]/60">
                  Please wait a moment
                </p>
              </>
            ) : completed ? (
              <>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F0] mb-2">
                  Unlocked!
                </h3>
                <p className="text-sm text-[#C4C4BA]/60">
                  Enjoy your AI recipe
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-[#FF6B35]" />
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F0] mb-2">
                  Unlock AI Best Guess Recipe
                </h3>
                <p className="text-sm text-[#C4C4BA]/60 mb-6">
                  Watch a short ad to reveal your AI-generated recipe.
                </p>
                {adFailed && (
                  <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-400">
                      Ad unavailable. Please try again.
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  <Button
                    onClick={handleWatchAd}
                    disabled={watching}
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
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}