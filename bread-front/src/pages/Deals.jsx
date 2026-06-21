import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Plus, Package, Loader2, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffectiveZip } from "@/lib/location";
import { DEFAULT_UNIT } from "@/lib/units";

export default function Deals() {
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [favorites, setFavorites] = useState([]); // lowercased product names
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const navigate = useNavigate();
  const zip = useEffectiveZip(user);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFavorites((u?.favorite_products || []).map((s) => s.toLowerCase()));
    }).catch(() => {});
    base44.entities.PantryItem.list("-created_date", 200)
      .then((items) => setPantry(Array.isArray(items) ? items : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!zip) { setLoading(false); setError("Add your ZIP in Settings to see deals"); return; }
    setLoading(true); setError(null);
    base44.pricing.deals(zip, 60, true)
      .then((data) => { if (!cancelled) { setDeals(Array.isArray(data) ? data : []); if (!data?.length) setError("No current deals found near you"); } })
      .catch(() => { if (!cancelled) setError("Deals unavailable right now"); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [zip]);

  const pantryNames = useMemo(
    () => pantry.map((p) => (p.name || "").toLowerCase()).filter(Boolean),
    [pantry]
  );

  const isFavorite = (d) => favorites.includes((d.name || "").toLowerCase());
  const inPantry = (d) => {
    const n = (d.name || "").toLowerCase();
    return pantryNames.some((pn) => pn.length > 2 && (n.includes(pn) || pn.includes(n)));
  };

  // Favorites first, then pantry matches, then by savings.
  const sorted = useMemo(() => {
    return [...deals].sort((a, b) => {
      const fa = isFavorite(a) ? 1 : 0, fb = isFavorite(b) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      const pa = inPantry(a) ? 1 : 0, pb = inPantry(b) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return (b.savings || 0) - (a.savings || 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, favorites, pantryNames]);

  const toggleFavorite = async (d) => {
    const key = (d.name || "").toLowerCase();
    const next = favorites.includes(key)
      ? favorites.filter((f) => f !== key)
      : [...favorites, key];
    setFavorites(next); // optimistic
    try {
      await base44.auth.updateMe({ favorite_products: next });
    } catch {
      setFavorites(favorites); // revert on failure
    }
  };

  const addToList = async (d) => {
    const newItem = {
      name: d.name, brand: d.brand || null, product_id: d.product_id || null,
      image_url: d.image_url || null, size: d.size || null,
      quantity: "1", unit: DEFAULT_UNIT,
      price: d.sale_price != null ? d.sale_price : d.price,
      store: d.store || "Kroger", checked: false,
    };
    const lists = await base44.entities.GroceryList.list("-created_date", 1);
    if (lists?.[0]) {
      await base44.entities.GroceryList.update(lists[0].id, { items: [...(lists[0].items || []), newItem] });
    } else {
      await base44.entities.GroceryList.create({ name: "My Grocery List", items: [newItem] });
    }
    setAddedIds((prev) => new Set(prev).add(d.product_id));
  };

  return (
    <div className="min-h-screen bg-[#15233A]">
      <div className="pt-6 px-5 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5">
          <ArrowLeft className="w-5 h-5 text-[#F5F5F0]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">All Deals</h1>
          <p className="text-sm text-[#C4C4BA]/60">
            {zip ? `Sale prices near ${zip}` : "On-sale items near you"}
          </p>
        </div>
      </div>

      <div className="px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#C4C4BA]/60">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Finding deals…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
            <Tag className="w-10 h-10 mb-3" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((d) => {
              const fav = isFavorite(d);
              const pantryMatch = inPantry(d);
              const added = addedIds.has(d.product_id);
              return (
                <div key={d.product_id || d.name} className="flex items-center gap-3 bg-[#1A2744] rounded-xl p-3">
                  <button onClick={() => toggleFavorite(d)} className="flex-shrink-0 p-1" title="Favorite">
                    <Star className={`w-5 h-5 ${fav ? "fill-[#FFD23F] text-[#FFD23F]" : "text-[#C4C4BA]/30"}`} />
                  </button>
                  {d.image_url ? (
                    <img src={d.image_url} alt="" className="w-11 h-11 rounded-lg object-cover bg-[#243352]" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-[#243352] flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#C4C4BA]/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F5F5F0] font-medium truncate">{d.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#C4C4BA]/60 truncate">{d.brand}{d.size ? ` · ${d.size}` : ""}</span>
                      {pantryMatch && (
                        <span className="text-[9px] bg-[#FF6B35]/20 text-[#FF6B35] px-1.5 py-0.5 rounded">IN PANTRY</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap mr-1">
                    <p className="text-base font-bold text-[#34D399]">${d.sale_price?.toFixed(2)}</p>
                    <p className="text-[10px] text-[#C4C4BA]/50 line-through">${d.price?.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => addToList(d)}
                    disabled={added}
                    className={`flex-shrink-0 p-2 rounded-lg ${added ? "text-[#34D399]" : "text-[#FF6B35] hover:bg-[#243352]"}`}
                    title={added ? "Added" : "Add to list"}
                  >
                    {added ? <span className="text-xs font-medium">Added</span> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
