import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SignupOnboarding from "@/components/onboarding/SignupOnboarding";
import { getLiveZip } from "@/lib/location";

export default function PostSignupOnboarding() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState("onboarding"); // "onboarding" | "zip"
  const [zip, setZip] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then((currentUser) => {
        if (!currentUser) {
          navigate("/signup");
          return;
        }
        if (currentUser.signup_onboarding_complete) {
          navigate("/Home");
          return;
        }
        setUser(currentUser);
        setZip(currentUser.zipcode || "");
        setChecking(false);
      })
      .catch(() => navigate("/signup"));
  }, [navigate]);

  const finish = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        signup_onboarding_complete: true,
        ...(zip?.trim() ? { zipcode: zip.trim() } : {}),
      });
      navigate("/Home");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setSaving(false);
    }
  };

  // After the onboarding wizard: if we still don't have a zip (e.g. OAuth signup
  // that never collected one), show the zip-capture fallback. Otherwise finish.
  const handleOnboardingComplete = () => {
    if (user?.zipcode) {
      finish();
    } else {
      setPhase("zip");
    }
  };

  const handleDetect = async () => {
    setDetecting(true);
    const detected = await getLiveZip({ force: true });
    if (detected) setZip(detected);
    setDetecting(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "zip") {
    return (
      <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1A2744] rounded-2xl p-8 border border-white/5">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/15 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-[#FF6B35]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F0] text-center mb-1">One last thing</h1>
          <p className="text-[#C4C4BA] text-center mb-6 text-sm">
            Add your ZIP so we can show real grocery prices near you.
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              inputMode="numeric"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              maxLength={5}
              placeholder="e.g. 27576"
              className="flex-1 bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] text-center text-xl tracking-widest placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleDetect}
              disabled={detecting}
              className="shrink-0 flex items-center gap-1.5 bg-[#15233A] border border-white/10 hover:border-[#FF6B35]/50 disabled:opacity-50 text-[#C4C4BA] px-3 rounded-xl transition-colors text-sm"
            >
              <MapPin className="w-4 h-4" />
              {detecting ? "…" : "Locate"}
            </button>
          </div>

          <button
            onClick={finish}
            disabled={saving}
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? "Saving…" : "Finish"}
          </button>
          <button
            onClick={finish}
            disabled={saving}
            className="w-full text-[#C4C4BA]/60 text-sm py-3 hover:text-[#C4C4BA] transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return <SignupOnboarding onComplete={handleOnboardingComplete} />;
}
