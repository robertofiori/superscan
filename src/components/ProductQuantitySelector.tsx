import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface ProductQuantitySelectorProps {
  quantity: number;
  onUpdate: (newQuantity: number) => void;
  max?: number;
  min?: number;
}

const ProductQuantitySelector: React.FC<ProductQuantitySelectorProps> = ({ 
  quantity, 
  onUpdate, 
  max = 20, 
  min = 1 
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > min) onUpdate(quantity - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < max) onUpdate(quantity + 1);
  };

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
      <button 
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          quantity <= min ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm'
        }`}
      >
        <Minus size={14} />
      </button>
      
      <span className="w-8 text-center font-black text-xs text-slate-800 dark:text-slate-200">
        {quantity}
      </span>
      
      <button 
        onClick={handleIncrement}
        disabled={quantity >= max}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          quantity >= max ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm'
        }`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default ProductQuantitySelector;
