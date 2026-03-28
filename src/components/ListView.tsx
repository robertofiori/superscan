import React from 'react';
import { ShoppingBasket, Trash2, Plus, Minus, Share2, Calculator, ExternalLink } from 'lucide-react';
import { type ShoppingListItem } from './ShoppingList';

interface ListViewProps {
  items: ShoppingListItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onClear: () => void;
}

const ListView: React.FC<ListViewProps> = ({ items, onUpdateQuantity, onClear }) => {
  // Agrupar por supermercado
  const grouped = items.reduce((acc, item) => {
    const store = item.price.supermarket;
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const total = items.reduce((sum, item) => sum + item.price.price * item.quantity, 0);
  
  // Calcular ahorro (comparar con el siguiente precio más caro de la misma tienda si existiera, o simplemente un mock de ahorro)
  const estimatedSavings = total * 0.15; // 15% de ahorro mock por ahora

  const handleWhatsAppExport = () => {
    let message = "*Mi Lista de Compras (Optimizado por SuperScan)*\n\n";
    Object.entries(grouped).forEach(([store, storeItems]) => {
      message += `--- *${store.toUpperCase()}* ---\n`;
      let storeTotal = 0;
      storeItems.forEach(it => {
        const itemTotal = it.price.price * it.quantity;
        storeTotal += itemTotal;
        message += `• ${it.quantity}x ${it.price.productName || it.product.product_name} - $${itemTotal.toLocaleString('es-AR')}\n`;
        if (it.price.url) message += `  Ver: ${it.price.url}\n`;
      });
      message += `Subtotal: *$${storeTotal.toLocaleString('es-AR')}*\n\n`;
    });
    message += `*Total General: $${total.toLocaleString('es-AR')}*\n`;
    message += `*Ahorro Total Estimado: $${estimatedSavings.toLocaleString('es-AR')}* ✨`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800">Mi Lista</h2>
        {items.length > 0 && (
          <button onClick={onClear} className="text-red-500 font-bold text-sm flex items-center gap-1">
            <Trash2 size={16} /> Vaciar
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-[32px] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <ShoppingBasket className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">Tu lista está vacía</h3>
          <p className="text-slate-400 text-sm">Agrega productos desde el buscador para ver tu ahorro total.</p>
        </div>
      ) : (
        <>
          {/* Tarjeta de Resumen */}
          <div className="bg-primary-green text-white rounded-[32px] p-6 shadow-xl shadow-green-200/50 flex flex-col gap-4">
            <div className="flex justify-between items-center opacity-90">
              <span className="font-bold uppercase tracking-widest text-xs">Ahorro Estimado</span>
              <Calculator size={20} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">${total.toLocaleString('es-AR')}</span>
              <span className="text-sm font-bold opacity-80">Total</span>
            </div>
            <p className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold self-start border border-white/30">
              Estás ahorrando aprox. ${estimatedSavings.toLocaleString('es-AR')}
            </p>
          </div>

          {/* Listado agrupado */}
          <div className="flex flex-col gap-8">
            {Object.entries(grouped).map(([store, storeItems]) => (
              <div key={store} className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">
                  {store}
                </h3>
                {storeItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 items-center">
                    <div className="w-12 h-12 shrink-0 bg-white rounded-xl overflow-hidden p-2 flex items-center justify-center relative group">
                        <img src={item.price.imageUrl} alt={item.price.productName} className="w-full h-full object-contain" />
                        {item.price.url && (
                          <a 
                            href={item.price.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <ExternalLink size={14} className="text-white drop-shadow-md" />
                          </a>
                        )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1 leading-tight flex items-center gap-1">
                        {item.price.productName || item.product.product_name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary-green font-black mt-0.5">
                          ${(item.price.price * item.quantity).toLocaleString('es-AR')}
                        </span>
                        {item.price.url && (
                            <a 
                                href={item.price.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[9px] font-bold text-slate-400 hover:text-primary-orange flex items-center gap-0.5"
                            >
                                <ExternalLink size={8} /> Tienda
                            </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-xl px-1 py-1">
                      <button 
                         onClick={() => onUpdateQuantity(items.indexOf(item), -1)}
                         className="w-8 h-8 flex items-center justify-center text-slate-500"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-2 font-black text-sm w-6 text-center">{item.quantity}</span>
                      <button 
                         onClick={() => onUpdateQuantity(items.indexOf(item), 1)}
                         className="w-8 h-8 flex items-center justify-center text-primary-green"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <button 
            onClick={handleWhatsAppExport}
            className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-3 py-4 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Share2 size={24} />
            <span>Enviar Lista a WhatsApp</span>
          </button>
        </>
      )}
    </div>
  );
};

export default ListView;
