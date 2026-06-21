import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

/**
 * Ingredient name input with real-world branded product search.
 *
 * As the user types, we debounce-call the Kroger pricing search and show a
 * dropdown of real products (thumbnail + brand + size + price). "Any brand"
 * is always pinned first so users can skip brand selection when it doesn't
 * matter — pricing then falls back to the cheapest matching product.
 *
 * On select we store the chosen product so the recipe can be priced later:
 *   { name, brand, product_id, image_url, size, price }
 *
 * Props:
 *   value      - current ingredient name string
 *   userZip    - the user's zipcode (required for store-specific pricing)
 *   onChange   - (name) => void           fired on every keystroke
 *   onSelect   - (product|null) => void   fired when a product (or "Any") is picked
 */
export default function IngredientAutocomplete({ value, userZip, onChange, onSelect }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = (query) => {
    clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (!userZip) {
      // No zip → can't price; allow free text but tell the user why
      setError("Add your zipcode in settings to search real products");
      setResults([]);
      setOpen(true);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await base44.pricing.search(query.trim(), userZip, 8);
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch (e) {
        // 503 = Kroger not configured yet; degrade gracefully to free text
        setError("Product search unavailable — you can still type the name");
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleType = (e) => {
    const v = e.target.value;
    setSelected(null);
    onChange(v);
    onSelect?.(null); // typing clears any prior product selection
    runSearch(v);
  };

  const pickAny = () => {
    setSelected({ any: true });
    // `value` is what the user typed (e.g. "ground beef") — save it so brand
    // substitution later searches that generic term, not the product name.
    onSelect?.({ name: value, brand: "Any", product_id: null, image_url: null, any: true, search_term: value });
    setOpen(false);
  };

  const pickProduct = (p) => {
    const typedTerm = value; // capture BEFORE we overwrite the field with the product name
    setSelected(p);
    onChange(p.name);
    onSelect?.({
      name: p.name,
      brand: p.brand,
      product_id: p.product_id,
      image_url: p.image_url,
      size: p.size,
      price: p.sale_price ?? p.price,
      search_term: typedTerm,
    });
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="relative">
        <Input
          placeholder="Ingredient (e.g. grape jelly)"
          value={value}
          onChange={handleType}
          onFocus={() => value && results.length > 0 && setOpen(true)}
          className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] rounded-xl pr-8"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C4C4BA]/50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>
      </div>

      {/* Selected-product chip */}
      {selected && !selected.any && (
        <div className="flex items-center gap-2 mt-1 text-xs text-[#C4C4BA]">
          {selected.image_url ? (
            <img src={selected.image_url} alt="" className="w-5 h-5 rounded object-cover" />
          ) : (
            <Package className="w-4 h-4" />
          )}
          <span className="text-[#FF6B35]">{selected.brand}</span>
          {selected.size && <span>· {selected.size}</span>}
          {(selected.sale_price ?? selected.price) != null && (
            <span>· ${(selected.sale_price ?? selected.price).toFixed(2)}</span>
          )}
        </div>
      )}
      {selected?.any && (
        <div className="mt-1 text-xs text-[#FF6B35]">Any brand — cheapest match used for pricing</div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1A2744] border border-[#243352] rounded-xl shadow-2xl max-h-72 overflow-y-auto">
          {/* "Any" is always first */}
          <button
            type="button"
            onClick={pickAny}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#243352] text-left border-b border-[#243352]"
          >
            <div className="w-9 h-9 rounded-lg bg-[#243352] flex items-center justify-center">
              <Package className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#F5F5F0]">Any brand</div>
              <div className="text-xs text-[#C4C4BA]/60">Use cheapest available for pricing</div>
            </div>
          </button>

          {error && <div className="px-3 py-2.5 text-xs text-[#C4C4BA]/60">{error}</div>}

          {results.map((p) => (
            <button
              type="button"
              key={p.product_id || p.name}
              onClick={() => pickProduct(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#243352] text-left"
            >
              {p.image_url ? (
                <img src={p.image_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#243352]" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#243352] flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#C4C4BA]/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#F5F5F0] truncate">{p.name}</div>
                <div className="text-xs text-[#C4C4BA]/60 truncate">
                  {p.brand}{p.size ? ` · ${p.size}` : ""}
                </div>
              </div>
              {(p.sale_price ?? p.price) != null && (
                <div className="text-sm text-[#FF6B35] whitespace-nowrap">
                  ${(p.sale_price ?? p.price).toFixed(2)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
