import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as cors from "cors";

// Initialize CORS
const corsHandler = cors({ origin: true });

async function fetchVtex(storeName: string, domain: string, query: string) {
  try {
    const url = `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    if (data && data.length > 0) {
      const results = [];
      const topProducts = data.slice(0, 3); // top 3
      
      for (const product of topProducts) {
        const item = product.items && product.items.length > 0 ? product.items[0] : null;
        if (item) {
          const commertialOffer = item.sellers[0]?.commertialOffer;
          const price = commertialOffer?.Price || 0;
          let listPrice = commertialOffer?.ListPrice || 0;
          
          if (listPrice > price * 3 && price > 0) {
            listPrice = price;
          }
          
          const stock = commertialOffer?.AvailableQuantity || 0;
          const isOffer = listPrice > price;
          const imageUrl = item.images && item.images.length > 0 ? item.images[0].imageUrl : '';

          results.push({
            id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''),
            name: storeName,
            price,
            inStock: stock > 0,
            url: product.link || `https://${domain}/${product.linkText}/p`,
            originalPrice: listPrice,
            isOffer,
            imageUrl,
            productName: product.productName,
            brand: product.brand || ''
          });
        }
      }
      return results;
    }
  } catch (error: any) {
    logger.error(`[${storeName}] Error on VTEX API:`, error.message);
  }
  return [{ 
    id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''), 
    name: storeName, 
    price: 0, 
    inStock: false,
    url: '',
    originalPrice: 0,
    isOffer: false,
    imageUrl: '',
    productName: 'Producto no disponible',
    brand: ''
  }];
}

async function fetchCoope(query: string) {
  try {
    const url = "https://us-central1-elchango-81e77.cloudfunctions.net/scrapeCoope";
    const { data } = await axios.post(url, { data: { query: query } }, { timeout: 45000 });
    
    if (data?.result?.success && data.result.products?.length > 0) {
      const topProducts = data.result.products.slice(0, 3);
      return topProducts.map((p: any) => ({
        id: "lacoope",
        name: "Cooperativa Obrera",
        price: p.price,
        inStock: p.stock,
        url: p.url || `https://www.lacoopeencasa.coop/sucursales/bahia-blanca/buscar?b=${encodeURIComponent(query)}`,
        originalPrice: p.originalPrice || 0,
        isOffer: !!p.isOffer,
        imageUrl: p.imageUrl || '',
        productName: p.name || 'Producto en La Coope',
        brand: p.brand || ''
      }));
    }
  } catch (error: any) {
     logger.error("[Cooperativa Obrera] Error calling external Cloud Function:", error.message);
  }
  return [{ id: "lacoope", name: "Cooperativa Obrera", price: 0, inStock: false, url: '', originalPrice: 0, isOffer: false, imageUrl: '', productName: 'Producto no disponible', brand: '' }];
}

export const getSupermarketPrices = onRequest({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
  corsHandler(req, res, async () => {
    const q = (req.query.query || req.query.barcode) as string;
    
    if (!q) {
      res.status(400).json({ error: "Query or Barcode is required" });
      return;
    }

    logger.info("Buscando ofertas reales para:", q);

    try {
      const results = await Promise.all([
        fetchVtex("Carrefour", "www.carrefour.com.ar", q),
        fetchVtex("Chango Más", "www.masonline.com.ar", q),
        fetchVtex("VEA", "www.vea.com.ar", q),
        fetchCoope(q)
      ]);
      
      const flatResults = results.flat();
      res.json(flatResults);
    } catch (error: any) {
      logger.error("Error global en getSupermarketPrices:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

export const getSearchSuggestions = onRequest({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
  corsHandler(req, res, async () => {
    const query = req.query.q as string;
    
    if (!query) {
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    try {
      // Usaremos VEA o Carrefour como fuente de catálogo rápido para sugerencias
      const url = `https://www.vea.com.ar/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      if (data && data.length > 0) {
        // Formateamos las sugerencias, descartando las que no tengan un EAN claro
        const suggestions = data.slice(0, 15).map((product: any) => {
          const item = product.items && product.items.length > 0 ? product.items[0] : null;
          const ean = (item && item.ean) || product.productReference || "";
          const imageUrl = item && item.images && item.images.length > 0 ? item.images[0].imageUrl : "";
          
          return {
            id: product.productId,
            name: product.productName,
            brand: product.brand || "",
            imageUrl,
            ean
          };
        }).filter((p: any) => p.ean && p.ean.length >= 8); // eans validos

        // Extractor heurístico de Tipos y Tamaños basado en los nombres encontrados
        const sizesSet = new Set<string>();
        const typesSet = new Set<string>();
        
        const qLower = query.toLowerCase();

        suggestions.forEach((p: any) => {
          const nameLower = p.name.toLowerCase();
          
          // Extraer tamaño (e.g. 500 ml, 1.5 l, 900cc, 1 kg)
          const sizeMatch = nameLower.match(/\b(\d+(?:[.,]\d+)?\s*(?:ml|l|lt|cc|g|kg|cm3))\b/i);
          if (sizeMatch) {
            sizesSet.add(sizeMatch[1].trim().toLowerCase());
          }

          // Extraer el "Tipo" (palabra que le sigue inmediatamente al término de búsqueda principal)
          if (nameLower.includes(qLower)) {
            const afterQuery = nameLower.split(qLower)[1];
            if (afterQuery) {
              const cleaned = afterQuery.replace(/^( de | con | sabor )/i, '').trim();
              const firstWord = cleaned.split(' ')[0];
              // Filtramos palabras chicas o genéricas
              if (firstWord && firstWord.length > 2 && !/\d/.test(firstWord) && !['pack', 'x', 'la', 'el'].includes(firstWord)) {
                typesSet.add(firstWord.charAt(0).toUpperCase() + firstWord.slice(1));
              }
            }
          }
        });

        res.json({
          types: Array.from(typesSet).slice(0, 5),
          sizes: Array.from(sizesSet).slice(0, 5),
          products: suggestions.slice(0, 20)
        });
      } else {
        res.json([]);
      }
    } catch (error: any) {
      logger.error("Error en getSearchSuggestions:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});
