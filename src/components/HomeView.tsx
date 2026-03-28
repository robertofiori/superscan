import React, { useEffect, useState } from 'react';
import { Camera, Zap, ArrowRight, ShoppingBag } from 'lucide-react';
import AutocompleteSearch from './AutocompleteSearch';
import { fetchDailyOffers, type SupermarketPrice } from '../api';

interface HomeViewProps {
  onSearch: (query: string) => void;
  onScan: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onSearch, onScan }) => {
  const [offers, setOffers] = useState<SupermarketPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      setLoading(true);
      const data = await fetchDailyOffers();
      setOffers(data);
      setLoading(false);
    }
    loadOffers();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Buscador Central */}
      <section className="bg-surface rounded-[32px] p-6 shadow-xl border border-slate-100 flex flex-col gap-6 items-center text-center mt-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-800 leading-tight">
            ¡Ahorra en tu compra <span className="text-primary-green italic underline decoration-wavy decoration-green-100 underline-offset-4">realmente</span>!
        </h2>
        <p className="text-slate-500 text-sm max-w-[280px]">Ingresa el nombre del producto o su código de barras.</p>
        
        <AutocompleteSearch onSearch={onSearch} />

        <div className="flex items-center w-full gap-4 text-slate-300">
          <div className="h-[1px] bg-slate-200 flex-1"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">O usa tu cámara</span>
          <div className="h-[1px] bg-slate-200 flex-1"></div>
        </div>

        <button 
          onClick={onScan}
          className="w-full bg-slate-900 hover:bg-black text-white font-black flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl transition-all active:scale-95 group"
        >
          <Camera size={24} className="group-hover:rotate-12 transition-transform" />
          <span>Escanear Producto</span>
        </button>
      </section>

      {/* Ofertas del Día */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Zap size={22} className="text-primary-orange fill-primary-orange" />
            Ofertas del día
          </h3>
          <button className="text-primary-green font-extrabold text-sm flex items-center gap-1 hover:underline">
            Ver todas <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 mask-fade-right">
          {loading ? (
             // Skeleton Loaders
             [1, 2, 3].map((i) => (
                <div key={i} className="min-w-[200px] bg-white rounded-[28px] p-4 shadow-sm border border-slate-100 animate-pulse">
                    <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4" />
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
             ))
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <OfferCard 
                key={offer.id + offer.productName}
                offer={offer}
                onClick={onSearch}
              />
            ))
          ) : (
            <div className="w-full text-center py-8 text-slate-400 font-medium italic">
                No hay ofertas disponibles en este momento.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const OfferCard = ({ offer, onClick }: { offer: SupermarketPrice, onClick: (q: string) => void }) => {
  const discountAmount = offer.originalPrice && offer.originalPrice > offer.price 
    ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100) 
    : null;

  return (
    <div 
      onClick={() => onClick(offer.productName || '')}
      className="min-w-[200px] md:min-w-[240px] bg-white rounded-[32px] p-5 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col gap-3 relative transition-all active:scale-95 group cursor-pointer"
    >
      {discountAmount && (
        <span className="absolute top-4 right-4 bg-primary-orange text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg z-10 animate-in zoom-in duration-500">
          {discountAmount}% OFF
        </span>
      )}
      
      <div className="w-full h-32 bg-white rounded-2xl mb-1 flex items-center justify-center overflow-hidden">
        {offer.imageUrl ? (
            <img 
                src={offer.imageUrl} 
                alt={offer.productName} 
                className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" 
            />
        ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                <ShoppingBag size={48} />
            </div>
        )}
      </div>

      <div className="flex flex-col gap-1 min-h-[44px]">
        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-primary-green transition-colors">
            {offer.productName}
        </h4>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {offer.supermarket}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-auto pt-2 border-t border-slate-50">
        <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900">${offer.price.toLocaleString('es-AR')}</span>
            {offer.originalPrice && offer.originalPrice > offer.price && (
                <span className="text-[11px] text-slate-400 line-through font-bold">
                    ${offer.originalPrice.toLocaleString('es-AR')}
                </span>
            )}
        </div>
        <div className="w-10 h-10 rounded-2xl bg-primary-green/10 flex items-center justify-center text-primary-green group-hover:bg-primary-green group-hover:text-white transition-all shadow-sm">
            <ArrowRight size={18} />
        </div>
      </div>
    </div>
  );
};

export default HomeView;

