import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6987b1c8cdaba2eee625be16/f1e9b59bf_BreadLogo.png";

const sizeMap = { sm: 40, md: 56, lg: 72, xl: 96, "2xl": 120 };

export default function BreadLogo({ size = "xl" }) {
  const px = sizeMap[size] || 96;
  return (
    <img
      src={LOGO_URL}
      alt="Bread"
      width={px}
      height={px}
      style={{ objectFit: "contain" }}
    />
  );
}