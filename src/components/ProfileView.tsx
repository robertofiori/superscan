import React from 'react';
import { User, Settings, LogOut, MapPin, CreditCard, ChevronRight } from 'lucide-react';

const ProfileView: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-md border border-slate-100">
        <div className="w-16 h-16 bg-primary-green rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-green-50">
          <User size={32} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Roberto Fiori</h2>
          <span className="text-sm text-slate-400 font-medium">roberto.fiori@example.com</span>
        </div>
        <button className="ml-auto p-2 text-slate-300 hover:text-slate-600">
          <Settings size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4">Configuración</h3>
        <div className="bg-white rounded-[32px] py-2 shadow-md border border-slate-100">
          <ProfileItem icon={<MapPin size={20} />} label="Mi Localización" detail="Bahía Blanca, CP 8000" />
          <ProfileItem icon={<CreditCard size={20} />} label="Métodos de Pago" detail="Cuenta DNI, BNA+" />
          <ProfileItem icon={<Settings size={20} />} label="Preferencias" detail="Notificar ofertas" />
          <div className="h-[1px] bg-slate-50 mx-6 my-1"></div>
          <button className="w-full px-6 py-4 flex items-center gap-4 text-red-500 hover:bg-red-50 transition-colors rounded-b-[24px]">
            <LogOut size={20} />
            <span className="font-bold flex-1 text-left">Cerrar Sesión</span>
          </button>
        </div>
      </div>

       <div className="bg-primary-orange/5 border border-primary-orange/20 rounded-[32px] p-6 flex flex-col gap-2">
        <h4 className="font-black text-primary-orange text-sm uppercase tracking-widest">SuperScan Premium</h4>
        <p className="text-slate-600 text-sm leading-relaxed">Suscribite para recibir alertas de precios en tiempo real y descuentos exclusivos.</p>
        <button className="mt-2 bg-primary-orange text-white font-black py-3 rounded-2xl shadow-lg shadow-orange-200 shadow-bold">
          Obtener Premium
        </button>
      </div>
    </div>
  );
};

const ProfileItem = ({ icon, label, detail }: any) => (
  <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
    <div className="text-slate-400 group-hover:text-primary-green transition-colors">{icon}</div>
    <div className="flex flex-col items-start flex-1 min-w-0">
      <span className="font-bold text-slate-800 text-sm">{label}</span>
      <span className="text-[11px] text-slate-400 font-medium">{detail}</span>
    </div>
    <ChevronRight size={16} className="text-slate-300" />
  </button>
);

export default ProfileView;
