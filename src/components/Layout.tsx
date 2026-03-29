import { Search, Tag, ListOrdered, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string, tab?: 'settings' | 'payments') => void;
  cartCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, cartCount }) => {
  const { user, userData } = useAuth();
  const avatarUrl = userData?.avatarUrl || user?.photoURL;
  return (
    <div className="min-h-screen pb-20 bg-background-soft text-text-dark font-sans">
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface shadow-sm z-50 px-4 flex justify-between items-center border-b border-slate-200">

        {/* Lado Izquierdo (Buscar en Escritorio) */}
        <div className="flex-1 flex justify-start sm:w-1/3">
          <div className="hidden sm:block w-full max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-green outline-none transition-all"
            />
          </div>
        </div>

        {/* Centro (Logo) */}
        <div className="flex-shrink-0 cursor-pointer absolute left-1/2 -translate-x-1/2 flex justify-center items-center pt-2" onClick={() => onViewChange('home')}>
          <img
            src={`${import.meta.env.BASE_URL}header-logo.svg`}
            alt="ElMango"
            className="h-10 object-contain scale-[2.0] drop-shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter hidden">
            El<span className="text-primary-green">Mango</span>
          </h1>
        </div>

        {/* Lado Derecho (Botones/Lista) */}
        <div className="flex-1 flex justify-end items-center gap-4 sm:w-1/3">
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
          icon={avatarUrl ? (
            <img src={avatarUrl} alt="Perfil" className="w-[22px] h-[22px] rounded-full object-cover ring-2 ring-transparent transition-all" />
          ) : (
            <User size={22} />
          )}
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
    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-primary-green font-bold' : 'text-slate-400 hover:text-slate-600'
      }`}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-wider">{label}</span>
  </button>
);

export default Layout;
