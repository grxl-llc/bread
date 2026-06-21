import React, { useState, useRef, useEffect } from "react";
import { X, Scissors, Play, Pause, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * VideoClipCropper
 * Lets the user pick a start time and crop a max-20s clip from a tutorial video.
 * Returns { blob, startTime, endTime } via onCrop.
 */
export default function VideoClipCropper({ open, videoUrl, tutorialTitle, onCrop, onClose }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(20);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      setStartTime(0);
      setEndTime(20);
      setCurrentTime(0);
    }
  }, [open]);

  if (!open) return null;

  const handleLoaded = () => {
    const dur = videoRef.current?.duration || 0;
    setDuration(dur);
    const end = Math.min(20, dur);
    setEndTime(end);
  };

  const handleTimeUpdate = () => {
    const t = videoRef.current?.currentTime || 0;
    setCurrentTime(t);
    // stop at endTime
    if (t >= endTime) {
      videoRef.current.pause();
      videoRef.current.currentTime = startTime;
      setPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const handleStartChange = (val) => {
    const s = parseFloat(val);
    const maxStart = Math.max(0, endTime - 1);
    const clamped = Math.min(s, maxStart);
    setStartTime(clamped);
    // keep window <= 20s
    if (endTime - clamped > 20) setEndTime(clamped + 20);
    if (videoRef.current) videoRef.current.currentTime = clamped;
  };

  const handleEndChange = (val) => {
    const e = parseFloat(val);
    const minEnd = startTime + 1;
    const maxEnd = Math.min(duration, startTime + 20);
    const clamped = Math.min(Math.max(e, minEnd), maxEnd);
    setEndTime(clamped);
  };

  const clipLength = (endTime - startTime).toFixed(1);

  const handleConfirm = () => {
    // We pass back start/end times and the original URL
    // Actual trimming happens server-side or we just enforce via max playback duration
    onCrop({ videoUrl, startTime, endTime, clipLength: parseFloat(clipLength) });
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#15233A] rounded-t-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F0]">Crop Clip</h2>
            <p className="text-xs text-[#C4C4BA]/60 truncate max-w-[220px]">{tutorialTitle}</p>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[#C4C4BA]" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onLoadedMetadata={handleLoaded}
            onTimeUpdate={handleTimeUpdate}
            playsInline
          />
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
              {playing ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </div>
          </button>
        </div>

        {/* Timeline */}
        <div className="px-5 py-4 space-y-4">
          {/* Clip duration badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-sm font-semibold text-[#F5F5F0]">Clip: {clipLength}s</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${parseFloat(clipLength) <= 20 ? "bg-[#34D399]/20 text-[#34D399]" : "bg-red-500/20 text-red-400"}`}>
              max 20s
            </span>
          </div>

          {/* Start slider */}
          <div>
            <div className="flex justify-between text-xs text-[#C4C4BA]/60 mb-1">
              <span>Start: {fmt(startTime)}</span>
              <span>End: {fmt(endTime)}</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-[#C4C4BA]/50 mb-1">Start time</p>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, duration - 1)}
                  step={0.1}
                  value={startTime}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full accent-[#FF6B35]"
                />
              </div>
              <div>
                <p className="text-xs text-[#C4C4BA]/50 mb-1">End time</p>
                <input
                  type="range"
                  min={startTime + 1}
                  max={Math.min(duration, startTime + 20)}
                  step={0.1}
                  value={endTime}
                  onChange={(e) => handleEndChange(e.target.value)}
                  className="w-full accent-[#FF6B35]"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleConfirm}
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12 font-semibold"
          >
            <Check className="w-4 h-4 mr-2" />
            Use This Clip ({clipLength}s)
          </Button>
          <p className="text-center text-xs text-[#C4C4BA]/40 pb-2">
            A "Watch full tutorial" link will be added automatically
          </p>
        </div>
      </div>
    </div>
  );
}