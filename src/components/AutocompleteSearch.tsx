import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { fetchSearchSuggestions, type ProductSuggestion } from '../api';

interface AutocompleteSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({ onSearch, placeholder }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        const results = await fetchSearchSuggestions(query);
        if (results && results.products) {
          setSuggestions(results.products);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowDropdown(false);
    }
  };

  const handleSelect = (s: ProductSuggestion) => {
    setQuery(s.name);
    onSearch(s.ean || s.name);
    setShowDropdown(false);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={20} className={loading ? 'text-primary-green animate-pulse' : 'text-slate-400'} />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "Ej. Aceite Natura, Leche..."} 
          className="w-full bg-slate-100 border-2 border-transparent focus:border-primary-green focus:bg-white rounded-2xl py-4 pl-12 pr-12 font-medium outline-none transition-all shadow-inner"
        />
        {query && (
          <button 
            type="button" 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-16 flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        )}
        <button 
          type="submit"
          disabled={!query.trim()}
          className="absolute inset-y-1.5 right-1.5 min-w-[44px] min-h-[44px] bg-primary-green hover:bg-green-600 text-white font-bold px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center"
        >
          Ir
        </button>
      </form>

      {/* Dropdown de Sugerencias */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(s)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none group text-left"
            >
              <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 p-1 flex items-center justify-center">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.name} className="w-full h-full object-contain" />
                ) : (
                  <Search size={16} className="text-slate-300" />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-slate-800 text-sm group-hover:text-primary-green transition-colors line-clamp-1">
                  {s.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{s.brand || 'Varios'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && query.length > 2 && !showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full px-4 py-3 flex items-center gap-3 border-b border-slate-50 last:border-none">
              <div className="w-10 h-10 shrink-0 bg-slate-100 rounded-lg animate-pulse" />
              <div className="flex flex-col flex-1 gap-2">
                <div className="h-3 w-3/4 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-2 w-1/3 bg-slate-50 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;
