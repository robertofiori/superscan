import React from 'react';
import { 
  ShoppingBag, MapPin, Plus, Minus, Search, 
  Tag, ShoppingBasket, ArrowRight, Sparkles,
  Globe, Store
} from 'lucide-react';
import AutocompleteSearch from './AutocompleteSearch';
import { useAuth } from '../contexts/AuthContext';
import { type ShoppingListItem } from '../api';

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

const categories = [
  { name: 'Almacén', emoji: '🥫' },
  { name: 'Bebidas', emoji: '🥤' },
  { name: 'Frescos', emoji: '🥩' },
  { name: 'Limpieza', emoji: '🧼' },
  { name: 'Higiene', emoji: '🪥' },
  { name: 'Mascotas', emoji: '🐾' }
];

const mainActions = [
  {
    title: 'Mis Ofertas',
    desc: 'Ver descuentos exclusivos hoy',
    icon: <Tag />,
    color: 'bg-fuchsia-500',
    view: 'offers'
  },
  {
    title: 'Smart Basket',
    desc: 'Optimizar mi lista actual',
    icon: <Sparkles />,
    color: 'bg-primary-green',
    view: 'list'
  }
];

const HomeView: React.FC<HomeViewProps> = ({ onSearch, onViewChange, onShowLocation, items, onUpdateQuantity }) => {
  const { user, userData } = useAuth();

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full">
      {/* 
        HERO SECTION - DESKTOP 
      */}
      <section className="hidden lg:flex relative bg-slate-950 rounded-[40px] p-12 overflow-hidden min-h-[420px] items-center border border-white/5">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-green/20 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full"></div>

        <div className="relative z-10 flex-1">
          <span className="inline-block px-4 py-1.5 bg-primary-green/10 text-primary-green text-xs font-black uppercase tracking-[0.2em] rounded-full mb-6 border border-primary-green/20">
            Inteligencia en Compras
          </span>
          <h2 className="text-5xl xl:text-7xl font-black text-white leading-[0.95] tracking-tighter mb-8">
            EL PRECIO <span className="text-primary-green">MÁS BAJO</span> <br/>
            <span className="text-white/40 italic">SIEMPRE AQUÍ.</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center max-w-2xl">
            <div className="flex-1 relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-primary-green/50 focus-within:bg-white/10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary-green transition-colors" size={22} />
              <input
                type="text"
                placeholder="Busca productos para comparar..."
                className="w-full bg-transparent border-none rounded-2xl py-5 pl-14 pr-4 text-white font-bold placeholder:text-white/20 outline-none text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch(e.currentTarget.value);
                }}
              />
            </div>
            
            <button
              onClick={() => onViewChange('offers')}
              className="px-10 py-5 bg-primary-green hover:bg-[#1faa5e] text-white font-black rounded-2xl shadow-xl shadow-primary-green/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <Tag size={22} />
              OFERTAS
            </button>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="relative z-10 hidden xl:block ml-12">
          <div className="bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 p-8 rotate-3 hover:rotate-0 transition-transform duration-700 shadow-2xl w-80">
            <div className="w-16 h-16 bg-primary-green rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <ShoppingBasket size={32} className="text-white" />
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Ahorro Promedio</div>
                <div className="text-4xl font-black text-white">$15.200</div>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary-green rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              </div>
              <p className="text-white/60 text-xs font-medium leading-relaxed">
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
          <div className="flex items-center gap-0">
            <div className="w-[100px] min-[400px]:w-[130px] shrink-0 relative z-10 transition-all duration-300 -mr-2">
              <img
                src={`${import.meta.env.BASE_URL}elmango-logo.svg`}
                alt="ElMango Logo"
                className="w-full h-auto object-contain drop-shadow-md scale-[1.4] min-[400px]:scale-[1.5] origin-right"
              />
            </div>
            <div className="flex flex-col pt-1">
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Hola, <span className="text-primary-green">{user?.displayName?.split(' ')[0] || 'Roberto'}</span> 👋
            </h1>
            <p className="text-slate-500 font-medium">¿Qué productos vamos a comparar hoy?</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tu Ciudad</p>
                <p className="font-black text-slate-800">{userData?.location?.city || 'Bahía Blanca'}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Globe size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="font-black text-slate-800">Conectado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {mainActions.map((card, i) => (
            <button 
              key={i}
              onClick={() => onViewChange(card.view)}
              className="group flex items-center gap-6 p-8 bg-white hover:bg-slate-50 rounded-[40px] border border-slate-100 hover:border-slate-200 transition-all text-left shadow-sm hover:shadow-md"
            >
              <div className={`${card.color} p-5 rounded-[28px] text-white shadow-lg group-hover:scale-105 transition-transform duration-500`}>
                {React.cloneElement(card.icon as React.ReactElement<any>, { size: 32 })}
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-slate-900 text-2xl leading-tight mb-1">{card.title}</h4>
                <p className="text-slate-400 text-sm font-medium">{card.desc}</p>
              </div>
              <div className="ml-auto p-3 bg-slate-100 rounded-2xl group-hover:bg-primary-green group-hover:text-white transition-all">
                <ArrowRight size={20} />
              </div>
            </button>
          ))}
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
                  <h3 className="text-2xl font-black text-slate-800">Sucursales</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bahía Blanca</p>
               </div>
               <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                 <Store size={24} />
               </div>
            </div>
            <div className="space-y-4">
               {[1, 2, 3].map((_, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                       <MapPin size={22} />
                    </div>
                    <div className="flex-1">
                       <p className="text-lg font-black text-slate-700">Cooperativa Obrera</p>
                       <p className="text-sm text-slate-400 font-medium tracking-tight">Sucursal {60 + i} • A {1.2 + i * 0.5}km</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-primary-green text-xs font-black rounded-lg">ABIERTO</span>
                 </div>
               ))}
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
          <h3 className="font-black text-slate-900 text-xl tracking-tight mb-4 px-2">Categorías</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat, i) => (
              <button key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="font-bold text-slate-700 text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
