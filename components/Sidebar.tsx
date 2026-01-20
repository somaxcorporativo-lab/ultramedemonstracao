
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Filter, Users, PhoneCall, Bot, Inbox, Settings2, Stethoscope } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/inbox', label: 'Atendimentos', icon: Inbox },
    { path: '/', label: 'Dashboard Clínico', icon: LayoutDashboard },
    { path: '/funnel', label: 'Fluxo de Comparecimento', icon: Filter },
    { path: '/leads', label: 'Nossos Pacientes', icon: Users },
    { path: '/follow-up', label: 'Follow-up', icon: PhoneCall },
    { path: '/ai-customization', label: 'Cérebro da IA', icon: Bot },
    { path: '/channels', label: 'Unidades & Canais', icon: Settings2 },
  ];

  return (
    <div className="w-64 bg-medical-primary border-r border-medical-primary/20 h-screen fixed left-0 top-0 flex flex-col z-50 shadow-2xl transition-all duration-300">
      <div className="p-8 flex items-center space-x-3">
        <div className="bg-medical-secondary p-2.5 rounded-2xl shadow-lg shadow-black/20">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
           <span className="text-xl font-serif font-bold text-white tracking-tight">ULTRAMED</span>
           <span className="block text-[10px] uppercase font-bold tracking-widest text-white/60">Diagnósticos Precisos</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-medical-primary font-bold shadow-lg' 
                  : 'text-white/70 hover:bg-medical-secondary/20 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-medical-primary' : 'text-white/50 group-hover:text-white/80'}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-white/10 space-y-4">
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-black/10 border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-medical-secondary flex items-center justify-center text-white font-serif font-bold text-lg shadow-inner">
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Dr. Responsável</p>
            <p className="text-[10px] text-white/60 truncate uppercase tracking-tighter">Gestor Clínico</p>
          </div>
        </div>
      </div>
    </div>
  );
};
