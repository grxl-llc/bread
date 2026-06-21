import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import BreadIcon from "../branding/BreadIcon";

export default function PremiumFeatureModal({ open, onClose, onUpgrade }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#15233A] rounded-3xl p-6 relative overflow-hidden"
        >
          {/* Premium Badge */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6B35]/20 to-transparent rounded-bl-full" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 z-10"
          >
            <X className="w-5 h-5 text-[#C4C4BA]" />
          </button>

          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center relative">
              <BreadIcon size={72} variant="default" showLetter={true} />
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-[#FF6B35] to-[#FF8555] rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#F5F5F0] mb-2">
              Smart Pantry Suggestions
            </h2>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm text-[#FF6B35] font-semibold">Bread+ Feature</span>
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <p className="text-sm text-[#C4C4BA]/80 leading-relaxed">
              Instantly see which recipes you can cook right now using ingredients already in your pantry.
            </p>
          </div>

          <div className="bg-[#1A2744] rounded-2xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-[#F5F5F0] mb-3">What you'll get:</h3>
            <ul className="space-y-2 text-sm text-[#C4C4BA]">
              <li className="flex items-start gap-2">
                <span className="text-[#34D399] mt-0.5">✓</span>
                <span>AI-powered pantry analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#34D399] mt-0.5">✓</span>
                <span>Instant recipe matches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#34D399] mt-0.5">✓</span>
                <span>Zero-shopping meal ideas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#34D399] mt-0.5">✓</span>
                <span>Smart pricing for missing items</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8555] hover:from-[#FF8555] hover:to-[#FF6B35] text-white rounded-xl h-12 font-semibold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Bread+
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-[#C4C4BA] hover:bg-white/5 rounded-xl h-10"
            >
              Maybe Later
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}