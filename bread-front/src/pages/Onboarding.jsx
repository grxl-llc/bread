import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import OnboardingSteps from "../components/onboarding/OnboardingSteps";

export default function Onboarding() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if onboarding is already complete
    base44.auth.me().then((user) => {
      if (user?.onboarding_complete) {
        window.location.href = "/Home";
      } else {
        setChecking(false);
      }
    }).catch(() => setChecking(false));
  }, []);

  const handleComplete = async (data) => {
    await base44.auth.updateMe({
      ...data,
      onboarding_complete: true,
    });
    window.location.href = "/Home";
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <OnboardingSteps onComplete={handleComplete} />;
}