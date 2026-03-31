"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchSuggestions = exports.getSupermarketPrices = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios_1 = require("axios");
const cors = require("cors");
// Initialize CORS
const corsHandler = cors({ origin: true });
async function fetchVtex(storeName, domain, query) {
    var _a;
    try {
        const url = `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
        const { data } = await axios_1.default.get(url, {
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
                    const commertialOffer = (_a = item.sellers[0]) === null || _a === void 0 ? void 0 : _a.commertialOffer;
                    const price = (commertialOffer === null || commertialOffer === void 0 ? void 0 : commertialOffer.Price) || 0;
                    let listPrice = (commertialOffer === null || commertialOffer === void 0 ? void 0 : commertialOffer.ListPrice) || 0;
                    if (listPrice > price * 3 && price > 0) {
                        listPrice = price;
                    }
                    const stock = (commertialOffer === null || commertialOffer === void 0 ? void 0 : commertialOffer.AvailableQuantity) || 0;
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
    }
    catch (error) {
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
async function fetchCoto(query) {
    // Coto no es VTEX, requiere scraping o una API específica.
    // Por ahora devolvemos un placeholder vacío para evitar errores.
    return [];
}
async function getCoopeSession() {
    try {
        const response = await axios_1.default.get("https://www.lacoopeencasa.coop/", {
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
    }
    catch (error) {
        logger.error("[Cooperativa Obrera] Error fetching session:", error.message);
    }
    return null;
}
async function fetchCoope(query) {
    var _a, _b;
    try {
        const allCookies = await getCoopeSession();
        const url = "https://api.lacoopeencasa.coop/api/articulos/pagina_busqueda";
        // Configuración para Bahía Blanca (id_local: 840)
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
        const cookieHeader = `${allCookies ? allCookies + '; ' : ''}_lcec_linf={"id_local":840};`;
        const { data } = await axios_1.default.post(url, payload, {
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
        if (((_b = (_a = data === null || data === void 0 ? void 0 : data.datos) === null || _a === void 0 ? void 0 : _a.articulos) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            const topProducts = data.datos.articulos.slice(0, 3);
            return topProducts.map((p) => {
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
    }
    catch (error) {
        logger.error("[Cooperativa Obrera] Error calling Direct API:", error.message);
        if (error.response) {
            logger.error("[Cooperativa Obrera] Response data:", JSON.stringify(error.response.data));
        }
    }
    return [{ id: "lacoope", name: "Cooperativa Obrera", price: 0, inStock: false, url: '', originalPrice: 0, isOffer: false, imageUrl: '', productName: 'Producto no disponible', brand: '' }];
}
const CITY_CHAINS = {
    "default": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto"],
    "bahia blanca": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto"],
    "mar del plata": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto", "disco", "toledo"],
    "caba": ["carrefour", "masonline", "vea", "lacoope", "dia", "coto", "disco"],
    "neuquen": ["carrefour", "laanonima", "vea", "lacoope", "dia"],
    "bariloche": ["carrefour", "laanonima", "todo", "vea"]
};
exports.getSupermarketPrices = (0, https_1.onRequest)({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
    corsHandler(req, res, async () => {
        const q = (req.query.query || req.query.barcode);
        const city = (req.query.city || "").toLowerCase().trim();
        if (!q) {
            res.status(400).json({ error: "Query or Barcode is required" });
            return;
        }
        logger.info(`Buscando [${q}] en [${city || 'ubicación por defecto'}]`);
        // Determinar qué cadenas buscar basándonos en la ciudad
        let allowedChains = CITY_CHAINS[city] || CITY_CHAINS["default"];
        // Si la ciudad contiene "bahia blanca", forzamos el filtrado estricto
        if (city.includes("bahia blanca")) {
            allowedChains = CITY_CHAINS["bahia blanca"];
        }
        try {
            const fetchers = [];
            if (allowedChains.includes("carrefour"))
                fetchers.push(fetchVtex("Carrefour", "www.carrefour.com.ar", q));
            if (allowedChains.includes("masonline"))
                fetchers.push(fetchVtex("Chango Más", "www.masonline.com.ar", q));
            if (allowedChains.includes("vea"))
                fetchers.push(fetchVtex("VEA", "www.vea.com.ar", q));
            if (allowedChains.includes("lacoope"))
                fetchers.push(fetchCoope(q));
            if (allowedChains.includes("dia"))
                fetchers.push(fetchVtex("Día", "diaonline.supermercadosdia.com.ar", q));
            if (allowedChains.includes("disco"))
                fetchers.push(fetchVtex("Disco", "www.disco.com.ar", q));
            if (allowedChains.includes("toledo"))
                fetchers.push(fetchVtex("Toledo", "www.toledodigital.com.ar", q));
            if (allowedChains.includes("laanonima"))
                fetchers.push(fetchVtex("La Anónima", "www.laanonima.com.ar", q));
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