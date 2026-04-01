
import { CheckCircle2, MapPin, CreditCard, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingScreen = ({ onNavigate }: { onNavigate: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-soft p-6 text-center">
      {/* Wrapper to center vertically in the remaining space */}
      <div className="flex-1 w-full flex flex-col justify-center items-center">
        {/* Hero Logo Combo from HomeView */}
        <div className="flex flex-col items-start w-fit mx-auto select-none relative">
          {/* Top Block: Logo and ¡Ahorra en tu compra */}
          <div className="flex items-center gap-0 sm:gap-1">
            {/* Logo */}
            <div className="w-[100px] min-[400px]:w-[130px] sm:w-[160px] shrink-0 relative z-10 transition-all duration-300 -mr-2 sm:-mr-4">
              <img
                src="/elmango-logo.svg"
                alt="ElMango Logo"
                className="w-full h-auto object-contain drop-shadow-md scale-[1.4] min-[400px]:scale-[1.5] sm:scale-[1.6] origin-right"
              />
            </div>
            {/* Text */}
            <div className="flex flex-col pt-1 text-left">
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
          <div className="flex flex-col w-full relative -mt-1 sm:-mt-2 mb-2 items-center sm:items-start pl-2">
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
        </div>
      </div>

      <div className="flex flex-col w-full gap-5 mt-auto sm:mt-0 max-w-sm px-4">
        <button
          onClick={onNavigate}
          className="w-full bg-[#7A5CA7] hover:bg-[#684b91] text-white font-bold text-[17px] py-[18px] px-6 rounded-[24px] shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <span>Registrarme</span>
          <ArrowRight size={22} />
        </button>
        <button
          onClick={onNavigate}
          className="w-full bg-transparent text-slate-500 hover:text-slate-700 font-bold text-[17px] py-3 px-6 rounded-[24px] transition-all"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
};

export const LoginScreen = () => {
  const { login } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa] overflow-hidden relative">
      <div className="pt-6 sm:pt-12 pb-2 flex justify-center z-10 relative mt-2 sm:mt-6">
        {/* El logo con la frase (app web logo) */}
        <img
          src={`${import.meta.env.BASE_URL}header-logo.svg`}
          alt="ElMango"
          className="h-16 sm:h-24 object-contain scale-[1.5] sm:scale-[2.0]"
        />
      </div>
 
      {/* Mock Ticket Header */}
      <div className="relative w-full flex justify-center mt-2 z-10 scale-95 sm:scale-100">
        <div className="w-[85%] max-w-[310px] bg-white rounded-t-[24px] rounded-b-[12px] shadow-xl pb-6 overflow-hidden relative border border-slate-100 flex flex-col pt-8 px-5 gap-3">
          {/* Subtle horizontal pill mark at very top */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-100 rounded-full"></div>
 
          <div className="flex flex-col gap-2 font-bold text-[11px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="tracking-widest uppercase">Leche Entera</span>
              <div className="flex items-center gap-1.5">
                <span className="line-through opacity-50">$1200</span>
                <span className="text-purple-700 text-sm font-black">$850</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="tracking-widest uppercase">Café Molido</span>
              <div className="flex items-center gap-1.5">
                <span className="line-through opacity-50">$4500</span>
                <span className="text-purple-700 text-sm font-black">$3200</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="tracking-widest uppercase">Pan Artesano</span>
              <div className="flex items-center gap-1.5">
                <span className="line-through opacity-50">$2100</span>
                <span className="text-purple-700 text-sm font-black">$1500</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="tracking-widest uppercase">Pack Yogur</span>
              <div className="flex items-center gap-1.5">
                <span className="line-through opacity-50">$1800</span>
                <span className="text-purple-700 text-sm font-black">$1200</span>
              </div>
            </div>
          </div>
 
          <div className="flex justify-end gap-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <MapPin size={12} />
            </div>
            <div className="w-7 h-7 rounded-full bg-fuchsia-50 flex items-center justify-center text-fuchsia-500">
              <CreditCard size={12} />
            </div>
          </div>
 
          <div className="border-t border-dashed border-slate-200 mt-1 pt-4 flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 tracking-widest uppercase">A Pagar</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary-green" />
              <span className="text-2xl font-black text-purple-800">$6750</span>
            </div>
          </div>
 
          {/* Ticket Scalloped Bottom Edge */}
          <div
            className="absolute bottom-0 left-0 w-full h-[8px]"
            style={{
              backgroundImage: 'radial-gradient(circle at 8px 8px, transparent 8px, #f7f8fa 9px)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 -8px',
              backgroundRepeat: 'repeat-x'
            }}
          />
        </div>
      </div>
 
      <div className="flex flex-col items-center px-8 pt-4 pb-6 text-center z-10 w-full max-w-sm mx-auto">
        <p className="text-[#64748b] mb-4 max-w-[280px] font-bold text-[14px] leading-relaxed">
          Inicia sesión con tu cuenta de Google para guardar tus listas, métodos de pago y recibir alertas.
        </p>
 
        <button
          onClick={login}
          className="w-full bg-white text-slate-800 font-extrabold text-[15px] py-[16px] px-6 rounded-[20px] shadow-md border border-slate-100 hover:shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <LogIn size={20} className="text-primary-green" />
          <span className="tracking-wide">Continuar con Google</span>
        </button>
      </div>
    </div>
  );
};
