import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, ExternalLink, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { getStoresWithExport } from "./storeConfig";

export default function ExportGroceryListModal({ open, onClose, groceryList, connectedAccounts }) {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  const exportableStores = getStoresWithExport();

  const handleExport = async (store) => {
    setExporting(true);
    setSelectedStore(store);

    // Check if account is connected
    const isConnected = connectedAccounts?.[store.id];
    if (!isConnected) {
      alert(`Please connect your ${store.name} account in Settings first.`);
      setExporting(false);
      return;
    }

    // Simulate export - in production, call actual API
    await new Promise(resolve => setTimeout(resolve, 2000));

    setExportSuccess(true);
    setExporting(false);

    // Reset after 2 seconds
    setTimeout(() => {
      setExportSuccess(false);
      setSelectedStore(null);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A2744] border-[#243352] max-w-md">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F5F5F0]">Export to Store</h2>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          </div>

          {exportSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="w-16 h-16 bg-[#34D399]/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#34D399]" />
              </div>
              <p className="text-lg font-semibold text-[#F5F5F0] mb-1">Export Successful!</p>
              <p className="text-sm text-[#C4C4BA]/60 text-center">
                Your grocery list has been added to {selectedStore?.name}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#C4C4BA]/60 mb-3">
                Select a store to export your grocery list
              </p>

              {exportableStores.map((store) => {
                const isConnected = connectedAccounts?.[store.id];
                const isExporting = exporting && selectedStore?.id === store.id;

                return (
                  <button
                    key={store.id}
                    onClick={() => handleExport(store)}
                    disabled={exporting}
                    className={`w-full bg-[#15233A] rounded-xl p-4 flex items-center justify-between transition ${
                      isExporting ? "ring-2 ring-[#FF6B35]" : "hover:bg-[#243352]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2">
                        <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#F5F5F0]">{store.name}</p>
                        {isConnected ? (
                          <p className="text-xs text-[#34D399]">Connected</p>
                        ) : (
                          <p className="text-xs text-[#C4C4BA]/60 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Not connected
                          </p>
                        )}
                      </div>
                    </div>
                    {isExporting ? (
                      <div className="w-5 h-5 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-[#C4C4BA]/60" />
                    )}
                  </button>
                );
              })}

              <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-xl p-3 mt-4">
                <p className="text-xs text-[#C4C4BA]/80">
                  Connect accounts in Settings → Connected Shopping Accounts to enable exporting
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}