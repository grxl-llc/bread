import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BreadLogo from "./BreadLogo";

export default function SplashScreen({ onComplete }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system dark mode preference
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(darkModeQuery.matches);

    // Auto-complete after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#15233A]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <BreadLogo size="xl" />
      </motion.div>
    </motion.div>
  );
}