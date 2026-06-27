import React, { useEffect, useRef } from "react";

const PUB_ID = "ca-pub-4306310273252138";

/**
 * Renders a real Google AdSense in-article ad.
 * Pass the slot ID from your AdSense ad unit.
 * Safe to mount multiple times — each instance pushes once.
 */
export default function AdSenseBanner({ slot, className = "" }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense not loaded yet — no-op, it will auto-init on script load
    }
  }, []);

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
      />
    </div>
  );
}
