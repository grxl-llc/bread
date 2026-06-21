import React from "react";
import { motion } from "framer-motion";
import { Lock, Package, Zap, RefreshCw, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Package, title: "Track Your Pantry", desc: "Know what's in stock at all times" },
  { icon: Zap, title: "Smart Shopping", desc: "Only buy what you actually need" },
  { icon: RefreshCw, title: "Auto-Deduct", desc: "Ingredients reduce when you cook" },
  { icon: Users, title: "Household Sync", desc: "Share pantry with your household" },
];

export default function PantryPaywall({ onSubscribe, loading }) {
  return (
    <div className="min-h-screen bg-[#15233A] p-6 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#FF6B35] to-[#FF8555] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
          <Lock className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-[#F5F5F0] mb-2">Unlock Your Pantry</h1>
        <p className="text-[#C4C4BA] text-sm mb-8">
          Track inventory, save money, and never over-buy groceries again.
        </p>

        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="flex items-center gap-4 bg-[#1A2744] rounded-xl px-4 py-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F0]">{f.title}</h3>
                <p className="text-xs text-[#C4C4BA]">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#1A2744] rounded-2xl p-5 mb-4">
          <div className="text-3xl font-bold text-[#F5F5F0] mb-1">
            $19.95<span className="text-base font-normal text-[#C4C4BA]">/mo</span>
          </div>
          <p className="text-xs text-[#C4C4BA]">Cancel anytime. Save hundreds on groceries.</p>
        </div>

        <Button
          onClick={onSubscribe}
          disabled={loading}
          className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12 text-base font-semibold"
        >
          {loading ? "Processing..." : "Start Subscription"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </motion.div>
    </div>
  );
}