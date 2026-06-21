import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, TrendingDown, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tutorialSteps = [
  {
    icon: ChefHat,
    title: "Welcome to Your Pantry",
    description: "Store as many pantry items as you want. The more you add, the smarter Bread becomes at helping you save money and reduce waste.",
  },
  {
    icon: Users,
    title: "Set Up Your Household",
    description: "Add household members and their serving sizes. This helps Bread accurately calculate how quickly ingredients are consumed and when you'll run out.",
  },
  {
    icon: Sparkles,
    title: "Smart Recipe Matching",
    description: "Your pantry powers recipe recommendations and grocery savings. Bread will show you what recipes you can make with what you already have.",
  },
  {
    icon: TrendingDown,
    title: "See What You Have, Anywhere",
    description: "The more accurate your pantry setup, the better Bread helps you see what's at home—even while shopping. Setting it up takes effort, but the payoff is seamless.",
  },
];

export default function PantryTutorialModal({ open, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-[#1A2744] border-[#243352] max-w-md">
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-[#FF6B35]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-10 h-10 text-[#FF6B35]" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F0] mb-3">{step.title}</h2>
              <p className="text-[#C4C4BA] text-sm leading-relaxed mb-6">{step.description}</p>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {tutorialSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i === currentStep
                        ? "w-8 bg-[#FF6B35]"
                        : "w-2 bg-[#243352]"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <Button
                    onClick={handlePrev}
                    variant="outline"
                    className="flex-1 border-[#243352] text-[#C4C4BA] hover:bg-[#243352]"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#FF8555] text-white"
                >
                  {currentStep === tutorialSteps.length - 1 ? (
                    "Start Adding Items"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}