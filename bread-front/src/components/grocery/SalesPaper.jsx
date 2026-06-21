import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, Loader2, Plus, Package, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Real "weekly specials" — on-sale products near the user, pulled from Kroger
 * promo pricing (the free Kroger API has no literal circular endpoint, so we
 * surface genuine sale prices on staples instead). Falls back to a friendly
 * message when no ZIP / no Kroger config / no current deals.
 */
export default function SalesPaper({ storeName, userZip, userIsBreadPlus, onViewCoupon, onUpgrade, onAddItem }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const PREVIEW_COUNT = 4;

  useEffect(() => {
    let cancelled = false;
    if (!userZip) {
      setDeals([]);
      setError("Add your ZIP in Settings to see local deals");
      return;
    }
    setLoading(true);
    setError(null);
    base44.pricing
      .deals(userZip, 8)
      .then((data) => {
        if (cancelled) return;
        setDeals(Array.isArray(data) ? data : []);
        if (!Array.isArray(data) || data.length === 0) {
          setError("No current deals found near you");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Deals unavailable right now");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [userZip]);

  return (
    <div className="px-4 pb-3">
      <div className="bg-[#1A2744] rounded-2xl p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-[#F5F5F0]">{storeName || "Kroger"} Weekly Specials</h3>
          <p className="text-xs text-[#C4C4BA]/60">Live sale prices near you</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-[#C4C4BA]/60">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading deals…
          </div>
        ) : error ? (
          <div className="py-5 text-center text-sm text-[#C4C4BA]/60">{error}</div>
        ) : (
          <div className="space-y-2 mb-3">
            {deals.slice(0, PREVIEW_COUNT).map((item, i) => (
              <div key={item.product_id || i} className="flex items-center gap-3 bg-[#15233A] rounded-xl p-3">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#243352]" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#243352] flex items-center justify-center">
                    <Package className="w-4 h-4 text-[#C4C4BA]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F5F5F0] font-medium truncate">{item.name}</p>
                  <p className="text-xs text-[#C4C4BA]/60 truncate">{item.brand}{item.size ? ` · ${item.size}` : ""}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-lg font-bold text-[#34D399]">${item.sale_price?.toFixed(2)}</p>
                  <p className="text-[10px] text-[#C4C4BA]/60">Save ${item.savings?.toFixed(2)}</p>
                </div>
                {onAddItem && (
                  <button
                    onClick={() => onAddItem({
                      name: item.name, brand: item.brand, product_id: item.product_id,
                      image_url: item.image_url, size: item.size, price: item.price,
                      sale_price: item.sale_price, store: item.store || "Kroger",
                    })}
                    className="p-1.5 rounded-lg hover:bg-[#243352]"
                    title="Add to list"
                  >
                    <Plus className="w-4 h-4 text-[#FF6B35]" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && deals.length > 0 && (
          <button
            onClick={() => navigate("/Deals")}
            className="w-full flex items-center justify-center gap-1 text-sm text-[#FF6B35] hover:text-[#FF8555] font-medium py-2 mb-2 transition-colors"
          >
            See all deals
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onViewCoupon}
            variant="outline"
            className="flex-1 border-[#243352] text-[#C4C4BA] hover:bg-[#243352] rounded-xl h-10"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Coupons
          </Button>
          <Button
            onClick={userIsBreadPlus ? onViewCoupon : onUpgrade}
            disabled={!userIsBreadPlus}
            className={`flex-1 rounded-xl h-10 ${
              userIsBreadPlus
                ? "bg-gradient-to-r from-[#FF6B35] to-[#FF8555] hover:from-[#FF8555] hover:to-[#FF6B35] text-white"
                : "bg-[#243352] text-[#C4C4BA]/50"
            }`}
          >
            {userIsBreadPlus ? (
              <><ExternalLink className="w-4 h-4 mr-2" />Bread+ Coupons</>
            ) : (
              <><Lock className="w-4 h-4 mr-2" />Bread+ Coupons</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
