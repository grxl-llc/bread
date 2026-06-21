import React from "react";
import { Check, RefreshCw, MapPin, Package } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UNITS } from "@/lib/units";

export default function GroceryItem({ item, index, onToggle, onSwapStore, onUpdate }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-3 bg-[#1A2744] rounded-xl px-4 py-3 transition-all ${
        item.checked ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onToggle(index)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
          item.checked
            ? "bg-[#34D399] border-[#34D399]"
            : "border-[#C4C4BA]/30 hover:border-[#FF6B35]"
        }`}
      >
        {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      {/* Product thumbnail */}
      {item.image_url ? (
        <img src={item.image_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#243352] flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-[#243352] flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-[#C4C4BA]/40" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium block truncate ${item.checked ? "line-through text-[#C4C4BA]/50" : "text-[#F5F5F0]"}`}>
          {item.name}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <input
            type="text"
            inputMode="decimal"
            value={item.quantity ?? ""}
            onChange={(e) => onUpdate?.(index, { quantity: e.target.value })}
            className="w-10 bg-[#243352] text-[#C4C4BA] text-xs rounded-md px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
          />
          {onUpdate ? (
            <Select value={item.unit || ""} onValueChange={(v) => onUpdate(index, { unit: v })}>
              <SelectTrigger className="h-6 w-16 bg-[#243352] border-[#243352] text-[#C4C4BA] rounded-md text-xs px-1.5 py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2744] border-[#243352]">
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u} className="text-[#F5F5F0] text-xs">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-[#C4C4BA]/60">{item.unit}</span>
          )}
          {item.brand && <span className="text-xs text-[#C4C4BA]/40 truncate">{item.brand}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {item.price > 0 && (
          <span className="text-xs font-medium text-[#34D399]">${item.price?.toFixed(2)}</span>
        )}
        {item.store && (
          <span className="text-[10px] bg-[#243352] text-[#C4C4BA] px-2 py-0.5 rounded-full flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {item.store}
          </span>
        )}
        <button
          onClick={() => onSwapStore(index)}
          className="p-1.5 rounded-full hover:bg-white/5"
          title="Swap store"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#C4C4BA]/30" />
        </button>
      </div>
    </motion.div>
  );
}
