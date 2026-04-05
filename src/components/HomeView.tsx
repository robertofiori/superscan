import React from 'react';
import { 
  ShoppingBag, MapPin, Plus, Minus, 
  ShoppingBasket, Store
} from 'lucide-react';
import AutocompleteSearch from './AutocompleteSearch';
import { useAuth } from '../contexts/AuthContext';
import { type ShoppingListItem } from '../api';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
interface HomeViewProps {
  onSearch: (query: string) => void;
  onViewChange: (view: string, tab?: 'settings' | 'payments') => void;
  onShowLocation: () => void;
  items: ShoppingListItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

const formatPrice = (price: number) => {
    return price.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

const RAW_STORES_DATA = {
  ciudad: "Bahía Blanca",
  sucursales: [
    {
      cadena: "VEA",
      locales: [
        { nombre: "Vea - Casanova", direccion: "Casanova 472", id: "place_id://ChIJyTHTcKq87ZUR27b2yy7otIk", lat: -38.7088, lon: -62.2638 },
        { nombre: "Vea - Capitán Martínez", direccion: "Cap. de Navio José Martínez 1356", id: "place_id://ChIJJbReijCj7ZUR235HkNbI9bE", lat: -38.7460, lon: -62.2850 }
      ]
    },
    {
      cadena: "CARREFOUR",
      locales: [
        { nombre: "Carrefour Market Bahía Blanca", direccion: "Brown 51", id: "place_id://ChIJyQ9MLbK87ZURlRpFSu3xe0o", lat: -38.7182, lon: -62.2628 }
      ]
    },
    {
      cadena: "CHANGO MAS",
      locales: [
        { nombre: "Hiper ChangoMâs Bahía Blanca", direccion: "Sarmiento 4114", id: "place_id://ChIJr78M27a87ZURkG3_Gk2tHwY", lat: -38.6946, lon: -62.2289 }
      ]
    },
    {
      cadena: "COOPERATIVA OBRERA",
      locales: [
        { nombre: "Cooperativa Obrera - Belgrano", direccion: "Belgrano 45", id: "place_id://ChIJz-6rPbK87ZURmYVvP2X3f8Q", lat: -38.7161, lon: -62.2642 },
        { nombre: "Cooperativa Obrera - Roca", direccion: "Julio Argentino Roca 34", id: "place_id://ChIJmweNLLK87ZURrVZVZ04eP2o", lat: -38.7226, lon: -62.2599 },
        { nombre: "Cooperativa Obrera - 9 de Julio", direccion: "9 de Julio 136", id: "place_id://ChIJQx2kP7K87ZURX9vBvjL7F7s", lat: -38.7180, lon: -62.2660 },
        { nombre: "Cooperativa Obrera - HiperAguado", direccion: "Guatemala 533", id: "place_id://ChIJs9g95J287ZURU82R4V2Q86g", lat: -38.6993, lon: -62.2748 },
        { nombre: "Cooperativa Obrera - Vieytes", direccion: "Vieytes 2139", id: "place_id://ChIJi_ZlJ0Sj7ZURdI_10KxH7jA", lat: -38.7042, lon: -62.2882 }
      ]
    }
  ]
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

const HomeView: React.FC<HomeViewProps> = ({ onSearch, onViewChange, onShowLocation, items, onUpdateQuantity }) => {
  const { user, userData } = useAuth();
  const [stores, setStores] = React.useState<any[]>([]);
  const [locationStatus, setLocationStatus] = React.useState<'idle' | 'loading' | 'success' | 'error' | 'no_stores'>('idle');

  React.useEffect(() => {
    let isMounted = true;
    
    const fetchStoresAndLocation = async () => {
      setLocationStatus('loading');
      
      let storesData = RAW_STORES_DATA;
      try {
        const docRef = doc(db, "config", "sucursales");
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          console.log("Añadiendo sucursales a Firebase por primera vez...");
          await setDoc(docRef, RAW_STORES_DATA);
        } else {
          storesData = snap.data() as typeof RAW_STORES_DATA;
        }
      } catch (err) {
        console.error("Error al obtener sucursales de Firebase:", err);
      }

      if (!isMounted) return;

      const flatStores: any[] = [];
      storesData.sucursales.forEach(cadena => {
        cadena.locales.forEach(local => {
          flatStores.push({
            id: local.id,
            name: cadena.cadena,
            branch: local.nombre,
            extra: local.direccion.replace('9. de Julio', '9 de Julio'),
            lat: local.lat,
            lon: local.lon
          });
        });
      });

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted) return;
            const { latitude, longitude } = position.coords;
            const storesWithDistances = flatStores.map(store => ({
              ...store,
              distance: calculateDistance(latitude, longitude, store.lat, store.lon)
            }))
            .filter(store => store.distance !== null && store.distance <= 3)
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));
            
            setStores(storesWithDistances);
            setLocationStatus(storesWithDistances.length > 0 ? 'success' : 'no_stores');
          },
          (error) => {
            console.error("Error obteniendo ubicación:", error);
            if (isMounted) setLocationStatus('error');
          }
        );
      } else {
        if (isMounted) setLocationStatus('error');
      }
    };

    fetchStoresAndLocation();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full">
      {/* 
        HERO SECTION - DESKTOP 
      */}
      <section className="hidden lg:flex relative bg-surface rounded-[40px] p-12 overflow-hidden min-h-[420px] items-center border border-slate-100 shadow-xl mt-2">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-green/10 blur-[120px] rounded-full"></div>

        <div className="relative z-10 flex-1 flex flex-col items-start pr-4 xl:pr-8 min-w-0">
          <div className="flex items-center gap-2 mb-4 select-none pr-4">
            <div className="w-[180px] xl:w-[220px] 2xl:w-[260px] shrink-0 relative z-10 transition-all duration-300">
              <img
                src={`${import.meta.env.BASE_URL}elmango-logo.svg`}
                alt="ElMango Logo"
                className="w-full h-auto object-contain drop-shadow-lg scale-110 origin-center"
              />
            </div>
            <div className="flex flex-col pt-4 ml-2 2xl:ml-4">
              <span className="text-[54px] xl:text-[68px] 2xl:text-[80px] leading-[0.85] tracking-tight text-slate-950 font-black" style={{ fontFamily: "'Montserrat', sans-serif" }}>¡Ahorra en</span>
              <span className="text-[54px] xl:text-[68px] 2xl:text-[80px] leading-[0.85] tracking-tight text-slate-950 font-black" style={{ fontFamily: "'Montserrat', sans-serif" }}>tu compra</span>
            </div>
          </div>

          <div className="flex flex-col w-full relative mb-12 items-start pl-4 2xl:pl-8">
            <span className="text-[72px] xl:text-[88px] 2xl:text-[100px] leading-[0.85] tracking-tighter text-primary-green font-black italic relative z-20" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              realmente<span className="text-slate-950">!</span>
            </span>
          </div>

          <div className="w-full max-w-xl 2xl:max-w-2xl relative z-30">
             <AutocompleteSearch onSearch={onSearch} />
          </div>
          
          <div className="mt-6">
            <button 
              onClick={onShowLocation}
              className="flex items-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 active:scale-[0.98] transition-all shadow-sm group"
            >
              <div className="w-8 h-8 bg-slate-50 group-hover:bg-white text-primary-green rounded-xl flex items-center justify-center shadow-sm">
                <MapPin size={18} />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ubicación Actual</span>
                <span className="text-sm font-black text-slate-800 line-clamp-1">
                  {userData?.location?.city || 'Seleccionar Ciudad'}
                </span>
              </div>
              <div className="ml-4 bg-slate-50 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary-green hover:bg-primary-green hover:text-white border border-slate-100 uppercase tracking-wider transition-colors">
                CAMBIAR
              </div>
            </button>
          </div>
        </div>

        {/* Decorative Element - Adapted for Light Mode */}
        <div className="relative z-10 hidden xl:flex shrink-0 ml-auto justify-end">
          <div className="bg-white/90 backdrop-blur-xl rounded-[40px] border border-slate-100 p-8 rotate-3 hover:rotate-0 transition-transform duration-700 shadow-2xl w-[280px] 2xl:w-80 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-green/10 blur-[40px] rounded-full"></div>
            <div className="w-16 h-16 bg-primary-green rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <ShoppingBasket size={32} className="text-white" />
            </div>
            <div className="space-y-6 relative z-10">
              <div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ahorro Promedio</div>
                <div className="text-4xl font-black text-slate-900">$15.200</div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary-green rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              </div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                Utilizando el Smart Basket de ElMango en tu zona.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 
        HERO SECTION - MOBILE 
      */}
      <section className="lg:hidden bg-surface rounded-[32px] p-6 shadow-xl border border-slate-100 flex flex-col mt-2">
        <div className="flex flex-col items-start w-fit mx-auto mb-4 mt-2 select-none relative">
          <div className="flex items-center gap-2">
            <div className="w-[110px] min-[400px]:w-[140px] shrink-0 relative z-10 transition-all duration-300">
              <img
                src={`${import.meta.env.BASE_URL}elmango-logo.svg`}
                alt="ElMango Logo"
                className="w-full h-auto object-contain drop-shadow-md scale-110 origin-center"
              />
            </div>
            <div className="flex flex-col pt-1 ml-2">
              <span className="text-[40px] min-[400px]:text-[50px] leading-[0.85] tracking-tight text-slate-950 font-black" style={{ fontFamily: "'Montserrat', sans-serif" }}>¡Ahorra</span>
              <span className="text-[40px] min-[400px]:text-[50px] leading-[0.85] tracking-tight text-slate-950 font-black" style={{ fontFamily: "'Montserrat', sans-serif" }}>en tu</span>
              <span className="text-[40px] min-[400px]:text-[50px] leading-[0.85] tracking-tight text-slate-950 font-black" style={{ fontFamily: "'Montserrat', sans-serif" }}>compra</span>
            </div>
          </div>

          <div className="flex flex-col w-full relative -mt-1 mb-8 items-center pl-2">
            <span className="text-[52px] min-[400px]:text-[64px] leading-[0.85] tracking-tighter text-primary-green font-black italic relative z-20" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              realmente<span className="text-slate-950">!</span>
            </span>
          </div>

          <div className="w-full max-w-[280px] mx-auto space-y-4">
            <div className="relative z-30">
              <AutocompleteSearch onSearch={onSearch} />
            </div>
            <button 
              onClick={onShowLocation}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white text-primary-green rounded-xl flex items-center justify-center shadow-sm">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ubicación</span>
                  <span className="text-sm font-black text-slate-800 line-clamp-1">
                    {userData?.location?.city || 'Seleccionar Ciudad'}
                  </span>
                </div>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-black text-primary-green border border-slate-100 uppercase tracking-wider">
                CAMBIAR
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* DASHBOARD CONTENT - DESKTOP */}
      <div className="hidden lg:flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center pb-2">
          <div className="space-y-1 text-center">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Hola, <span className="text-primary-green">{user?.displayName?.split(' ')[0] || 'Roberto'}</span> 👋
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 items-start">
          {/* Recent Summary Desktop */}
          <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <ShoppingBasket size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mi Lista</h2>
                </div>
                {items.length > 0 && (
                  <button 
                    onClick={() => onViewChange('list')}
                    className="text-primary-green font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    Ver Todo
                  </button>
                )}
             </div>

             {items.length > 0 ? (
               <div className="space-y-4">
                  {items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 p-2">
                          <img src={item.price.imageUrl || item.product.image_url} alt={item.product.product_name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{item.product.product_name}</span>
                          <span className="text-sm font-black text-primary-green">{formatPrice(item.price.price)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100">
                        <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"><Minus size={16}/></button>
                        <span className="font-black text-slate-900 w-6 text-center">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded-lg text-primary-green"><Plus size={16}/></button>
                      </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="py-12 flex flex-col items-center text-center">
                  <ShoppingBag size={48} className="text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">Tu lista está vacía</p>
               </div>
             )}
          </section>

          {/* Near Stores Desktop */}
          <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Sucursales Cercanas</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bahía Blanca</p>
               </div>
               <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                 <Store size={24} />
               </div>
            </div>
            <div className="space-y-4">
              {locationStatus === 'loading' && (
                <p className="text-sm text-slate-400 animate-pulse">Obteniendo ubicación...</p>
              )}
              {locationStatus === 'error' && (
                <p className="text-sm text-red-400">No pudimos acceder a tu ubicación.</p>
              )}
              {locationStatus === 'no_stores' && (
                <p className="text-sm text-slate-400 font-medium">No hay sucursales a menos de 3km de tu ubicación actual.</p>
              )}
              {locationStatus === 'success' && stores.slice(0, 3).map((store) => {
                const placeId = store.id?.startsWith('place_id://') ? store.id.replace('place_id://', '') : '';
                const placeIdParam = placeId ? `&destination_place_id=${placeId}` : '';
                const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.extra + ', Bahía Blanca, Argentina')}${placeIdParam}`;
                return (
                <a 
                  key={store.id} 
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer"
                >
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-green">
                       <MapPin size={22} />
                    </div>
                    <div className="flex-1">
                       <p className="text-lg font-black text-slate-700">{store.name}</p>
                       <p className="text-sm text-slate-400 font-medium tracking-tight">
                         {store.extra} • {store.distance !== null ? `A ${store.distance.toFixed(1)}km` : ''}
                       </p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-primary-green text-[10px] font-black uppercase tracking-widest rounded-lg">Ver Mapa</span>
                </a>
               )})}
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE LIST PREVIEW */}
      <section className="lg:hidden flex flex-col gap-5 pb-8">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-green/10 rounded-xl text-primary-green">
                <ShoppingBasket size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Mi Lista</h2>
            </div>
            {items.length > 0 && (
              <button 
                onClick={() => onViewChange('list')}
                className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black"
              >
                VER TODO
              </button>
            )}
        </div>

        {items.length > 0 ? (
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="space-y-4">
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
                      <img src={item.price.imageUrl || item.product.image_url} alt={item.product.product_name} className="w-8 h-8 object-contain" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate">{item.product.product_name}</span>
                      <span className="text-xs font-black text-primary-green">{formatPrice(item.price.price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 text-slate-400"><Minus size={14}/></button>
                    <span className="text-sm font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 text-primary-green"><Plus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-10 flex flex-col items-center text-center gap-4">
            <ShoppingBag size={32} className="text-slate-300" />
            <p className="text-slate-400 text-xs font-bold">Tu lista está vacía</p>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Sucursales Cercanas</h3>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
              <Store size={18} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {locationStatus === 'loading' && (
              <p className="text-sm text-center text-slate-400 animate-pulse py-4">Buscando sucursales cerca de tí...</p>
            )}
            {locationStatus === 'error' && (
              <p className="text-sm text-center text-red-400 py-4">Habilita el GPS para ver las sucursales cercanas.</p>
            )}
            {locationStatus === 'no_stores' && (
              <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                <Store size={24} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 font-medium tracking-tight">No hay sucursales a menos de 3km de tí.</p>
              </div>
            )}
            {locationStatus === 'success' && stores.slice(0, 4).map((store) => {
              const placeId = store.id?.startsWith('place_id://') ? store.id.replace('place_id://', '') : '';
              const placeIdParam = placeId ? `&destination_place_id=${placeId}` : '';
              const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.extra + ', Bahía Blanca, Argentina')}${placeIdParam}`;
              return (
              <a 
                key={store.id} 
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-[16px] flex items-center justify-center text-primary-green shrink-0">
                  <MapPin size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-slate-800 truncate">{store.name}</p>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {store.extra}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-black text-primary-green bg-green-50 px-2 py-1 rounded-lg">
                    {store.distance !== null ? `${store.distance.toFixed(1)} km` : ''}
                  </span>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Ver Mapa</span>
                </div>
              </a>
            )})}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
