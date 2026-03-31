import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import ResultsView from './components/ResultsView';
import ListView from './components/ListView';
import ProfileView from './components/ProfileView';
import Scanner from './components/Scanner';
import OffersView from './components/OffersView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchProductInfo, getSupermarketPrices, type ProductData, type SupermarketPrice, type ShoppingListItem } from './api';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { LandingScreen, LoginScreen } from './components/AuthScreens';
import { fetchUserList, saveUserList } from './services/listService';
import React, { useRef } from 'react';

// Simple Error Boundary to catch rendering crashes
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-soft p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-[32px] flex items-center justify-center text-red-500 mb-6 border-4 border-white shadow-xl">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Oops! Algo salió mal</h2>
          <p className="text-slate-500 mb-8 max-w-xs font-medium">Ocurrió un error inesperado. Estamos trabajando para solucionarlo.</p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-primary-green text-white font-black py-3 px-8 rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw size={20} />
            <span>Recargar App</span>
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-red-50 text-red-700 rounded-xl text-xs overflow-auto max-w-full text-left font-mono">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}



const AppContent = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [showAuthScreen, setShowAuthScreen] = useState<'landing' | 'login'>('landing');
  const [activeView, setActiveView] = useState('home');
  const [scanning, setScanning] = useState(false);
  const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
  
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [prices, setPrices] = useState<SupermarketPrice[]>([]);

  const [profileInitialTab, setProfileInitialTab] = useState<'settings' | 'payments'>('settings');
  const isInitialLoad = useRef(true);

  // Cargar lista desde Firestore al iniciar sesión
  useEffect(() => {
    if (!user) {
      setListItems([]);
      isInitialLoad.current = true;
      return;
    }

    const loadList = async () => {
      const savedList = await fetchUserList(user.uid);
      if (savedList && savedList.length >= 0) {
        setListItems(savedList);
      }
      isInitialLoad.current = false;
    };

    loadList();
  }, [user]);

  // Guardar lista en Firestore ante cualquier cambio
  useEffect(() => {
    if (!user || isInitialLoad.current) return;

    const timeoutId = setTimeout(() => {
      saveUserList(user.uid, listItems);
    }, 1000); // Debounce de 1 segundo

    return () => clearTimeout(timeoutId);
  }, [listItems, user]);

  const handleViewChange = (view: string, tab?: 'settings' | 'payments') => {
    if (tab) setProfileInitialTab(tab);
    setActiveView(view);
  };

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
        getSupermarketPrices(lastScannedCode!, userData?.location)
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
  
  const handleAddToList = (prod: ProductData, best: SupermarketPrice, allPrices: SupermarketPrice[]) => {
    setListItems(prev => {
      // Usar EAN o ID del producto para unicidad, ya que 'prod.code' puede ser la query de búsqueda
      const productUniqueId = best.ean || best.id;
      const existingIdx = prev.findIndex(item => (item.price.ean || item.price.id) === productUniqueId);
      
      if (existingIdx >= 0) {
        const neue = [...prev];
        neue[existingIdx] = { 
          ...neue[existingIdx], 
          quantity: neue[existingIdx].quantity + 1,
          price: best, // Update to the "last added" price selection
          allPrices: allPrices // Update with latest comparison data
        };
        return neue;
      }
      return [...prev, { 
        id: crypto.randomUUID(),
        product: prod, 
        price: best, 
        allPrices: allPrices, 
        quantity: 1,
        checked: false
      }];
    });
  };

  if (authLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-soft">
          <div className="w-16 h-16 border-4 border-primary-green border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-slate-500">Cargando...</p>
        </div>
     );
  }

  if (!user) {
    if (showAuthScreen === 'landing') {
      return <LandingScreen onNavigate={() => setShowAuthScreen('login')} />;
    }
    return <LoginScreen />;
  }

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 mt-6">
          <div className="h-8 w-3/4 bg-slate-100 rounded-lg animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="w-full h-48 bg-slate-50 flex items-center justify-center rounded-2xl animate-pulse">
                  <div className="w-16 h-16 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-5 w-full bg-slate-100 rounded-md animate-pulse mt-2"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded-md animate-pulse"></div>
                <div className="flex items-end justify-between mt-2 pt-4 border-t border-slate-50">
                   <div className="flex flex-col gap-2">
                     <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
                     <div className="h-3 w-16 bg-slate-100 rounded-md animate-pulse"></div>
                   </div>
                   <div className="h-14 w-14 bg-slate-50 rounded-2xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'home':
        return <HomeView onSearch={handleSearch} onScan={() => setScanning(true)} onViewChange={handleViewChange} />;
      case 'results':
        return product ? (
          <ResultsView 
            product={product} 
            prices={prices} 
            onAddToList={handleAddToList} 
            onBack={() => setActiveView('home')} 
          />
        ) : <HomeView onSearch={handleSearch} onScan={() => setScanning(true)} onViewChange={handleViewChange} />;
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
            onUpdatePrice={(idx, newPrice) => {
              setListItems(prev => {
                const neue = [...prev];
                neue[idx] = { ...neue[idx], price: newPrice };
                return neue;
              });
            }}
            onClear={() => setListItems([])}
          />
        );
      case 'profile':
        return <ProfileView initialTab={profileInitialTab} onTabChange={setProfileInitialTab} />;
      case 'offers':
        return <OffersView onAddToList={handleAddToList} />;
      default:
        return <HomeView onSearch={handleSearch} onScan={() => setScanning(true)} onViewChange={handleViewChange} />;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={handleViewChange} cartCount={listItems.length}>
      {renderView()}
      {scanning && (
        <Scanner onClose={() => setScanning(false)} onScanSuccess={handleScanSuccess} />
      )}
    </Layout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
