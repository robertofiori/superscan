import React from 'react';
import { Search, Tag, User, Scan, ListChecks, MapPin, ListOrdered, Barcode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LocationModal from './LocationModal';
import { type ShoppingListItem } from '../api';
import { SidebarList } from './SidebarList';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string, tab?: 'settings' | 'payments') => void;
  cartCount: number;
  onScan: () => void;
  showLocationModal: boolean;
  onShowLocation: () => void;
  onCloseLocation: () => void;
  listItems?: ShoppingListItem[];
  onRemoveItem?: (id: string) => void;
  onClearList?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeView, 
  onViewChange, 
  cartCount, 
  onScan, 
  showLocationModal, 
  onShowLocation, 
  onCloseLocation,
  listItems = [],
  onRemoveItem = () => {},
  onClearList = () => {}
}) => {
  const { user, userData } = useAuth();
  const avatarUrl = userData?.avatarUrl || user?.photoURL;
  
  return (
    <div className="min-h-screen flex flex-col bg-background-soft text-text-dark font-sans">
      {/* Header - Desktop Optimized */}
      <header className="h-20 bg-white/80 backdrop-blur-md shadow-sm z-50 px-8 hidden lg:flex justify-between items-center border-b border-slate-100 sticky top-0">
        <div className="flex items-center gap-6">
          <div className="cursor-pointer flex items-center gap-2" onClick={() => onViewChange('home')}>
            <img
              src={`${import.meta.env.BASE_URL}header-logo.svg`}
              alt="ElMango"
              className="h-10 object-contain scale-[2.2] translate-y-[-2px] mr-6"
            />
          </div>
          
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeView === 'list'
                  ? 'bg-primary-green/10 text-primary-green'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ListChecks size={18} />
              MI LISTA
            </button>
            <button
              onClick={() => onViewChange('offers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeView === 'offers'
                  ? 'bg-fuchsia-100 text-fuchsia-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Tag size={18} />
              OFERTAS
            </button>
          </nav>
        </div>

        {/* Central Search Area */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-green transition-colors" size={18} />
            <input
              type="text"
              placeholder="¿Qué buscamos hoy?"
              className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-2.5 pl-12 pr-4 text-[15px] font-medium focus:bg-white focus:border-primary-green/20 outline-none transition-all shadow-inner"
              onClick={() => activeView !== 'home' && onViewChange('home')}
            />
          </div>
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onShowLocation}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 group"
            title="Cambiar Ubicación"
          >
            <MapPin size={16} className="text-primary-green group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black text-slate-600 uppercase tracking-tight">
              {userData?.location?.city || 'Seleccionar'}
            </span>
          </button>

          <button
            onClick={() => onViewChange('profile')}
            className={`flex items-center gap-2 p-1 pl-1 pr-4 rounded-xl transition-all border border-transparent ${
              activeView === 'profile' 
                ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:border-slate-100'
            }`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-white" />
            ) : (
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
            )}
            <span className="text-xs font-black tracking-tight uppercase">{user?.displayName?.split(' ')[0] || 'Mi Perfil'}</span>
          </button>

          <button
            onClick={onScan}
            className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-black transition-all shadow-lg active:scale-95 group"
          >
            <Scan size={18} className="text-primary-green group-hover:rotate-12 transition-transform" />
            ESCANEAR
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-24 lg:mb-0">
            {children}
          </div>
        </div>

        {/* Desktop Sidebar - "Mi Lista" Summary */}
        <aside className="hidden lg:block w-[380px] flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] border-l border-slate-100 overflow-hidden bg-white">
          <SidebarList 
            items={listItems}
            onRemoveItem={onRemoveItem}
            onClearList={onClearList}
            onViewFullList={() => onViewChange('list')}
          />
        </aside>
      </main>

      {showLocationModal && <LocationModal onClose={onCloseLocation} />}

      {/* Bottom Navigation (Mobile Only) - Professional Refresh */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] h-18 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl flex items-center justify-around px-2 z-50 rounded-[32px]">
          <NavItem
            icon={
              <div className="relative">
                <ListOrdered size={24} />
                {cartCount > 0 && (
                  <span 
                    key={cartCount}
                    className="absolute -top-2 -right-2 bg-primary-green text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white shadow-sm animate-in zoom-in duration-300"
                  >
                    {cartCount}
                  </span>
                )}
              </div>
            }
            label="Lista"
            isActive={activeView === 'list'}
            onClick={() => onViewChange('list')}
          />
          <NavItem
            icon={<Tag size={24} />}
            label="Ofertas"
            isActive={activeView === 'offers'}
            onClick={() => onViewChange('offers')}
          />
          
          {/* Central Highlighted Search Button */}
          <div className="relative -mt-10 flex flex-col items-center">
            <button
              onClick={() => onViewChange('home')}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 active:scale-90 border-[4px] border-white
                ${activeView === 'home' || activeView === 'results'
                  ? 'bg-slate-900 text-white scale-110 shadow-slate-200' 
                  : 'bg-primary-green text-white hover:scale-105'}`}
            >
              <Search size={28} className={activeView === 'home' ? 'animate-pulse' : ''} />
            </button>
            <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-2 transition-all ${activeView === 'home' ? 'text-slate-900 opacity-100' : 'text-slate-400 opacity-80'}`}>BUSCAR</span>
          </div>

          <NavItem
            icon={avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className={`w-6 h-6 rounded-full object-cover shadow-sm ${activeView === 'profile' ? 'ring-2 ring-primary-green' : 'opacity-70'}`} />
            ) : (
              <User size={24} />
            )}
            label="Perfil"
            isActive={activeView === 'profile'}
            onClick={() => onViewChange('profile')}
          />

          <NavItem
            icon={<Barcode size={24} />}
            label="Escanear"
            isActive={false}
            onClick={onScan}
          />
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
    className={`flex flex-col items-center justify-center w-14 h-14 gap-1 transition-all duration-300 ${isActive ? 'text-primary-green' : 'text-slate-400 hover:text-slate-600'
      }`}
  >
    <div className={isActive ? 'scale-110' : ''}>{icon}</div>
    {label && <span className={`text-[9px] uppercase font-black tracking-widest ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>}
  </button>
);

export default Layout;
