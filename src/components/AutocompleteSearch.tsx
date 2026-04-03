import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { fetchSearchSuggestions, type ProductSuggestion } from '../api';

interface AutocompleteSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SEARCH_CACHE: Record<string, ProductSuggestion[]> = {};

const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({ onSearch, placeholder }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length <= 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      // Check cache first
      if (SEARCH_CACHE[query.toLowerCase()]) {
        setSuggestions(SEARCH_CACHE[query.toLowerCase()]);
        setShowDropdown(true);
        setSelectedIndex(-1);
        return;
      }

      setLoading(true);
      const results = await fetchSearchSuggestions(query);
      if (results && results.products) {
        // Cache result
        SEARCH_CACHE[query.toLowerCase()] = results.products;
        setSuggestions(results.products);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
      setSelectedIndex(-1);
      setLoading(false);
    };

    const timer = setTimeout(fetchSuggestions, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setShowDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Tab':
        setShowDropdown(false);
        break;
    }
  };

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
          <Search size={20} className={loading ? 'text-primary-green animate-bounce' : 'text-slate-400'} />
        </div>
        <input 
          type="text" 
          value={query}
          onKeyDown={handleKeyDown}
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
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Ir"
          )}
        </button>
      </form>

      {/* Dropdown de Sugerencias */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => handleSelect(s)}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-none group text-left ${selectedIndex === idx ? 'bg-green-50' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-10 h-10 shrink-0 bg-white rounded-lg overflow-hidden border p-1 flex items-center justify-center transition-all ${selectedIndex === idx ? 'border-primary-green scale-105' : 'border-slate-100'}`}>
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.name} className="w-full h-full object-contain" />
                ) : (
                  <Search size={16} className="text-slate-300" />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className={`font-bold text-slate-800 text-sm transition-colors line-clamp-1 ${selectedIndex === idx ? 'text-primary-green' : ''}`}>
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
