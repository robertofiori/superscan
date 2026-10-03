import { calculatePricePerUnit } from './utils/unitParser';
import { isStoreAllowedInZone, DEFAULT_ZONE_ID } from './data/zones';

export interface ProductData {
  code: string;
  product_name?: string;
  image_url?: string;
  brands?: string;
  quantity?: string;
}

export async function fetchProductInfo(barcode: string): Promise<ProductData | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      return {
        code: barcode,
        product_name: data.product.product_name,
        image_url: data.product.image_url,
        brands: data.product.brands,
        quantity: data.product.quantity
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching from Open Food Facts", error);
    return null;
  }
}

export interface SupermarketPrice {
  id: string;
  supermarket: string;
  price: number;
  inStock: boolean;
  url?: string;
  originalPrice?: number;
  isOffer?: boolean;
  imageUrl?: string;
  productName?: string;
  brand?: string;
  pricePerUnit?: number;
  unitType?: string;
  ean?: string;
}

export interface LocationData {
  id: string;
  city: string;
  province: string;
  zipCode: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function getCached<T>(key: string): T | null {
  const entry = MEMORY_CACHE.get(key);
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  MEMORY_CACHE.set(key, { data, timestamp: Date.now() });
}

async function fetchCotoDirect(query: string): Promise<SupermarketPrice[]> {
  try {
    const url = `https://ac.cnstrc.com/search/${encodeURIComponent(query.trim())}?key=key_r6xzz4IAoTWcipni&num_results_per_page=6`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.response?.results || [];

    return results.map((item: any) => {
      const itemData = item.data || {};
      
      let price = itemData.product_list_price || itemData.price || itemData.listPrice || 0;
      if (!price && itemData.price_and_stores && itemData.price_and_stores.length > 0) {
        price = itemData.price_and_stores[0].listPrice || itemData.price_and_stores[0].formatPrice || 0;
      }

      let originalPrice = price;
      if (itemData.discounts && itemData.discounts.length > 0) {
        const disc = itemData.discounts[0];
        if (disc.regularPriceText) {
          const regMatch = disc.regularPriceText.match(/\$?(\d+(?:\.\d+)?)/);
          if (regMatch) originalPrice = parseFloat(regMatch[1]);
        }
        if (disc.discountPrice) {
          const discMatch = disc.discountPrice.match(/\$?(\d+(?:\.\d+)?)/);
          if (discMatch) price = parseFloat(discMatch[1]);
        }
      }

      const imageUrl = itemData.image_url || itemData.product_large_image_url || (itemData.id ? `https://static.cotodigital3.com.ar/sitios/fotos/large/${itemData.id.slice(0, 8)}/${itemData.id}.jpg` : '');
      const itemUrl = itemData.url ? `https://www.cotodigital3.com.ar${itemData.url}` : 'https://www.cotodigital3.com.ar';
      const unitCalc = calculatePricePerUnit(price, item.value || '');

      return {
        id: `coto-${itemData.sku_id || itemData.id || item.value}`,
        supermarket: 'Coto',
        price: price,
        inStock: price > 0,
        url: itemUrl,
        originalPrice: originalPrice,
        isOffer: originalPrice > price,
        imageUrl: imageUrl,
        productName: item.value,
        brand: itemData.product_brand || itemData.brand || itemData.marca || 'Coto',
        pricePerUnit: unitCalc?.pricePerUnit,
        unitType: unitCalc?.unitLabel,
        ean: itemData.product_main_ean ? String(itemData.product_main_ean) : itemData.id
      };
    }).filter((r: SupermarketPrice) => r.price > 0);
  } catch (error) {
    console.error("Error fetching Coto direct:", error);
    return [];
  }
}

async function fetchVtexDirect(storeName: string, domain: string, query: string): Promise<SupermarketPrice[]> {
  try {
    const searchUrl = `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query.trim())}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return [];
    const searchData = await res.json();
    if (!Array.isArray(searchData) || searchData.length === 0) return [];

    const topProducts = searchData.slice(0, 4);
    const results: SupermarketPrice[] = [];
    for (const product of topProducts) {
      const item = product.items?.[0];
      if (!item) continue;
      const offer = item.sellers?.[0]?.commertialOffer;
      const price = Number(offer?.SpotPrice || offer?.Price || 0);
      if (price <= 0) continue;
      let originalPrice = Number(offer?.PriceWithoutDiscount || price);
      if (offer?.ListPrice && offer.ListPrice > price && offer.ListPrice < price * 5) {
        originalPrice = Number(offer.ListPrice);
      }
      const unitCalc = calculatePricePerUnit(price, product.productName || '');

      results.push({
        id: `${storeName.toLowerCase()}-${item.itemId}`,
        supermarket: storeName,
        price: price,
        inStock: (offer?.AvailableQuantity || 0) > 0,
        url: product.link || `https://${domain}/${product.linkText}/p`,
        originalPrice: originalPrice,
        isOffer: originalPrice > price,
        imageUrl: item.images?.[0]?.imageUrl || '',
        productName: product.productName,
        brand: product.brand || storeName,
        pricePerUnit: unitCalc?.pricePerUnit,
        unitType: unitCalc?.unitLabel,
        ean: item.ean || product.productReference
      });
    }
    return results;
  } catch (error) {
    console.error(`Error fetching ${storeName} direct:`, error);
    return [];
  }
}

export async function getSupermarketPrices(query: string, location?: LocationData, zoneId?: string): Promise<SupermarketPrice[]> {
  const targetZoneId = zoneId || DEFAULT_ZONE_ID;
  const cacheKey = `prices-${query.trim().toLowerCase()}-${targetZoneId}-${location?.city || 'default'}`;
  const cachedData = getCached<SupermarketPrice[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    let url = `https://getsupermarketprices-4glajx37za-uc.a.run.app?query=${encodeURIComponent(query)}`;
    if (location) {
      url += `&zipCode=${location.zipCode}&city=${encodeURIComponent(location.city)}`;
    }
    let validPrices: SupermarketPrice[] = [];
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        validPrices = data
          .filter((item: any) => item != null)
          .map((item: any) => {
            const unitCalc = calculatePricePerUnit(item.price, item.productName || '');
            return {
              id: item.id,
              supermarket: item.name,
              price: item.price,
              inStock: item.inStock,
              url: item.url,
              originalPrice: item.originalPrice,
              isOffer: item.isOffer,
              imageUrl: item.imageUrl,
              productName: item.productName,
              brand: item.brand,
              pricePerUnit: unitCalc?.pricePerUnit,
              unitType: unitCalc?.unitLabel,
              ean: item.ean
            };
          });
      }
    } catch (backendError) {
      console.warn("Backend fetch failed, falling back to direct scrapers:", backendError);
    }

    // Filtro dinámico de cadenas habilitadas según la zona activa
    validPrices = validPrices.filter(p => isStoreAllowedInZone(p.supermarket, targetZoneId));

    // Si la zona admite Coto, Jumbo o Disco y no vinieron del backend, los consultamos directamente
    const extraFetches: Promise<SupermarketPrice[]>[] = [];

    if (isStoreAllowedInZone('Coto', targetZoneId) && !validPrices.some(p => p.supermarket.toLowerCase().includes('coto'))) {
      extraFetches.push(fetchCotoDirect(query));
    }
    if (isStoreAllowedInZone('Jumbo', targetZoneId) && !validPrices.some(p => p.supermarket.toLowerCase().includes('jumbo'))) {
      extraFetches.push(fetchVtexDirect('Jumbo', 'www.jumbo.com.ar', query));
    }
    if (isStoreAllowedInZone('Disco', targetZoneId) && !validPrices.some(p => p.supermarket.toLowerCase().includes('disco'))) {
      extraFetches.push(fetchVtexDirect('Disco', 'www.disco.com.ar', query));
    }

    if (extraFetches.length > 0) {
      const extraResults = await Promise.all(extraFetches);
      validPrices = [...validPrices, ...extraResults.flat()];
    }

    // Ordenar: primero los que tienen stock y precio > 0, de más barato a más caro.
    const finalPrices = validPrices.sort((a, b) => {
      if (a.inStock && a.price > 0 && (!b.inStock || b.price === 0)) return -1;
      if (b.inStock && b.price > 0 && (!a.inStock || a.price === 0)) return 1;
      return a.price - b.price;
    });

    setCache(cacheKey, finalPrices);
    return finalPrices;
  } catch (error: any) {
    console.error("Error fetching supermarket prices:", error);
    return [];
  }
}

export interface ProductSuggestion {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  ean: string;
}

export interface GuidedSearchResponse {
  types: string[];
  sizes: string[];
  products: ProductSuggestion[];
}

export async function fetchSearchSuggestions(query: string, type?: string, size?: string): Promise<GuidedSearchResponse | null> {
  try {
    let url = `https://getsearchsuggestions-4glajx37za-uc.a.run.app?q=${encodeURIComponent(query)}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (size) url += `&size=${encodeURIComponent(size)}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error fetching suggestions");
    const data = await res.json();
    return data as GuidedSearchResponse;
  } catch (error: any) {
    console.error("Error fetching suggestions from Firebase/CloudRun:", error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.warn("Possible CSP or Network block detected for Cloud Run domains.");
    }
    return null;
  }
}

export async function fetchDailyOffers(location?: LocationData): Promise<SupermarketPrice[]> {
  const categories = ['aceite', 'leche', 'arroz', 'fideos', 'limpieza'];
  
  try {
    // Fetch prices for a set of common categories concurrently
    const searchResults = await Promise.all(
      categories.map(cat => getSupermarketPrices(cat, location))
    );

    // Flatten results and filter only items with offers and stock
    const allOffers = searchResults
      .flat()
      .filter(p => p.isOffer && p.inStock && p.price > 0 && p.imageUrl);

    // Deduplicate by productName (approximate) and shuffle
    const uniqueOffersMap = new Map<string, SupermarketPrice>();
    allOffers.forEach(o => {
      const key = `${o.productName?.substring(0, 20)}-${o.supermarket}`;
      if (!uniqueOffersMap.has(key)) {
        uniqueOffersMap.set(key, o);
      }
    });

    // Return a random selection of up to 12 offers
    return Array.from(uniqueOffersMap.values())
      .sort(() => Math.random() - 0.5)
      .slice(0, 12);
      
  } catch (error) {
    console.error("Error fetching daily offers:", error);
    return [];
  }
}

export interface ShoppingListItem {
  id: string;
  product: ProductData;
  price: SupermarketPrice;
  allPrices: SupermarketPrice[];
  quantity: number;
  checked: boolean;
  isOptional?: boolean;
}
