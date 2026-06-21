import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Scan, Mic } from "lucide-react";

import PantryPaywall from "../components/pantry/PantryPaywall";
import PantryInventory from "../components/pantry/PantryInventory";
import PantryTutorialModal from "../components/pantry/PantryTutorialModal";
import PantryTrialLockScreen from "../components/pantry/PantryTrialLockScreen";
import BarcodeScannerModal from "../components/shared/BarcodeScannerModal";
import VoiceLogModal from "../components/pantry/VoiceLogModal";
import PullToRefresh from "../components/shared/PullToRefresh";

export default function Pantry() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showVoiceLog, setShowVoiceLog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      // Initialize trial dates if needed
      if (!u.account_created_at) {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 30);
        
        await base44.auth.updateMe({
          account_created_at: now.toISOString(),
          pantry_trial_end_date: trialEnd.toISOString(),
        });
        
        const updated = await base44.auth.me();
        setUser(updated);
      } else {
        setUser(u);
      }
      
      // Show tutorial on first visit
      if (!u.pantry_tutorial_completed) {
        setShowTutorial(true);
      }
      
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const hasAccess = () => {
    if (user?.subscription_status === "active") return true;
    if (!user?.pantry_trial_end_date) return false;
    
    const now = new Date();
    const trialEnd = new Date(user.pantry_trial_end_date);
    return now < trialEnd;
  };

  const daysRemaining = () => {
    if (!user?.pantry_trial_end_date) return 0;
    const now = new Date();
    const trialEnd = new Date(user.pantry_trial_end_date);
    const diff = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const { data: pantryItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["pantryItems"],
    queryFn: () => base44.entities.PantryItem.list("-updated_date", 200),
    enabled: hasAccess(),
  });

  const handleSubscribe = async () => {
    setSubscribing(true);
    await base44.auth.updateMe({
      subscription_status: "active",
      subscription_date: new Date().toISOString().split("T")[0],
    });
    const updated = await base44.auth.me();
    setUser(updated);
    setSubscribing(false);
  };

  const handleTutorialComplete = async () => {
    await base44.auth.updateMe({ pantry_tutorial_completed: true });
    setShowTutorial(false);
  };

  const handleBarcodeScanned = async (product) => {
    await base44.entities.PantryItem.create({
      name: product.name,
      quantity: 1,
      unit: product.size,
      brand: product.brand,
      product_id: product.product_id || null,
      category: product.category,
    });
    queryClient.invalidateQueries({ queryKey: ["pantryItems"] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show lock screen if trial expired and no Bread+ subscription
  if (!hasAccess()) {
    return <PantryTrialLockScreen onUpgrade={handleSubscribe} loading={subscribing} />;
  }

  const trialDays = daysRemaining();
  const isOnTrial = user?.subscription_status !== "active" && trialDays > 0;

  return (
    <>
      <div className="min-h-screen bg-[#15233A]">
        <div className="pt-6 px-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-[#F5F5F0]">My Pantry</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowVoiceLog(true)}
                size="sm"
                className="bg-[#1A2744] hover:bg-[#243352] border border-[#FF6B35]/40 text-[#FF6B35] rounded-xl"
              >
                <Mic className="w-4 h-4 mr-1" />
                Log
              </Button>
              <Button
                onClick={() => setShowBarcodeScanner(true)}
                size="sm"
                className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
              >
                <Scan className="w-4 h-4 mr-1" />
                Scan
              </Button>
            </div>
          </div>
          {isOnTrial ? (
            <p className="text-sm text-[#FF6B35]">
              {trialDays} {trialDays === 1 ? "day" : "days"} remaining in your free trial
            </p>
          ) : (
            <p className="text-sm text-[#C4C4BA]/60">Track what's in your kitchen</p>
          )}
        </div>

        <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ["pantryItems"] })}>
          <PantryInventory
            items={pantryItems}
            user={user}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["pantryItems"] })}
          />
        </PullToRefresh>
      </div>

      <PantryTutorialModal open={showTutorial} onComplete={handleTutorialComplete} />
      <VoiceLogModal
        open={showVoiceLog}
        onClose={() => setShowVoiceLog(false)}
        userId={user?.id}
        onLogged={() => queryClient.invalidateQueries({ queryKey: ["pantryItems"] })}
      />
      <BarcodeScannerModal
        open={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductScanned={handleBarcodeScanned}
      />
    </>
  );
}