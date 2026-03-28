import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import ResultsView from './components/ResultsView';
import ListView from './components/ListView';
import ProfileView from './components/ProfileView';
import Scanner from './components/Scanner';
import { fetchProductInfo, getSupermarketPrices, type ProductData, type SupermarketPrice } from './api';

export interface ShoppingListItem {
  product: ProductData;
  price: SupermarketPrice;
  quantity: number;
}

function App() {
  const [activeView, setActiveView] = useState('home');
  const [scanning, setScanning] = useState(false);
  const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
  
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [prices, setPrices] = useState<SupermarketPrice[]>([]);

  // Effect to fetch data when a code is scanned or searched
  useEffect(() => {
    if (!lastScannedCode) return;

    let active = true;
    setLoading(true);
    setProduct(null);
    setPrices([]);

    async function loadData() {
      const isBarcode = /^\d{7,14}$/.test(lastScannedCode!);

      const [prodInfo, pricesData] = await Promise.all([
        isBarcode ? fetchProductInfo(lastScannedCode!) : Promise.resolve(null),
        getSupermarketPrices(lastScannedCode!)
      ]);

      if (!active) return;
      
      setProduct(prodInfo || { 
        code: lastScannedCode!, 
        product_name: isBarcode ? 'Producto Desconocido' : `Búsqueda: ${lastScannedCode!}`,
        brands: isBarcode ? 'Marca no registrada' : 'Resultados sugeridos'
      });
      setPrices(pricesData);
      setLoading(false);
      setActiveView('results');
    }

    loadData();

    return () => { active = false; };
  }, [lastScannedCode]);

  const handleSearch = (query: string) => {
    setLastScannedCode(query);
  };

  const handleScanSuccess = (code: string) => {
    setScanning(false);
    setLastScannedCode(code);
  };
  
  const handleAddToList = (prod: ProductData, best: SupermarketPrice) => {
    setListItems(prev => {
      const existing = prev.find(item => item.product.code === prod.code && item.price.id === best.id);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product: prod, price: best, quantity: 1 }];
    });
    // Optional: Mostrar feedback o navegar a la lista
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
          <div className="w-16 h-16 border-4 border-primary-green border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-slate-500">Buscando las mejores ofertas...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'home':
        return <HomeView onSearch={handleSearch} onScan={() => setScanning(true)} />;
      case 'results':
        return product ? (
          <ResultsView 
            product={product} 
            prices={prices} 
            onAddToList={handleAddToList} 
            onBack={() => setActiveView('home')} 
          />
        ) : <HomeView onSearch={handleSearch} onScan={() => setScanning(true)} />;
      case 'list':
        return (
          <ListView 
            items={listItems} 
            onUpdateQuantity={(idx, delta) => {
              setListItems(prev => {
                const nueva = [...prev];
                nueva[idx].quantity += delta;
                if (nueva[idx].quantity <= 0) nueva.splice(idx, 1);
                return nueva;
              });
            }}
            onClear={() => setListItems([])}
          />
        );
      case 'profile':
        return <ProfileView />;
      case 'offers':
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Ofertas Exclusivas</h2>
            <p className="text-slate-500 max-w-xs">Estamos recopilando las mejores ofertas del día para vos. ¡Volvé pronto!</p>
          </div>
        );
      default:
        return <HomeView onSearch={handleSearch} onScan={() => setScanning(true)} />;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView} cartCount={listItems.length}>
      {renderView()}
      {scanning && (
        <Scanner onClose={() => setScanning(false)} onScanSuccess={handleScanSuccess} />
      )}
    </Layout>
  );
}

export default App;
