"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchSuggestions = exports.getSupermarketPrices = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios_1 = require("axios");
const cors = require("cors");
// Initialize CORS
const corsHandler = cors({ origin: true });
async function fetchVtex(storeName, domain, query, sc = 1) {
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
        const { data: searchData } = await axios_1.default.get(searchUrl, { headers: commonHeaders, timeout: 8000 });
        logger.info(`[${storeName}] Search results found: ${(searchData === null || searchData === void 0 ? void 0 : searchData.length) || 0}`);
        if (searchData && searchData.length > 0) {
            const topProducts = searchData.slice(0, 3);
            const skusToSimulate = [];
            // Mapeo inicial desde la búsqueda (con descuentos ya aplicados en Search API si sc=34 funciona)
            const results = topProducts.map((product) => {
                var _a, _b, _c, _d, _e;
                const item = (_a = product.items) === null || _a === void 0 ? void 0 : _a[0];
                if (item) {
                    const offer = (_c = (_b = item.sellers) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.commertialOffer;
                    skusToSimulate.push({ id: item.itemId, quantity: 1, seller: "1" });
                    const searchPrice = (offer === null || offer === void 0 ? void 0 : offer.SpotPrice) || (offer === null || offer === void 0 ? void 0 : offer.Price) || 0;
                    const searchListPrice = (offer === null || offer === void 0 ? void 0 : offer.ListPrice) || searchPrice;
                    return {
                        id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''),
                        name: storeName,
                        skuId: item.itemId,
                        productName: product.productName,
                        url: product.link || `https://${domain}/${product.linkText}/p`,
                        imageUrl: ((_e = (_d = item.images) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.imageUrl) || '',
                        brand: product.brand || '',
                        price: searchPrice,
                        originalPrice: searchListPrice,
                        isOffer: searchListPrice > searchPrice,
                        inStock: (offer === null || offer === void 0 ? void 0 : offer.AvailableQuantity) > 0
                    };
                }
                return null;
            }).filter((r) => r !== null);
            // Opcional: Checkout Simulation para confirmar precios finales y detectar beneficios complejos (2x1, etc)
            if (skusToSimulate.length > 0) {
                try {
                    const simUrl = `https://${domain}/api/checkout/pub/orderforms/simulation?sc=${sc}`;
                    const { data: simData } = await axios_1.default.post(simUrl, { items: skusToSimulate }, { headers: commonHeaders, timeout: 5000 });
                    if (simData && simData.items) {
                        simData.items.forEach((simItem, idx) => {
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
                }
                catch (simError) {
                    logger.warn(`[${storeName}] Simulation failed, using search results.`, simError.message);
                }
            }
            return results.filter((r) => r.price > 0);
        }
    }
    catch (error) {
        logger.error(`[${storeName}] Error on VTEX API:`, error.message);
    }
    return [];
}
async function fetchCoto(query) {
    // Coto no es VTEX, requiere scraping o una API específica.
    // Por ahora devolvemos un placeholder vacío para evitar errores.
    return [];
}
async function fetchCoope(query, idLocal = 840) {
    var _a;
    try {
        const url = `https://api.lacoopeencasa.coop/api/buscar/articulos?q=${encodeURIComponent(query)}&offset=0&pedido=0`;
        const cookieHeader = `_lcec_linf={"id_local":${idLocal}};`;
        const { data } = await axios_1.default.get(url, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://www.lacoopeencasa.coop',
                'Referer': 'https://www.lacoopeencasa.coop/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                'Cookie': cookieHeader
            },
            timeout: 10000
        });
        if (((_a = data === null || data === void 0 ? void 0 : data.datos) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            const topProducts = data.datos.slice(0, 3);
            return topProducts.map((p) => {
                const slug = (p.descripcion || '')
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/[\s_-]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                const price = parseFloat(p.precio) || 0;
                const originalPrice = parseFloat(p.precio_anterior) || price;
                return {
                    id: "lacoope",
                    name: "Cooperativa Obrera",
                    price: price,
                    inStock: p.estado === "1" && price > 0,
                    url: `https://www.lacoopeencasa.coop/producto/${slug}/${p.cod_interno}`,
                    originalPrice: originalPrice,
                    isOffer: originalPrice > price,
                    imageUrl: p.imagen || '',
                    productName: p.descripcion || 'Producto en La Coope',
                    brand: p.marca_desc || ''
                };
            });
        }
    }
    catch (error) {
        logger.error("[Cooperativa Obrera] Error calling Direct API:", error.message);
        if (error.response) {
            logger.error("[Cooperativa Obrera] Response data:", JSON.stringify(error.response.data));
        }
    }
    return [];
}
const CITY_CHAINS = {
    "default": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto"],
    "bahia blanca": ["carrefour", "masonline", "vea", "lacoope"],
    "mar del plata": ["carrefour", "masonline", "vea", "dia", "coto", "disco", "toledo", "lacoope"],
    "rosario": ["carrefour", "masonline", "vea", "dia", "coto", "disco"],
    "caba": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto", "disco"],
    "neuquen": ["carrefour", "laanonima", "vea", "lacoope", "dia"],
    "bariloche": ["carrefour", "laanonima", "todo", "vea"]
};
// Mapeo de ciudades a IDs de sucursales de La Coope
const COOPE_LOCAL_IDS = {
    "default": 840,
    "bahia blanca": 840,
    "neuquen": 748,
    "mar del plata": 815,
    "general roca": 757,
    "viedma": 732,
    "punta alta": 841,
    "caba": 840
};
exports.getSupermarketPrices = (0, https_1.onRequest)({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
    corsHandler(req, res, async () => {
        const q = (req.query.query || req.query.barcode);
        const rawCity = (req.query.city || "");
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
            if (city.includes("bahia blanca"))
                allowedChains = CITY_CHAINS["bahia blanca"];
            else if (city.includes("mar del plata"))
                allowedChains = CITY_CHAINS["mar del plata"];
            else if (city.includes("rosario"))
                allowedChains = CITY_CHAINS["rosario"];
        }
        logger.info(`Cadenas permitidas para [${city}]: ${JSON.stringify(allowedChains)}`);
        try {
            const fetchers = [];
            if (allowedChains.includes("carrefour"))
                fetchers.push(fetchVtex("Carrefour", "www.carrefour.com.ar", q, 3));
            if (allowedChains.includes("masonline"))
                fetchers.push(fetchVtex("Chango Más", "www.masonline.com.ar", q, 1));
            if (allowedChains.includes("vea"))
                fetchers.push(fetchVtex("VEA", "www.vea.com.ar", q, 34));
            if (allowedChains.includes("lacoope")) {
                const idLocal = COOPE_LOCAL_IDS[city] || COOPE_LOCAL_IDS["default"];
                fetchers.push(fetchCoope(q, idLocal));
            }
            if (allowedChains.includes("dia"))
                fetchers.push(fetchVtex("Día", "diaonline.supermercadosdia.com.ar", q, 1));
            if (allowedChains.includes("disco"))
                fetchers.push(fetchVtex("Disco", "www.disco.com.ar", q, 34));
            if (allowedChains.includes("toledo"))
                fetchers.push(fetchVtex("Toledo", "www.toledodigital.com.ar", q, 1));
            if (allowedChains.includes("laanonima"))
                fetchers.push(fetchVtex("La Anónima", "www.laanonima.com.ar", q, 1));
            // Coto es especial (pendiente implementación robusta, por ahora simulamos si está permitido)
            if (allowedChains.includes("coto"))
                fetchers.push(fetchCoto(q));
            const results = await Promise.all(fetchers);
            const flatResults = results.flat().filter(r => r.price > 0);
            res.json(flatResults);
        }
        catch (error) {
            logger.error("Error global en getSupermarketPrices:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
});
exports.getSearchSuggestions = (0, https_1.onRequest)({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
    corsHandler(req, res, async () => {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ error: "Query parameter 'q' is required" });
            return;
        }
        try {
            // Usaremos VEA o Carrefour como fuente de catálogo rápido para sugerencias
            const url = `https://www.vea.com.ar/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
            const { data } = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            if (data && data.length > 0) {
                // Formateamos las sugerencias, descartando las que no tengan un EAN claro
                const suggestions = data.slice(0, 15).map((product) => {
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
                }).filter((p) => p.ean && p.ean.length >= 8); // eans validos
                // Extractor heurístico de Tipos y Tamaños basado en los nombres encontrados
                const sizesSet = new Set();
                const typesSet = new Set();
                const qLower = query.toLowerCase();
                suggestions.forEach((p) => {
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
            }
            else {
                res.json({ types: [], sizes: [], products: [] });
            }
        }
        catch (error) {
            logger.error("Error en getSearchSuggestions:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
});
//# sourceMappingURL=index.js.map