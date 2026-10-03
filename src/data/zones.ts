export interface StoreChain {
  id: string;
  name: string;
  shortName?: string;
  aliases: string[];
  zones: string[]; // List of zone IDs where this chain operates
  active: boolean;
  logoUrl?: string;
  note?: string;
  defaultZipCode?: string;
}

export interface Zone {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  zipCode: string;
  badge?: string;
  description?: string;
}

export const ZONES: Zone[] = [
  {
    id: 'bahia-blanca',
    name: 'Bahía Blanca',
    province: 'Buenos Aires',
    lat: -38.7183,
    lng: -62.2663,
    zipCode: '8000',
    badge: 'Zona Central',
    description: 'Bahía Blanca y alrededores'
  },
  {
    id: 'amba',
    name: 'AMBA (CABA y GBA)',
    province: 'Buenos Aires / CABA',
    lat: -34.6037,
    lng: -58.3816,
    zipCode: '1001',
    badge: 'Cobertura Completa',
    description: 'Capital Federal y Gran Buenos Aires'
  },
  {
    id: 'cordoba-capital',
    name: 'Córdoba Capital',
    province: 'Córdoba',
    lat: -31.4201,
    lng: -64.1888,
    zipCode: '5000',
    badge: 'Zona Centro',
    description: 'Córdoba Capital y alrededores'
  },
  {
    id: 'rosario',
    name: 'Rosario',
    province: 'Santa Fe',
    lat: -32.9587,
    lng: -60.6930,
    zipCode: '2000',
    badge: 'Zona Litoral',
    description: 'Rosario y Gran Rosario'
  },
  {
    id: 'mendoza',
    name: 'Mendoza',
    province: 'Mendoza',
    lat: -32.8895,
    lng: -68.8458,
    zipCode: '5500',
    badge: 'Zona Cuyo',
    description: 'Mendoza Capital y Gran Mendoza'
  }
];

export const DEFAULT_ZONE_ID = 'bahia-blanca';

export const MASTER_CHAINS: StoreChain[] = [
  {
    id: 'coop',
    name: 'Cooperativa Obrera',
    shortName: 'La Coope',
    aliases: ['cooperativa obrera', 'la coope', 'coop', 'lacoope'],
    zones: ['bahia-blanca', 'amba', 'caba'],
    active: true,
    note: 'Sucursales Bahía Blanca e HiperAguado'
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    shortName: 'Carrefour',
    aliases: ['carrefour', 'carrefour market', 'carrefour express', 'carrefour hiper'],
    zones: ['bahia-blanca', 'amba', 'caba', 'gba-norte', 'gba-sur', 'cordoba-capital', 'rosario', 'mendoza', 'la-plata', 'mar-del-plata', 'neuquen-capital', 'bariloche'],
    active: true,
    note: 'Hiper, Market y Express'
  },
  {
    id: 'vea',
    name: 'Vea',
    shortName: 'Vea',
    aliases: ['vea', 'supermercados vea'],
    zones: ['bahia-blanca', 'amba', 'caba', 'gba-norte', 'gba-sur', 'cordoba-capital', 'mendoza', 'neuquen-capital', 'mar-del-plata'],
    active: true,
    note: 'Sucursales de cercanía e Hiper'
  },
  {
    id: 'changomas',
    name: 'ChangoMás',
    shortName: 'ChangoMás',
    aliases: ['chango mas', 'chango más', 'changomas', 'masonline', 'hiper changomas'],
    zones: ['bahia-blanca', 'amba', 'caba', 'gba-norte', 'gba-sur', 'cordoba-capital', 'mendoza', 'bariloche', 'mar-del-plata'],
    active: true,
    note: 'Hiper ChangoMás y Masonline'
  },
  {
    id: 'coto',
    name: 'Coto',
    shortName: 'Coto',
    aliases: ['coto', 'coto digital'],
    zones: ['amba', 'caba', 'gba-norte', 'gba-sur', 'rosario', 'la-plata', 'neuquen-capital'],
    active: true,
    note: 'Digital + Sucursales físicas'
  },
  {
    id: 'jumbo',
    name: 'Jumbo',
    shortName: 'Jumbo',
    aliases: ['jumbo', 'hipermercados jumbo'],
    zones: ['amba', 'caba', 'gba-norte', 'mendoza'],
    active: true,
    note: 'Hipermercados Jumbo'
  },
  {
    id: 'disco',
    name: 'Disco',
    shortName: 'Disco',
    aliases: ['disco', 'supermercados disco'],
    zones: ['amba', 'caba', 'gba-norte', 'cordoba-capital', 'la-plata', 'mar-del-plata'],
    active: true,
    note: 'Supermercados Disco'
  },
  {
    id: 'dia',
    name: 'DIA %',
    shortName: 'DIA %',
    aliases: ['dia', 'dia %', 'supermercados dia', 'día'],
    zones: ['amba', 'caba', 'gba-norte', 'gba-sur', 'rosario', 'la-plata'],
    active: true,
    note: 'Tiendas DIA % y App'
  }
];

export function findZoneById(zoneId: string): Zone {
  return ZONES.find(z => z.id === zoneId) || ZONES[0];
}

export function getStoresForZone(zoneId: string): StoreChain[] {
  const isAmbaSubzone = ['caba', 'gba-norte', 'gba-sur', 'amba'].includes(zoneId);
  return MASTER_CHAINS.filter(chain => 
    chain.active && (chain.zones.includes(zoneId) || (isAmbaSubzone && chain.zones.includes('amba')))
  );
}

const normalizeStr = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

export function isStoreAllowedInZone(supermarketName: string, zoneId: string): boolean {
  if (!supermarketName) return false;
  const normSM = normalizeStr(supermarketName);
  const activeStoresInZone = getStoresForZone(zoneId);

  return activeStoresInZone.some(chain => {
    return chain.aliases.some(alias => {
      const normAlias = normalizeStr(alias);
      return normSM.includes(normAlias) || normAlias.includes(normSM);
    });
  });
}

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findClosestZone(lat: number, lng: number): Zone {
  let closestZone = ZONES[0];
  let minDistance = Infinity;

  for (const zone of ZONES) {
    const dist = calculateHaversineDistance(lat, lng, zone.lat, zone.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestZone = zone;
    }
  }

  return closestZone;
}
