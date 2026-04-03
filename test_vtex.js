import axios from 'axios';

async function testSimulation() {
    const veaUrl = 'https://www.vea.com.ar/api/checkout/pub/orderforms/simulation?sc=34';
    const payload = {
        items: [{
            id: "24803", // SKU for La Virginia 500g
            quantity: 1,
            seller: "1"
        }],
        postalCode: "8000",
        country: "ARG"
    };

    try {
        const response = await axios.post(veaUrl, payload);
        console.log("SIMULATION RESULT:", JSON.stringify(response.data, null, 2));
        
        const item = response.data.items[0];
        console.log("PRICE:", item.price / 100);
        console.log("LIST PRICE:", item.listPrice / 100);
        console.log("PRICE DEFINITION:", JSON.stringify(item.priceDefinition, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
}

testSimulation();
