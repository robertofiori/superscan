import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown, Check, Loader2, Store } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';

interface ZoneSelectorProps {
  className?: string;
  variant?: 'header' | 'hero' | 'compact';
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({ className = '', variant = 'header' }) => {
  const { currentZone, availableStores, zones, selectZone, detectGPSLocation, isDetectingGPS } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDetectGPS = async () => {
    setGpsStatusMessage(null);
    const result = await detectGPSLocation();
    if (result.success && result.zone) {
      setGpsStatusMessage(`Ubicado en ${result.zone.name}`);
      setTimeout(() => {
        setGpsStatusMessage(null);
        setIsOpen(false);
      }, 1500);
    } else {
      setGpsStatusMessage(result.error || 'Error al detectar ubicación');
      setTimeout(() => setGpsStatusMessage(null), 3000);
    }
  };

  const handleSelectZone = (zoneId: string) => {
    selectZone(zoneId);
    setIsOpen(false);
  };

  if (variant === 'hero') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3.5 sm:px-6 sm:py-4 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 text-primary-green rounded-xl flex items-center justify-center shadow-xs">
              <MapPin size={20} />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Zona Seleccionada</span>
              <span className="text-sm sm:text-base font-black text-slate-800 line-clamp-1">
                {currentZone.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-100/70 text-emerald-800 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Store size={12} />
              {availableStores.length} Cadenas
            </span>
            <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Cambiar Zona</span>
              <button
                onClick={handleDetectGPS}
                disabled={isDetectingGPS}
                className="flex items-center gap-1.5 text-xs font-bold text-primary-green hover:text-emerald-700 transition-colors disabled:opacity-50"
              >
                {isDetectingGPS ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                GPS Autodetección
              </button>
            </div>

            {gpsStatusMessage && (
              <div className="mb-3 p-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl text-center">
                {gpsStatusMessage}
              </div>
            )}

            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {zones.map((zone) => {
                const isSelected = zone.id === currentZone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => handleSelectZone(zone.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left ${
                      isSelected ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{zone.name}</span>
                        {zone.badge && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-primary-green text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {zone.badge}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {zone.province}
                      </span>
                    </div>

                    {isSelected && <Check size={18} className="text-primary-green shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header / Compact variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/90 hover:bg-white backdrop-blur border border-slate-200/80 rounded-full shadow-xs active:scale-95 transition-all"
      >
        <div className="w-5 h-5 bg-emerald-100 text-primary-green rounded-full flex items-center justify-center shrink-0">
          <MapPin size={12} />
        </div>

        <span className="text-xs font-black text-slate-800 line-clamp-1">
          {currentZone.name}
        </span>

        <span className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200/50">
          {availableStores.length} cadenas
        </span>

        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 z-[100] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Zonificación</span>
              <span className="text-[10px] text-slate-500 font-medium">Seleccioná tu región comercial</span>
            </div>
            <button
              onClick={handleDetectGPS}
              disabled={isDetectingGPS}
              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-primary-green rounded-xl transition-colors shrink-0"
              title="Detectar por GPS"
            >
              {isDetectingGPS ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            </button>
          </div>

          {gpsStatusMessage && (
            <div className="mb-3 p-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl text-center">
              {gpsStatusMessage}
            </div>
          )}

          <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
            {zones.map((zone) => {
              const isSelected = zone.id === currentZone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => handleSelectZone(zone.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all text-left ${
                    isSelected ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs">{zone.name}</span>
                      {zone.badge && (
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-primary-green text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {zone.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {zone.province}
                    </span>
                  </div>

                  {isSelected && <Check size={16} className="text-primary-green shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
