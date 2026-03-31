export interface UnitInfo {
  normalizedSize: number; // The size in terms of the standardized unit (e.g., 0.5 for 500g if unit is Kg)
  unitLabel: 'L' | 'Kg' | 'u'; // The standardized unit label
}

export function parseUnitInfo(name: string): UnitInfo | null {
  if (!name) return null;
  const normalizedName = name.toLowerCase();

  // Try to find L / Litros
  const lMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:l|lt|litro|litros)\b/);
  if (lMatch) {
    return {
      normalizedSize: parseFloat(lMatch[1].replace(',', '.')),
      unitLabel: 'L',
    };
  }

  // Try to find ML / CC / CM3 (Convert to Liters)
  const mlMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|militros|cc|cm3|cm³)\b/);
  if (mlMatch) {
    return {
      normalizedSize: parseFloat(mlMatch[1].replace(',', '.')) / 1000,
      unitLabel: 'L',
    };
  }

  // Try to find KG / Kilos
  const kgMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilos)\b/);
  if (kgMatch) {
    return {
      normalizedSize: parseFloat(kgMatch[1].replace(',', '.')),
      unitLabel: 'Kg',
    };
  }

  // Try to find G / GR / Gramos (Convert to Kg)
  const gMatch = normalizedName.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grs|gramo|gramos)\b/);
  if (gMatch) {
    return {
      normalizedSize: parseFloat(gMatch[1].replace(',', '.')) / 1000,
      unitLabel: 'Kg',
    };
  }

  // Try to find Units (e.g., "Pack 6u", "X4", "6 Unidades")
  // Only match numbers directly followed by 'u' or prefixed by 'x'.  More complex logic can be added later if needed.
  const packMatch = normalizedName.match(/(?:pack|caja|bolsa)?\s*(?:de\s*)?(\d+)\s*(?:u|unidades|unr)\b/);
  if (packMatch) {
      return {
          normalizedSize: parseInt(packMatch[1], 10),
          unitLabel: 'u'
      }
  }
  
  const xMatch = normalizedName.match(/\bx\s*(\d+)\b/); // Matches " x 6 " or "x6"
  if (xMatch) {
      return {
          normalizedSize: parseInt(xMatch[1], 10),
          unitLabel: 'u'
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
