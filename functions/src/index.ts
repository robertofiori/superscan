import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as cors from "cors";

// Initialize CORS
const corsHandler = cors({ origin: true });

async function fetchVtex(storeName: string, domain: string, barcode: string) {
  try {
    const url = `https://${domain}/api/catalog_system/pub/products/search?ft=${barcode}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    if (data && data.length > 0) {
      const product = data[0];
      const item = product.items && product.items.length > 0 ? product.items[0] : null;
      if (item) {
        const price = item.sellers[0]?.commertialOffer?.Price || 0;
        const stock = item.sellers[0]?.commertialOffer?.AvailableQuantity || 0;
        return {
          id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''),
          name: storeName,
          price,
          inStock: stock > 0
        };
      }
    }
  } catch (error: any) {
    logger.error(`[${storeName}] Error on VTEX API:`, error.message);
  }
  return { id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''), name: storeName, price: 0, inStock: false };
}

async function fetchCoope(barcode: string) {
  try {
    const url = "https://us-central1-elchango-81e77.cloudfunctions.net/scrapeCoope";
    const { data } = await axios.post(url, { data: { query: barcode } }, { timeout: 45000 });
    
    if (data?.result?.success && data.result.products?.length > 0) {
      return {
        id: "lacoope",
        name: "Cooperativa Obrera",
        price: data.result.products[0].price,
        inStock: data.result.products[0].stock
      };
    }
  } catch (error: any) {
     logger.error("[Cooperativa Obrera] Error calling external Cloud Function:", error.message);
  }
  return { id: "lacoope", name: "Cooperativa Obrera", price: 0, inStock: false };
}

export const getSupermarketPrices = onRequest({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
  corsHandler(req, res, async () => {
    const barcode = req.query.barcode as string;
    
    if (!barcode) {
      res.status(400).json({ error: "Barcode is required" });
      return;
    }

    logger.info("Buscando precios reales (Proxy) para el código:", barcode);

    try {
      const results = await Promise.all([
        fetchVtex("Carrefour", "www.carrefour.com.ar", barcode),
        fetchVtex("Chango Más", "www.masonline.com.ar", barcode),
        fetchVtex("VEA", "www.vea.com.ar", barcode),
        fetchCoope(barcode)
      ]);
      
      res.json(results);
    } catch (error: any) {
      logger.error("Error global en getSupermarketPrices:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

