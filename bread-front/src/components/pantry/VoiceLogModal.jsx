import React, { useState, useRef } from "react";
import { Mic, MicOff, Send, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/apiConfig";

export default function VoiceLogModal({ open, onClose, userId, onLogged }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // parsed confirmation
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  if (!open) return null;

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use the text input below.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setError("Could not capture audio. Try the text input instead.");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setError(null);
    setResult(null);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const submitLog = async (text) => {
    if (!text?.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const baseUrl = API_BASE_URL || "";
    const res = await fetch(`${baseUrl}/pantry/voice-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, text: text.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.detail || "Failed to log. Please try again.");
    } else {
      setResult(data);
      setTranscript("");
      setTextInput("");
      onLogged?.();
    }

    setLoading(false);
  };

  const handleClose = () => {
    stopListening();
    setTranscript("");
    setTextInput("");
    setResult(null);
    setError(null);
    onClose();
  };

  const activeText = transcript || textInput;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-[#1A2744] rounded-t-3xl px-5 pt-5 pb-10 space-y-5">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#F5F5F0]">Log Pantry Usage</h2>
          <button onClick={handleClose}>
            <X className="w-5 h-5 text-[#C4C4BA]" />
          </button>
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? "bg-red-500 animate-pulse shadow-red-500/40"
                : "bg-[#FF6B35] hover:bg-[#FF8555] shadow-[#FF6B35]/30"
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
          <p className="text-xs text-[#C4C4BA]/60">
            {isListening ? "Listening… tap to stop" : "Tap to speak"}
          </p>
        </div>

        {/* Transcript preview */}
        {transcript ? (
          <div className="bg-[#15233A] rounded-xl px-4 py-3">
            <p className="text-xs text-[#C4C4BA]/60 mb-1">Heard:</p>
            <p className="text-sm text-[#F5F5F0]">"{transcript}"</p>
          </div>
        ) : null}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-[#C4C4BA]/40">or type it</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Text fallback */}
        <div className="flex gap-2">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. Lex just had a regular cup of orange juice"
            className="bg-[#15233A] border-[#243352] text-[#F5F5F0] placeholder:text-[#C4C4BA]/40 rounded-xl flex-1"
            onKeyDown={(e) => e.key === "Enter" && submitLog(textInput)}
          />
          <Button
            onClick={() => submitLog(textInput)}
            disabled={!textInput.trim() || loading}
            className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Submit transcript */}
        {transcript && (
          <Button
            onClick={() => submitLog(transcript)}
            disabled={loading}
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-11"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Log This
          </Button>
        )}

        {/* Loading */}
        {loading && !transcript && (
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF6B35]" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Success confirmation */}
        {result && (
          <div className="bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl px-4 py-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[#34D399]" />
              <span className="text-sm font-semibold text-[#34D399]">Logged!</span>
            </div>
            {result.parsed && (
              <p className="text-sm text-[#F5F5F0]">
                <span className="text-[#C4C4BA]/60">Parsed: </span>
                {result.parsed}
              </p>
            )}
            {result.deducted && (
              <p className="text-sm text-[#F5F5F0]">
                <span className="text-[#C4C4BA]/60">Deducted: </span>
                {result.deducted}
              </p>
            )}
            {result.message && (
              <p className="text-sm text-[#C4C4BA]">{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}