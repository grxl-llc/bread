import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

/**
 * Real grocery item search backed by Kroger pricing.
 * Debounce-searches as the user types and returns branded products with
 * thumbnails, regular + sale prices. Selecting one calls onAddItem with the
 * full product so it can be added to the active grocery list.
 */
export default function SmartSearchBar({ onAddItem, userZip }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = (q) => {
    clearTimeout(debounceRef.current);
    if (!q || q.trim().length < 2) {
      setResults([]); setOpen(false); return;
    }
    if (!userZip) {
      setError("Add your ZIP in Settings to search real products");
      setResults([]); setOpen(true); return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const data = await base44.pricing.search(q.trim(), userZip, 8);
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setError("Product search unavailable right now");
        setResults([]); setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    runSearch(e.target.value);
  };

  const handleSelect = (p) => {
    onAddItem({
      name: p.name,
      brand: p.brand,
      product_id: p.product_id,
      image_url: p.image_url,
      size: p.size,
      price: p.price,
      sale_price: p.sale_price,
      store: p.store || "Kroger",
    });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="px-4 pb-3 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BA]/60" />
        <Input
          placeholder="Search for an item..."
          value={query}
          onChange={handleChange}
          onFocus={() => query && results.length > 0 && setOpen(true)}
          className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl pl-10 pr-9 h-12"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BA]/60 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-4 right-4 bg-[#1A2744] rounded-xl border border-[#243352] shadow-xl z-50 max-h-72 overflow-y-auto"
          >
            {error && <div className="p-3 text-xs text-[#C4C4BA]/60">{error}</div>}
            {!error && results.length === 0 && !loading && (
              <div className="p-3 text-xs text-[#C4C4BA]/60">No products found</div>
            )}
            {results.map((p) => (
              <button
                key={p.product_id || p.name}
                onClick={() => handleSelect(p)}
                className="w-full flex items-center gap-3 p-3 hover:bg-[#243352] transition border-b border-[#243352]/50 last:border-b-0 text-left"
              >
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#243352]" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#243352] flex items-center justify-center">
                    <Package className="w-4 h-4 text-[#C4C4BA]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F5F5F0] font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#C4C4BA]/60 truncate">
                      {p.brand}{p.size ? ` · ${p.size}` : ""}
                    </span>
                    {p.sale_price != null && p.price != null && p.sale_price < p.price && (
                      <span className="text-[9px] bg-[#34D399]/20 text-[#34D399] px-1.5 py-0.5 rounded">SALE</span>
                    )}
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  {p.sale_price != null && p.price != null && p.sale_price < p.price ? (
                    <>
                      <span className="text-sm font-bold text-[#34D399]">${p.sale_price.toFixed(2)}</span>
                      <span className="text-[10px] text-[#C4C4BA]/40 line-through ml-1">${p.price.toFixed(2)}</span>
                    </>
                  ) : (
                    p.price != null && <span className="text-sm font-bold text-[#34D399]">${p.price.toFixed(2)}</span>
                  )}
                </div>
                <Plus className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
