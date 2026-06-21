import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { UNITS } from "@/lib/units";
import IngredientAutocomplete from "@/components/recipes/IngredientAutocomplete";
import { useEffectiveZip } from "@/lib/location";

const pantryCategories = [
  "produce", "dairy", "meat", "grains", "spices", "canned", "frozen", "beverages", "snacks", "condiments", "baking", "other"
];

const categoryEmojis = {
  produce: "🥬", dairy: "🧈", meat: "🥩", grains: "🌾", spices: "🧂",
  canned: "🥫", frozen: "🧊", beverages: "🥤", snacks: "🍿", condiments: "🫙", baking: "🧁", other: "📦"
};

export default function PantryInventory({ items, onRefresh, user }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ item_name: "", quantity: "", unit: "oz", category: "other", brand: "", product_id: null, image_url: null });
  const effectiveZip = useEffectiveZip(user);

  const safeItems = Array.isArray(items) ? items : [];
  const filtered = safeItems.filter(item =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!newItem.item_name || !newItem.quantity) return;
    await base44.entities.PantryItem.create({
      name: newItem.item_name,            // backend column is `name`
      brand: newItem.brand || null,
      product_id: newItem.product_id || null,
      image_url: newItem.image_url || null,
      quantity: parseFloat(newItem.quantity),
      unit: newItem.unit,
      category: newItem.category,
    });
    setNewItem({ item_name: "", quantity: "", unit: "oz", category: "other", brand: "", product_id: null, image_url: null });
    setShowAdd(false);
    onRefresh();
  };

  const adjustQuantity = async (item, delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    if (newQty === 0) {
      await base44.entities.PantryItem.delete(item.id);
    } else {
      await base44.entities.PantryItem.update(item.id, {
        quantity: newQty,
        last_updated: new Date().toISOString()
      });
    }
    onRefresh();
  };

  const deleteItem = async (item) => {
    await base44.entities.PantryItem.delete(item.id);
    onRefresh();
  };

  return (
    <div className="p-4">
      {/* Search & Add */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BA]/40" />
          <Input
            placeholder="Search pantry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] pl-10 rounded-xl"
          />
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-[#1A2744] rounded-2xl p-4 space-y-3">
              <IngredientAutocomplete
                value={newItem.item_name}
                userZip={effectiveZip}
                onChange={(name) => setNewItem((prev) => ({ ...prev, item_name: name }))}
                onSelect={(product) => setNewItem((prev) => ({
                  ...prev,
                  brand: product?.brand && product.brand !== "Any" ? product.brand : prev.brand,
                  product_id: product?.product_id || null,
                  image_url: product?.image_url || null,
                }))}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl w-24"
                />
                <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                  <SelectTrigger className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2744] border-[#243352]">
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u} className="text-[#F5F5F0]">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                  <SelectTrigger className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2744] border-[#243352]">
                    {pantryCategories.map((c) => (
                      <SelectItem key={c} value={c} className="text-[#F5F5F0]">
                        {categoryEmojis[c]} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Brand (optional)"
                value={newItem.brand}
                onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl"
              />
              <Button onClick={handleAdd} className="w-full bg-[#FF6B35] hover:bg-[#FF8555] rounded-xl">
                Add to Pantry
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#C4C4BA]/40">
          <Package className="w-12 h-12 mb-3" />
          <p className="text-sm">Your pantry is empty</p>
          <p className="text-xs mt-1">Add items to start tracking</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-[#C4C4BA]/60 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>{categoryEmojis[cat]}</span>
                {cat}
              </h3>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-[#1A2744] rounded-xl px-4 py-3"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[#F5F5F0]">{item.name}</span>
                      {item.brand && (
                        <span className="text-xs text-[#C4C4BA]/50 ml-2">{item.brand}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustQuantity(item, -1)}
                        className="w-7 h-7 rounded-lg bg-[#243352] flex items-center justify-center hover:bg-[#FF6B35]/20"
                      >
                        <Minus className="w-3 h-3 text-[#C4C4BA]" />
                      </button>
                      <span className="text-sm font-medium text-[#F5F5F0] w-16 text-center">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        onClick={() => adjustQuantity(item, 1)}
                        className="w-7 h-7 rounded-lg bg-[#243352] flex items-center justify-center hover:bg-[#34D399]/20"
                      >
                        <Plus className="w-3 h-3 text-[#C4C4BA]" />
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 ml-1"
                      >
                        <Trash2 className="w-3 h-3 text-red-400/50" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}