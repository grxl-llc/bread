import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6987b1c8cdaba2eee625be16/f1e9b59bf_BreadLogo.png";

export default function BreadIcon({ size = 48 }) {
  return (
    <img
      src={LOGO_URL}
      alt="Bread"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}