import { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles, AlertCircle, Plus } from 'lucide-react';
import { fetchDailyOffers, type SupermarketPrice, type ProductData } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { getApplicableDiscount } from '../data/bankDiscounts';

interface OffersViewProps {
  onAddToList: (product: ProductData, bestPrice: SupermarketPrice, allPrices: SupermarketPrice[]) => void;
}

export default function OffersView({ onAddToList }: OffersViewProps) {
  const { userData } = useAuth();
  const [offers, setOffers] = useState<SupermarketPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadOpts = async () => {
      // Si no tenemos userData aún, no disparamos la carga de ofertas
      // para evitar pedir el 'default' erróneamente
      if (!userData?.location) return;

      setLoading(true);
      const data = await fetchDailyOffers(userData.location);
      if (active) {
        setOffers(data);
        setLoading(false);
      }
    };
    loadOpts();
    return () => { active = false; };
  }, [userData?.location]);

  const handleAdd = (priceItem: SupermarketPrice) => {
    // Buscar precios del mismo producto en otras tiendas dentro de las ofertas actuales
    const relevantPrices = offers.filter(o => 
      o.brand?.toLowerCase() === priceItem.brand?.toLowerCase() &&
      o.productName?.toLowerCase().includes(priceItem.productName?.split(' ')[0].toLowerCase() || '')
    );

    const prod: ProductData = {
      code: priceItem.ean || `offer-${priceItem.id}`,
      product_name: priceItem.productName,
      brands: priceItem.brand,
      image_url: priceItem.imageUrl,
    };
    
    // Asegurarnos de que el precio actual esté incluido en relevantPrices
    if (!relevantPrices.find(p => p.id === priceItem.id)) {
      relevantPrices.push(priceItem);
    }

    onAddToList(prod, priceItem, relevantPrices);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 h-full">
        <div className="relative bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center overflow-hidden">
             <div className="w-16 h-16 bg-slate-200 rounded-2xl animate-pulse mb-4"></div>
             <div className="w-48 h-6 bg-slate-200 rounded-full animate-pulse mb-2"></div>
             <div className="w-64 h-4 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
             <div key={i} className="bg-white rounded-[24px] p-4 flex flex-col shadow-sm border border-slate-100 h-[260px]">
               <div className="w-12 h-4 bg-slate-200 rounded-full animate-pulse mb-4 self-end"></div>
               <div className="h-28 w-full bg-slate-100 rounded-xl animate-pulse mb-3"></div>
               <div className="w-1/2 h-3 bg-slate-200 rounded-full animate-pulse mb-2"></div>
               <div className="w-full h-4 bg-slate-200 rounded-full animate-pulse mb-1"></div>
               <div className="w-2/3 h-4 bg-slate-200 rounded-full animate-pulse mb-4"></div>
               <div className="mt-auto flex flex-col gap-1">
                 <div className="w-12 h-3 bg-slate-200 rounded-full animate-pulse"></div>
                 <div className="w-20 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                 <div className="w-full h-8 bg-slate-100 rounded-xl animate-pulse mt-2"></div>
               </div>
             </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 h-full">
      {/* Header */}
      <div className="relative bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-100/40 to-primary-green/10 -z-10"></div>
        
        <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-yellow-900 shadow-lg mb-4 rotate-3">
          <Sparkles size={32} />
        </div>

        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
          Ofertas del Día
        </h2>
        <p className="text-sm text-slate-500 font-medium px-4">
          Encontramos estos productos con descuentos exclusivos reales hoy.
        </p>
      </div>

      {/* Grid de Ofertas */}
      {offers.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-[32px] shadow-lg border border-slate-100">
          <AlertCircle className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-600 font-bold leading-relaxed">No encontramos ofertas hoy.</p>
          <p className="text-slate-500 text-sm mt-2">Vuelve más tarde para ver nuevos descuentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {offers.map((offer, idx) => {
            const discountInfo = getApplicableDiscount(offer.supermarket, userData?.paymentMethods || []);
            const effectivePrice = discountInfo 
              ? offer.price * (1 - discountInfo.discount)
              : offer.price;

            return (
              <div 
                key={`${offer.id}-${idx}`}
                className="bg-white rounded-[24px] p-4 flex flex-col shadow-lg border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all"
              >
              {/* Etiqueta Oferta */}
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm z-10">
                OFERTA
              </div>

              {/* Supermercado Badge */}
              <div className="absolute top-3 left-3 bg-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-full z-10 border border-slate-200">
                {offer.supermarket}
              </div>
              
              {/* Imagen */}
              <div className="h-28 w-full bg-white flex items-center justify-center mb-3 mt-4 relative">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.productName} className="h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <ShoppingBag className="text-slate-200" size={32} />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 truncate">{offer.brand || 'Varias'}</span>
                <h3 className="font-bold text-slate-800 text-xs leading-tight line-clamp-2 mb-2 min-h-[32px]">
                  {offer.productName || 'Producto Desconocido'}
                </h3>
                
                <div className="mt-auto">
                  {offer.originalPrice && offer.originalPrice > offer.price && (
                    <span className="text-[10px] text-slate-400 line-through font-bold block leading-none mb-0.5">
                      ${offer.originalPrice.toLocaleString('es-AR')}
                    </span>
                  )}
                  <span className="text-lg font-black text-primary-green block leading-none">
                    ${offer.price.toLocaleString('es-AR')}
                  </span>
                  {offer.pricePerUnit && offer.unitType && (
                    <span className="text-[9px] text-slate-500 font-bold mt-1 block">
                      ${offer.pricePerUnit.toLocaleString('es-AR', {maximumFractionDigits: 0})} / {offer.unitType}
                    </span>
                  )}

                  {/* Effective Price with Bank Discount */}
                  {discountInfo && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-[9px] font-black text-primary-green uppercase">
                        {discountInfo.name} -{(discountInfo.discount * 100).toFixed(0)}%
                      </div>
                      <span className="text-xs font-black text-slate-900 block">
                        Final: ${effectivePrice.toLocaleString('es-AR', {maximumFractionDigits: 0})}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add button */}
              <button 
                onClick={() => handleAdd(offer)}
                className="mt-3 w-full bg-slate-900 text-white flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold active:scale-95 transition-all shadow-md"
              >
                <Plus size={14} /> Agregar
              </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
