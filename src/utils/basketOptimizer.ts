import type { ShoppingListItem } from '../api';
import { getApplicableDiscount } from '../data/bankDiscounts';

export interface SupermarketTotal {
  supermarket: string;
  total: number;           // Real total of found items
  estimatedTotal: number;  // Total + estimated cost of missing items
  itemCount: number;
  missingItems: number;
  matchPercentage: number; // Percentage of items from list found in this store
  savingsVsCurrent: number;
}

export interface OptimizationResults {
  totalsPerSupermarket: SupermarketTotal[];
  theoreticalMin: number;
  currentTotal: number;
  bestSupermarket: SupermarketTotal | null;
}

export const calculateOptimization = (items: ShoppingListItem[], userBanks: string[] = []): OptimizationResults => {
  if (items.length === 0) {
    return { totalsPerSupermarket: [], theoreticalMin: 0, currentTotal: 0, bestSupermarket: null };
  }

  const allSupermarkets = new Set<string>();
  items.forEach(item => {
    item.allPrices?.forEach(p => allSupermarkets.add(p.supermarket));
    allSupermarkets.add(item.price.supermarket);
  });

  const supermarketList = Array.from(allSupermarkets);
  const currentTotal = items.reduce((sum, item) => sum + item.price.price * item.quantity, 0);
  
  const totalsPerSupermarket: SupermarketTotal[] = supermarketList.map(sm => {
    let total = 0;
    let itemCount = 0;
    let missingItems = 0;

    items.forEach(item => {
      const priceInSm = item.allPrices?.find(p => p.supermarket === sm && p.inStock);
      
      if (priceInSm) {
        total += priceInSm.price * item.quantity;
        itemCount++;
      } else {
        if (item.price.supermarket === sm) {
            total += item.price.price * item.quantity;
            itemCount++;
        } else {
            // Fair comparison: Use the average price of THIS specific item from other stores
            // fall back to current price if no other prices available
            const otherPrices = (item.allPrices || []).filter(p => p.inStock && p.price > 0);
            const itemAvgPrice = otherPrices.length > 0 
              ? otherPrices.reduce((sum, p) => sum + p.price, 0) / otherPrices.length
              : item.price.price;
            
            total += itemAvgPrice * item.quantity;
            missingItems++;
        }
      }
    });

    const matchPercentage = Math.round((itemCount / items.length) * 100);
    const discountInfo = getApplicableDiscount(sm, userBanks);
    const effectiveTotal = discountInfo 
      ? total * (1 - discountInfo.discount)
      : total;

    return {
      supermarket: sm,
      total: effectiveTotal, // Now it's the effective total!
      estimatedTotal: effectiveTotal,
      itemCount,
      missingItems,
      matchPercentage,
      savingsVsCurrent: currentTotal - effectiveTotal
    };
  });

  // Sort by estimated total (cheapest first)
  // We no longer strictly prioritize missing items count because estimatedTotal handles the "penalty"
  totalsPerSupermarket.sort((a, b) => a.estimatedTotal - b.estimatedTotal);

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

