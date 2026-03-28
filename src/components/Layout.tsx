import React from 'react';
import { Search, Tag, ListOrdered, User, ShoppingCart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  cartCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, cartCount }) => {
  return (
    <div className="min-h-screen pb-20 bg-background-soft text-text-dark font-sans">
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface shadow-sm z-50 px-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2" onClick={() => onViewChange('home')}>
          <div className="w-8 h-8 bg-primary-green rounded-lg flex items-center justify-center text-white shadow-md cursor-pointer">
            <ShoppingCart size={18} />
          </div>
          <h1 className="text-xl font-black tracking-tight cursor-pointer">SuperScan</h1>
        </div>
        
        <div className="flex-1 max-w-xs mx-4 lg:max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-green outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => onViewChange('list')} className="relative p-2 text-slate-600 hover:text-primary-green transition-colors">
            <ListOrdered size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary-orange text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-surface">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="pt-20 px-4 max-w-screen-xl mx-auto">
        {children}
      </main>

      {/* Bottom Bar para Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-slate-200 flex justify-around items-center px-2 z-50">
        <NavItem 
          icon={<Search size={22} />} 
          label="Buscar" 
          isActive={activeView === 'home' || activeView === 'results'} 
          onClick={() => onViewChange('home')} 
        />
        <NavItem 
          icon={<Tag size={22} />} 
          label="Ofertas" 
          isActive={activeView === 'offers'} 
          onClick={() => onViewChange('offers')} 
        />
        <NavItem 
          icon={<ListOrdered size={22} />} 
          label="Mi Lista" 
          isActive={activeView === 'list'} 
          onClick={() => onViewChange('list')} 
        />
        <NavItem 
          icon={<User size={22} />} 
          label="Perfil" 
          isActive={activeView === 'profile'} 
          onClick={() => onViewChange('profile')} 
        />
      </nav>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
      isActive ? 'text-primary-green font-bold' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-wider">{label}</span>
  </button>
);

export default Layout;
