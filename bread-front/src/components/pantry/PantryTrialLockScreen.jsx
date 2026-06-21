import React from "react";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import BreadIcon from "../branding/BreadIcon";

export default function PantryTrialLockScreen({ onUpgrade, loading }) {
  return (
    <div className="min-h-screen bg-[#15233A] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-[#1A2744] rounded-3xl p-8 text-center border border-[#243352]">
          <div className="mb-4 flex justify-center relative">
            <BreadIcon size={80} variant="default" showLetter={true} />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF6B35]/20 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#FF6B35]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-[#F5F5F0] mb-3">
            Your 30-Day Free Pantry Access Has Ended
          </h2>
          
          <p className="text-[#C4C4BA] text-sm mb-6 leading-relaxed">
            Continue tracking your pantry, getting smart recipe recommendations, and saving money with Bread+
          </p>

          {/* Blurred preview */}
          <div className="bg-[#15233A] rounded-2xl p-4 mb-6 relative overflow-hidden">
            <div className="blur-sm opacity-50 space-y-2">
              <div className="flex items-center justify-between bg-[#243352] rounded-xl p-3">
                <span className="text-[#F5F5F0] text-sm">🥛 Milk</span>
                <span className="text-[#C4C4BA] text-xs">2 gallons</span>
              </div>
              <div className="flex items-center justify-between bg-[#243352] rounded-xl p-3">
                <span className="text-[#F5F5F0] text-sm">🍞 Bread</span>
                <span className="text-[#C4C4BA] text-xs">1 loaf</span>
              </div>
              <div className="flex items-center justify-between bg-[#243352] rounded-xl p-3">
                <span className="text-[#F5F5F0] text-sm">🥚 Eggs</span>
                <span className="text-[#C4C4BA] text-xs">12 count</span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#FF6B35]" />
            </div>
          </div>

          <Button
            onClick={onUpgrade}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8555] hover:from-[#FF8555] hover:to-[#FF6B35] text-white h-12 rounded-xl font-semibold"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Bread+
              </>
            )}
          </Button>

          <p className="text-xs text-[#C4C4BA]/60 mt-4">
            $19.95/month • Cancel anytime
          </p>
        </div>
      </motion.div>
    </div>
  );
}