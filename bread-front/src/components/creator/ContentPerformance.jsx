import React from "react";
import { Eye, Heart, TrendingUp } from "lucide-react";

export default function ContentPerformance({ content }) {
  const getPerformanceColor = (views) => {
    if (views > 10000) return "text-[#34D399]";
    if (views > 1000) return "text-[#F59E0B]";
    return "text-[#FF6B35]";
  };

  return (
    <div className="space-y-3">
      {content.map((item) => (
        <div key={item.id} className="bg-[#15233A] rounded-xl p-3 border border-[#243352]">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#F5F5F0] truncate">{item.title}</p>
              <p className="text-xs text-[#C4C4BA]/60">
                {new Date(item.created_date).toLocaleDateString()}
              </p>
            </div>
            <div className={`text-xs font-bold ${getPerformanceColor(item.view_count || 0)}`}>
              {(item.view_count || 0).toLocaleString()} views
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-[#C4C4BA]">{(item.view_count || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#EC4899]" />
              <span className="text-[#C4C4BA]">{(item.like_count || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="text-[#C4C4BA]">
                {item.view_count > 0 ? ((item.like_count || 0) / (item.view_count || 1) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}