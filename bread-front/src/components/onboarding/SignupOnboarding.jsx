import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, ShoppingCart, BookOpen, Share2, ArrowRight } from "lucide-react";
import BreadLogo from "@/components/branding/BreadLogo";

const steps = [
  {
    title: "Welcome to Bread",
    description: "Cook smarter. Spend less.",
    icon: "🍞",
    content: "AI-powered recipes, pantry tracking, and grocery deals — all in one place."
  },
  {
    title: "AI Recipe Discovery",
    description: "From photos to full recipes",
    icon: <Zap className="w-12 h-12 text-[#FF6B35]" />,
    content: "Snap a photo of any dish and get AI-generated recipes with ingredient lists, cook times, and estimated costs."
  },
  {
    title: "Smart Grocery Shopping",
    description: "Find the best deals",
    icon: <ShoppingCart className="w-12 h-12 text-[#FF6B35]" />,
    content: "Compare prices across stores, track sales, and generate smart shopping lists based on your recipes."
  },
  {
    title: "Pantry Tracking",
    description: "Never waste food",
    icon: <BookOpen className="w-12 h-12 text-[#FF6B35]" />,
    content: "Track what you have at home and get recipe suggestions to use items before they expire."
  },
  {
    title: "Share & Earn",
    description: "Become a creator",
    icon: <Share2 className="w-12 h-12 text-[#FF6B35]" />,
    content: "Share your recipes with our community. Create live tutorials and earn money from sponsorships."
  }
];

export default function SignupOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo - only on first step */}
        {currentStep === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center mb-12"
          >
            <BreadLogo size="2xl" />
          </motion.div>
        )}

        {/* Progress indicator */}
        <div className="flex gap-1.5 mb-12 justify-center">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? "w-8 bg-[#FF6B35]"
                  : idx < currentStep
                  ? "w-2 bg-[#FF6B35]/60"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-12"
          >
            {typeof step.icon === "string" ? (
              <div className="text-6xl mb-6">{step.icon}</div>
            ) : (
              <div className="flex justify-center mb-6">{step.icon}</div>
            )}

            <h2 className="text-3xl font-bold text-[#F5F5F0] mb-2">
              {step.title}
            </h2>
            <p className="text-[#FF6B35] font-semibold text-sm mb-4">
              {step.description}
            </p>
            <p className="text-[#C4C4BA]/70 text-base leading-relaxed">
              {step.content}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold py-3.5 rounded-2xl hover:bg-[#FF8555] active:scale-95 transition-all"
          >
            {isLastStep ? (
              <>
                Start Sharing <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Next <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          {currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleSkip}
              className="w-full text-[#C4C4BA]/60 font-medium py-3 rounded-xl hover:text-[#C4C4BA] transition"
            >
              Skip tour
            </motion.button>
          )}
        </div>

        {/* Step indicator text */}
        <p className="text-center text-[#C4C4BA]/40 text-xs mt-6">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}