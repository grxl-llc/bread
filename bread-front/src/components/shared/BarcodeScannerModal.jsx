import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X } from "lucide-react";
import { motion } from "framer-motion";

// Mock barcode scan - in production, use a barcode scanning library
const mockScanBarcode = (barcode) => {
  const products = {
    "012345678901": {
      name: "Milk - Whole",
      brand: "Great Value",
      size: "1 gallon",
      category: "dairy",
      price: 3.49,
      store: "Walmart",
    },
    "098765432109": {
      name: "Eggs - Large",
      brand: "Organic Valley",
      size: "12 count",
      category: "dairy",
      price: 4.99,
      store: "Kroger",
    },
    "111222333444": {
      name: "Bread - White",
      brand: "Nature's Own",
      size: "20 oz",
      category: "bakery",
      price: 2.49,
      store: "Food Lion",
    },
  };
  return products[barcode] || null;
};

export default function BarcodeScannerModal({ open, onClose, onProductScanned }) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    // Simulate camera scan
    setTimeout(() => {
      const product = mockScanBarcode("012345678901");
      setScannedProduct(product);
      setScanning(false);
    }, 1500);
  };

  const handleManualScan = () => {
    const product = mockScanBarcode(manualBarcode);
    if (product) {
      setScannedProduct(product);
    } else {
      alert("Product not found. Please enter details manually.");
    }
  };

  const handleConfirm = () => {
    if (scannedProduct) {
      onProductScanned(scannedProduct);
      setScannedProduct(null);
      setManualBarcode("");
      onClose();
    }
  };

  const handleReset = () => {
    setScannedProduct(null);
    setManualBarcode("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A2744] border-[#243352] max-w-md">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F5F5F0]">Scan Barcode</h2>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          </div>

          {!scannedProduct ? (
            <>
              {/* Camera Scan */}
              <div className="bg-[#15233A] rounded-2xl p-8 mb-4 text-center">
                {scanning ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-20 h-20 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Camera className="w-10 h-10 text-[#FF6B35]" />
                  </motion.div>
                ) : (
                  <div className="w-20 h-20 bg-[#243352] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-[#C4C4BA]" />
                  </div>
                )}
                <p className="text-sm text-[#C4C4BA] mb-4">
                  {scanning ? "Scanning..." : "Point camera at barcode"}
                </p>
                <Button
                  onClick={handleScan}
                  disabled={scanning}
                  className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
                >
                  {scanning ? "Scanning..." : "Start Scan"}
                </Button>
              </div>

              {/* Manual Entry */}
              <div className="space-y-3">
                <p className="text-xs text-[#C4C4BA]/60 text-center">Or enter barcode manually</p>
                <Input
                  placeholder="Enter barcode number..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl"
                />
                <Button
                  onClick={handleManualScan}
                  disabled={!manualBarcode}
                  variant="outline"
                  className="w-full border-[#243352] text-[#C4C4BA] hover:bg-[#243352] rounded-xl"
                >
                  Search
                </Button>
              </div>
            </>
          ) : (
            <div>
              {/* Scanned Product */}
              <div className="bg-[#15233A] rounded-2xl p-4 mb-4">
                <p className="text-sm text-[#34D399] mb-3">✓ Product Found</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-[#C4C4BA]/60">Name</p>
                    <p className="text-sm text-[#F5F5F0] font-medium">{scannedProduct.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-[#C4C4BA]/60">Brand</p>
                      <p className="text-sm text-[#F5F5F0]">{scannedProduct.brand}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#C4C4BA]/60">Size</p>
                      <p className="text-sm text-[#F5F5F0]">{scannedProduct.size}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-[#C4C4BA]/60">Price</p>
                      <p className="text-sm text-[#34D399]">${scannedProduct.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#C4C4BA]/60">Store</p>
                      <p className="text-sm text-[#F5F5F0]">{scannedProduct.store}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-[#243352] text-[#C4C4BA] hover:bg-[#243352] rounded-xl"
                >
                  Scan Again
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
                >
                  Add Item
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}