import React, { useState } from 'react';
import { LogOut, MapPin, CreditCard, ChevronRight, Bell, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LocationModal from './LocationModal';
import AvatarUpload from './AvatarUpload';
const PAYMENT_METHODS = [
  { 
    id: 'cuentadni', 
    name: 'Cuenta DNI', 
    color: 'bg-[#40b080]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=bancoprovincia.com.ar'
  },
  { 
    id: 'bnaplus', 
    name: 'BNA+', 
    color: 'bg-[#0072bc]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=bna.com.ar'
  },
  { 
    id: 'modo', 
    name: 'MODO', 
    color: 'bg-[#ffda00]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=modo.com.ar'
  },
  { 
    id: 'mercadopago', 
    name: 'Mercado Pago', 
    color: 'bg-[#009ee3]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=mercadopago.com.ar'
  },
  { 
    id: 'ualá', 
    name: 'Ualá', 
    color: 'bg-[#002aff]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=uala.com.ar'
  },
  { 
    id: 'brubank', 
    name: 'Brubank', 
    color: 'bg-[#2b3137]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=brubank.com'
  },
  { 
    id: 'lemon', 
    name: 'Lemon Cash', 
    color: 'bg-[#1de9b6]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=lemon.me'
  },
  { 
    id: 'naranjax', 
    name: 'Naranja X', 
    color: 'bg-[#ff4500]',
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=naranjax.com'
  },
  { 
    id: 'personalpay', 
    name: 'Personal Pay', 
    color: 'bg-[#00e1ff]',
    logo: 'https://icon.horse/icon/personalpay.com.ar'
  },
  { 
    id: 'credicoop', 
    name: 'Credicoop', 
    color: 'bg-[#005ca9]', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_Banco_Credicoop.svg' 
  },
  { 
    id: 'hipotecario', 
    name: 'Hipotecario', 
    color: 'bg-[#00b1eb]', 
    logo: 'https://icon.horse/icon/hipotecario.com.ar' 
  },
  { 
    id: 'comafi', 
    name: 'Banco Comafi', 
    color: 'bg-[#003a70]', 
    logo: 'https://icon.horse/icon/comafi.com.ar' 
  },
  { 
    id: 'pampa', 
    name: 'Banco Pampa', 
    color: 'bg-[#008d36]', 
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ffffff"/><text x="50" y="66" fill="%23008d36" font-family="Arial, sans-serif" font-size="48" font-weight="900" text-anchor="middle">BP</text></svg>' 
  },
  { 
    id: 'supervielle', 
    name: 'Supervielle', 
    color: 'bg-[#e4002b]', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Supervielle_logo14.png/250px-Supervielle_logo14.png' 
  },
  { 
    id: 'santander', 
    name: 'Santander Rio', 
    color: 'bg-[#ec0000]', 
    logo: 'https://icon.horse/icon/santander.com.ar' 
  },
  { 
    id: 'ciudad', 
    name: 'Banco Ciudad', 
    color: 'bg-[#00aeef]', 
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=bancociudad.com.ar' 
  },
  { 
    id: 'sol', 
    name: 'Banco del Sol', 
    color: 'bg-[#ffc600]', 
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=bancodelsol.com' 
  },
  { 
    id: 'carrefour', 
    name: 'Tarj. Carrefour', 
    color: 'bg-[#00519e]', 
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=carrefour.com.ar' 
  },
  { 
    id: 'cencosud', 
    name: 'Tarj. Cencosud', 
    color: 'bg-[#00a34d]', 
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=tarjetacencosud.com.ar' 
  },
  { 
    id: 'visa', 
    name: 'VISA', 
    color: 'bg-[#1a1f71]', 
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=visa.com.ar' 
  },
  { 
    id: 'mastercard', 
    name: 'Mastercard', 
    color: 'bg-[#eb001b]', 
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=mastercard.com.ar' 
  },
  { 
    id: 'amex', 
    name: 'AMEX', 
    color: 'bg-[#0070d2]', 
    logo: 'https://www.google.com/s2/favicons?sz=128&domain=americanexpress.com' 
  }
];

interface ProfileViewProps {
  initialTab?: 'settings' | 'payments';
  onTabChange?: (tab: 'settings' | 'payments') => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ initialTab = 'settings', onTabChange }) => {
  const { user, userData, logout, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'payments'>(initialTab);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Sync internal state with prop
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!user) return null;

  const handleTabChange = (tab: 'settings' | 'payments') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const togglePaymentMethod = (methodId: string) => {
    const current = userData?.paymentMethods || [];
    const updated = current.includes(methodId)
      ? current.filter(id => id !== methodId)
      : [...current, methodId];
    updateUserData({ paymentMethods: updated });
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent('¡Mirá lo que encontré! ElMango te ayuda a ahorrar en el súper. Probala acá: https://robertofiori.github.io/superscan/');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header / Avatar Section */}
      <div className="relative bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary-green/20 to-primary-orange/20 -z-10"></div>
        <AvatarUpload />

        <div className="mt-6">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            {user.displayName || 'Usuario de ElMango'}
          </h2>
          <span className="text-sm text-slate-400 font-bold mt-2 inline-block">
            {user.email}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white/50 p-1.5 rounded-[24px] border border-slate-100">
        <button 
          onClick={() => handleTabChange('settings')}
          className={`flex-1 py-3 px-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'settings' ? 'bg-white text-primary-green shadow-sm' : 'text-slate-400'
          }`}
        >
          Ajustes
        </button>
        <button 
          onClick={() => handleTabChange('payments')}
          className={`flex-1 py-3 px-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'payments' ? 'bg-white text-primary-green shadow-sm' : 'text-slate-400'
          }`}
        >
          Pagos
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[32px] py-2 shadow-lg border border-slate-100 overflow-hidden">
            <ProfileItem 
              icon={<MapPin size={20} />} 
              label="Localización Actual" 
              detail={userData?.location ? `${userData.location.city}, CP ${userData.location.zipCode}` : "Seleccionar ubicación"}
              onClick={() => setShowLocationModal(true)}
            />
            
            <div className="px-6 py-4 flex items-center gap-4 border-t border-slate-50">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-slate-800 text-sm block">Notificaciones</span>
                <span className="text-[11px] text-slate-400 font-medium">Alertas de ofertas diarias</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={userData?.notifications ?? true}
                  onChange={(e) => updateUserData({ notifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-green"></div>
              </label>
            </div>

            <div className="h-[1px] bg-slate-50 mx-6"></div>
            
            <button 
              onClick={logout}
              className="w-full px-6 py-5 flex items-center gap-4 text-red-500 hover:bg-red-50 transition-colors font-black text-sm"
            >
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="px-4">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Mis Billeteras</h3>
            <p className="text-sm text-slate-400 font-medium">Seleccioná las que usás para ver promos bancarias.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PAYMENT_METHODS.map((method) => {
              const isActive = userData?.paymentMethods?.includes(method.id) || false;
              return (
                <button
                  key={method.id}
                  onClick={() => togglePaymentMethod(method.id)}
                  className={`relative p-5 rounded-[32px] flex flex-col items-start gap-3 transition-all border-2 ${
                    isActive 
                      ? `${method.color} text-white border-transparent shadow-xl scale-[1.02]` 
                      : 'bg-white border-slate-100 text-slate-600 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner overflow-hidden p-2 ${
                    isActive ? 'bg-white' : 'bg-slate-50'
                  }`}>
                    {method.logo ? (
                      <img src={method.logo} alt={method.name} className="w-full h-full object-contain" />
                    ) : (
                      <CreditCard size={20} className={isActive ? 'text-primary-green' : 'text-slate-400'} />
                    )}
                  </div>
                  <span className="font-black text-sm leading-tight text-left truncate w-full">
                    {method.name}
                  </span>
                  
                  {isActive && (
                    <div className="absolute top-3 right-3 bg-white text-primary-green p-1 rounded-full shadow-md">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-800 text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-green/20 rounded-full blur-3xl"></div>
        <h4 className="font-black text-lg mb-2 relative z-10">¡Ayudanos a crecer!</h4>
        <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium relative z-10">
          ElMango es un proyecto gratuito para Bahía Blanca. Compartilo con tus conocidos para que todos ahorren.
        </p>
        <button 
          onClick={shareOnWhatsApp}
          className="bg-primary-green text-white font-black py-4 px-8 rounded-2xl shadow-xl w-full flex items-center justify-center gap-3 active:scale-95 transition-all text-center"
        >
          Compartir App
        </button>
      </div>

      {/* Disclaimer Legal */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center max-w-sm mx-auto w-full">
        <h4 className="font-black text-slate-700 justify-center text-xs mb-2 flex items-center gap-1 uppercase tracking-widest">
          <AlertCircle size={14} className="text-primary-orange" />
          Aviso Legal
        </h4>
        <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
          Los precios indicados son referenciales y pueden variar en cada sucursal. Los nombres de las cadenas (EJ: Carrefour, ChangoMás) se utilizan únicamente con fines comparativos e informativos y son propiedad de sus respectivos dueños.
        </p>
      </div>

      {showLocationModal && <LocationModal onClose={() => setShowLocationModal(false)} />}
    </div>
  );
};

const ProfileItem = ({ icon, label, detail, onClick }: any) => (
  <button onClick={onClick} className="w-full px-6 py-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
    <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:text-primary-green group-hover:bg-green-50 rounded-2xl flex items-center justify-center transition-all">
      {icon}
    </div>
    <div className="flex flex-col items-start flex-1 min-w-0">
      <span className="font-black text-slate-800 text-sm">{label}</span>
      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{detail}</span>
    </div>
    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
  </button>
);

export default ProfileView;
