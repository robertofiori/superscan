"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupermarketPrices = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios_1 = require("axios");
const cors = require("cors");
// Initialize CORS
const corsHandler = cors({ origin: true });
async function fetchVtex(storeName, domain, barcode) {
    var _a, _b, _c, _d;
    try {
        const url = `https://${domain}/api/catalog_system/pub/products/search?ft=${barcode}`;
        const { data } = await axios_1.default.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        if (data && data.length > 0) {
            const product = data[0];
            const item = product.items && product.items.length > 0 ? product.items[0] : null;
            if (item) {
                const price = ((_b = (_a = item.sellers[0]) === null || _a === void 0 ? void 0 : _a.commertialOffer) === null || _b === void 0 ? void 0 : _b.Price) || 0;
                const stock = ((_d = (_c = item.sellers[0]) === null || _c === void 0 ? void 0 : _c.commertialOffer) === null || _d === void 0 ? void 0 : _d.AvailableQuantity) || 0;
                return {
                    id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''),
                    name: storeName,
                    price,
                    inStock: stock > 0
                };
            }
        }
    }
    catch (error) {
        logger.error(`[${storeName}] Error on VTEX API:`, error.message);
    }
    return { id: domain.replace('www.', '').replace('.com.ar', '').replace('.com', ''), name: storeName, price: 0, inStock: false };
}
async function fetchCoope(barcode) {
    var _a, _b;
    try {
        const url = "https://us-central1-elchango-81e77.cloudfunctions.net/scrapeCoope";
        const { data } = await axios_1.default.post(url, { data: { query: barcode } }, { timeout: 45000 });
        if (((_a = data === null || data === void 0 ? void 0 : data.result) === null || _a === void 0 ? void 0 : _a.success) && ((_b = data.result.products) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            return {
                id: "lacoope",
                name: "Cooperativa Obrera",
                price: data.result.products[0].price,
                inStock: data.result.products[0].stock
            };
        }
    }
    catch (error) {
        logger.error("[Cooperativa Obrera] Error calling external Cloud Function:", error.message);
    }
    return { id: "lacoope", name: "Cooperativa Obrera", price: 0, inStock: false };
}
exports.getSupermarketPrices = (0, https_1.onRequest)({ timeoutSeconds: 60, memory: "256MiB" }, (req, res) => {
    corsHandler(req, res, async () => {
        const barcode = req.query.barcode;
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
        }
        catch (error) {
            logger.error("Error global en getSupermarketPrices:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
});
//# sourceMappingURL=index.js.map