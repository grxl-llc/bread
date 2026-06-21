import React, { useState } from "react";
import { X, Scissors, Type, Music, Zap, Filter, Image } from "lucide-react";

export default function VideoEditorModal({ isOpen, onClose, onSave }) {
  const [videoFile, setVideoFile] = useState(null);
  const [edits, setEdits] = useState({
    trimStart: 0,
    trimEnd: 0,
    textOverlay: "",
    music: null,
    speed: 1,
    filter: "none",
    thumbnail: null,
  });

  const handleFileUpload = (e) => {
    setVideoFile(e.target.files?.[0]);
  };

  const handleSave = () => {
    if (videoFile) {
      onSave({ videoFile, edits });
      setVideoFile(null);
      setEdits({
        trimStart: 0,
        trimEnd: 0,
        textOverlay: "",
        music: null,
        speed: 1,
        filter: "none",
        thumbnail: null,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A2744] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#243352]">
          <h2 className="text-xl font-bold text-[#F5F5F0]">Advanced Video Editor</h2>
          <button onClick={onClose} className="text-[#C4C4BA] hover:text-[#F5F5F0]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video Upload */}
          <div>
            <label className="text-sm font-semibold text-[#F5F5F0] block mb-2">Upload Video</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA]"
            />
            {videoFile && <p className="text-xs text-[#34D399] mt-2">✓ {videoFile.name}</p>}
          </div>

          {/* Trim */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scissors className="w-4 h-4 text-[#FF6B35]" />
              <label className="text-sm font-semibold text-[#F5F5F0]">Trim</label>
            </div>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Start (seconds)"
                value={edits.trimStart}
                onChange={(e) => setEdits({ ...edits, trimStart: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA] text-sm"
              />
              <input
                type="number"
                placeholder="End (seconds)"
                value={edits.trimEnd}
                onChange={(e) => setEdits({ ...edits, trimEnd: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA] text-sm"
              />
            </div>
          </div>

          {/* Text Overlay */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-[#9333EA]" />
              <label className="text-sm font-semibold text-[#F5F5F0]">Text Overlay</label>
            </div>
            <input
              type="text"
              placeholder="Enter text to overlay on video"
              value={edits.textOverlay}
              onChange={(e) => setEdits({ ...edits, textOverlay: e.target.value })}
              className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA] text-sm"
            />
          </div>

          {/* Music */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-[#3B82F6]" />
              <label className="text-sm font-semibold text-[#F5F5F0]">Add Music</label>
            </div>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setEdits({ ...edits, music: e.target.files?.[0] })}
              className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA] text-sm"
            />
          </div>

          {/* Speed Control */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#F59E0B]" />
              <label className="text-sm font-semibold text-[#F5F5F0]">Speed</label>
            </div>
            <select
              value={edits.speed}
              onChange={(e) => setEdits({ ...edits, speed: parseFloat(e.target.value) })}
              className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA] text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x (Normal)</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-[#EC4899]" />
              <label className="text-sm font-semibold text-[#F5F5F0]">Filters</label>
            </div>
            <select
              value={edits.filter}
              onChange={(e) => setEdits({ ...edits, filter: e.target.value })}
              className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA] text-sm"
            >
              <option value="none">None</option>
              <option value="brightness">Brightness</option>
              <option value="contrast">Contrast</option>
              <option value="sepia">Sepia</option>
              <option value="grayscale">Grayscale</option>
              <option value="blur">Blur</option>
            </select>
          </div>

          {/* Thumbnail */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-[#06B6D4]" />
              <label className="text-sm font-semibold text-[#F5F5F0]">Custom Thumbnail</label>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEdits({ ...edits, thumbnail: e.target.files?.[0] })}
              className="w-full bg-[#15233A] border border-[#243352] rounded-lg px-4 py-2 text-[#C4C4BA] text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#243352]">
            <button
              onClick={onClose}
              className="flex-1 bg-[#243352] text-[#F5F5F0] font-semibold py-2 rounded-lg hover:bg-[#2A3F54] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!videoFile}
              className="flex-1 bg-[#FF6B35] text-white font-semibold py-2 rounded-lg hover:bg-[#FF8555] transition disabled:opacity-50"
            >
              Save & Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}