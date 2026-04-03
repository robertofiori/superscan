export interface UnitInfo {
  normalizedSize: number; // The size in terms of the standardized unit (e.g., 0.5 for 500g if unit is Kg)
  unitLabel: 'L' | 'Kg' | 'u'; // The standardized unit label
}

export function parseUnitInfo(name: string): UnitInfo | null {
  if (!name) return null;
  // Normalize string for consistent matching
  const normalizedName = name.toLowerCase().replace(/\s+/g, ' ');

  // 1. Try to find ML / CC / CM3 (Convert to Liters) - Priority for liquid units
  const mlMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|militros|milis|cc|cm3|cm³)\b/);
  if (mlMatch) {
    const value = parseFloat(mlMatch[1].replace(',', '.'));
    if (value > 0) {
      return {
        normalizedSize: value / 1000,
        unitLabel: 'L',
      };
    }
  }

  // 2. Try to find L / Litros
  const lMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:l|lt|lts|litro|litros)\b/);
  if (lMatch) {
    const value = parseFloat(lMatch[1].replace(',', '.'));
    if (value > 0) {
      return {
        normalizedSize: value,
        unitLabel: 'L',
      };
    }
  }

  // 3. Try to find G / GR / Gramos (Convert to Kg)
  const gMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grs|gramo|gramos)\b/);
  if (gMatch) {
    const value = parseFloat(gMatch[1].replace(',', '.'));
    if (value > 0) {
      // Small optimization: if it's explicitly "g" but a large number, it's likely correct
      return {
        normalizedSize: value / 1000,
        unitLabel: 'Kg',
      };
    }
  }

  // 4. Try to find KG / Kilos
  const kgMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilos|k)\b/);
  if (kgMatch) {
    const value = parseFloat(kgMatch[1].replace(',', '.'));
    if (value > 0) {
      return {
        normalizedSize: value,
        unitLabel: 'Kg',
      };
    }
  }

  // 5. Try to find Units (e.g., "Pack 6u", "X4", "6 Unidades")
  const packMatch = normalizedName.match(/(?:pack|caja|bolsa)?\s*(?:de\s*)?(\d+)\s*(?:u|un|uni|unr|unidades|unid)\b/);
  if (packMatch) {
    const value = parseInt(packMatch[1], 10);
    if (value > 0) {
      return {
        normalizedSize: value,
        unitLabel: 'u'
      };
    }
  }
  
  // Specific catch for isolated "x 6" or similar
  const xMatch = normalizedName.match(/\bx\s*(\d+)\b/);
  if (xMatch) {
    const value = parseInt(xMatch[1], 10);
    if (value > 0) {
      return {
        normalizedSize: value,
        unitLabel: 'u'
      };
    }
  }

  return null;
}

export function calculatePricePerUnit(price: number, name: string): { pricePerUnit: number; unitLabel: string } | null {
  if (!price || !name) return null;

  const unitInfo = parseUnitInfo(name);
  if (!unitInfo || unitInfo.normalizedSize <= 0) return null;

  return {
    pricePerUnit: price / unitInfo.normalizedSize,
    unitLabel: unitInfo.unitLabel,
  };
}
