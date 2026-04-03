import React from 'react';
import { ShoppingBasket, Trash2, Calculator, Search, ArrowRight } from 'lucide-react';
import { type ShoppingListItem } from '../api';

interface SidebarListProps {
  items: ShoppingListItem[];
  onRemoveItem: (id: string) => void;
  onClearList: () => void;
  onViewFullList: () => void;
}

export const SidebarList: React.FC<SidebarListProps> = ({ 
  items, 
  onRemoveItem, 
  onClearList,
  onViewFullList 
}) => {
  const total = items.reduce((sum, item) => sum + (item.price.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white relative z-20">
      {/* Header */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-green/10 flex items-center justify-center text-primary-green">
              <ShoppingBasket size={20} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-lg leading-tight tracking-tight">Mi Lista</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button 
              onClick={onClearList}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Vaciar lista"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 m-2">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-slate-100">
              <Search size={24} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-[160px]">
              Tu lista está vacía. ¡Busca productos para empezar!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="group p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex items-center gap-3 relative overflow-hidden"
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img 
                    src={item.price.imageUrl || item.product.image_url} 
                    alt={item.price.productName || item.product.product_name} 
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-green text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.quantity}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-700 text-xs line-clamp-1 leading-tight mb-0.5">
                    {item.price.productName || item.product.product_name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-fuchsia-600 font-black text-sm">
                      ${Math.round(item.price.price * item.quantity).toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      @ {item.price.supermarket}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => onRemoveItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1.5 bg-white shadow-sm border border-slate-100 text-slate-300 hover:text-red-500 rounded-lg transition-all transform translate-x-2 group-hover:translate-x-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Summary */}
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <div className="flex flex-col gap-4">
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200/60">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Estimado</span>
              <div className="flex items-center gap-1 text-primary-green">
                <Calculator size={12} />
                <span className="text-[10px] font-black uppercase">Calculado</span>
              </div>
            </div>
            <div className="text-3xl font-black text-purple-900 tracking-tight">
              ${Math.round(total).toLocaleString('es-AR')}
            </div>
          </div>

          <button 
            onClick={onViewFullList}
            className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            <span>VER LISTA COMPLETA</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
