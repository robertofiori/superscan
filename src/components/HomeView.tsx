import React from 'react';
import { CreditCard, ChevronRight, Gift, MapPin } from 'lucide-react';
import AutocompleteSearch from './AutocompleteSearch';
import { useAuth } from '../contexts/AuthContext';

const BANK_PROMOS = [
  {
    id: 'cuentadni',
    bank: 'Cuenta DNI',
    promo: '35% DE AHORRO',
    days: 'SÁBADOS',
    color: 'bg-[#40b080]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=bancoprovincia.com.ar',
    stores: 'EN LA COOPE / CARREFOUR / MASONLINE',
    methodId: 'cuentadni'
  },
  {
    id: 'bnaplus',
    bank: 'BNA+',
    promo: '30% DE DESCUENTO',
    days: 'MIÉRCOLES',
    color: 'bg-[#0072bc]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=bna.com.ar',
    stores: 'EN VEA / CHANGOMÁS',
    methodId: 'bnaplus'
  },
  {
    id: 'modo',
    bank: 'MODO',
    promo: '25% DE REINTEGRO',
    days: 'MARTES Y JUEVES',
    color: 'bg-[#ffda00]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=modo.com.ar',
    stores: 'EN TODOS LOS SUPERS',
    methodId: 'modo'
  },
  {
    id: 'galicia',
    bank: 'Galicia',
    promo: '20% DE AHORRO',
    days: 'VIERNES',
    color: 'bg-[#ff6600]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=bancogalicia.com',
    stores: 'EN CARREFOUR',
    methodId: 'galicia'
  },
  {
    id: 'santander',
    bank: 'Santander',
    promo: '30% DE AHORRO',
    days: 'MIÉRCOLES',
    color: 'bg-[#ec0000]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=santander.com.ar',
    stores: 'EN MASONLINE / CHANGOMÁS',
    methodId: 'santander'
  }
];

interface HomeViewProps {
  onSearch: (query: string) => void;
  onViewChange: (view: string, tab?: 'settings' | 'payments') => void;
  onShowLocation: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onSearch, onViewChange, onShowLocation }) => {
  const { userData } = useAuth();

  const paymentMethods = userData?.paymentMethods || [];
  const selectedPromos = BANK_PROMOS.filter(p => paymentMethods.includes(p.methodId));
  const otherPromos = BANK_PROMOS.filter(p => !paymentMethods.includes(p.methodId));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Buscador Central Compacto */}
      <section className="bg-surface rounded-[32px] p-5 shadow-xl border border-slate-100 flex flex-col mt-4">
        <div className="flex flex-col items-start w-fit mx-auto mb-2 mt-6 select-none relative">
          {/* Top Block: Logo and ¡Ahorra en tu compra */}
          <div className="flex items-center gap-0 sm:gap-1">
            {/* Logo */}
            <div className="w-[100px] min-[400px]:w-[130px] sm:w-[160px] shrink-0 relative z-10 transition-all duration-300 -mr-2 sm:-mr-4">
              <img
                src="Elmango logo.svg"
                alt="ElMango Logo"
                className="w-full h-auto object-contain drop-shadow-md scale-[1.4] min-[400px]:scale-[1.5] sm:scale-[1.6] origin-right"
              />
            </div>
            {/* Text */}
            <div className="flex flex-col pt-1">
              <span
                className="text-[40px] min-[400px]:text-[50px] sm:text-[62px] leading-[0.85] tracking-tight text-slate-950"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}
              >
                ¡Ahorra
              </span>
              <span
                className="text-[40px] min-[400px]:text-[50px] sm:text-[62px] leading-[0.85] tracking-tight text-slate-950"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}
              >
                en tu
              </span>
              <span
                className="text-[40px] min-[400px]:text-[50px] sm:text-[62px] leading-[0.85] tracking-tight text-slate-950"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}
              >
                compra
              </span>
            </div>
          </div>

          {/* Bottom Block: realmente! and squiggly */}
          <div className="flex flex-col w-full relative -mt-1 sm:-mt-2 mb-8 items-center sm:items-start pl-2">
            <span
              className="text-[52px] min-[400px]:text-[64px] sm:text-[80px] leading-[0.85] tracking-tighter text-primary-green relative z-20"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontStyle: "italic" }}
            >
              realmente<span className="text-slate-950">!</span>
            </span>
            <div
              className="w-full max-w-[280px] sm:max-w-[340px] h-[20px] mt-0.5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='20' viewBox='0 0 28 20'%3E%3Cpath d='M0,10 Q7,2 14,10 T28,10' fill='none' stroke='%23bbf7d0' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat-x',
                backgroundPosition: 'left center'
              }}
            />
          </div>

          {/* Controles Compactos (mismo ancho que el texto) */}
          <div className="flex flex-col w-full max-w-[280px] sm:max-w-[340px] mx-auto sm:ml-2 gap-5">
            <div className="relative w-full z-30">
              <AutocompleteSearch onSearch={onSearch} />
            </div>

            {/* Selector de Ubicación (Móvil) */}
            <div className="sm:hidden w-full">
              <button 
                onClick={onShowLocation}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white text-primary-green rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <MapPin size={18} />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ubicación Actual</span>
                    <span className="text-sm font-black text-slate-800">
                      {userData?.location?.city || 'Seleccionar Ciudad'}
                    </span>
                  </div>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-black text-primary-green border border-slate-100 uppercase tracking-wider shadow-sm">
                  Cambiar
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Promociones Bancarias */}
      <section className="flex flex-col gap-5 pb-8">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Gift size={22} className="text-indigo-500 fill-indigo-100" />
            Promos Bancarias
          </h3>
        </div>

        {selectedPromos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {selectedPromos.map(promo => (
              <PromoItem key={promo.id} promo={promo} onClick={() => onViewChange('profile', 'payments')} />
            ))}
            {otherPromos.slice(0, 1).map(promo => (
              <PromoItem key={promo.id} promo={promo} dimmed onClick={() => onViewChange('profile', 'payments')} />
            ))}
          </div>
        ) : (
          <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-500">
              <CreditCard size={32} />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-black text-slate-800">¿Qué billeteras usás?</h4>
              <p className="text-slate-500 text-sm font-medium">Configurá tus métodos de pago para ver promos personalizadas.</p>
            </div>
            <button
              onClick={() => onViewChange('profile', 'payments')}
              className="bg-slate-900 text-white font-black py-3 px-6 rounded-2xl text-sm shadow-xl active:scale-95 transition-all text-center"
            >
              Configurar Pagos
            </button>
          </div>
        )}
      </section>

    </div>
  );
};

const PromoItem = ({ promo, dimmed = false, onClick }: { promo: any, dimmed?: boolean, onClick: () => void }) => (
  <div
    onClick={onClick}
    className={`p-2 rounded-[32px] transition-all bg-white shadow-lg border border-slate-100 flex items-center gap-4 cursor-pointer active:scale-[0.98] ${dimmed ? 'opacity-50 grayscale scale-[0.98]' : ''}`}
  >
    <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center p-2.5 shadow-inner shrink-0 overflow-hidden border border-slate-50">
      {promo.logo ? (
        <img src={promo.logo} alt={promo.bank} className="w-full h-full object-contain" />
      ) : (
        <div className={`w-full h-full ${promo.color} rounded-xl flex items-center justify-center`}>
          <Gift size={24} className="text-white" />
        </div>
      )}
    </div>
    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{promo.bank}</span>
        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest whitespace-nowrap">• {promo.days}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-black text-primary-green uppercase tracking-tight">{promo.promo}</span>
        <p className="text-[10px] text-slate-400 font-bold leading-tight uppercase tracking-wide truncate">
          {promo.stores}
        </p>
      </div>
    </div>
    <div className="pr-2">
      <button className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-slate-100 transition-colors">
        <ChevronRight size={18} />
      </button>
    </div>
  </div>
);

export default HomeView;

