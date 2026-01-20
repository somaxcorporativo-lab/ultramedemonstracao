
import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLeads } from '../contexts/LeadContext';
import { LeadStage, UILead, FollowUpPriority } from '../types';
import { supabase } from '../services/supabaseClient';
import { 
  ChevronRight, Search, Activity, Users, X, CreditCard, AlertCircle, Clock, CheckCircle2, MessageSquare, PhoneCall
} from 'lucide-react';

export const LeadList: React.FC = () => {
  const { leads, loading, refreshLeads } = useLeads();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [actionLead, setActionLead] = useState<UILead | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchSearch = (lead.patientName + lead.phoneNumber + lead.interestExam).toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus !== 'todos' ? lead.stage === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [leads, search, filterStatus]);

  // Updated to include all active stages and fix DEFINICAO error
  const getStatusChip = (stage: LeadStage) => {
    switch (stage) {
      case LeadStage.CONFIRMADO: return 'bg-medical-success/10 text-medical-success border-medical-success/20';
      case LeadStage.COMPARECIMENTO: return 'bg-medical-accent/10 text-medical-accent border-medical-accent/20';
      case LeadStage.TRIAGEM: return 'bg-medical-secondary/10 text-medical-secondary border-medical-secondary/20';
      case LeadStage.RECUSADO: return 'bg-medical-alert/10 text-medical-alert border-medical-alert/20';
      default: return 'bg-slate-50 text-medical-text border-slate-200';
    }
  };

  if (loading && leads.length === 0) return (
    <div className="p-8 flex items-center justify-center h-screen bg-medical-bg">
      <div className="flex flex-col items-center">
        <Activity className="w-12 h-12 text-medical-accent mb-4 animate-pulse" />
        <span className="text-sm font-bold tracking-widest text-medical-primary uppercase">Carregando Prontuários...</span>
      </div>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24 relative">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <nav className="flex items-center space-x-2 text-[10px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-2">
              <span>ULTRAMED</span>
              <ChevronRight size={10} />
              <span className="text-medical-primary">Base de Dados de Pacientes</span>
            </nav>
            <h1 className="text-4xl font-serif font-bold text-medical-text tracking-tight">Gestão Assistencial</h1>
        </div>
        <div className="flex bg-white rounded-2xl px-5 py-2.5 border border-slate-200 shadow-sm items-center">
           <Users className="w-4 h-4 text-medical-secondary mr-2" />
           <span className="text-xs font-bold text-medical-primary uppercase tracking-wider">{leads.length} Pacientes</span>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-clinical border border-slate-200 space-y-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-5 top-4 w-4 h-4 text-slate-300" />
              <input 
                  type="text" 
                  placeholder="Buscar por paciente, exame ou pagamento..." 
                  className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm text-medical-text transition-all placeholder:text-slate-400 shadow-inner focus:bg-white"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
              />
          </div>
          <select 
              className="px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold text-medical-text min-w-[180px]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
          >
              <option value="todos">Todos Status</option>
              {Object.values(LeadStage).map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-professional border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-medical-secondary">Paciente</th>
                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-medical-secondary">Diagnóstico</th>
                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-medical-secondary">Comparecimento</th>
                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-medical-secondary">Pagamento</th>
                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-medical-secondary">Status</th>
                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-medical-secondary text-right">Ficha</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map(lead => (
                      <tr 
                        key={lead.id} 
                        onClick={() => setActionLead(lead)}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                          <td className="px-8 py-7">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-medical-bg border border-slate-200 flex items-center justify-center font-bold text-medical-primary group-hover:bg-medical-primary group-hover:text-white transition-all">
                                {lead.patientName.charAt(0)}
                              </div>
                              <div>
                                  <span className="font-bold block text-medical-text group-hover:text-medical-primary">{lead.patientName}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{lead.phoneNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-7 font-bold text-medical-text">{lead.interestExam}</td>
                          <td className="px-8 py-7">
                             <span className="text-xs text-medical-secondary font-medium">{lead.scheduleDetails || 'Pendente de Check-in'}</span>
                          </td>
                          <td className="px-8 py-7 text-[10px] font-bold uppercase text-slate-500">{lead.paymentType}</td>
                          <td className="px-8 py-7">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusChip(lead.stage)}`}>
                                  {lead.stage}
                              </span>
                          </td>
                          <td className="px-8 py-7 text-right">
                             <ChevronRight size={16} className="text-slate-300 group-hover:text-medical-primary ml-auto" />
                          </td>
                      </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {actionLead && (
        <LeadDetailsModal lead={actionLead} onClose={() => setActionLead(null)} onUpdate={refreshLeads} />
      )}
    </div>
  );
};

const LeadDetailsModal: React.FC<{ lead: UILead; onClose: () => void; onUpdate: () => void }> = ({ lead, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    comparecimento: lead.scheduleDetails,
    mensagem_followup: lead.followUp.message,
    pagamento: lead.paymentType,
    prioridade_assistencial: lead.followUp.priority
  });

  const handleSetToday = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    setFormData(prev => ({ ...prev, comparecimento: today }));
  };

  const handleGoToChat = () => {
    const prefill = encodeURIComponent(formData.mensagem_followup);
    navigate(`/inbox?chatId=${lead.id}&prefill=${prefill}`);
    onClose();
  };

  const handleGoToFollowUp = () => {
    navigate(`/follow-up?patientId=${lead.id}`);
    onClose();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('Clinica')
        .update({
          agendamento: formData.comparecimento,
          mensagem_followup: formData.mensagem_followup,
          plano_ou_particular: formData.pagamento,
          prioridade_followup: formData.prioridade_assistencial,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Erro ao atualizar prontuário:", err);
      alert("Erro ao atualizar prontuário no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[3rem] shadow-2xl border border-slate-200 w-full max-w-2xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-medical-primary text-white flex items-center justify-center font-bold text-xl shadow-clinical">
              {lead.patientName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-medical-text">{lead.patientName}</h2>
              <p className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest flex items-center">
                <Clock size={12} className="mr-1.5" /> Ficha Assistencial • {lead.interestExam}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest">Data de Comparecimento</label>
                  <button 
                    onClick={handleSetToday}
                    className="text-[9px] font-bold text-medical-secondary bg-medical-secondary/10 px-3 py-1 rounded-full hover:bg-medical-secondary hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={10} />
                    Compareceu Hoje
                  </button>
                </div>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-medical-primary outline-none transition-all shadow-inner"
                  value={formData.comparecimento}
                  onChange={e => setFormData({...formData, comparecimento: e.target.value})}
                  placeholder="Ex: 25/08/2024"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest">Prioridade Assistencial</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-medical-text outline-none focus:bg-white transition-all shadow-inner"
                  value={formData.prioridade_assistencial}
                  onChange={e => setFormData({...formData, prioridade_assistencial: e.target.value as FollowUpPriority})}
                >
                   <option value={FollowUpPriority.INDEFINIDA}>Padrão / Indefinida</option>
                   <option value={FollowUpPriority.BAIXA}>Baixa Prioridade</option>
                   <option value={FollowUpPriority.MEDIA}>Prioridade Média</option>
                   <option value={FollowUpPriority.ALTA}>Alta Prioridade (Urgente)</option>
                </select>
             </div>
          </div>

          <div className="space-y-2">
              <label className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest">Forma de Pagamento</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-4 text-slate-300" size={18} />
                <input 
                  type="text" 
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white transition-all shadow-inner"
                  value={formData.pagamento}
                  onChange={e => setFormData({...formData, pagamento: e.target.value})}
                  placeholder="Particular, Bradesco, Unimed..."
                />
              </div>
          </div>

          <div className="space-y-4">
              <div className="flex flex-col space-y-3">
                <label className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest">Observações de Follow-up / Mensagem</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleGoToChat}
                    disabled={!lead}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-accent text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-medical-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare size={14} />
                    Entrar em Contato (Atendimento)
                  </button>
                  <button 
                    onClick={handleGoToFollowUp}
                    disabled={!lead}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-medical-secondary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-medical-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PhoneCall size={14} />
                    Follow-up
                  </button>
                </div>
              </div>
              <textarea 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm h-40 resize-none outline-none focus:bg-white focus:border-medical-primary transition-all shadow-inner leading-relaxed"
                value={formData.mensagem_followup}
                onChange={e => setFormData({...formData, mensagem_followup: e.target.value})}
                placeholder="Insira detalhes sobre o contato ou preparo do exame..."
              />
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <AlertCircle size={14} className="text-medical-secondary" />
             Dados sincronizados com o banco de dados principal
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto px-12 py-4 bg-medical-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-medical-text transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCcw size={16} className="animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : (
              <span>Confirmar Atualização</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const RefreshCcw = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
