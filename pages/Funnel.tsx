
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '../contexts/LeadContext';
import { supabase } from '../services/supabaseClient';
import { LeadStage, UILead } from '../types';
import { 
  Phone, ChevronRight, Clock, Search, Activity, 
  Target, Bot, X, BarChart3, Calendar, Ban, RefreshCcw, Info, Users
} from 'lucide-react';
import { generateFunnelAnalysis } from '../services/geminiService';

export const Funnel: React.FC = () => {
  const { leads, loading, refreshLeads } = useLeads();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // THE 5 OFFICIAL STAGES
  const columns = [
    { id: LeadStage.RECEBIDO, label: 'Novos Pacientes', color: 'bg-medical-primary', icon: Users },
    { id: LeadStage.TRIAGEM, label: 'Triagem IA', color: 'bg-medical-secondary', icon: Bot },
    { id: LeadStage.COMPARECIMENTO, label: 'Em Comparecimento', color: 'bg-medical-accent', icon: Clock },
    { id: LeadStage.CONFIRMADO, label: 'Comp. Confirmado', color: 'bg-medical-success', icon: Activity },
    { id: LeadStage.RECUSADO, label: 'Não Compareceu', color: 'bg-medical-alert', icon: Ban },
  ];

  const refusalStats = useMemo(() => {
    const reasons: Record<string, number> = {};
    let totalRefusals = 0;
    leads.forEach(l => {
      if (l.stage === LeadStage.RECUSADO) {
        const r = l.refusalReason?.trim() || "Motivo não especificado";
        reasons[r] = (reasons[r] || 0) + 1;
        totalRefusals++;
      }
    });
    return Object.entries(reasons)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalRefusals > 0 ? ((value / totalRefusals) * 100).toFixed(0) : '0'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [leads]);

  useEffect(() => {
    if (leads.length > 0 && showAnalytics) {
      setLoadingAi(true);
      const funnelData = {
        total: leads.length,
        qualified: triagesInIA,
        negotiation: leads.filter(l => l.stage === LeadStage.COMPARECIMENTO).length,
        scheduled: leads.filter(l => l.stage === LeadStage.CONFIRMADO).length,
      };
      generateFunnelAnalysis(funnelData, refusalStats)
        .then(res => setAiAnalysis(res))
        .catch(() => setAiAnalysis("Erro ao processar análise assistencial."))
        .finally(() => setLoadingAi(false));
    }
  }, [leads, showAnalytics, refusalStats]);

  const triagesInIA = useMemo(() => leads.filter(l => l.stage === LeadStage.TRIAGEM).length, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.interestExam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phoneNumber.includes(searchTerm)
    );
  }, [leads, searchTerm]);

  const getLeadsByColumn = (stage: LeadStage) => {
    return filteredLeads.filter(l => l.stage === stage);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    
    let updateData: any = { updated_at: new Date().toISOString() };
    
    // Mapping target stage back to database fields
    switch(targetStage) {
      case LeadStage.RECEBIDO:
        updateData.status_followup = 'pending';
        updateData.recusou_agendamento = null;
        updateData.prompt_usuario = null;
        break;
      case LeadStage.TRIAGEM:
        updateData.status_followup = 'draft';
        updateData.recusou_agendamento = null;
        if (!updateData.prompt_usuario) updateData.prompt_usuario = "Triagem iniciada manualmente.";
        break;
      case LeadStage.COMPARECIMENTO:
        updateData.status_followup = 'scheduled';
        updateData.recusou_agendamento = null;
        break;
      case LeadStage.CONFIRMADO:
        updateData.status_followup = 'sent';
        updateData.recusou_agendamento = null;
        break;
      case LeadStage.RECUSADO:
        updateData.status_followup = 'cancelled';
        updateData.recusou_agendamento = "Desistência manual";
        break;
    }

    try {
      const { error } = await supabase
        .from('Clinica')
        .update(updateData)
        .eq('id', leadId);
      if (error) throw error;
      await refreshLeads();
    } catch (err) {
      console.error("Erro ao mover paciente:", err);
    }
  };

  if (loading && leads.length === 0) return (
    <div className="flex items-center justify-center h-full bg-medical-bg">
        <div className="flex flex-col items-center">
            <Activity className="w-12 h-12 text-medical-accent mb-4 animate-pulse" />
            <span className="text-sm font-bold tracking-widest text-medical-primary uppercase font-sans">Sincronizando Fluxo Real...</span>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-medical-bg relative overflow-visible w-full">
      <header className="px-8 py-6 lg:px-12 border-b border-slate-200 bg-white/80 backdrop-blur-md z-40 sticky top-0 shrink-0 min-w-full">
        <div className="max-w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-medical-text tracking-tight flex items-center gap-3">
              Fluxo Assistencial Real
              <span className="text-[10px] bg-medical-primary/10 text-medical-primary px-3 py-1 rounded-full border border-medical-primary/20 font-sans uppercase tracking-widest">
                {filteredLeads.length} Pacientes Auditados
              </span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative w-80">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-medical-secondary/40" />
              <input 
                type="text" 
                placeholder="Buscar paciente real..."
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm text-medical-text shadow-sm focus:border-medical-accent transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAnalytics(true)}
              className="flex items-center space-x-3 px-6 py-2.5 bg-medical-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-medical-text transition-all shadow-clinical group"
            >
              <BarChart3 size={14} className="group-hover:scale-110 transition-transform" />
              <span>Diagnóstico do Fluxo</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 lg:px-12 lg:py-8 bg-clinical-mesh overflow-visible">
        <div className="flex space-x-6 pb-20 overflow-visible" style={{ width: 'max-content', minWidth: '100%' }}>
          {columns.map(column => (
            <div 
              key={column.id} 
              className="w-80 flex flex-col h-fit flex-shrink-0"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between mb-5 px-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${column.color} shadow-sm shadow-${column.color}/40`}></div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-medical-text">{column.label}</h3>
                  <span className="bg-white text-medical-secondary text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                    {getLeadsByColumn(column.id).length}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-[2.5rem] p-3 border border-slate-200/60 space-y-4 shadow-inner min-h-[600px]">
                {getLeadsByColumn(column.id).map(lead => (
                  <KanbanCard 
                    key={lead.id} 
                    lead={lead} 
                    onClick={() => navigate(`/leads?highlight=${lead.id}`)}
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                  />
                ))}
                {getLeadsByColumn(column.id).length === 0 && (
                  <div className="flex flex-col items-center justify-center opacity-10 text-center p-8 mt-20">
                    <column.icon size={48} className="mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest italic">Aguardando Progressão</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAnalytics && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowAnalytics(false)}></div>
          <div className="relative bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 sm:px-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-5">
                <div className="p-3 bg-medical-primary text-white rounded-2xl shadow-clinical">
                   <Target size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-serif font-bold text-medical-text">Análise de Conversão Real</h2>
                   <p className="text-xs text-medical-text/50 font-medium">Diagnóstico assistencial baseado no histórico do banco</p>
                </div>
              </div>
              <button onClick={() => setShowAnalytics(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 sm:p-14 space-y-12 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-medical-primary rounded-[3rem] shadow-professional p-12 flex flex-col relative overflow-hidden group h-fit">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-10">
                      <div className="p-3 bg-white rounded-2xl shadow-sm"><Bot size={32} className="text-medical-secondary" /></div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">IA Strategic Analysis</h3>
                    </div>
                    <div className="space-y-6">
                      {loadingAi ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <RefreshCcw size={28} className="text-medical-accent animate-spin" />
                          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest animate-pulse">Lendo Prontuários...</span>
                        </div>
                      ) : (
                        <div className="space-y-6 text-white/90">
                          {aiAnalysis.split('\n').map((line, i) => (
                            line.trim() && (
                              <div key={i} className="flex items-start gap-5 bg-white/10 p-6 rounded-[2rem] border border-white/10">
                                <div className="w-2.5 h-2.5 rounded-full bg-medical-accent mt-2 shrink-0"></div>
                                <span className="text-[13px] leading-relaxed font-medium">{line.replace(/^[•\-\*]\s*/, '').trim()}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-8">
                  <h3 className="text-xs font-bold text-medical-secondary uppercase tracking-widest flex items-center"><Ban size={18} className="mr-3 text-medical-alert" /> Motivos de Recusa</h3>
                  <div className="space-y-4">
                    {refusalStats.length > 0 ? refusalStats.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-6 p-6 bg-slate-50/80 rounded-[2rem] border border-slate-100">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-medical-primary shadow-sm">{item.percentage}%</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-medical-text truncate uppercase tracking-tighter mb-2">{item.name}</p>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-medical-alert" style={{ width: `${item.percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )) : <div className="py-20 text-center opacity-30 italic text-sm text-slate-400">Sem dados de recusa no momento.</div>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 sm:px-12 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Info size={14} className="text-medical-secondary" /> Auditoria Real</div>
               <button onClick={() => setShowAnalytics(false)} className="px-12 py-3 bg-medical-text text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl shadow-lg">Retornar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KanbanCard: React.FC<{ lead: UILead; onClick: () => void; onDragStart: (e: React.DragEvent) => void }> = ({ lead, onClick, onDragStart }) => {
  return (
    <div 
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      className={`bg-white p-5 rounded-[2.2rem] border shadow-sm hover:shadow-professional transition-all duration-300 cursor-grab active:cursor-grabbing group relative overflow-hidden ${lead.stage === LeadStage.RECUSADO ? 'border-medical-alert/20 bg-medical-alert/[0.01]' : 'border-slate-200/60'}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${lead.stage === LeadStage.RECUSADO ? 'bg-medical-alert' : lead.followUp.priority === 'alta' ? 'bg-medical-accent' : 'bg-slate-100 group-hover:bg-medical-primary'} transition-colors`}></div>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border ${lead.stage === LeadStage.RECUSADO ? 'text-medical-alert border-medical-alert/20 bg-medical-alert/5' : 'text-medical-secondary/60 border-slate-100 bg-slate-50'}`}>
          {lead.stage.toUpperCase()}
        </span>
        <Clock size={10} className="text-slate-300" />
      </div>
      <h4 className="text-[14px] font-bold text-medical-text mb-0.5 group-hover:text-medical-primary transition-colors leading-tight truncate">{lead.patientName}</h4>
      <p className="text-[11px] text-medical-text/40 italic mb-4 line-clamp-1">{lead.interestExam}</p>
      <div className={`mb-4 p-3 rounded-2xl border flex items-start gap-2 ${lead.stage === LeadStage.RECUSADO ? 'bg-medical-alert/5 border-medical-alert/10' : 'bg-slate-50 border-slate-100'}`}>
        {lead.stage === LeadStage.RECUSADO ? (
          <>
            <Ban size={11} className="text-medical-alert shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-medical-alert uppercase tracking-tighter line-clamp-2 leading-tight">Objeção: {lead.refusalReason}</p>
          </>
        ) : (
          <>
            <Calendar size={11} className="text-medical-secondary shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-medical-text uppercase tracking-tighter line-clamp-1 leading-tight">{lead.scheduleDetails || 'Aguardando Agendamento'}</p>
          </>
        )}
      </div>
      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
             <Phone size={10} className="mr-1.5 text-medical-secondary/40" /> {lead.phoneNumber}
        </div>
        <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-medical-primary group-hover:text-white transition-all">
          <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
};
