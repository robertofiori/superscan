import React, { useState, useMemo } from 'react';
import { ShoppingBag, AlertCircle, Plus, Zap, ExternalLink, ArrowUpDown } from 'lucide-react';
import { type ProductData, type SupermarketPrice } from '../api';

interface ResultsViewProps {
  product: ProductData;
  prices: SupermarketPrice[];
  onAddToList: (product: ProductData, bestPrice: SupermarketPrice, allPrices: SupermarketPrice[]) => void;
  onBack: () => void;
}

type SortOption = 'price' | 'size';

// Helper to extract size from product name (e.g., "1.5L", "500g", "250cc")
const parseSize = (name: string): number => {
  const normalized = name.toLowerCase();
  // Regex for common units: L, ml, kg, g, cc, cm3
  const match = normalized.match(/(\d+[.,]?\d*)\s*(l|ml|kg|g|cc|cm3|mt|u)/);
  if (!match) return 0;

  let value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2];

  // Normalize to common base (ml or g)
  if (unit === 'l' || unit === 'kg') value *= 1000;
  
  return value;
};

const ResultsView: React.FC<ResultsViewProps> = ({ product, prices, onAddToList, onBack }) => {
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [showOnlyOffers, setShowOnlyOffers] = useState(false);

  const queryName = product.product_name?.replace('Búsqueda: ', '') || 'Producto';

  const processedPrices = useMemo(() => {
    let result = [...prices];

    // Filter by offers if enabled
    if (showOnlyOffers) {
      result = result.filter(p => p.isOffer);
    }

    // Sort logic
    result.sort((a, b) => {
      // Always keep stock items first
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;

      if (sortBy === 'price') {
        return a.price - b.price;
      } else {
        const sizeA = parseSize(a.productName || '');
        const sizeB = parseSize(b.productName || '');
        
        // If sizes are equal or not found, fallback to price
        if (sizeA === sizeB) return a.price - b.price;
        return sizeB - sizeA; // Sort larger sizes first
      }
    });

    return result;
  }, [prices, sortBy, showOnlyOffers]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header section */}
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-800 leading-tight">
          Resultados para <span className="text-primary-green">"{queryName}"</span>
        </h2>
      </div>

      {/* Control Bar - Mobile Optimized */}
      <div className="flex flex-col gap-3 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md py-2 -mx-4 px-4 border-b border-slate-200/50">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Sort Segmented Control */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setSortBy('price')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs transition-all ${
                sortBy === 'price' 
                ? 'bg-white text-primary-green shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 italic'
              }`}
            >
              <ArrowUpDown size={14} /> Menor Precio
            </button>
            <button
              onClick={() => setSortBy('size')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs transition-all ${
                sortBy === 'size' 
                ? 'bg-white text-primary-green shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 italic'
              }`}
            >
              <ShoppingBag size={14} /> Más Grande
            </button>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 shrink-0 mx-1" />

          {/* Filter Toggle */}
          <button
            onClick={() => setShowOnlyOffers(!showOnlyOffers)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs whitespace-nowrap transition-all border-2 ${
              showOnlyOffers 
              ? 'bg-primary-orange border-primary-orange text-white shadow-lg shadow-orange-200 scale-105' 
              : 'bg-white border-slate-100 text-slate-600 shadow-sm'
            }`}
          >
            <Zap size={14} className={showOnlyOffers ? 'fill-current' : ''} />
            SÓLO OFERTAS
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedPrices.length > 0 ? (
          processedPrices.map((p, index) => {
            const isBestPrice = index === 0 && p.inStock && p.price > 0 && !showOnlyOffers;
            
            return (
              <div 
                key={`${p.id}-${p.url}`} 
                className={`group bg-white rounded-3xl p-5 shadow-sm border-2 transition-all flex flex-col relative overflow-hidden active:scale-[0.98] ${
                  !p.inStock ? 'opacity-60 grayscale border-transparent' : 
                  p.isOffer ? 'border-primary-orange/20 bg-orange-50/5' : 
                  isBestPrice ? 'border-primary-green/30 shadow-green-100 shadow-xl' : 'border-slate-100'
                }`}
              >
                {/* Image Section - Large & Centered */}
                <div className="w-full h-48 mb-4 bg-white rounded-2xl overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <ShoppingBag className="text-slate-200" size={64} />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary-green bg-white/95 backdrop-blur shadow-sm px-3 py-1 rounded-full border border-green-100/50">
                      {p.supermarket}
                    </span>
                    {p.isOffer && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-white bg-primary-orange px-3 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                        <Zap size={10} className="fill-current" /> OFERTA
                      </span>
                    )}
                  </div>

                  {isBestPrice && (
                    <div className="absolute top-0 right-4 bg-primary-green text-white text-[10px] font-black px-4 py-1.5 rounded-b-xl shadow-lg z-10">
                      MEJOR PRECIO
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-tight mb-4 min-h-[3rem]">
                    {p.productName || queryName}
                  </h3>
                  
                  <div className="flex flex-col gap-3 mt-auto">
                    {/* Price Info */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900">${p.price.toLocaleString('es-AR')}</span>
                                {p.originalPrice && p.originalPrice > p.price && (
                                    <span className="text-sm text-slate-400 line-through font-medium">${p.originalPrice.toLocaleString('es-AR')}</span>
                                )}
                            </div>
                            {p.isOffer && p.originalPrice && p.originalPrice > p.price && (
                               <span className="text-[11px] font-bold text-primary-orange flex items-center gap-1">
                                 Ahorrás ${(p.originalPrice - p.price).toLocaleString('es-AR')}
                               </span>
                            )}
                        </div>

                        {/* Add Button - Large Target */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (p.inStock) {
                                  // Filtrar precios similares para este producto específico
                                  // Queremos comparar LO MISMO en otros supers
                                  const relevantPrices = prices.filter(other => {
                                    const sameBrand = other.brand?.toLowerCase() === p.brand?.toLowerCase();
                                    const similarName = other.productName?.toLowerCase().includes(p.productName?.split(' ')[0].toLowerCase() || '');
                                    return sameBrand || similarName;
                                  });
                                  onAddToList(product, p, relevantPrices);
                                }
                            }}
                            disabled={!p.inStock}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg shrink-0 ${
                                p.inStock 
                                ? 'bg-primary-green hover:bg-green-600 text-white active:scale-90 shadow-green-100' 
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            <Plus size={32} />
                        </button>
                    </div>

                    {/* External Link */}
                    {p.url && (
                        <a 
                            href={p.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-slate-50 py-3 rounded-xl text-[11px] font-black text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors uppercase tracking-widest border border-slate-100"
                        >
                            Ver en tienda externa <ExternalLink size={12} />
                        </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-slate-300" size={40} />
            </div>
            <h4 className="text-slate-800 font-black text-xl mb-2">Sin resultados</h4>
            <p className="text-slate-500 font-medium px-8">No encontramos lo que buscas con los filtros actuales.</p>
            <div className="flex flex-col gap-2 mt-6 w-full px-8">
              <button 
                onClick={() => {
                    setShowOnlyOffers(false);
                    setSortBy('price');
                }}
                className="bg-primary-green/10 text-primary-green w-full py-4 rounded-2xl font-black text-sm hover:bg-primary-green hover:text-white transition-all"
              >
                REINICIAR FILTROS
              </button>
              <button 
                onClick={onBack}
                className="text-slate-400 font-bold text-sm py-2 hover:text-slate-600 transition-colors"
              >
                VOLVER A BUSCAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsView;

