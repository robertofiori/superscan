import { Search, Tag, ListOrdered, User, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import LocationModal from './LocationModal';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string, tab?: 'settings' | 'payments') => void;
  cartCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, cartCount }) => {
  const { user, userData } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const avatarUrl = userData?.avatarUrl || user?.photoURL;
  return (
    <div className="min-h-screen pb-24 bg-background-soft text-text-dark font-sans">
      {/* Header - Visible solo en escritorio */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface shadow-sm z-50 px-6 hidden sm:flex justify-between items-center border-b border-slate-200">
        
        {/* Lado Izquierdo (Buscar en Escritorio / Ubicación) */}
        <div className="flex-1 flex justify-start items-center gap-4 w-1/3">
          <div className="w-full max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-green outline-none transition-all"
            />
          </div>
          
          {/* Ubicación (Escritorio) */}
          <button 
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-all border border-slate-100 group min-h-[40px]"
          >
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-primary-green shadow-sm group-hover:scale-110 transition-transform">
              <MapPin size={14} />
            </div>
            <div className="flex flex-col items-start leading-none pr-1">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Tu Ciudad</span>
              <span className="text-xs font-black text-slate-700 truncate max-w-[100px]">
                {userData?.location?.city || 'Seleccionar'}
              </span>
            </div>
          </button>
        </div>

        {/* Centro (Logo Escritorio) */}
        <div className="flex-shrink-0 cursor-pointer absolute left-1/2 -translate-x-1/2 flex justify-center items-center pt-1" onClick={() => onViewChange('home')}>
          <img
            src={`${import.meta.env.BASE_URL}header-logo.svg`}
            alt="ElMango"
            className="h-8 object-contain drop-shadow-sm scale-[2.2]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter hidden">
            El<span className="text-primary-green">Mango</span>
          </h1>
        </div>

        {/* Lado Derecho (Perfil Escritorio) */}
        <div className="flex-1 flex justify-end items-center gap-6 w-1/3">
           <button
            onClick={() => onViewChange('profile')}
            className={`flex items-center gap-2 p-1 rounded-full transition-all ${activeView === 'profile' ? 'bg-green-50 text-primary-green ring-1 ring-primary-green/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             {avatarUrl ? (
                <img src={avatarUrl} alt="Perfil" className="w-8 h-8 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
              )}
              <span className="text-xs font-bold pr-2 hidden lg:block">{user?.displayName || 'Mi Cuenta'}</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="pt-4 sm:pt-20 px-4 max-w-screen-xl mx-auto">
        {/* Ubicación Mobile - Siempre visible al inicio */}
        <div className="sm:hidden mb-6 mt-1">
           <button 
            onClick={() => setShowLocationModal(true)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-[28px] shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 text-primary-green rounded-2xl flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ubicación Actual</span>
                <span className="text-base font-black text-slate-800">
                  {userData?.location?.city || 'Seleccionar Ciudad'}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary-green uppercase tracking-wider">
              Cambiar
            </div>
          </button>
        </div>
        {children}
      </main>

      {showLocationModal && <LocationModal onClose={() => setShowLocationModal(false)} />}

      {/* Modern Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-50">
        <div className="max-w-md mx-auto h-18 bg-slate-900/90 backdrop-blur-xl rounded-[32px] flex justify-around items-center px-4 shadow-2xl border border-white/10 pointer-events-auto">
          <NavItem
            icon={<Search size={22} />}
            isActive={activeView === 'home' || activeView === 'results'}
            onClick={() => onViewChange('home')}
          />
          <NavItem
            icon={<Tag size={22} />}
            isActive={activeView === 'offers'}
            onClick={() => onViewChange('offers')}
          />
          
          {/* Central Highlighted Button: MI LISTA */}
          <div className="relative -mt-12 flex flex-col items-center">
            <button
              onClick={() => onViewChange('list')}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 border-[4px] border-surface
                ${activeView === 'list' 
                  ? 'bg-primary-green text-white rotate-12 scale-110' 
                  : 'bg-white text-primary-green hover:bg-primary-green hover:text-white'}`}
            >
              <ListOrdered size={28} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-orange text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
            <span className={`text-[9px] font-black uppercase tracking-widest mt-2 transition-opacity ${activeView === 'list' ? 'text-primary-green opacity-100' : 'text-slate-400 opacity-80'}`}>Mi Lista</span>
          </div>

          <NavItem
            icon={avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className={`w-6 h-6 rounded-full object-cover ${activeView === 'profile' ? 'ring-2 ring-primary-green' : 'opacity-70'}`} />
            ) : (
              <User size={22} />
            )}
            isActive={activeView === 'profile'}
            onClick={() => onViewChange('profile')}
          />
           <div className="w-12 h-12 flex items-center justify-center sm:hidden">
              {/* Espaciador para mantener simetría si es necesario */}
           </div>
        </div>
      </nav>

    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label?: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 h-12 gap-1 transition-all duration-300 ${isActive ? 'text-primary-green scale-110' : 'text-slate-400 hover:text-slate-200'
      }`}
  >
    {icon}
    {label && <span className="text-[10px] uppercase tracking-wider">{label}</span>}
  </button>
);

export default Layout;
