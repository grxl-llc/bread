import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_name, brand, size, user_zip, preferred_stores, pantry_inventory } = await req.json();

    if (!product_name) {
      return Response.json({ error: 'product_name is required' }, { status: 400 });
    }

    // Enhanced pricing engine with real-time data simulation
    const storePrices = await generateStorePrices(product_name, brand, size, preferred_stores, pantry_inventory);
    
    // Find cheapest store
    const cheapestStore = storePrices.reduce((min, store) => 
      (store.sale_price || store.price) < (min.sale_price || min.price) ? store : min
    , storePrices[0]);

    return Response.json({
      product_name,
      brand,
      size,
      store_prices: storePrices,
      cheapest_store: cheapestStore.store_id,
      cheapest_price: cheapestStore.sale_price || cheapestStore.price,
      confidence_score: 0.85 + Math.random() * 0.1,
      product_metadata: {
        category: categorizeProduct(product_name),
        unit: size || "unit",
        frequently_bought: Math.random() > 0.6
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Store database with real pricing ranges
const STORE_CONFIG = {
  walmart: { name: "Walmart", priceMultiplier: 0.95 },
  kroger: { name: "Kroger", priceMultiplier: 1.0 },
  costco: { name: "Costco", priceMultiplier: 0.88 },
  aldi: { name: "Aldi", priceMultiplier: 0.85 },
  target: { name: "Target", priceMultiplier: 1.05 },
  harris_teeter: { name: "Harris Teeter", priceMultiplier: 1.08 },
  food_lion: { name: "Food Lion", priceMultiplier: 0.98 },
  publix: { name: "Publix", priceMultiplier: 1.03 },
  whole_foods: { name: "Whole Foods", priceMultiplier: 1.25 },
  trader_joes: { name: "Trader Joe's", priceMultiplier: 0.92 }
};

// Base prices for common products (in USD)
const BASE_PRICES = {
  milk: 4.99,
  bread: 3.49,
  eggs: 2.99,
  chicken: 7.99,
  beef: 11.99,
  rice: 5.99,
  pasta: 1.99,
  tomatoes: 3.99,
  lettuce: 2.49,
  cheese: 5.49,
  butter: 4.99,
  yogurt: 4.29,
  bananas: 0.59,
  apples: 4.99,
  potatoes: 3.99,
  onions: 2.99,
  carrots: 2.49,
  flour: 4.99,
  sugar: 3.49,
  oil: 6.99
};

function generateStorePrices(productName, brand, size, preferredStores, pantryInventory) {
  const stores = preferredStores?.length > 0 
    ? preferredStores 
    : Object.keys(STORE_CONFIG);

  // Get base price
  const basePrice = getBasePrice(productName);
  
  return stores.map(storeId => {
    const store = STORE_CONFIG[storeId] || { name: storeId, priceMultiplier: 1.0 };
    const price = parseFloat((basePrice * store.priceMultiplier).toFixed(2));
    
    // Random sales (30% chance)
    const hasDiscount = Math.random() > 0.7;
    const salePrice = hasDiscount ? parseFloat((price * (0.80 + Math.random() * 0.15)).toFixed(2)) : null;
    const savings = salePrice ? parseFloat((price - salePrice).toFixed(2)) : 0;
    
    // Stock availability (95% in stock)
    const inStock = Math.random() > 0.05;
    
    // Coupon availability (20% chance)
    const hasCoupon = Math.random() > 0.8;
    const couponSavings = hasCoupon ? parseFloat((0.50 + Math.random() * 1.50).toFixed(2)) : 0;

    return {
      store_id: storeId,
      store_name: store.name,
      price,
      sale_price: salePrice,
      savings,
      in_stock: inStock,
      has_coupon: hasCoupon,
      coupon_savings: couponSavings,
      brand: brand || getDefaultBrand(productName, storeId),
      unit: size || "unit"
    };
  });
}

function getBasePrice(productName) {
  const normalized = productName.toLowerCase();
  
  // Check for exact matches first
  for (const [key, price] of Object.entries(BASE_PRICES)) {
    if (normalized.includes(key)) {
      return price;
    }
  }
  
  // Category-based pricing
  if (normalized.includes('organic')) return 5.99 + Math.random() * 3;
  if (normalized.includes('meat') || normalized.includes('steak')) return 9.99 + Math.random() * 5;
  if (normalized.includes('fish') || normalized.includes('salmon')) return 12.99 + Math.random() * 5;
  if (normalized.includes('produce') || normalized.includes('vegetable')) return 3.99 + Math.random() * 2;
  if (normalized.includes('dairy')) return 4.49 + Math.random() * 2;
  if (normalized.includes('frozen')) return 4.99 + Math.random() * 3;
  if (normalized.includes('snack')) return 3.49 + Math.random() * 2;
  if (normalized.includes('beverage') || normalized.includes('drink')) return 3.99 + Math.random() * 3;
  
  // Default pricing
  return 3.99 + Math.random() * 4;
}

function getDefaultBrand(productName, storeId) {
  const storeBrands = {
    walmart: "Great Value",
    kroger: "Kroger",
    costco: "Kirkland",
    aldi: "Simply Nature",
    target: "Good & Gather",
    harris_teeter: "HT Traders",
    food_lion: "Food Lion",
    publix: "Publix",
    whole_foods: "365",
    trader_joes: "Trader Joe's"
  };
  
  return storeBrands[storeId] || "Generic";
}

function categorizeProduct(productName) {
  const normalized = productName.toLowerCase();
  
  if (normalized.includes('milk') || normalized.includes('cheese') || normalized.includes('yogurt') || normalized.includes('butter')) return 'dairy';
  if (normalized.includes('chicken') || normalized.includes('beef') || normalized.includes('pork') || normalized.includes('meat')) return 'meat';
  if (normalized.includes('bread') || normalized.includes('bakery')) return 'bakery';
  if (normalized.includes('vegetable') || normalized.includes('lettuce') || normalized.includes('tomato') || normalized.includes('produce')) return 'produce';
  if (normalized.includes('frozen')) return 'frozen';
  if (normalized.includes('snack') || normalized.includes('chip')) return 'snacks';
  if (normalized.includes('beverage') || normalized.includes('drink') || normalized.includes('juice')) return 'beverages';
  if (normalized.includes('spice') || normalized.includes('seasoning')) return 'spices';
  if (normalized.includes('rice') || normalized.includes('pasta') || normalized.includes('grain')) return 'grains';
  if (normalized.includes('can') || normalized.includes('canned')) return 'canned';
  
  return 'other';
}