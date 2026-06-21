import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, ChevronDown, ChevronUp, Download, DollarSign, MapPin, Plus, Scan, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

import GroceryItem from "../components/grocery/GroceryItem";
import StoreSelector from "../components/grocery/StoreSelector";
import SmartSearchBar from "../components/grocery/SmartSearchBar";
import SalesPaper from "../components/grocery/SalesPaper";
import AdCard from "../components/feed/AdCard";
import SuggestedDeals from "../components/grocery/SuggestedDeals";
import CouponLockScreen from "../components/grocery/CouponLockScreen";
import BarcodeScannerModal from "../components/shared/BarcodeScannerModal";
import ExportGroceryListModal from "../components/grocery/ExportGroceryListModal";
import PullToRefresh from "../components/shared/PullToRefresh";
import { getStore } from "../components/grocery/storeConfig";
import { useEffectiveZip } from "@/lib/location";
import { DEFAULT_UNIT } from "@/lib/units";

export default function GroceryList() {
  const [expandedList, setExpandedList] = useState(null);
  const [selectedStore, setSelectedStore] = useState("walmart");
  const [showCouponLock, setShowCouponLock] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const effectiveZip = useEffectiveZip(user);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["groceryLists"],
    queryFn: () => base44.entities.GroceryList.list("-created_date", 50),
  });

  const toggleItem = async (listId, items, index) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], checked: !updatedItems[index].checked };
    await base44.entities.GroceryList.update(listId, { items: updatedItems });
    queryClient.invalidateQueries({ queryKey: ["groceryLists"] });
  };

  const updateItem = async (listId, items, index, patch) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], ...patch };
    await base44.entities.GroceryList.update(listId, { items: updatedItems });
    queryClient.invalidateQueries({ queryKey: ["groceryLists"] });
  };

  const swapStore = async (listId, items, index) => {
    // Simple store rotation for demonstration
    const stores = ["Walmart", "Kroger", "Costco", "Aldi", "Target"];
    const currentStore = items[index].store || "";
    const currentIdx = stores.indexOf(currentStore);
    const nextStore = stores[(currentIdx + 1) % stores.length];

    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], store: nextStore };
    await base44.entities.GroceryList.update(listId, { items: updatedItems });
    queryClient.invalidateQueries({ queryKey: ["groceryLists"] });
  };

  const deleteList = async (listId) => {
    await base44.entities.GroceryList.delete(listId);
    queryClient.invalidateQueries({ queryKey: ["groceryLists"] });
  };

  const exportList = (list) => {
    const text = `${list.name}\n${"=".repeat(30)}\n\n${
      list.items?.map((item) =>
        `${item.checked ? "✓" : "○"} ${item.name} — ${item.quantity} ${item.unit}${item.price ? ` ($${item.price.toFixed(2)})` : ""}${item.store ? ` @ ${item.store}` : ""}`
      ).join("\n") || "No items"
    }\n\nTotal: $${list.total_cost?.toFixed(2) || "0.00"}`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list.name?.replace(/\s+/g, "_") || "grocery_list"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSearchItem = async (item) => {
    const newItem = {
      name: item.name,
      brand: item.brand || null,
      product_id: item.product_id || null,
      image_url: item.image_url || null,
      size: item.size || null,
      quantity: "1",
      unit: DEFAULT_UNIT,
      price: item.sale_price != null ? item.sale_price : item.price,
      store: item.store || "Kroger",
      checked: false,
    };

    // Add to the active list, or create one if none exists yet.
    const activeList = lists[0];
    if (activeList) {
      const updatedItems = [...(activeList.items || []), newItem];
      await base44.entities.GroceryList.update(activeList.id, { items: updatedItems });
    } else {
      await base44.entities.GroceryList.create({ name: "My Grocery List", items: [newItem] });
    }
    queryClient.invalidateQueries({ queryKey: ["groceryLists"] });
  };

  const handleViewCoupon = () => {
    window.open(`https://${selectedStore}.com/coupons`, "_blank");
  };

  const handleUpgrade = async () => {
    if (user?.subscription_status !== "active") {
      await base44.auth.updateMe({ subscription_status: "active" });
      const updated = await base44.auth.me();
      setUser(updated);
      setShowCouponLock(false);
    }
  };

  const handleBreadPlusCoupon = () => {
    if (user?.subscription_status === "active") {
      handleViewCoupon();
    } else {
      setShowCouponLock(true);
    }
  };

  const handleBarcodeScanned = async (product) => {
    const activeList = lists[0];
    if (activeList) {
      const newItem = {
        name: product.name,
        quantity: "1",
        unit: product.size,
        brand: product.brand,
        price: product.price,
        store: product.store,
        checked: false,
      };
      const updatedItems = [...(activeList.items || []), newItem];
      await base44.entities.GroceryList.update(activeList.id, { items: updatedItems });
      queryClient.invalidateQueries({ queryKey: ["groceryLists"] });
    }
  };

  const userIsBreadPlus = user?.subscription_status === "active";

  return (
    <div className="min-h-screen bg-[#15233A]">
      <div className="pt-6 px-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Grocery</h1>
          <Button
            onClick={() => setShowBarcodeScanner(true)}
            size="sm"
            className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
          >
            <Scan className="w-4 h-4 mr-1" />
            Scan
          </Button>
        </div>
        <p className="text-sm text-[#C4C4BA]/60">Browse stores, deals, and your lists</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Smart Search Bar */}
        <SmartSearchBar onAddItem={handleAddSearchItem} userZip={effectiveZip} />

        {/* Weekly Specials Section */}
        <div className="pt-2">
          <h2 className="text-lg font-bold text-[#F5F5F0] mb-3">Weekly Specials</h2>
          <StoreSelector selectedStore={selectedStore} onStoreSelect={setSelectedStore} userZip={effectiveZip} />
        </div>

        {/* Sales Paper */}
        <SalesPaper
          storeName={getStore(selectedStore)?.name}
          userZip={effectiveZip}
          userIsBreadPlus={userIsBreadPlus}
          onViewCoupon={handleViewCoupon}
          onUpgrade={handleBreadPlusCoupon}
          onAddItem={handleAddSearchItem}
        />

        {/* Ad Card */}
        <AdCard index={0} />

        {/* Suggested Deals */}
        <SuggestedDeals 
          selectedStore={selectedStore}
          userIsBreadPlus={userIsBreadPlus}
          onAddItem={handleAddSearchItem}
          onViewCoupon={handleViewCoupon}
          onUpgrade={handleBreadPlusCoupon}
        />

        {/* Export Button */}
        {lists.length > 0 && (
          <Button
            onClick={() => setShowExportModal(true)}
            className="w-full bg-[#243352] hover:bg-[#2d4060] text-[#F5F5F0] border border-[#243352] rounded-xl h-12"
          >
            <Upload className="w-4 h-4 mr-2" />
            Export to Store
          </Button>
        )}
      </div>

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ["groceryLists"] })}>
        <div className="px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1A2744] rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
            <ShoppingCart className="w-12 h-12 mb-3" />
            <p className="text-base font-medium">No grocery lists</p>
            <p className="text-sm mt-1">Add recipes to your grocery list from the Recipes tab</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => {
              const isExpanded = expandedList === list.id;
              const safeListItems = Array.isArray(list.items) ? list.items : [];
              const checkedCount = safeListItems.filter((i) => i.checked).length;
              const totalCount = safeListItems.length;

              return (
                <div key={list.id} className="bg-[#1A2744] rounded-2xl overflow-hidden card-glow">
                  {/* List Header */}
                  <button
                    onClick={() => setExpandedList(isExpanded ? null : list.id)}
                    className="w-full flex items-center justify-between p-4"
                  >
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-[#F5F5F0]">{list.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[#C4C4BA]/60">
                          {checkedCount}/{totalCount} items
                        </span>
                        {list.total_cost > 0 && (
                          <span className="flex items-center gap-1 text-xs text-[#34D399]">
                            <DollarSign className="w-3 h-3" />
                            ${list.total_cost?.toFixed(2)}
                          </span>
                        )}
                        {list.store && (
                          <span className="flex items-center gap-1 text-xs text-[#C4C4BA]/60">
                            <MapPin className="w-3 h-3" />
                            {list.store}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Progress ring */}
                      <div className="relative w-10 h-10">
                        <svg className="w-10 h-10 transform -rotate-90">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="#243352" strokeWidth="3" />
                          <circle
                            cx="20" cy="20" r="16" fill="none" stroke="#34D399" strokeWidth="3"
                            strokeDasharray={`${(checkedCount / Math.max(totalCount, 1)) * 100.5} 100.5`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#F5F5F0]">
                          {totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0}%
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#C4C4BA]/40" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#C4C4BA]/40" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Items */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2">
                          {(Array.isArray(list.items) ? list.items : []).map((item, i) => (
                            <GroceryItem
                              key={i}
                              item={item}
                              index={i}
                              onToggle={(idx) => toggleItem(list.id, list.items, idx)}
                              onSwapStore={(idx) => swapStore(list.id, list.items, idx)}
                              onUpdate={(idx, patch) => updateItem(list.id, list.items, idx, patch)}
                            />
                          ))}

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportList(list)}
                              className="border-[#243352] text-[#C4C4BA] hover:bg-[#243352] rounded-xl flex-1"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteList(list.id)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </PullToRefresh>
      {/* Coupon Lock Screen */}
      <CouponLockScreen
        open={showCouponLock}
        onClose={() => setShowCouponLock(false)}
        onUpgrade={handleUpgrade}
      />

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        open={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductScanned={handleBarcodeScanned}
      />

      {/* Export Modal */}
      <ExportGroceryListModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        groceryList={lists[0]}
        connectedAccounts={user?.connected_accounts}
      />
    </div>
  );
}