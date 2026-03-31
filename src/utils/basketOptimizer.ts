import type { ShoppingListItem } from '../api';

export interface SupermarketTotal {
  supermarket: string;
  total: number;
  itemCount: number;
  missingItems: number;
  savingsVsCurrent: number;
}

export interface OptimizationResults {
  totalsPerSupermarket: SupermarketTotal[];
  theoreticalMin: number; // Minimum price if shopping at multiple stores
  currentTotal: number;
  bestSupermarket: SupermarketTotal | null;
}

export const calculateOptimization = (items: ShoppingListItem[]): OptimizationResults => {
  if (items.length === 0) {
    return { totalsPerSupermarket: [], theoreticalMin: 0, currentTotal: 0, bestSupermarket: null };
  }

  // 1. Get unique supermarkets from all items
  const allSupermarkets = new Set<string>();
  items.forEach(item => {
    item.allPrices?.forEach(p => allSupermarkets.add(p.supermarket));
    // Also include the current supermarket just in case
    allSupermarkets.add(item.price.supermarket);
  });

  const supermarketList = Array.from(allSupermarkets);
  const currentTotal = items.reduce((sum, item) => sum + item.price.price * item.quantity, 0);

  // 2. Calculate total for each supermarket
  const totalsPerSupermarket: SupermarketTotal[] = supermarketList.map(sm => {
    let total = 0;
    let itemCount = 0;
    let missingItems = 0;

    items.forEach(item => {
      // Find this product's price in this specific supermarket
      const priceInSm = item.allPrices?.find(p => p.supermarket === sm && p.inStock);
      
      if (priceInSm) {
        total += priceInSm.price * item.quantity;
        itemCount++;
      } else {
        // If not found in comparison, but the item *was* added from this supermarket originally
        if (item.price.supermarket === sm) {
            total += item.price.price * item.quantity;
            itemCount++;
        } else {
            missingItems++;
        }
      }
    });

    return {
      supermarket: sm,
      total,
      itemCount,
      missingItems,
      savingsVsCurrent: currentTotal - total
    };
  });

  // Sort by total (cheapest first)
  totalsPerSupermarket.sort((a, b) => {
    // Prioritize stores that have more items from the list
    if (a.missingItems !== b.missingItems) return a.missingItems - b.missingItems;
    return a.total - b.total;
  });

  // 3. Calculate theoretical minimum (best price for each item individually)
  const theoreticalMin = items.reduce((sum, item) => {
    const validPrices = (item.allPrices || []).filter(p => p.inStock && p.price > 0);
    const bestPrice = validPrices.length > 0 
      ? Math.min(...validPrices.map(p => p.price), item.price.price)
      : item.price.price;
    return sum + (bestPrice * item.quantity);
  }, 0);

  return {
    totalsPerSupermarket,
    theoreticalMin,
    currentTotal,
    bestSupermarket: totalsPerSupermarket.length > 0 ? totalsPerSupermarket[0] : null
  };
};
