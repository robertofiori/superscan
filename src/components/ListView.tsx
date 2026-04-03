import React from 'react';
import { 
  ShoppingBasket, Trash2, Plus, Minus, Share2, 
  ExternalLink, Download, Sparkles, 
  TrendingDown, Store, Save, Bookmark, Edit2, X, ChevronRight
} from 'lucide-react';
import { type ShoppingListItem, type SupermarketPrice } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { getApplicableDiscount } from '../data/bankDiscounts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateOptimization } from '../utils/basketOptimizer';
import { type SavedList } from '../services/listService';
import { useState } from 'react';

interface ListViewProps {
  items: ShoppingListItem[];
  savedLists: SavedList[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdatePrice: (id: string, newPrice: SupermarketPrice) => void;
  onClear: () => void;
  onSaveNamedList: (name: string) => Promise<void>;
  onDeleteNamedList: (listId: string) => Promise<void>;
  onRenameNamedList: (listId: string, newName: string) => Promise<void>;
  onLoadNamedList: (list: SavedList) => void;
}

const ListView: React.FC<ListViewProps> = ({ 
  items, 
  savedLists,
  onUpdateQuantity, 
  onUpdatePrice, 
  onClear,
  onSaveNamedList,
  onDeleteNamedList,
  onRenameNamedList,
  onLoadNamedList
}) => {
  const { userData } = useAuth();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Robust check for DIA chain matches api.ts
  const isDiaChain = (name: string) => {
    if (!name) return false;
    const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalized.includes('dia');
  };

  const filteredItems = items.filter(it => !isDiaChain(it.price.supermarket));
  const optimization = calculateOptimization(filteredItems, userData?.paymentMethods || []);
  
  // Group by supermarket
  const grouped = filteredItems.reduce((acc, item) => {
    const store = item.price.supermarket;
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const total = filteredItems.reduce((sum, item) => sum + item.price.price * item.quantity, 0);
  const potentialSavings = total - optimization.theoreticalMin;

  const handleWhatsAppExport = () => {
    let message = "*Mi Lista de Compras en ElMango 🥭*\n\n";
    Object.entries(grouped).forEach(([store, storeItems]) => {
      message += `🛒 *${store.toUpperCase()}*\n`;
      let storeTotal = 0;
      storeItems.forEach(it => {
        const itemTotal = it.price.price * it.quantity;
        storeTotal += itemTotal;
        message += `• ${it.quantity}x ${it.price.productName || it.product.product_name} - $${itemTotal.toLocaleString('es-AR')}\n`;
      });
      message += `Subtotal: *$${storeTotal.toLocaleString('es-AR')}*\n\n`;
    });
    message += `💰 *Total General: $${total.toLocaleString('es-AR')}*\n`;
    message += `✨ *Ahorro Total Posible: $${potentialSavings.toLocaleString('es-AR')}*`;
    message += `\n\nOptimizado con ElMango 🥭 - Bahía Blanca`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePDFExport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94); // primary-green
    doc.text('ElMango', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Tu lista de compras optimizada - Bahía Blanca', 14, 26);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 20);

    let currentY = 35;

    Object.entries(grouped).forEach(([store, storeItems]) => {
      // Check if we need a new page for the store title
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Store Title
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(store.toUpperCase(), 14, currentY);
      currentY += 5;

      const storeTableData = storeItems.map(item => [
        String(item.price.productName || item.product.product_name || 'Producto'),
        String(item.quantity || 1),
        `$${(item.price.price || 0).toLocaleString('es-AR')}`,
        String(item.price.supermarket || 'Distribuidora'),
        `$${((item.price.price || 0) * (item.quantity || 1)).toLocaleString('es-AR')}`
      ]);

      const storeTotal = storeItems.reduce((sum, item) => sum + item.price.price * item.quantity, 0);

      autoTable(doc, {
        startY: currentY,
        head: [['Producto', 'Cant.', 'P. Unit', 'Supermercado', 'Subtotal']],
        body: storeTableData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
        foot: [[
          { content: `SUBTOTAL ${store.toUpperCase()}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `$${storeTotal.toLocaleString('es-AR')}`, styles: { fontStyle: 'bold' } }
        ]],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    // Final Summary
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('RESUMEN DE AHORRO', 14, currentY);
    currentY += 8;

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL GENERAL: $${total.toLocaleString('es-AR')}`, 14, currentY);
    currentY += 7;
    doc.setTextColor(34, 197, 94);
    doc.text(`Ahorro Extra Posible (si dividís la compra): $${potentialSavings.toLocaleString('es-AR')}`, 14, currentY);
    
    // Explicitly set type to application/pdf for blob creation
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
    
    // Create download link
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `Lista-ElMango-${dateStr}.pdf`;
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }, 100);
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
          {/* Optimization Strategy Switcher */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-green opacity-20 blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-green">Estrategia de Ahorro</span>
                        <Sparkles size={18} className="text-primary-green" />
                    </div>
                    <div>
                        <span className="text-3xl font-black">${total.toLocaleString('es-AR')}</span>
                        <p className="text-xs font-bold text-slate-400 mt-1">Total actual de tu canasta</p>
                    </div>
                    
                    {potentialSavings > 0 && (
                        <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-white/10">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-primary-green flex items-center gap-1 uppercase tracking-tighter">
                                    <TrendingDown size={14} /> Máximo Ahorro Posible
                                </span>
                                <span className="text-lg font-black text-white">
                                    ¡Ganás ${potentialSavings.toLocaleString('es-AR')}!
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-slate-400 block">Total Optimizado</span>
                                <span className="text-sm font-black text-primary-green">${optimization.theoreticalMin.toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison by Supermarket Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                {optimization.totalsPerSupermarket.map((sm, idx) => (
                    <div 
                        key={idx}
                        className={`min-w-[240px] bg-white rounded-3xl p-5 border-2 shadow-sm transition-all shrink-0 ${
                            sm.supermarket === optimization.bestSupermarket?.supermarket ? 'border-primary-green/30 bg-green-50/5' : 'border-slate-100 opacity-80'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${sm.supermarket === optimization.bestSupermarket?.supermarket ? 'bg-primary-green/10 text-primary-green' : 'bg-slate-100 text-slate-500'}`}>
                                    <Store size={16} />
                                </div>
                                <span className="font-black text-sm uppercase tracking-tight truncate max-w-[120px]">{sm.supermarket}</span>
                            </div>
                            {sm.supermarket === optimization.bestSupermarket?.supermarket && (
                                <span className="bg-primary-green text-white text-[8px] font-black px-2 py-1 rounded-full">RECOMENDADO</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-slate-400 font-bold italic truncate">Todo en este lugar:</span>
                            <span className="text-xl font-black text-slate-800">${sm.total.toLocaleString('es-AR')}</span>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] font-bold text-slate-500 italic">
                                    {sm.itemCount} de {items.length} productos
                                </span>
                                {sm.savingsVsCurrent > 0 && (
                                    <span className="text-[10px] font-black text-primary-green italic">
                                        -{((sm.savingsVsCurrent / total) * 100).toFixed(0)}% OFF
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Listado agrupado */}
          <div className="flex flex-col gap-8">
            {Object.entries(grouped).map(([store, storeItems]) => (
              <div key={store} className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">
                  {store}
                </h3>
                {storeItems.map((item, idx) => {
                  const betterPrice = (item.allPrices || [])
                    .filter(p => p.inStock && p.price > 0)
                    .sort((a, b) => {
                      const discA = getApplicableDiscount(a.supermarket, userData?.paymentMethods || []);
                      const discB = getApplicableDiscount(b.supermarket, userData?.paymentMethods || []);
                      const effA = discA ? a.price * (1 - discA.discount) : a.price;
                      const effB = discB ? b.price * (1 - discB.discount) : b.price;
                      
                      // Priority: effective price
                      return effA - effB;
                    })[0];
                  
                  // Only suggest if it's actually better
                  const discountNow = getApplicableDiscount(item.price.supermarket, userData?.paymentMethods || []);
                  const effectiveNow = discountNow ? item.price.price * (1 - discountNow.discount) : item.price.price;
                  
                  const discountBetter = betterPrice ? getApplicableDiscount(betterPrice.supermarket, userData?.paymentMethods || []) : null;
                  const effectiveBetter = betterPrice ? (discountBetter ? betterPrice.price * (1 - discountBetter.discount) : betterPrice.price) : Infinity;

                  const isBetter = betterPrice && effectiveBetter < effectiveNow;

                  return (
                    <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 items-center relative">
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
                          <div className="flex flex-col">
                            <span className="text-xs text-primary-green font-black mt-0.5">
                              ${(item.price.price * item.quantity).toLocaleString('es-AR')}
                            </span>
                            {item.price.pricePerUnit && item.price.unitType && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1 mt-0.5">
                                ⚖️ ${item.price.pricePerUnit.toLocaleString('es-AR', {maximumFractionDigits: 0})} / {item.price.unitType}
                              </span>
                            )}
                            {/* Bank Discount Info */}
                            {discountNow && (
                              <div className="mt-1 flex items-center gap-1.5 bg-primary-green/5 px-2 py-0.5 rounded-lg border border-primary-green/10 self-start">
                                <span className="text-[9px] font-black text-primary-green uppercase">{discountNow.name} -{(discountNow.discount * 100).toFixed(0)}%</span>
                                <span className="text-xs font-black text-slate-800">${effectiveNow.toLocaleString('es-AR')}</span>
                              </div>
                            )}
                          </div>
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
                           onClick={() => onUpdateQuantity(item.id, -1)}
                           className="w-11 h-11 flex items-center justify-center text-slate-500 active:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Minus size={20} />
                        </button>
                        <span className="px-2 font-black text-sm w-8 text-center">{item.quantity}</span>
                        <button 
                           onClick={() => onUpdateQuantity(item.id, 1)}
                           disabled={item.quantity >= 20}
                           className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors ${item.quantity >= 20 ? 'text-slate-200 cursor-not-allowed' : 'text-primary-green active:bg-green-100 hover:bg-slate-50'}`}
                        >
                          <Plus size={20} />
                        </button>
                      </div>

                      {isBetter && (
                        <button 
                          onClick={() => onUpdatePrice(item.id, betterPrice)}
                          className="absolute -top-2 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[9px] font-black shadow-lg border-2 border-white flex items-center gap-2 active:scale-95 transition-transform"
                        >
                          <TrendingDown size={12} /> 
                          {betterPrice.pricePerUnit && item.price.pricePerUnit && betterPrice.pricePerUnit < item.price.pricePerUnit 
                            ? `¡RINDE MÁS POR $${betterPrice.price}!` 
                            : `MÁS BARATO ($${betterPrice.price})`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePDFExport}
              className="w-full bg-slate-900 hover:bg-black text-white font-black flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 border-black"
            >
              <Download size={20} />
              <span>Descargar Lista PDF</span>
            </button>
            <button 
              onClick={handleWhatsAppExport}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 border-[#128C7E]"
            >
              <Share2 size={20} />
              <span>Compartir por WhatsApp</span>
            </button>
            <button 
              onClick={() => setShowSaveModal(true)}
              disabled={savedLists.length >= 3}
              className={`w-full font-black flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 ${
                savedLists.length >= 3 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-primary-orange text-white border-orange-700'
              }`}
            >
              <Save size={20} />
              <span>{savedLists.length >= 3 ? 'Límite de Listas Alcanzado' : 'Guardar esta Lista'}</span>
            </button>
          </div>
        </>
      )}

      {/* Sección de Listas Guardadas (3 slots) */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-2">
           <Bookmark size={18} className="text-primary-green" />
           <h3 className="text-lg font-black text-slate-800">Mis Listas Guardadas</h3>
           <span className="text-xs font-bold text-slate-400">({savedLists.length}/3)</span>
        </div>
        
        {savedLists.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium italic">Aún no has guardado ninguna lista permanente.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {savedLists.map((list) => (
              <div key={list.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3 group">
                <div className="flex items-center justify-between">
                  {editingListId === list.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                       <input 
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-slate-50 border-2 border-primary-green rounded-xl px-3 py-1.5 font-bold text-sm outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && onRenameNamedList(list.id, editName).then(() => setEditingListId(null))}
                       />
                       <button onClick={() => { onRenameNamedList(list.id, editName); setEditingListId(null); }} className="p-2 bg-primary-green text-white rounded-lg">
                         <Save size={14} />
                       </button>
                       <button onClick={() => setEditingListId(null)} className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                         <X size={14} />
                       </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 flex items-center gap-2">
                        {list.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {list.items.length} productos • {new Date(list.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {!editingListId && (
                    <div className="flex items-center gap-1">
                       <button 
                         onClick={() => { setEditingListId(list.id); setEditName(list.name); }}
                         className="p-2 text-slate-400 hover:text-primary-green transition-colors"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={() => onDeleteNamedList(list.id)}
                         className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  )}
                </div>

                {!editingListId && (
                  <button 
                    onClick={() => onLoadNamedList(list)}
                    className="w-full bg-slate-50 hover:bg-primary-green/10 text-slate-600 hover:text-primary-green font-black py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                  >
                    Cargar esta Lista <ChevronRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Nombre de Lista */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-white rounded-[40px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div className="bg-orange-100 p-2.5 rounded-2xl text-primary-orange">
                   <Save size={24} />
                </div>
                <button onClick={() => setShowSaveModal(false)} className="bg-slate-100 p-2 rounded-full text-slate-500">
                   <X size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2">Ponle nombre a tu lista</h3>
              <p className="text-slate-400 text-sm font-medium mb-6">Se guardará como una lista permanente en tu cuenta.</p>
              
              <input 
                autoFocus
                placeholder="Ej: Asado del Domingo"
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-green rounded-2xl px-5 py-4 font-bold text-lg outline-none transition-all placeholder:text-slate-300 mb-6"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              
              <button 
                onClick={() => {
                  if (newListName.trim()) {
                    onSaveNamedList(newListName.trim()).then(() => {
                      setShowSaveModal(false);
                      setNewListName('');
                    });
                  }
                }}
                className="w-full bg-primary-green text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all text-lg"
              >
                Confirmar y Guardar
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ListView;
