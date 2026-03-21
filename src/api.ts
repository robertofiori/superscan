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
}

export async function getSupermarketPrices(barcode: string): Promise<SupermarketPrice[]> {
  try {
    const res = await fetch(`https://us-central1-elchango-81e77.cloudfunctions.net/getSupermarketPrices?barcode=${barcode}`);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data = await res.json();
    
    // Filtramos y adaptamos el campo name -> supermarket
    const validPrices: SupermarketPrice[] = data
      .filter((item: any) => item && item.price > 0)
      .map((item: any) => ({
        id: item.id,
        supermarket: item.name,
        price: item.price,
        inStock: item.inStock
      }));

    // Ordenar de más barato a más caro
    return validPrices.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error("Error fetching real prices from Firebase:", error);
    return [];
  }
}
