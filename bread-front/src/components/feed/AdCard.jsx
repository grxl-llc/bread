import React from "react";
import AdSenseBanner from "@/components/ads/AdSenseBanner";

// Slot ID from your AdSense in-article ad unit.
// If you create more ad units later, pass the slot as a prop.
const IN_ARTICLE_SLOT = "3425670884";

export default function AdCard({ index = 0 }) {
  // Each AdCard instance needs a unique key so React doesn't reuse the DOM node
  // (AdSense breaks if the <ins> element is reused with a different push).
  // index is used purely to satisfy any callers that pass it.
  return (
    <div className="mx-4 mb-4">
      <AdSenseBanner slot={IN_ARTICLE_SLOT} />
    </div>
  );
}
