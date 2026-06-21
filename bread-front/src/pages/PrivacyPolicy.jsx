import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-[#F5F5F0] mb-2">Privacy Policy</h1>
        <p className="text-[#C4C4BA]/60 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="bg-[#1A2744] rounded-2xl p-8 text-center">
          <p className="text-lg text-[#C4C4BA]">Content coming soon</p>
          <p className="text-sm text-[#C4C4BA]/60 mt-2">We're working on our Privacy Policy. Check back later!</p>
        </div>
      </div>
    </div>
  );
}