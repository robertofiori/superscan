import React, { useState, useEffect } from 'react';
import { X, MapPin, Search, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para los íconos por defecto de Leaflet en Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Active vs Inactive Supermarkets
const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const inactiveIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para recentrar el mapa cuando cambia la ciudad buscada
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}

const CHAINS = [
  { name: 'Carrefour', available: true },
  { name: 'La Coope', available: true },
  { name: 'ChangoMás', available: true },
  { name: 'Jumbo', available: false },
  { name: 'Disco', available: false },
  { name: 'Vea', available: false },
  { name: 'Coto', available: false }
];

interface LocationModalProps {
  onClose: () => void;
}

export default function LocationModal({ onClose }: LocationModalProps) {
  const { userData, updateUserData } = useAuth();
  
  // Posición por defecto: Bahía Blanca
  const defaultPos: [number, number] = [-38.7183, -62.2663];
  const [center, setCenter] = useState<[number, number]>(defaultPos);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [cityData, setCityData] = useState<{city: string, province: string, zipCode: string}>({
      city: 'Bahía Blanca',
      province: 'Buenos Aires',
      zipCode: '8000'
  });
  
  // Simular marcadores alrededor del centro
  const [markers, setMarkers] = useState<any[]>([]);

  // Inicializar con la ubicación actual si existe
  useEffect(() => {
     if (userData?.location) {
         setSearchQuery(userData.location.city);
         handleSearch(userData.location.city, false);
     }
  }, []);

  const generateMarkers = (lat: number, lng: number) => {
    // Generamos entre 4 y 8 supermercados aleatorios en un radio de ~5km
    const count = Math.floor(Math.random() * 5) + 4;
    const newMarkers = [];
    for (let i = 0; i < count; i++) {
        const chain = CHAINS[Math.floor(Math.random() * CHAINS.length)];
        const latOffset = (Math.random() - 0.5) * 0.05;
        const lngOffset = (Math.random() - 0.5) * 0.05;
        newMarkers.push({
            id: i,
            lat: lat + latOffset,
            lng: lng + lngOffset,
            ...chain
        });
    }
    setMarkers(newMarkers);
  };

  const handleSearch = async (query: string = searchQuery, updateInput: boolean = true) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            setCenter([lat, lon]);
            
            // Aproximar datos de ciudad a partir del display_name (Ej: "Rosario, Departamento Rosario, Santa Fe,...")
            const parts = result.display_name.split(', ');
            setCityData({
                city: parts[0],
                province: parts.length > 2 ? parts[parts.length - 2] : 'Desconocida',
                zipCode: '0000' // Nominatim gratis no siempre da CP seguro
            });

            if (updateInput) setSearchQuery(parts[0]);
            generateMarkers(lat, lon);
        } else {
            alert("No se encontró la ubicación. Intente ser más específico.");
        }
    } catch (e) {
        console.error("Error buscando ubicación:", e);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
      await updateUserData({
          location: {
              id: cityData.city.toLowerCase().replace(/\s+/g, '-'),
              ...cityData
          }
      });
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 p-2 sm:p-6 justify-end sm:justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-start z-10 bg-white shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tu Ubicación</h2>
            <p className="text-sm text-slate-500 font-medium">Buscá tu ciudad para ver ofertas cercanas.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-6 pb-4 bg-white z-10">
          <div className="flex gap-2 relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ej: Córdoba, Rosario..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-4 text-sm font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all"
            />
            <button 
                onClick={() => handleSearch()}
                disabled={loading}
                className="bg-primary-green text-white w-12 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all overflow-hidden"
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>
        </div>

        {/* Mapa Leaflet */}
        <div className="flex-1 w-full relative min-h-[300px] sm:min-h-[400px] z-0 bg-slate-100">
            {markers.length === 0 && !loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <span className="bg-white/80 backdrop-blur text-slate-600 px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                        Cargando mapa...
                    </span>
                </div>
            )}
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                <ChangeView center={center} />
                
                {/* Marcador de Centro de Ciudad (Tú) */}
                <Circle center={center} radius={300} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.2 }} />
                
                {/* Marcadores de Supermercados */}
                {markers.map(marker => (
                    <Marker 
                        key={marker.id} 
                        position={[marker.lat, marker.lng]}
                        icon={marker.available ? activeIcon : inactiveIcon}
                    >
                        <Popup className="rounded-xl overflow-hidden font-sans">
                            <div className="flex flex-col items-center p-1 min-w-[120px]">
                                <span className="font-black text-slate-800 text-sm">{marker.name}</span>
                                {marker.available ? (
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Activo
                                    </span>
                                ) : (
                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 flex items-center gap-1 border border-slate-200">
                                        Próximamente
                                    </span>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>

        {/* Footer (ConfirmBtn) */}
        <div className="p-6 bg-white z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 text-primary-green rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={20} />
              </div>
              <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ubicación Seleccionada</span>
                  <span className="text-base font-black text-slate-800 line-clamp-1">{cityData.city}</span>
              </div>
          </div>
          
          <button 
            onClick={handleSaveLocation}
            className="w-full bg-slate-900 text-white font-black py-4 px-6 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-black"
          >
            Confirmar Ubicación <Navigation size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
