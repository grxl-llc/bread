import React, { useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullY = useMotionValue(0);
  const iconOpacity = useTransform(pullY, [0, THRESHOLD], [0, 1]);
  const iconRotate = useTransform(pullY, [0, THRESHOLD], [0, 180]);
  const containerY = useTransform(pullY, [0, THRESHOLD], [0, 48]);

  const handleTouchStart = (e) => {
    const scrollEl = e.currentTarget.querySelector("[data-scroll]") || e.currentTarget;
    if (scrollEl.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) pullY.set(Math.min(delta * 0.5, THRESHOLD));
  };

  const handleTouchEnd = async () => {
    if (pullY.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      pullY.set(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    startY.current = null;
    pullY.set(0);
  };

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: iconOpacity }}
        className="absolute top-0 left-0 right-0 flex justify-center pt-2 z-20 pointer-events-none"
      >
        <motion.div style={{ rotate: iconRotate }}>
          <RefreshCw className={`w-5 h-5 text-[#FF6B35] ${refreshing ? "animate-spin" : ""}`} />
        </motion.div>
      </motion.div>

      <motion.div style={{ y: containerY }}>
        {children}
      </motion.div>
    </div>
  );
}