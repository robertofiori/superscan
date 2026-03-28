/**
 * Profitability Algorithm
 * Calculates if the savings from splitting a shopping list across multiple stores
 * justifies the travel cost (fuel, time, etc.)
 */

export interface ProfitabilityInput {
  totalSavings: number; // Ahorro total por dividir la lista
  numStores: number; // Cantidad de supermercados a visitar
  distanceKm: number; // Distancia estimada total entre sucursales
  costPerKm: number; // Costo por KM (combustible + desgaste)
  timeValuePerHour: number; // Valor estimado del tiempo del usuario
  avgTimePerStoreMin: number; // Tiempo promedio por sucursal (estacionamiento, cola, etc.)
}

export interface ProfitabilityResult {
  isProfitable: boolean;
  netBenefit: number;
  totalCost: number;
  breakdown: {
    travelCost: number;
    timeCost: number;
  };
}

export function calculateProfitability(input: ProfitabilityInput): ProfitabilityResult {
  const { 
    totalSavings, 
    numStores, 
    distanceKm, 
    costPerKm = 100, // Valor por defecto
    timeValuePerHour = 1500, // Valor por defecto
    avgTimePerStoreMin = 20 
  } = input;

  // Costo de viaje (distancia * costo por km)
  const travelCost = distanceKm * costPerKm;

  // Costo de tiempo (tiempo por tienda * num tiendas + tiempo de viaje)
  // Asumimos velocidad promedio de 30km/h en ciudad para el tiempo de viaje
  const travelTimeMin = (distanceKm / 30) * 60;
  const totalTimeMin = (numStores * avgTimePerStoreMin) + travelTimeMin;
  const timeCost = (totalTimeMin / 60) * timeValuePerHour;

  const totalCost = travelCost + timeCost;
  const netBenefit = totalSavings - totalCost;

  return {
    isProfitable: netBenefit > 0,
    netBenefit,
    totalCost,
    breakdown: {
      travelCost,
      timeCost
    }
  };
}
