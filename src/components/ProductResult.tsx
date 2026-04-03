import { useState } from 'react';
import { ShoppingBag, AlertCircle, ExternalLink, Search, ArrowDownUp, Tag } from 'lucide-react';
import { type ProductData, type SupermarketPrice } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { getApplicableDiscount } from '../data/bankDiscounts';

interface ProductResultProps {
  product: ProductData;
  prices: SupermarketPrice[];
  onAddToList: (product: ProductData, bestPrice: SupermarketPrice) => void;
  onScanAnother: () => void;
}


export default function ProductResult({ product, prices, onAddToList, onScanAnother }: ProductResultProps) {
  const { userData } = useAuth();
  const [sortBy, setSortBy] = useState<'price' | 'unitPrice'>('unitPrice');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [onlyOffers, setOnlyOffers] = useState(false);

  const sortedPrices = [...prices]
    .filter(p => !onlyOffers || p.isOffer)
    .sort((a, b) => {
    if (!a.inStock && b.inStock) return 1;
    if (a.inStock && !b.inStock) return -1;
    
    let comparison = 0;
    if (sortBy === 'unitPrice') {
      // If both have unit prices, compare them
      if (a.pricePerUnit != null && b.pricePerUnit != null && a.unitType === b.unitType) {
        comparison = a.pricePerUnit - b.pricePerUnit;
      } else {
        // Fallback to absolute price if units don't match or are missing
        comparison = a.price - b.price;
      }
    } else {
      comparison = a.price - b.price;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // The truly "Best Option" is the one with lowest unit price if available
  const bestValueItem = [...prices]
    .filter(p => p.inStock && p.price > 0 && p.pricePerUnit != null)
    .sort((a, b) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0))[0];

  const minPrice = sortedPrices.find(p => p.inStock) || sortedPrices[0];
  const queryName = product.product_name?.replace('Búsqueda: ', '') || 'Producto Desconocido';

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-[32px] p-6 shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-8">
      
      {/* Header */}
      <div className="flex gap-4 mb-6 bg-primary/5 p-4 rounded-2xl items-center border border-primary/10">
        <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Search size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Mejores Ofertas para</span>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
            {queryName}
          </h2>
        </div>
      </div>
      
      {prices.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1">
            <ArrowDownUp size={12} /> Ordenar:
          </span>
          
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <button 
              onClick={() => {
                if (sortBy === 'unitPrice') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('unitPrice');
                  setSortOrder('asc');
                }
              }}
              className={`px-3 py-1.5 text-[11px] font-bold transition-colors flex items-center gap-1 min-w-[90px] justify-center ${sortBy === 'unitPrice' ? 'bg-primary text-white shadow-inner' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Rinde Más {sortBy === 'unitPrice' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <button 
              onClick={() => {
                if (sortBy === 'price') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('price');
                  setSortOrder('asc');
                }
              }}
              className={`px-3 py-1.5 text-[11px] font-bold transition-colors flex items-center gap-1 min-w-[80px] justify-center ${sortBy === 'price' ? 'bg-primary text-white shadow-inner' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Precio {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <button
            onClick={() => setOnlyOffers(!onlyOffers)}
            className={`ml-auto px-3 py-1.5 text-[11px] font-bold transition-all flex items-center gap-1.5 rounded-xl border ${
              onlyOffers 
                ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
            }`}
          >
            <Tag size={12} className={onlyOffers ? 'fill-yellow-900' : ''} />
            Sólo Ofertas
          </button>
        </div>
      )}
      
      <div className="space-y-3 mb-6 lg:max-h-[50vh] overflow-y-auto pr-1">
        {sortedPrices.length > 0 ? (
          sortedPrices.map((p) => {
            const discountInfo = getApplicableDiscount(p.supermarket, userData?.paymentMethods || []);
            const effectivePrice = discountInfo 
              ? p.price * (1 - discountInfo.discount)
              : p.price;
            
            const isBest = p.id === minPrice?.id && p.inStock && p.price === minPrice.price;
            return (
              <div 
                key={`${p.id}-${p.url}`} 
                className={`flex items-start justify-between p-4 rounded-2xl border ${
                  isBest ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                } ${!p.inStock ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex flex-col gap-2 flex-1 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-md text-slate-600 dark:text-slate-300">
                      {p.supermarket}
                    </span>
                    {p.id === bestValueItem?.id && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                         🌟 Rinde Más
                      </span>
                    )}
                    {isBest && p.id !== bestValueItem?.id && (
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-primary/20">💰 Más Barato</span>
                    )}
                    {!p.inStock && (
                       <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                         <AlertCircle size={10} /> Sin stock
                       </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <div className="w-14 h-14 shrink-0 bg-white rounded-xl border border-slate-100 overflow-hidden p-1 shadow-sm">
                        <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 shrink-0 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="text-slate-300" size={24} />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-[13px] leading-tight line-clamp-2">{p.productName || queryName}</span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 uppercase tracking-wide">{p.brand || 'Varias Marcas'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-[80px]">
                  {p.price > 0 ? (
                    <>
                      {p.isOffer && p.originalPrice ? (
                        <div className="flex flex-col items-end leading-none">
                          <span className="text-[10px] text-slate-400 line-through font-bold">${p.originalPrice.toLocaleString('es-AR')}</span>
                          <span className={`text-xl font-black ${isBest ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>
                            ${p.price.toLocaleString('es-AR')}
                          </span>
                          <span className="bg-yellow-400 text-yellow-900 text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-0.5 shadow-sm">Oferta</span>
                        </div>
                      ) : (
                        <span className={`text-xl font-black mt-1 ${isBest ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>
                          ${p.price.toLocaleString('es-AR')}
                        </span>
                      )}
                      
                      {p.pricePerUnit && p.unitType && (
                        <div className="flex flex-col items-end mt-0.5">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                            ${p.pricePerUnit.toLocaleString('es-AR', {maximumFractionDigits: 0})} / {p.unitType}
                          </span>
                        </div>
                      )}

                      {/* Info de Descuento Bancario */}
                      {discountInfo && (
                        <div className="mt-1 flex flex-col items-end">
                          <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-[9px] font-black text-primary">
                            {discountInfo.name} -{(discountInfo.discount * 100).toFixed(0)}%
                          </div>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Pagas: ${effectivePrice.toLocaleString('es-AR', {maximumFractionDigits: 0})}
                          </span>
                        </div>
                      )}
                      
                      {p.inStock && (
                        <button 
                          onClick={() => onAddToList(product, p)} 
                          className={`mt-1 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all ${
                            isBest 
                            ? 'bg-primary hover:bg-violet-600 text-white shadow-md shadow-primary/20' 
                            : 'bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 shadow-sm'
                          }`}
                        >
                          Agregar
                        </button>
                      )}
                      
                      {p.url && (
                        <a 
                          href={p.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors mt-1"
                        >
                          Ver web <ExternalLink size={10} /> 
                        </a>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-2">
                      Agotado
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <AlertCircle className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={40} />
            <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
              No encontramos ofertas para "{queryName}".
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
              Verificá en la tienda física de tu supermercado habitual.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={onScanAnother}
          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-2xl transition-colors text-center"
        >
          Nueva Búsqueda
        </button>
      </div>

    </div>
  );
}
