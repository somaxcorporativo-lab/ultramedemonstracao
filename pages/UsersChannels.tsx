
import React, { useState, useMemo } from 'react';
import { useLeads } from '../contexts/LeadContext';
// Add Activity and RefreshCcw to the imports from lucide-react
import { 
  Phone, Users, Plus, ChevronRight, Settings, 
  CheckCircle2, AlertCircle, ShieldCheck, UserPlus, 
  LayoutGrid, Trash2, Smartphone, Signal, Hospital,
  X, QrCode, Wifi, Activity, RefreshCcw
} from 'lucide-react';

export const UsersChannels: React.FC = () => {
  const { leads } = useLeads();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Calcula triagens de hoje (simulado baseado na data de criação dos leads)
  const triagesToday = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return leads.filter(l => new Date(l.createdAt).setHours(0, 0, 0, 0) === today).length;
  }, [leads]);

  // Usamos 142 como base fixa + dados reais para demonstração conforme pedido
  const displayTriages = 142 + triagesToday;

  const staff = [
    { id: 'u1', name: 'Dr. Roberto Santos', role: 'Gestor Clínico', status: 'Ativo' },
    { id: 'u2', name: 'Juliana Rocha', role: 'Atendimento Triagem', status: 'Ativo' },
    { id: 'u3', name: 'Carlos Mendes', role: 'Enfermagem', status: 'Plantão' },
  ];

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <nav className="flex items-center space-x-2 text-[10px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-2">
            <span>ULTRAMED</span>
            <ChevronRight size={10} />
            <span className="text-medical-primary">Rede Assistencial</span>
          </nav>
          <h1 className="text-4xl font-serif font-bold text-medical-text tracking-tight flex items-center">
            Unidades & Canais
          </h1>
          <p className="text-medical-text/60 mt-2 font-medium">Gestão centralizada de unidades e equipe assistencial.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-full bg-medical-success/10 border border-medical-success/20 text-medical-success text-[10px] font-bold uppercase tracking-wider flex items-center">
            <CheckCircle2 size={16} className="mr-2" />
            Infraestrutura Operacional
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-medical-text flex items-center">
              <Smartphone className="mr-3 text-medical-secondary" size={24} /> Pontos de Contato
            </h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-200">
              <Plus size={16} />
              <span>Nova Unidade</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Unidade Fixa: Valparaíso de Goiás */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-clinical hover:shadow-professional transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-medical-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-2xl bg-medical-primary/10 flex items-center justify-center text-medical-primary shadow-sm border border-medical-primary/10">
                    <Hospital size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-medical-text">Ultramed - Valparaíso de Goiás</h3>
                    <p className="text-sm text-medical-secondary font-mono flex items-center">
                      <Phone size={12} className="mr-2" /> (61) 99232-6488
                    </p>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-medical-success/10 text-medical-success text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center border border-medical-success/20">
                  <Wifi size={12} className="mr-2" /> Conectado
                </span>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-medical-bg rounded-xl">
                    <Activity size={16} className="text-medical-primary" />
                  </div>
                  <span className="text-[11px] font-bold text-medical-text uppercase tracking-widest">
                    {displayTriages} triagens realizadas hoje
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2.5 text-slate-300 hover:text-medical-primary hover:bg-slate-50 rounded-xl transition-all">
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Placeholder para Futura Unidade */}
            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4 group hover:border-medical-secondary/40 transition-all min-h-[220px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                <Plus size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Nova Unidade</h3>
                <p className="text-[10px] text-slate-300 font-medium max-w-[200px] mt-1 italic">Espaço reservado para expansão da rede Ultramed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-medical-text flex items-center">
              <Users className="mr-3 text-medical-secondary" size={24} /> Equipe Assistencial
            </h2>
            <button 
              onClick={() => setIsQRModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-medical-primary text-white rounded-xl text-xs font-bold hover:bg-medical-text transition-all shadow-lg active:scale-95"
            >
              <UserPlus size={16} />
              <span>Novo Colaborador</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-clinical">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-medical-secondary font-bold uppercase tracking-[0.2em] text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Profissional</th>
                  <th className="px-8 py-5">Função</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-medical-primary/10 flex items-center justify-center font-bold text-medical-primary text-xs border border-slate-200">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-bold text-medical-text">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest">{member.role}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Ativo' ? 'bg-medical-success' : 'bg-medical-secondary'}`}></div>
                        <span className="text-xs font-medium text-slate-500">{member.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-300 hover:text-medical-primary transition-colors">
                        <Settings size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-medical-primary p-8 rounded-[2.5rem] border border-medical-primary shadow-professional text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-125"></div>
            <div className="relative z-10">
              <ShieldCheck className="mb-4 text-medical-secondary" size={32} />
              <h4 className="font-serif font-bold text-xl mb-2">Segurança de Dados</h4>
              <p className="text-sm text-white/70 leading-relaxed italic">
                "Todos os acessos são auditados e as unidades seguem rigorosos protocolos de proteção à informação do paciente, garantindo conformidade com a LGPD assistencial."
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal QR Code para Novo Colaborador */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsQRModalOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-serif font-bold text-medical-text">Conectar Colaborador</h2>
                <p className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest">Sincronização WhatsApp Business</p>
              </div>
              <button 
                onClick={() => setIsQRModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-medical-primary shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-10 flex flex-col items-center space-y-8">
              <div className="p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-clinical relative group">
                {/* QR Code Fictício (usando um placeholder visual) */}
                <div className="w-56 h-56 bg-slate-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden">
                  <QrCode size={120} className="text-medical-primary/20" />
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ultramed-valparaiso-${Math.random()}`} 
                    alt="QR Code de Conexão"
                    className="absolute inset-0 w-full h-full p-4 mix-blend-multiply opacity-90 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-medical-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  Aguardando Escaneamento
                </div>
              </div>

              <div className="text-center space-y-4 max-w-[280px]">
                <p className="text-xs text-medical-text font-medium leading-relaxed">
                  Escaneie este código com o <span className="font-bold">WhatsApp Business</span> do colaborador para integrar ao sistema de triagem Ultramed.
                </p>
                <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-medical-secondary uppercase tracking-widest bg-slate-50 py-2 px-4 rounded-xl border border-slate-100">
                  <RefreshCcw size={12} className="animate-spin text-medical-accent" />
                  <span>Atualizando em 45s</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                ID da Sessão: VALP-GO-{Math.floor(Math.random() * 10000)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
