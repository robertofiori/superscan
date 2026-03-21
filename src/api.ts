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

export async function getMockPrices(code: string): Promise<SupermarketPrice[]> {
  // Simular latencia de red de 800ms
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  // Utilizar el código del producto para generar precios "estables" pero aleatorios
  const hash = Array.from(code).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 800 + (hash % 3000); 

  return [
    {
      id: 'carrefour',
      supermarket: 'Carrefour',
      price: basePrice,
      inStock: true
    },
    {
      id: 'coto',
      supermarket: 'Coto',
      price: Math.round(basePrice * 0.92), // A little cheaper
      inStock: (hash % 10) > 2 // 80% obj chance instock
    },
    {
      id: 'hiper-chango',
      supermarket: 'Hiper ChangoMás',
      price: Math.round(basePrice * 1.05),
      inStock: true
    }
  ].sort((a, b) => a.price - b.price);
}
