import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Zone, StoreChain } from '../data/zones';
import { 
  ZONES, 
  DEFAULT_ZONE_ID, 
  findZoneById, 
  getStoresForZone, 
  findClosestZone 
} from '../data/zones';

const STORAGE_KEY = 'el_mango_current_zone';

interface LocationContextType {
  currentZone: Zone;
  availableStores: StoreChain[];
  zones: Zone[];
  isDetectingGPS: boolean;
  selectZone: (zoneId: string) => void;
  detectGPSLocation: () => Promise<{ success: boolean; zone?: Zone; error?: string }>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentZone, setCurrentZoneState] = useState<Zone>(() => {
    try {
      const savedZoneId = localStorage.getItem(STORAGE_KEY);
      if (savedZoneId) {
        return findZoneById(savedZoneId);
      }
    } catch (e) {
      console.error('Error reading saved zone from localStorage:', e);
    }
    return findZoneById(DEFAULT_ZONE_ID);
  });

  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  const availableStores = useMemo(() => {
    return getStoresForZone(currentZone.id);
  }, [currentZone.id]);

  const selectZone = (zoneId: string) => {
    const zone = findZoneById(zoneId);
    setCurrentZoneState(zone);
    try {
      localStorage.setItem(STORAGE_KEY, zone.id);
    } catch (e) {
      console.error('Error persisting zone to localStorage:', e);
    }
  };

  const detectGPSLocation = (): Promise<{ success: boolean; zone?: Zone; error?: string }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: 'La geolocalización no está soportada por tu navegador.' });
        return;
      }

      setIsDetectingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsDetectingGPS(false);
          const { latitude, longitude } = position.coords;
          const closestZone = findClosestZone(latitude, longitude);
          selectZone(closestZone.id);
          resolve({ success: true, zone: closestZone });
        },
        (error) => {
          setIsDetectingGPS(false);
          let errorMsg = 'No se pudo obtener la ubicación GPS.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Permiso de ubicación denegado.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Ubicación no disponible.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Tiempo de espera agotado al consultar GPS.';
          }
          resolve({ success: false, error: errorMsg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return (
    <LocationContext.Provider value={{
      currentZone,
      availableStores,
      zones: ZONES,
      isDetectingGPS,
      selectZone,
      detectGPSLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
