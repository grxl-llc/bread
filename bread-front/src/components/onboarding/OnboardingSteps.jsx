import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Store, Leaf, Users, ChefHat, Zap, Package, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const storeOptions = ["Walmart", "Kroger", "Costco", "Aldi", "Trader Joe's", "Whole Foods", "Target", "Publix", "H-E-B", "Safeway"];
const dietaryOptions = ["No restrictions", "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Paleo", "Dairy-Free", "Halal", "Kosher", "Low-Sodium"];
const skillLevels = [
  { key: "beginner", label: "Beginner", desc: "I can make basic meals", emoji: "🍳" },
  { key: "intermediate", label: "Intermediate", desc: "I cook regularly", emoji: "👨‍🍳" },
  { key: "advanced", label: "Advanced", desc: "I love complex recipes", emoji: "⭐" },
];

export default function OnboardingSteps({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    zip_code: "",
    preferred_stores: [],
    dietary_preferences: [],
    household_size: 1,
    cooking_skill: "beginner",
    smart_pricing_enabled: true,
  });

  const steps = [
    {
      icon: MapPin,
      title: "Your Location",
      subtitle: "Enter your ZIP code for local pricing",
      content: (
        <Input
          placeholder="Enter ZIP code"
          value={data.zip_code}
          onChange={(e) => setData({ ...data, zip_code: e.target.value })}
          className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] text-center text-2xl h-16 rounded-2xl tracking-widest"
          maxLength={5}
        />
      ),
      valid: data.zip_code.length >= 5,
    },
    {
      icon: Store,
      title: "Your Stores",
      subtitle: "Select your preferred grocery stores",
      content: (
        <div className="grid grid-cols-2 gap-2">
          {storeOptions.map((store) => (
            <button
              key={store}
              onClick={() => {
                const stores = data.preferred_stores.includes(store)
                  ? data.preferred_stores.filter((s) => s !== store)
                  : [...data.preferred_stores, store];
                setData({ ...data, preferred_stores: stores });
              }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                data.preferred_stores.includes(store)
                  ? "bg-[#FF6B35] text-white"
                  : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
              }`}
            >
              {store}
            </button>
          ))}
        </div>
      ),
      valid: data.preferred_stores.length > 0,
    },
    {
      icon: Leaf,
      title: "Dietary Preferences",
      subtitle: "Help us personalize your experience",
      content: (
        <div className="grid grid-cols-2 gap-2">
          {dietaryOptions.map((diet) => (
            <button
              key={diet}
              onClick={() => {
                const prefs = data.dietary_preferences.includes(diet)
                  ? data.dietary_preferences.filter((d) => d !== diet)
                  : [...data.dietary_preferences, diet];
                setData({ ...data, dietary_preferences: prefs });
              }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                data.dietary_preferences.includes(diet)
                  ? "bg-[#FF6B35] text-white"
                  : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
              }`}
            >
              {diet}
            </button>
          ))}
        </div>
      ),
      valid: data.dietary_preferences.length > 0,
    },
    {
      icon: Users,
      title: "Household Size",
      subtitle: "How many people in your household?",
      content: (
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setData({ ...data, household_size: Math.max(1, data.household_size - 1) })}
            className="w-14 h-14 rounded-2xl bg-[#1A2744] text-[#F5F5F0] text-2xl font-bold hover:bg-[#243352] transition"
          >
            −
          </button>
          <span className="text-6xl font-bold text-[#F5F5F0] w-20 text-center">
            {data.household_size}
          </span>
          <button
            onClick={() => setData({ ...data, household_size: data.household_size + 1 })}
            className="w-14 h-14 rounded-2xl bg-[#1A2744] text-[#F5F5F0] text-2xl font-bold hover:bg-[#243352] transition"
          >
            +
          </button>
        </div>
      ),
      valid: true,
    },
    {
      icon: ChefHat,
      title: "Cooking Level",
      subtitle: "What's your experience in the kitchen?",
      content: (
        <div className="space-y-3">
          {skillLevels.map((level) => (
            <button
              key={level.key}
              onClick={() => setData({ ...data, cooking_skill: level.key })}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition ${
                data.cooking_skill === level.key
                  ? "bg-[#FF6B35] text-white"
                  : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
              }`}
            >
              <span className="text-3xl">{level.emoji}</span>
              <div>
                <div className="font-semibold text-base">{level.label}</div>
                <div className="text-xs opacity-70">{level.desc}</div>
              </div>
            </button>
          ))}
        </div>
      ),
      valid: true,
    },
    {
      icon: Zap,
      title: "Smart Pricing",
      subtitle: "Enable AI-powered price comparisons across stores",
      content: (
        <div className="space-y-4">
          <button
            onClick={() => setData({ ...data, smart_pricing_enabled: true })}
            className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl text-left transition ${
              data.smart_pricing_enabled
                ? "bg-[#FF6B35] text-white"
                : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
            }`}
          >
            <Zap className="w-8 h-8" />
            <div>
              <div className="font-semibold">Enable Smart Pricing</div>
              <div className="text-xs opacity-70">See the cheapest option for every ingredient</div>
            </div>
          </button>
          <button
            onClick={() => setData({ ...data, smart_pricing_enabled: false })}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition ${
              !data.smart_pricing_enabled
                ? "bg-[#243352] text-white"
                : "bg-[#1A2744] text-[#C4C4BA] hover:bg-[#243352]"
            }`}
          >
            <div className="font-semibold text-sm">Skip for now</div>
          </button>
        </div>
      ),
      valid: true,
    },
    {
      icon: Package,
      title: "Pantry Tracker",
      subtitle: "Track what's in your kitchen for $19.95/mo",
      content: (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8555] flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
          <p className="text-[#C4C4BA] text-sm mb-6 max-w-xs mx-auto">
            Never over-buy groceries again. Smart pantry knows exactly what you need.
          </p>
          <div className="bg-[#1A2744] rounded-2xl p-4 mb-4">
            <span className="text-3xl font-bold text-[#F5F5F0]">$19.95</span>
            <span className="text-[#C4C4BA]">/mo</span>
          </div>
          <p className="text-xs text-[#C4C4BA]/60">You can subscribe later from Settings</p>
        </div>
      ),
      valid: true,
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete(data);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-all duration-300 ${
              i <= step ? "bg-[#FF6B35]" : "bg-[#1A2744]"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex-1 flex flex-col"
        >
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mb-4">
              <Icon className="w-7 h-7 text-[#FF6B35]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1">{currentStep.title}</h1>
            <p className="text-sm text-[#C4C4BA]">{currentStep.subtitle}</p>
          </div>

          <div className="flex-1">{currentStep.content}</div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="border-[#243352] text-[#C4C4BA] hover:bg-[#1A2744] rounded-xl h-12 px-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!currentStep.valid}
          className="flex-1 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12 text-base font-semibold disabled:opacity-30"
        >
          {isLast ? (
            <><Check className="w-5 h-5 mr-2" />Get Started</>
          ) : (
            <>Continue<ChevronRight className="w-5 h-5 ml-1" /></>
          )}
        </Button>
      </div>
    </div>
  );
}