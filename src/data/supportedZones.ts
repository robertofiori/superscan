export interface SupermarketChain {
  id: string;
  name: string;
  active: boolean; // Si ElMango tiene monitoreo activo de precios en esta zona
  note?: string;   // p.ej. "Folleto diario + precios web", "Tiendas físicas y online", etc.
  logoUrl?: string;
}

export interface Zone {
  id: string;
  name: string;      // Nombre de la ciudad o zona (ej. "Bahía Blanca", "CABA")
  province: string;  // Nombre de la provincia
  lat: number;
  lng: number;
  zipCode: string;
  activeChains: SupermarketChain[];
}

export interface ProvinceZones {
  province: string;
  badge?: string;
  zones: Zone[];
}

export const SUPPORTED_PROVINCES: ProvinceZones[] = [
  {
    province: 'Buenos Aires',
    badge: 'Zona Central',
    zones: [
      {
        id: 'bahia-blanca',
        name: 'Bahía Blanca',
        province: 'Buenos Aires',
        lat: -38.7183,
        lng: -62.2663,
        zipCode: '8000',
        activeChains: [
          { id: 'coop', name: 'Cooperativa Obrera', active: true, note: 'Todos los sucursales e HiperAguado' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Market Brown y Express' },
          { id: 'changomas', name: 'ChangoMás', active: true, note: 'Hiper ChangoMás Sarmiento' },
          { id: 'vea', name: 'Vea', active: true, note: 'Sucursales Casanova y Martínez' },
          { id: 'dia', name: 'DIA %', active: false, note: 'En proceso de integración' },
          { id: 'jumbo', name: 'Jumbo', active: false, note: 'Sin presencia física' }
        ]
      },
      {
        id: 'la-plata',
        name: 'La Plata',
        province: 'Buenos Aires',
        lat: -34.9214,
        lng: -57.9545,
        zipCode: '1900',
        activeChains: [
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Hiper y Express La Plata' },
          { id: 'coto', name: 'Coto', active: true, note: 'Sucursal 1 y 44' },
          { id: 'dia', name: 'DIA %', active: true, note: 'Red de locales de cercanía' },
          { id: 'disco', name: 'Disco', active: true, note: 'Supermercado Disco' },
          { id: 'vea', name: 'Vea', active: false, note: 'Próximamente' }
        ]
      },
      {
        id: 'mar-del-plata',
        name: 'Mar del Plata',
        province: 'Buenos Aires',
        lat: -38.0055,
        lng: -57.5426,
        zipCode: '7600',
        activeChains: [
          { id: 'toledo', name: 'Supermercados Toledo', active: true, note: 'Red local completa' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Hiper Pedro Luro y Express' },
          { id: 'disco', name: 'Disco', active: true, note: 'Güemes y Alem' },
          { id: 'vea', name: 'Vea', active: true, note: 'Sucursal Independencia' },
          { id: 'changomas', name: 'ChangoMás', active: false, note: 'Próximamente' }
        ]
      }
    ]
  },
  {
    province: 'Ciudad Autónoma de Buenos Aires (CABA)',
    badge: 'Cobertura Completa',
    zones: [
      {
        id: 'caba',
        name: 'CABA / Capital Federal',
        province: 'Ciudad Autónoma de Buenos Aires',
        lat: -34.6037,
        lng: -58.3816,
        zipCode: '1001',
        activeChains: [
          { id: 'coto', name: 'Coto', active: true, note: 'Digital + 45 Sucursales' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Express, Market e Hiper' },
          { id: 'disco', name: 'Disco', active: true, note: 'Cobertura CABA' },
          { id: 'jumbo', name: 'Jumbo', active: true, note: 'Hipermercados Jumbo' },
          { id: 'dia', name: 'DIA %', active: true, note: 'App & Tiendas físicas' },
          { id: 'changomas', name: 'ChangoMás', active: true, note: 'Masonline / ChangoMás' }
        ]
      },
      {
        id: 'gba-norte',
        name: 'GBA Norte (San Isidro / Olivos)',
        province: 'Buenos Aires (GBA)',
        lat: -34.4714,
        lng: -58.5284,
        zipCode: '1642',
        activeChains: [
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'San Isidro / Vicente López' },
          { id: 'coto', name: 'Coto', active: true, note: 'Sucursal Olivos & Beccar' },
          { id: 'jumbo', name: 'Jumbo', active: true, note: 'Jumbo Unicenter' },
          { id: 'disco', name: 'Disco', active: true, note: 'San Isidro y Martínez' },
          { id: 'dia', name: 'DIA %', active: true, note: 'Tiendas DIA %' }
        ]
      },
      {
        id: 'gba-sur',
        name: 'GBA Sur (Lomas / Quilmes)',
        province: 'Buenos Aires (GBA)',
        lat: -34.7602,
        lng: -58.3973,
        zipCode: '1832',
        activeChains: [
          { id: 'coto', name: 'Coto', active: true, note: 'Temperley y Quilmes' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Hiper Adrogué y Express' },
          { id: 'changomas', name: 'ChangoMás', active: true, note: 'Avellaneda / Quilmes' },
          { id: 'dia', name: 'DIA %', active: true, note: 'Locales zonales' },
          { id: 'vea', name: 'Vea', active: false, note: 'Próximamente' }
        ]
      }
    ]
  },
  {
    province: 'Córdoba',
    badge: 'Zona Centro',
    zones: [
      {
        id: 'cordoba-capital',
        name: 'Córdoba Capital',
        province: 'Córdoba',
        lat: -31.4201,
        lng: -64.1888,
        zipCode: '5000',
        activeChains: [
          { id: 'libertad', name: 'Hipermercados Libertad', active: true, note: 'Poeta Lugones, Ruta 20, Rivera' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Market y Hiper Barrio Jardín' },
          { id: 'disco', name: 'Disco', active: true, note: 'Nueva Córdoba y Cerro de las Rosas' },
          { id: 'vea', name: 'Vea', active: true, note: 'Sucursales zona centro' },
          { id: 'cordiez', name: 'Cordiez', active: true, note: 'Supermercados Cordiez' },
          { id: 'changomas', name: 'ChangoMás', active: true, note: 'ChangoMás Av. Fuerza Aérea' }
        ]
      },
      {
        id: 'rio-cuarto',
        name: 'Río Cuarto',
        province: 'Córdoba',
        lat: -33.1232,
        lng: -64.3493,
        zipCode: '5800',
        activeChains: [
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Sucursal Centro' },
          { id: 'vea', name: 'Vea', active: true, note: 'Supermercados Vea' },
          { id: 'top', name: 'Top', active: true, note: 'Supermercados Top local' },
          { id: 'libertad', name: 'Libertad', active: false, note: 'Próximamente' }
        ]
      }
    ]
  },
  {
    province: 'Santa Fe',
    badge: 'Zona Litoral',
    zones: [
      {
        id: 'rosario',
        name: 'Rosario',
        province: 'Santa Fe',
        lat: -32.9587,
        lng: -60.6930,
        zipCode: '2000',
        activeChains: [
          { id: 'coto', name: 'Coto', active: true, note: 'Coto Alto Rosario & Centro' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Hiper Pueyrredón y Express' },
          { id: 'lareina', name: 'La Reina', active: true, note: 'Supermercados La Reina' },
          { id: 'libertad', name: 'Hipermercados Libertad', active: true, note: 'Libertad Rosario' },
          { id: 'dia', name: 'DIA %', active: true, note: 'Locales de cercanía' }
        ]
      },
      {
        id: 'santa-fe-capital',
        name: 'Santa Fe Capital',
        province: 'Santa Fe',
        lat: -31.6333,
        lng: -60.7000,
        zipCode: '3000',
        activeChains: [
          { id: 'alvear', name: 'Alvear', active: true, note: 'Supermercados Alvear' },
          { id: 'kilbel', name: 'Kilbel', active: true, note: 'Kilbel Supermercados' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Sucursal Peatonal' },
          { id: 'coto', name: 'Coto', active: false, note: 'Próximamente' }
        ]
      }
    ]
  },
  {
    province: 'Mendoza',
    badge: 'Zona Cuyo',
    zones: [
      {
        id: 'mendoza-capital',
        name: 'Mendoza / Gran Mendoza',
        province: 'Mendoza',
        lat: -32.8895,
        lng: -68.8458,
        zipCode: '5500',
        activeChains: [
          { id: 'vea', name: 'Vea', active: true, note: 'Sede central e hipermercados' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Market e Hiper Guaymallén' },
          { id: 'jumbo', name: 'Jumbo', active: true, note: 'Jumbo Mendoza Plaza' },
          { id: 'libertad', name: 'Hipermercados Libertad', active: true, note: 'Libertad Godoy Cruz' },
          { id: 'changomas', name: 'ChangoMás', active: true, note: 'ChangoMás Maipú' }
        ]
      }
    ]
  },
  {
    province: 'Río Negro & Neuquén',
    badge: 'Patagonia Norte',
    zones: [
      {
        id: 'neuquen-capital',
        name: 'Neuquén Capital',
        province: 'Neuquén',
        lat: -38.9516,
        lng: -68.0591,
        zipCode: '8300',
        activeChains: [
          { id: 'la-anonima', name: 'La Anónima', active: true, note: 'Sucursales Neuquén Capital' },
          { id: 'coto', name: 'Coto', active: true, note: 'Hiper Coto Neuquén' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Market Neuquén' },
          { id: 'vea', name: 'Vea', active: true, note: 'Supermercados Vea' }
        ]
      },
      {
        id: 'bariloche',
        name: 'San Carlos de Bariloche',
        province: 'Río Negro',
        lat: -41.1335,
        lng: -71.3103,
        zipCode: '8400',
        activeChains: [
          { id: 'la-anonima', name: 'La Anónima', active: true, note: 'Locales del centro y km 4' },
          { id: 'carrefour', name: 'Carrefour', active: true, note: 'Carrefour Bariloche' },
          { id: 'todo', name: 'Todo', active: true, note: 'Supermercados Todo' },
          { id: 'changomas', name: 'ChangoMás', active: true, note: 'ChangoMás Bariloche' }
        ]
      }
    ]
  }
];

export function findZoneByName(cityName: string): Zone | undefined {
  if (!cityName) return undefined;
  const norm = cityName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  for (const prov of SUPPORTED_PROVINCES) {
    for (const z of prov.zones) {
      const zNorm = z.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (norm.includes(zNorm) || zNorm.includes(norm)) {
        return z;
      }
    }
  }
  return undefined;
}
