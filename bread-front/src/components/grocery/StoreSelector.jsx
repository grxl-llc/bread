import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getStoreList, STORES } from "./storeConfig";
import { base44 } from "@/api/base44Client";

// Kroger location "chain" codes → our store-config ids (the chains we support).
const CHAIN_TO_ID = {
  KROGER: "kroger",
  HARRISTEETER: "harris_teeter",
  RALPHS: "ralphs",
};

/**
 * Store picker. When a ZIP is available, we query Kroger for nearby locations
 * (returned nearest-first) and float those chains to the front of the list so
 * the closest stores appear first. Other chains follow in their default order.
 */
export default function StoreSelector({ selectedStore, onStoreSelect, userZip }) {
  const [orderedStores, setOrderedStores] = useState(getStoreList());

  useEffect(() => {
    let cancelled = false;
    if (!userZip) {
      setOrderedStores(getStoreList());
      return;
    }
    base44.pricing
      .stores(userZip, 35)
      .then((nearby) => {
        if (cancelled || !Array.isArray(nearby)) return;
        // Unique store-config ids in distance order
        const nearIds = [];
        for (const loc of nearby) {
          const id = CHAIN_TO_ID[(loc.chain || "").toUpperCase()];
          if (id && STORES[id] && !nearIds.includes(id)) nearIds.push(id);
        }
        if (nearIds.length === 0) {
          setOrderedStores(getStoreList());
          return;
        }
        const nearStores = nearIds.map((id) => STORES[id]);
        const rest = getStoreList().filter((s) => !nearIds.includes(s.id));
        setOrderedStores([...nearStores, ...rest]);
        // If the current selection isn't one of the nearby stores, default to nearest
        if (!nearIds.includes(selectedStore)) onStoreSelect(nearIds[0]);
      })
      .catch(() => {
        if (!cancelled) setOrderedStores(getStoreList());
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userZip]);

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {orderedStores.map((store, idx) => (
        <motion.button
          key={store.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStoreSelect(store.id)}
          className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition relative ${
            selectedStore === store.id
              ? "bg-[#FF6B35] ring-2 ring-[#FF6B35]"
              : "bg-[#1A2744] hover:bg-[#243352]"
          }`}
        >
          {idx === 0 && userZip && (
            <span className="absolute -top-1 -right-1 text-[8px] bg-[#34D399] text-[#0c1626] font-bold px-1.5 py-0.5 rounded-full">
              Closest
            </span>
          )}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: store.color }}
          >
            <span
              className="text-white font-bold text-center leading-tight px-1"
              style={{ fontSize: store.name.length > 8 ? "9px" : store.name.length > 5 ? "11px" : "13px" }}
            >
              {store.name}
            </span>
          </div>
          <span className="text-xs font-medium text-[#F5F5F0] text-center w-20">
            {store.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
