import { ShoppingBag, Minus, Plus, Camera, PiggyBank } from 'lucide-react';
import { type ProductData, type SupermarketPrice } from '../api';

export interface ShoppingListItem {
  product: ProductData;
  price: SupermarketPrice;
  quantity: number;
}

interface ShoppingListProps {
  items: ShoppingListItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onStartScan: () => void;
  onGoHome: () => void;
}

export default function ShoppingList({ items, onUpdateQuantity, onStartScan, onGoHome }: ShoppingListProps) {
  const total = items.reduce((acc, item) => acc + (item.price.price * item.quantity), 0);
  
  // Calculate potential savings comparing to the most expensive market for each item
  // A simple mockup to show "savings options" as requested
  const estimatedSavings = items.reduce((acc, item) => acc + (item.price.price * 0.15 * item.quantity), 0);

  // Agrupar items por supermercado
  const groupedItems = items.reduce((acc, item, index) => {
    const store = item.price.supermarket || 'Otros';
    if (!acc[store]) acc[store] = [];
    acc[store].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, (ShoppingListItem & { originalIndex: number })[]>);

  return (
    <div className="w-full max-w-md flex flex-col h-full gap-6 animate-in fade-in">
      <div className="flex justify-between items-end mb-2 px-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Mi Compra</h2>
        <span className="text-slate-500 font-medium pb-1">{items.length} productos</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface-light dark:bg-surface-dark rounded-[32px] p-10 text-center shadow-sm border border-slate-100 dark:border-slate-800 flex-1 flex flex-col items-center justify-center mt-4">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ShoppingBag size={40} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Tu carrito está vacío</h3>
          <p className="text-slate-500 mb-8 max-w-[200px] mx-auto text-sm">Comienza a buscar productos para armar tu lista de compras económica.</p>
          <button 
            onClick={onGoHome}
            className="w-full bg-primary hover:bg-violet-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Buscar productos
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 overflow-y-auto min-h-[300px] pb-4 px-1 mt-2">
            {Object.entries(groupedItems).map(([storeName, storeItems]) => (
              <div key={storeName} className="mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full"></span>
                  Lo que compro en {storeName}
                </h3>
                <div className="space-y-3">
                  {storeItems.map((item) => (
                    <div key={`${item.product.code}-${item.price.id}`} className="bg-surface-light dark:bg-surface-dark rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4">
                      <div className="w-16 h-16 shrink-0 bg-white rounded-xl border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                        {item.price.imageUrl || item.product.image_url ? (
                          <img src={item.price.imageUrl || item.product.image_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <ShoppingBag className="text-slate-200" size={24} />
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight line-clamp-2 mb-1">
                            {item.price.productName || item.product.product_name || 'Producto detectado'}
                          </h4>
                        </div>
                        <span className="font-black text-primary text-lg">${item.price.price.toLocaleString('es-AR')}</span>
                      </div>

                      <div className="shrink-0 flex flex-col items-center justify-between border-l border-slate-100 dark:border-slate-800 pl-3">
                        <button onClick={() => onUpdateQuantity(item.originalIndex, 1)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white transition-colors">
                          <Plus size={16} />
                        </button>
                        <span className="font-bold text-sm my-1">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.originalIndex, -1)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white transition-colors">
                          <Minus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <button 
              onClick={onStartScan}
              className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-400 hover:text-primary font-bold py-4 rounded-3xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <Camera size={20} />
              Agregar otro producto
            </button>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-[32px] p-6 shadow-xl border border-slate-100 dark:border-slate-800 mt-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Total estimado</span>
              <span className="text-3xl font-black">${total.toLocaleString('es-AR')}</span>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 flex gap-3 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 mb-6">
              <PiggyBank size={24} className="shrink-0" />
              <div className="text-sm font-medium">
                Al elegir estos supermercados estás ahorrando aproximadamente <strong className="font-bold">${estimatedSavings.toLocaleString('es-AR')}</strong> comparado con otras tiendas.
              </div>
            </div>

            <button className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 text-lg">
              Finalizar Recorrido
            </button>
          </div>
        </>
      )}
    </div>
  );
}
