import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Tag } from "lucide-react";
import { motion } from "framer-motion";
import BreadIcon from "../branding/BreadIcon";

export default function CouponLockScreen({ open, onClose, onUpgrade }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A2744] border-[#243352] max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 text-center"
        >
          <div className="mb-4 flex justify-center relative">
            <BreadIcon size={80} variant="default" showLetter={true} />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF6B35]/20 rounded-full flex items-center justify-center">
              <Tag className="w-5 h-5 text-[#FF6B35]" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#F5F5F0] mb-3">Unlock Bread+ Coupons</h2>

          <p className="text-[#C4C4BA] text-sm mb-6 leading-relaxed">
            Get exclusive access to premium coupons and deeper discounts with Bread+
          </p>

          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-start gap-3 bg-[#15233A] rounded-xl p-3">
              <Tag className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#F5F5F0] font-medium">Extra Savings</p>
                <p className="text-xs text-[#C4C4BA]/60">Save an average of $50/month</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#15233A] rounded-xl p-3">
              <Sparkles className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#F5F5F0] font-medium">Smart Pantry</p>
                <p className="text-xs text-[#C4C4BA]/60">Track inventory & get recipe suggestions</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8555] hover:from-[#FF8555] hover:to-[#FF6B35] text-white h-12 rounded-xl font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Bread+
          </Button>

          <p className="text-xs text-[#C4C4BA]/60 mt-4">$19.95/month • Cancel anytime</p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}