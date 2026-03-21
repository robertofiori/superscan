import { useState, useEffect } from 'react';
import { Camera, Search, ShoppingCart, Loader2, ListOrdered, ArrowLeft } from 'lucide-react';
import Scanner from './components/Scanner';
import ProductResult from './components/ProductResult';
import ShoppingList, { type ShoppingListItem } from './components/ShoppingList';
import { fetchProductInfo, getSupermarketPrices, type ProductData, type SupermarketPrice } from './api';

function App() {
  const [scanning, setScanning] = useState(false);
  const [showList, setShowList] = useState(false);
  const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
  
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [prices, setPrices] = useState<SupermarketPrice[]>([]);

  // Effect to fetch data when a code is scanned
  useEffect(() => {
    if (!lastScannedCode) return;

    let active = true;
    setLoading(true);
    setProduct(null);
    setPrices([]);

    async function loadData() {
      // Parallelize fetching product info and mock prices
      const [prodInfo, pricesData] = await Promise.all([
        fetchProductInfo(lastScannedCode!),
        getSupermarketPrices(lastScannedCode!)
      ]);

      if (!active) return;
      
      // If OFF API fails or doesn't find it, we create a generic placeholder
      setProduct(prodInfo || { code: lastScannedCode! });
      setPrices(pricesData);
      setLoading(false);
    }

    loadData();

    return () => { active = false; };
  }, [lastScannedCode]);

  const handleScanSuccess = (code: string) => {
    setLastScannedCode(code);
    setScanning(false);
  };
  
  const handleAddToList = (prod: ProductData, best: SupermarketPrice) => {
    setListItems(prev => {
      const existing = prev.find(item => item.product.code === prod.code && item.price.id === best.id);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product: prod, price: best, quantity: 1 }];
    });
    setLastScannedCode(null);
    setShowList(true);
  };

  if (showList) {
    return (
      <div className="min-h-[100dvh] bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 flex flex-col p-6 items-center">
        <header className="w-full max-w-md flex justify-between items-center mb-6 mt-4">
          <button 
            onClick={() => setShowList(false)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium py-2 pr-4 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Volver al buscador</span>
          </button>
        </header>
        <ShoppingList 
          items={listItems} 
          onUpdateQuantity={(index: number, delta: number) => {
            setListItems(prev => {
              const nueva = [...prev];
              nueva[index].quantity += delta;
              if (nueva[index].quantity <= 0) nueva.splice(index, 1);
              return nueva;
            });
          }}
          onStartScan={() => {
            setShowList(false);
            setScanning(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 flex flex-col items-center p-6">
      
      {/* HEADER */}
      <header className="w-full max-w-md flex justify-between items-center mb-8 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-[14px] flex items-center justify-center shadow-lg shadow-primary/30">
            <ShoppingCart size={20} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">SuperScan</h1>
        </div>
        <button 
          onClick={() => setShowList(true)}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <ListOrdered size={18} />
          <span className="hidden sm:inline">Mi Lista</span>
          {listItems.length > 0 && <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">{listItems.length}</span>}
        </button>
      </header>

      {/* BODY */}
      <div className="w-full max-w-md flex flex-col gap-6 flex-1">
        
        {/* If NO product is being viewed and NOT loading, show Scanner Card */}
        {!lastScannedCode && !loading && (
          <div className="bg-surface-light dark:bg-surface-dark rounded-[32px] p-8 text-center shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300 mt-4">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-[28px] rotate-3 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Search size={44} strokeWidth={2.5} className="-rotate-3" />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">Compara Precios</h2>
            <p className="text-slate-500 text-base mb-10 leading-relaxed max-w-[280px] mx-auto">
              Escanea cualquier código de barras y descubre qué supermercado lo tiene más barato hoy.
            </p>
            
            <button 
              onClick={() => setScanning(true)}
              className="w-full bg-primary hover:bg-violet-600 text-white font-bold flex flex-row items-center justify-center gap-3 py-5 px-6 rounded-2xl shadow-xl shadow-primary/25 transition-all active:scale-95"
            >
              <Camera size={24} />
              <span className="text-lg">Escanear Producto</span>
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in pt-10">
            <Loader2 className="animate-spin text-primary mb-6" size={48} strokeWidth={2.5} />
            <p className="font-medium text-slate-500 dark:text-slate-400">Buscando producto {lastScannedCode}...</p>
            <p className="text-sm text-slate-400 mt-2">Consultando supermercados locales</p>
          </div>
        )}

        {/* RESULT STATE */}
        {!loading && product && (
          <ProductResult 
            product={product} 
            prices={prices} 
            onAddToList={handleAddToList}
            onScanAnother={() => setLastScannedCode(null)}
          />
        )}
      </div>

      {scanning && (
        <Scanner onClose={() => setScanning(false)} onScanSuccess={handleScanSuccess} />
      )}
      
    </div>
  );
}

export default App;
