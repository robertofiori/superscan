import { ShoppingBag, AlertCircle, PlusCircle } from 'lucide-react';
import { type ProductData, type SupermarketPrice } from '../api';

interface ProductResultProps {
  product: ProductData;
  prices: SupermarketPrice[];
  onAddToList: (product: ProductData, bestPrice: SupermarketPrice) => void;
  onScanAnother: () => void;
}

export default function ProductResult({ product, prices, onAddToList, onScanAnother }: ProductResultProps) {
  const sortedPrices = [...prices].sort((a, b) => {
    if (!a.inStock && b.inStock) return 1;
    if (a.inStock && !b.inStock) return -1;
    return a.price - b.price;
  });
  
  const minPrice = sortedPrices.find(p => p.inStock) || sortedPrices[0];

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-[32px] p-6 shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-8">
      
      {/* Product Header */}
      <div className="flex gap-4 mb-8">
        <div className="w-24 h-24 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="w-full h-full object-contain" />
          ) : (
            <ShoppingBag className="text-slate-300" size={40} />
          )}
        </div>
        <div className="flex flex-col flex-1 pb-1">
          <h2 className="text-xl font-bold leading-tight mb-1 text-slate-800 dark:text-slate-100">
            {product.product_name || 'Producto Desconocido'}
          </h2>
          <span className="text-sm text-slate-500 font-medium mb-1">{product.brands || 'Marca no registrada'}</span>
          {product.quantity && <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md w-fit mt-auto">{product.quantity}</span>}
        </div>
      </div>

      {/* Price Comparison */}
      <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-100">Comparativa de Precios</h3>
      
      <div className="space-y-3 mb-8 md:max-h-[40vh] overflow-y-auto">
        {sortedPrices.map((p) => {
          const isBest = p.id === minPrice?.id && p.inStock;
          return (
            <div 
              key={p.id} 
              className={`flex items-center justify-between p-4 rounded-2xl border ${
                isBest ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-slate-200 dark:border-slate-800'
              } ${!p.inStock ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 dark:text-slate-200">{p.supermarket}</span>
                {!p.inStock && (
                  <span className="flex items-center gap-1 text-xs text-red-500 mt-1 font-medium">
                    <AlertCircle size={12} /> Sin stock online
                  </span>
                )}
                {isBest && p.inStock && (
                  <span className="text-xs text-primary font-bold mt-1 uppercase tracking-wider">Mejor opción</span>
                )}
              </div>
              <div className="text-right">
                <span className={`text-xl font-black ${isBest ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>
                  ${p.price.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {minPrice && minPrice.inStock && (
          <button 
            onClick={() => onAddToList(product, minPrice)}
            className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 shadow-lg font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <PlusCircle size={22} />
            <span>Agregar la mejor opción</span>
          </button>
        )}
        <button 
          onClick={onScanAnother}
          className="w-full bg-transparent border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl transition-colors"
        >
          Escanear otro producto
        </button>
      </div>

    </div>
  );
}
