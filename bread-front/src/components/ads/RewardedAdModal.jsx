import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdService } from "./AdService";
import { VAST_TAG_URL } from "@/lib/featureConfig";

// ── IMA SDK loader (singleton — only injects the script once) ─────────────────
let imaLoadPromise = null;
function loadIMASDK() {
  if (imaLoadPromise) return imaLoadPromise;
  imaLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.ima) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("IMA SDK failed to load"));
    document.head.appendChild(s);
  });
  return imaLoadPromise;
}

export default function RewardedAdModal({ open, onClose, onComplete, userId, postId }) {
  const [phase, setPhase] = useState("prompt"); // prompt | loading | watching | completed | error
  const [errorMsg, setErrorMsg] = useState("");

  const adContainerRef = useRef(null);
  const videoRef = useRef(null);
  const adsManagerRef = useRef(null);
  const adDisplayContainerRef = useRef(null);

  // Tear down IMA on unmount / close
  const destroyAds = useCallback(() => {
    try { adsManagerRef.current?.destroy(); } catch {}
    try { adDisplayContainerRef.current?.destroy(); } catch {}
    adsManagerRef.current = null;
    adDisplayContainerRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      destroyAds();
      setPhase("prompt");
      setErrorMsg("");
    }
    return destroyAds;
  }, [open, destroyAds]);

  const startAd = async () => {
    setPhase("loading");
    await AdService.logImpression(userId, "rewarded_ad", postId);

    try {
      await loadIMASDK();
      const ima = window.google.ima;

      // Give React one tick to render the ad container div
      await new Promise((r) => setTimeout(r, 50));

      if (!adContainerRef.current || !videoRef.current) {
        throw new Error("Ad container not ready");
      }

      // IMA requires a user-gesture context — we're inside a click handler chain so this is fine
      const adDisplayContainer = new ima.AdDisplayContainer(
        adContainerRef.current,
        videoRef.current
      );
      adDisplayContainer.initialize();
      adDisplayContainerRef.current = adDisplayContainer;

      const adsLoader = new ima.AdsLoader(adDisplayContainer);

      adsLoader.addEventListener(
        ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (event) => {
          const adsManager = event.getAdsManager(videoRef.current);
          adsManagerRef.current = adsManager;

          // Wire up events
          adsManager.addEventListener(ima.AdEvent.Type.STARTED, () => setPhase("watching"));
          adsManager.addEventListener(ima.AdEvent.Type.SKIPPED, handleComplete);
          adsManager.addEventListener(ima.AdEvent.Type.COMPLETE, handleComplete);
          adsManager.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, handleComplete);
          adsManager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, handleAdError);

          try {
            adsManager.init(
              adContainerRef.current.offsetWidth,
              adContainerRef.current.offsetHeight,
              ima.ViewMode.NORMAL
            );
            adsManager.start();
          } catch (err) {
            handleAdError(err);
          }
        }
      );

      adsLoader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, handleAdError);

      const request = new ima.AdsRequest();
      request.adTagUrl = VAST_TAG_URL;
      request.linearAdSlotWidth = adContainerRef.current.offsetWidth || 640;
      request.linearAdSlotHeight = adContainerRef.current.offsetHeight || 360;
      adsLoader.requestAds(request);

    } catch (err) {
      handleAdError(err);
    }
  };

  const handleComplete = useCallback(async () => {
    destroyAds();
    await AdService.logCompletion(userId, "rewarded_ad", postId);
    setPhase("completed");
    setTimeout(() => {
      onComplete();
      onClose();
      setPhase("prompt");
    }, 1200);
  }, [destroyAds, userId, postId, onComplete, onClose]);

  const handleAdError = useCallback((e) => {
    const msg = e?.getError?.()?.getMessage?.() || e?.message || "Ad unavailable";
    console.warn("IMA ad error:", msg);
    destroyAds();
    setErrorMsg("No ad available right now. Please try again.");
    setPhase("error");
  }, [destroyAds]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={phase === "prompt" || phase === "error" ? onClose : undefined}
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
                  onClick={startAd}
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

          {/* ── LOADING + WATCHING: IMA renders into this container ── */}
          {(phase === "loading" || phase === "watching") && (
            <div>
              {/* IMA ad container — must be visible in DOM before SDK initialises */}
              <div
                ref={adContainerRef}
                className="w-full bg-black relative"
                style={{ aspectRatio: "16/9" }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  playsInline
                  // IMA SDK controls playback — don't set src here
                />
                {phase === "loading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] text-[#C4C4BA]/40 uppercase tracking-wide">
                  Sponsored
                </span>
                <span className="text-xs text-[#C4C4BA]/50">
                  {phase === "loading" ? "Loading ad…" : "Watch to unlock"}
                </span>
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

          {/* ── ERROR ── */}
          {phase === "error" && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F0] mb-2">Ad Unavailable</h3>
              <p className="text-sm text-[#C4C4BA]/60 mb-5">{errorMsg}</p>
              <div className="space-y-2">
                <Button
                  onClick={() => { setPhase("prompt"); setErrorMsg(""); }}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-11"
                >
                  Try Again
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full text-[#C4C4BA] hover:bg-white/5 rounded-xl h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
