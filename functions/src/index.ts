import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as cors from "cors";

// Initialize CORS
const corsHandler = cors({ origin: true });

async function fetchVtex(storeName: string, domain: string, query: string, sc: number = 1) {
  try {
    const searchUrl = `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&sc=${sc}`;
    
    // Generar cookie de segmento idéntica a la del navegador para activar promociones
    const segmentObj = {
      campaigns: null,
      channel: sc.toString(),
      priceTables: null,
      regionId: null,
      utm_campaign: null,
      utm_source: null,
      utmi_campaign: null,
      currencyCode: "ARS",
      currencySymbol: "$",
      countryCode: "ARG",
      cultureInfo: "es-AR",
      channelPrivacy: "public"
    };
    const segmentBase64 = Buffer.from(JSON.stringify(segmentObj)).toString("base64");
    const cookie = `vtex_segment=${segmentBase64}; checkout.vtex.com=__ofid=`; // __ofid ayuda a resetear sesión si es necesario

    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Cookie': cookie,
      'x-vtex-sc': sc.toString()
    };

    const { data: searchData } = await axios.get(searchUrl, { headers: commonHeaders, timeout: 8000 });
    logger.info(`[${storeName}] Search results found: ${searchData?.length || 0}`);
    
    if (searchData && searchData.length > 0) {
      const topProducts = searchData.slice(0, 3);
      const skusToSimulate: any[] = [];

      // Mapeo inicial desde la búsqueda (con descuentos ya aplicados en Search API si sc=34 funciona)
      const results = topProducts.map((product: any) => {
        const item = product.items?.[0];
        if (item) {
          const offer = item.sellers?.[0]?.commertialOffer;
          skusToSimulate.push({ id: item.itemId, quantity: 1, seller: "1" });
          
          const searchPrice = offer?.SpotPrice || offer?.Price || 0;
          const searchListPrice = offer?.ListPrice || searchPrice;

          return {
            id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''),
            name: storeName,
            skuId: item.itemId,
            productName: product.productName,
            url: product.link || `https://${domain}/${product.linkText}/p`,
            imageUrl: item.images?.[0]?.imageUrl || '',
            brand: product.brand || '',
            price: searchPrice, 
            originalPrice: searchListPrice,
            isOffer: searchListPrice > searchPrice,
            inStock: offer?.AvailableQuantity > 0
          };
        }
        return null;
      }).filter((r: any) => r !== null);

      // Opcional: Checkout Simulation para confirmar precios finales y detectar beneficios complejos (2x1, etc)
      if (skusToSimulate.length > 0) {
        try {
          const simUrl = `https://${domain}/api/checkout/pub/orderforms/simulation?sc=${sc}`;
          const { data: simData } = await axios.post(simUrl, { items: skusToSimulate }, { headers: commonHeaders, timeout: 5000 });

          if (simData && simData.items) {
            simData.items.forEach((simItem: any, idx: number) => {
              if (results[idx]) {
                const simPrice = simItem.sellingPrice / 100;
                const simListPrice = (simItem.listPrice || simItem.sellingPrice) / 100;
                
                // Si la simulación da un precio menor, lo usamos (ej: descuentos por cantidad)
                if (simPrice > 0 && simPrice < results[idx].price) {
                  results[idx].price = simPrice;
                  results[idx].originalPrice = simListPrice;
                  results[idx].isOffer = simListPrice > simPrice;
                }
              }
            });
          }
        } catch (simError: any) {
          logger.warn(`[${storeName}] Simulation failed, using search results.`, simError.message);
        }
      }
      return results.filter((r: any) => r.price > 0);
    }
  } catch (error: any) {
    logger.error(`[${storeName}] Error on VTEX API:`, error.message);
  }
  return [];
}

async function fetchCoto(query: string) {
  // Coto no es VTEX, requiere scraping o una API específica.
  // Por ahora devolvemos un placeholder vacío para evitar errores.
  return [];
}

async function getCoopeSession() {
  try {
    const response = await axios.get("https://www.lacoopeencasa.coop/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      timeout: 8000
    });
    
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      // Join all cookies to maintain session context
      return setCookie.map(c => c.split(';')[0]).join('; ');
    }
  } catch (error: any) {
    logger.error("[Cooperativa Obrera] Error fetching session:", error.message);
  }
  return null;
}

async function fetchCoope(query: string, idLocal: number = 840): Promise<any[]> {
  try {
    const allCookies = await getCoopeSession();
    const url = "https://api.lacoopeencasa.coop/api/articulos/pagina_busqueda";
    
    // Configuración para el local especificado (ej. 840 para Bahía Blanca)
    // El sitio usa paginación 0-indexed. El 1 original saltaba la primera página.
    const formattedQuery = query
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, "_");

    const payload = {
      pagina: 0,
      filtros: {
        preciomenor: -1,
        preciomayor: -1,
        categoria: [],
        marca: [],
        tipo_seleccion: "busqueda",
        tipo_relacion: "busqueda",
        filtros_gramaje: [],
        termino: formattedQuery,
        cant_articulos: 0,
        ofertas: false,
        modificado: true,
        primer_filtro: ""
      }
    };

    // Combinamos las cookies del sitio con la de información de local
    const cookieHeader = `${allCookies ? allCookies + '; ' : ''}_lcec_linf={"id_local":${idLocal}};`;

    const { data } = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.lacoopeencasa.coop',
        'Referer': 'https://www.lacoopeencasa.coop/',
        'is-mobile': 'true',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 15000
    });
    
    if (data?.datos?.articulos?.length > 0) {
      const topProducts = data.datos.articulos.slice(0, 3);
      return topProducts.map((p: any) => {
        const slug = p.descripcion
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        return {
          id: "lacoope",
          name: "Cooperativa Obrera",
          price: parseFloat(p.precio) || 0,
          inStock: parseFloat(p.stock) > 0,
          url: `https://www.lacoopeencasa.coop/producto/${slug}/${p.cod_interno}`,
          originalPrice: parseFloat(p.precio_anterior) || parseFloat(p.precio) || 0,
          isOffer: parseFloat(p.precio_anterior) > parseFloat(p.precio),
          imageUrl: p.imagen || '',
          productName: p.descripcion || 'Producto en La Coope',
          brand: p.marca_desc || p.marca || ''
        };
      });
    }
  } catch (error: any) {
    logger.error("[Cooperativa Obrera] Error calling Direct API:", error.message);
    if (error.response) {
      logger.error("[Cooperativa Obrera] Response data:", JSON.stringify(error.response.data));
    }
  }
  return [{ id: "lacoope", name: "Cooperativa Obrera", price: 0, inStock: false, url: '', originalPrice: 0, isOffer: false, imageUrl: '', productName: 'Producto no disponible', brand: '' }];
}

const CITY_CHAINS: Record<string, string[]> = {
  "default": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto"],
  "bahia blanca": ["carrefour", "masonline", "vea", "lacoope"],
  "mar del plata": ["carrefour", "masonline", "vea", "dia", "coto", "disco", "toledo", "lacoope"],
  "rosario": ["carrefour", "masonline", "vea", "dia", "coto", "disco"],
  "caba": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto", "disco"],
  "neuquen": ["carrefour", "laanonima", "vea", "lacoope", "dia"],
  "bariloche": ["carrefour", "laanonima", "todo", "vea"]
};

// Mapeo de ciudades a IDs de sucursales de La Coope
const COOPE_LOCAL_IDS: Record<string, number> = {
  "default": 840,
  "bahia blanca": 840,
  "neuquen": 748,
  "mar del plata": 815,
  "general roca": 757,
  "viedma": 732,
  "punta alta": 841,
  "caba": 840
};

export const getSupermarketPrices = onRequest({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
  corsHandler(req, res, async () => {
    const q = (req.query.query || req.query.barcode) as string;
    const rawCity = (req.query.city as string || "");
    let city = rawCity.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/, .+$/, ""); // Quitar sufijos como ", Provincia de..."
    
    // Mapeo de alias para Bahía Blanca
    if (city === "b. blanca" || city === "bb" || city === "b blanca") {
      city = "bahia blanca";
    }

    logger.info(`Buscando [${q}] en [${rawCity}] -> Normalizada: [${city}]`);

    // Determinar qué cadenas buscar basándonos en la ciudad
    let allowedChains = CITY_CHAINS[city] || CITY_CHAINS["default"];
    
    // Fallback para variaciones comunes si no hubo coincidencia exacta
    if (!CITY_CHAINS[city]) {
      if (city.includes("bahia blanca")) allowedChains = CITY_CHAINS["bahia blanca"];
      else if (city.includes("mar del plata")) allowedChains = CITY_CHAINS["mar del plata"];
      else if (city.includes("rosario")) allowedChains = CITY_CHAINS["rosario"];
    }


    logger.info(`Cadenas permitidas para [${city}]: ${JSON.stringify(allowedChains)}`);

    try {
      const fetchers: Promise<any[]>[] = [];
      
      if (allowedChains.includes("carrefour")) fetchers.push(fetchVtex("Carrefour", "www.carrefour.com.ar", q, 3));
      if (allowedChains.includes("masonline")) fetchers.push(fetchVtex("Chango Más", "www.masonline.com.ar", q, 1));
      if (allowedChains.includes("vea")) fetchers.push(fetchVtex("VEA", "www.vea.com.ar", q, 34));
      
      if (allowedChains.includes("lacoope")) {
        const idLocal = COOPE_LOCAL_IDS[city] || COOPE_LOCAL_IDS["default"];
        fetchers.push(fetchCoope(q, idLocal));
      }
      if (allowedChains.includes("dia")) fetchers.push(fetchVtex("Día", "diaonline.supermercadosdia.com.ar", q, 1));
      if (allowedChains.includes("disco")) fetchers.push(fetchVtex("Disco", "www.disco.com.ar", q, 34));
      if (allowedChains.includes("toledo")) fetchers.push(fetchVtex("Toledo", "www.toledodigital.com.ar", q, 1));
      if (allowedChains.includes("laanonima")) fetchers.push(fetchVtex("La Anónima", "www.laanonima.com.ar", q, 1));
      
      // Coto es especial (pendiente implementación robusta, por ahora simulamos si está permitido)
      if (allowedChains.includes("coto")) fetchers.push(fetchCoto(q));

      const results = await Promise.all(fetchers);
      const flatResults = results.flat().filter(r => r.price > 0);
      
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
        res.json({ types: [], sizes: [], products: [] });
      }
    } catch (error: any) {
      logger.error("Error en getSearchSuggestions:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});
