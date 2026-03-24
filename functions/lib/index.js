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
async function fetchCoope(query) {
    var _a, _b;
    try {
        const url = "https://us-central1-elchango-81e77.cloudfunctions.net/scrapeCoope";
        const { data } = await axios_1.default.post(url, { data: { query: query } }, { timeout: 45000 });
        if (((_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a.success) && ((_b = data.result.products) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            const topProducts = data.result.products.slice(0, 3);
            return topProducts.map((p) => ({
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
    }
    catch (error) {
        logger.error("[Cooperativa Obrera] Error calling external Cloud Function:", error.message);
    }
    return [{ id: "lacoope", name: "Cooperativa Obrera", price: 0, inStock: false, url: '', originalPrice: 0, isOffer: false, imageUrl: '', productName: 'Producto no disponible', brand: '' }];
}
exports.getSupermarketPrices = (0, https_1.onRequest)({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
    corsHandler(req, res, async () => {
        const q = (req.query.query || req.query.barcode);
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
                res.json([]);
            }
        }
        catch (error) {
            logger.error("Error en getSearchSuggestions:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
});
//# sourceMappingURL=index.js.map