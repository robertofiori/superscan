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
}

export async function getSupermarketPrices(query: string): Promise<SupermarketPrice[]> {
  try {
    const res = await fetch(`https://us-central1-auraverde-db.cloudfunctions.net/getSupermarketPrices?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data = await res.json();
    
    // Filtramos y adaptamos el campo name -> supermarket
    const validPrices: SupermarketPrice[] = data
      .filter((item: any) => item != null)
      .map((item: any) => ({
        id: item.id,
        supermarket: item.name,
        price: item.price,
        inStock: item.inStock,
        url: item.url,
        originalPrice: item.originalPrice,
        isOffer: item.isOffer,
        imageUrl: item.imageUrl,
        productName: item.productName,
        brand: item.brand
      }));


    // Ordenar de más barato a más caro
    return validPrices.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error("Error fetching real prices from Firebase:", error);
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
    let url = `https://us-central1-auraverde-db.cloudfunctions.net/getSearchSuggestions?q=${encodeURIComponent(query)}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (size) url += `&size=${encodeURIComponent(size)}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error fetching suggestions");
    const data = await res.json();
    return data as GuidedSearchResponse;
  } catch (error) {
    console.error("Error fetching suggestions from Firebase:", error);
    return null;
  }
}
