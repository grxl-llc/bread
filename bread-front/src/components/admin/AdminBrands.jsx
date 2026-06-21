import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight } from "lucide-react";

const CATEGORIES = ["dairy", "meat", "produce", "grains", "condiments", "beverages", "snacks", "baking", "spices", "frozen", "other"];
const EMPTY = { brand_name: "", generic_item: "", category: "other", priority: 1, is_active: true, notes: "" };

export default function AdminBrands() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brand-sponsorships"],
    queryFn: () => base44.entities.BrandSponsorship.list("-priority", 100),
  });

  const handleSave = async () => {
    if (!form.brand_name || !form.generic_item) return alert("Brand name and generic item are required.");
    await base44.entities.BrandSponsorship.create({ ...form, priority: Number(form.priority) });
    queryClient.invalidateQueries({ queryKey: ["brand-sponsorships"] });
    setForm(EMPTY);
    setShowForm(false);
  };

  const toggleActive = async (b) => {
    await base44.entities.BrandSponsorship.update(b.id, { is_active: !b.is_active });
    queryClient.invalidateQueries({ queryKey: ["brand-sponsorships"] });
  };

  const deleteBrand = async (id) => {
    if (!confirm("Remove this brand sponsorship?")) return;
    await base44.entities.BrandSponsorship.delete(id);
    queryClient.invalidateQueries({ queryKey: ["brand-sponsorships"] });
  };

  return (
    <div className="space-y-4 pb-6">
      <p className="text-xs text-[#C4C4BA]/50">Brands added here will be suggested by the AI recipe generator in place of generic ingredients.</p>

      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#FF6B35] font-semibold text-sm py-3 rounded-xl transition border border-[#FF6B35]/20"
      >
        <Plus className="w-4 h-4" /> Add Brand Sponsorship
      </button>

      {showForm && (
        <div className="bg-[#1A2744] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#F5F5F0]">New Brand Sponsorship</h3>
          <input
            value={form.brand_name}
            onChange={(e) => setForm((f) => ({ ...f, brand_name: e.target.value }))}
            placeholder="Brand name (e.g. Kraft, Hellmann's)"
            className="w-full bg-[#15233A] text-[#F5F5F0] text-sm rounded-xl px-4 py-2.5 border border-white/10 outline-none placeholder:text-[#C4C4BA]/30"
          />
          <input
            value={form.generic_item}
            onChange={(e) => setForm((f) => ({ ...f, generic_item: e.target.value }))}
            placeholder="Replaces generic item (e.g. mayonnaise, butter)"
            className="w-full bg-[#15233A] text-[#F5F5F0] text-sm rounded-xl px-4 py-2.5 border border-white/10 outline-none placeholder:text-[#C4C4BA]/30"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full bg-[#15233A] text-[#F5F5F0] text-sm rounded-xl px-4 py-2.5 border border-white/10 outline-none"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#C4C4BA]/60">Priority</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-20 bg-[#15233A] text-[#F5F5F0] text-sm rounded-xl px-3 py-2 border border-white/10 outline-none"
            />
          </div>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            className="w-full bg-[#15233A] text-[#F5F5F0] text-sm rounded-xl px-4 py-2.5 border border-white/10 outline-none placeholder:text-[#C4C4BA]/30"
          />
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="flex-1 bg-[#FF6B35] hover:bg-[#FF8555] text-white font-semibold py-2.5 rounded-xl text-sm transition">Save</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-[#15233A] text-[#C4C4BA]/60 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-[#1A2744] rounded-xl h-16 animate-pulse" />)}</div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#C4C4BA]/30">
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-sm">No brand sponsorships yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {brands.map((b) => (
            <div key={b.id} className={`bg-[#1A2744] rounded-xl px-4 py-3 flex items-center gap-3 ${!b.is_active ? "opacity-50" : ""}`}>
              <div className="w-9 h-9 rounded-xl bg-[#243352] flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-[#FF6B35]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F5F5F0] font-semibold">{b.brand_name}</p>
                <p className="text-xs text-[#C4C4BA]/50">Replaces: <span className="text-[#C4C4BA]/70">{b.generic_item}</span> · {b.category} · P{b.priority}</p>
              </div>
              <button onClick={() => toggleActive(b)} className={b.is_active ? "text-green-400" : "text-[#C4C4BA]/30"}>
                {b.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button onClick={() => deleteBrand(b.id)} className="text-red-400/60 hover:text-red-400 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}