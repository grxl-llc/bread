import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Lock, Tag, Loader2 } from "lucide-react";
import { getStore } from "./storeConfig";

export default function SuggestedDeals({ selectedStore, userIsBreadPlus, onAddItem, onViewCoupon, onUpgrade }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, [selectedStore]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      
      // Fetch deals for frequently bought items
      const products = ["Milk", "Bread", "Chicken Breast", "Tomatoes"];
      const dealPromises = products.map(async (product) => {
        const response = await base44.functions.invoke('pricingEngine', {
          product_name: product,
          user_zip: user?.zip_code,
          preferred_stores: selectedStore ? [selectedStore] : undefined
        });
        
        const data = response.data;
        const storePrice = data.store_prices[0];
        
        return {
          name: `${storePrice.brand} ${product}`,
          category: data.product_metadata.category,
          originalPrice: storePrice.price,
          salePrice: storePrice.sale_price,
          savings: storePrice.savings,
          store: storePrice.store_id,
          reason: data.product_metadata.frequently_bought ? "You buy this often" : "Matches your recipes",
          hasCoupon: storePrice.has_coupon,
          hasBreadPlusCoupon: storePrice.has_coupon && Math.random() > 0.5,
        };
      });
      
      const fetchedDeals = await Promise.all(dealPromises);
      setDeals(fetchedDeals.filter(d => d.salePrice)); // Only show items on sale
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#F5F5F0]">Suggested Deals</h2>
          <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1A2744] rounded-2xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#F5F5F0]">Suggested Deals</h2>
        <Tag className="w-4 h-4 text-[#FF6B35]" />
      </div>

      <div className="space-y-3">
        {deals.map((deal, i) => {
          const storeInfo = getStore(deal.store);
          
          return (
            <div key={i} className="bg-[#1A2744] rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#F5F5F0] mb-2">{deal.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {storeInfo && (
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1.5">
                        <img src={storeInfo.logo} alt={storeInfo.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <span className="text-xs text-[#C4C4BA]/60">@ {storeInfo?.name || deal.store}</span>
                  </div>
                  <p className="text-[10px] bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-1 rounded inline-block">
                    {deal.reason}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#C4C4BA]/60 line-through">
                      ${deal.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-lg font-bold text-[#34D399]">
                      ${deal.salePrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#34D399]">Save ${deal.savings.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => onAddItem?.(deal)}
                  className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-9 text-xs col-span-3"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add to List
                </Button>
                {deal.hasCoupon && (
                  <Button
                    onClick={onViewCoupon}
                    variant="outline"
                    className="border-[#243352] text-[#C4C4BA] hover:bg-[#243352] rounded-xl h-9 text-xs col-span-1"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Coupon
                  </Button>
                )}
                {deal.hasBreadPlusCoupon && (
                  <Button
                    onClick={userIsBreadPlus ? onViewCoupon : onUpgrade}
                    disabled={!userIsBreadPlus}
                    className={`rounded-xl h-9 text-xs ${
                      deal.hasCoupon ? "col-span-2" : "col-span-3"
                    } ${
                      userIsBreadPlus
                        ? "bg-gradient-to-r from-[#FF6B35] to-[#FF8555] hover:from-[#FF8555] hover:to-[#FF6B35] text-white"
                        : "bg-[#243352] text-[#C4C4BA]/50"
                    }`}
                  >
                    {userIsBreadPlus ? (
                      <>
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Bread+
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Bread+
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}