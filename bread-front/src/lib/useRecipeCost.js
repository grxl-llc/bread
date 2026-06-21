import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Live recipe cost.
 *
 * Recipe cost is NOT stored — it's recomputed every view so it always reflects
 * this week's sales and current prices. We send each ingredient's chosen
 * product (so the user's brand is re-priced live) plus amount/unit, and the
 * backend returns the current cheapest-package total, excluding pantry items.
 *
 * Results are cached ~30 min (matching the backend's Kroger cache) so paging
 * through a list of recipes stays fast.
 */
export function useRecipeCost(recipe, zip, pantryItems = []) {
  const ingredients = (recipe?.ingredients || []).map((i) => ({
    name: i.name,
    amount: parseFloat(i.quantity) || 1,
    unit: i.unit || "",
    product_id: i.product_id ?? i.product?.product_id ?? null,
  }));

  const pantry = (pantryItems || []).map((p) => ({
    name: p.name,
    quantity: parseFloat(p.quantity) || 0,
    unit: p.unit || "",
  }));

  // Signature so swapping a brand / changing an amount / pantry change re-fetches.
  const sig = ingredients
    .map((i) => `${i.name}:${i.product_id || ""}:${i.amount}:${i.unit}`)
    .join("|");
  const pantrySig = pantry.map((p) => `${p.name}:${p.quantity}:${p.unit}`).join("|");

  return useQuery({
    queryKey: ["recipeCost", recipe?.id, zip, sig, pantrySig],
    enabled: !!zip && ingredients.length > 0,
    staleTime: 1000 * 60 * 30,
    retry: false,
    queryFn: () => base44.pricing.recipeCost(ingredients, zip, pantry),
  });
}
