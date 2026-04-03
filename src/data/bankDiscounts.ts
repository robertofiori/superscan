export interface BankDiscount {
  id: string;
  name: string;
  discount: number; // 0.3 for 30%
  cap?: number; // Maximum savings per purchase/month
  days: number[]; // 0=Sunday, 1=Monday, ..., 3=Wednesday
  supermarkets: string[]; // lowercase supermarket names
  color?: string; // Brand color for display
}

export const BANK_DISCOUNTS: BankDiscount[] = [
  {
    id: 'cuentadni',
    name: 'Cuenta DNI',
    discount: 0.3,
    cap: 4000,
    days: [1, 2], // Lunes y Martes (Typical for many cycles)
    supermarkets: ['vea', 'carrefour', 'chango mas', 'cooperativa obrera'],
    color: '#00adef'
  },
  {
    id: 'bnaplus',
    name: 'BNA+ (Nación)',
    discount: 0.35,
    cap: 5000,
    days: [3, 4], // Miércoles y Jueves
    supermarkets: ['carrefour', 'vea', 'chango mas'],
    color: '#004a8e'
  },
  {
    id: 'modosantafe',
    name: 'MODO (Billetera Santa Fe/Macro)',
    discount: 0.2,
    cap: 2500,
    days: [1, 2, 3, 4, 5],
    supermarkets: ['cooperativa obrera'],
    color: '#ec1c24'
  },
  {
    id: 'personalpay',
    name: 'Personal Pay',
    discount: 0.15,
    cap: 2000,
    days: [0, 1, 2, 3, 4, 5, 6], // Every day
    supermarkets: ['vea', 'carrefour', 'chango mas'],
    color: '#01fe9c'
  }
];

export function getApplicableDiscount(supermarket: string, userBanks: string[]): BankDiscount | null {
  const today = new Date().getDay();
  const lowerSM = supermarket.toLowerCase();
  
  // Find discounts that apply today to this supermarket and are in the user's banks
  const applicable = BANK_DISCOUNTS.filter(discount => 
    userBanks.includes(discount.id) &&
    discount.days.includes(today) &&
    discount.supermarkets.some(sm => lowerSM.includes(sm))
  );

  // Return the best one
  if (applicable.length === 0) return null;
  return applicable.sort((a, b) => b.discount - a.discount)[0];
}
