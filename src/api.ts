import { calculatePricePerUnit } from './utils/unitParser';

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

export async function getSupermarketPrices(query: string, location?: LocationData): Promise<SupermarketPrice[]> {
  try {
    let url = `https://getsupermarketprices-4glajx37za-uc.a.run.app?query=${encodeURIComponent(query)}`;
    if (location) {
      url += `&zipCode=${location.zipCode}&city=${encodeURIComponent(location.city)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API Error ${res.status}: ${res.statusText}`);
    
    const data = await res.json();
    
    // Filtramos y adaptamos el campo name -> supermarket
    let validPrices: SupermarketPrice[] = data
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

    // Robust check for DIA chain using Unicode normalization
    const isDiaChain = (name: string) => {
      if (!name) return false;
      const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalized.includes('dia');
    };

    // Filtro de seguridad frontend para Bahía Blanca y exclusión de DIA
    validPrices = validPrices.filter(p => !isDiaChain(p.supermarket));

    const city = location?.city?.toLowerCase() || '';
    if (city.includes('bahia blanca')) {
      const allowed = ['vea', 'carrefour', 'chango mas', 'cooperativa obrera', 'la coope'];
      validPrices = validPrices.filter(p => 
        allowed.some(a => p.supermarket?.toLowerCase().includes(a))
      );
    }


    // Ordenar: primero los que tienen stock y precio > 0, de más barato a más caro.
    // Los que no tienen stock o precio 0 van al final.
    return validPrices.sort((a, b) => {
      if (a.inStock && a.price > 0 && (!b.inStock || b.price === 0)) return -1;
      if (b.inStock && b.price > 0 && (!a.inStock || a.price === 0)) return 1;
      return a.price - b.price;
    });
  } catch (error: any) {
    console.error("Error fetching real prices from Firebase/CloudRun:", error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.warn("Possible CSP or Network block detected for Cloud Run domains.");
    }
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
}
