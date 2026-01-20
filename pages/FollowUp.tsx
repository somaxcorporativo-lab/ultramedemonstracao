
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLeads } from '../contexts/LeadContext';
import { supabase } from '../services/supabaseClient';
import { UILead, FollowUpPriority, FollowUpStatus, LeadStage } from '../types';
import { 
  Bot, X, Phone, Clock, ChevronRight, Activity, 
  CheckCircle2, Calendar, RefreshCcw, AlertCircle, 
  Target, Users, MessageSquare, Send, ShieldCheck, HeartPulse,
  Star, Zap, Stethoscope, Save, Trash2, Info
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

type ViewMode = 'assistencial' | 'premium';
type AssistencialFilter = '48h' | '96h' | 'retencao' | 'todos';

interface PremiumExamRule {
  id: string;
  name: string;
  defaultInterval: number;
  icon: any;
}

const PREMIUM_EXAMS: PremiumExamRule[] = [
  { id: 'morf1', name: 'Ultrassonografia Morfológica do 1º Trimestre', defaultInterval: 3, icon: HeartPulse },
  { id: 'morf2', name: 'Ultrassonografia Morfológica do 2º Trimestre', defaultInterval: 0, icon: HeartPulse },
  { id: 'abd_total', name: 'Ultrassonografia de Abdome Total', defaultInterval: 12, icon: Activity },
  { id: 'transvaginal', name: 'Ultrassonografia Transvaginal', defaultInterval: 9, icon: ShieldCheck },
  { id: 'mamaria', name: 'Ultrassonografia Mamária', defaultInterval: 12, icon: Activity },
  { id: 'tireoide', name: 'Ultrassonografia de Tireoide com Doppler', defaultInterval: 12, icon: Stethoscope },
  { id: 'rins', name: 'Ultrassonografia de Rins e Vias Urinárias', defaultInterval: 12, icon: Activity },
  { id: 'obstetrica', name: 'Ultrassonografia Obstétrica/Gestacional', defaultInterval: 1, icon: HeartPulse },
  { id: 'doppler_obs', name: 'Ultrassonografia Doppler Obstétrica', defaultInterval: 0, icon: HeartPulse },
  { id: 'abd_inf', name: 'Ultrassonografia de Abdome Inferior', defaultInterval: 12, icon: Activity },
  { id: 'abd_sup', name: 'Ultrassonografia de Abdome Superior', defaultInterval: 12, icon: Activity },
];

export const FollowUp: React.FC = () => {
  const { leads, loading, refreshLeads } = useLeads();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  
  const [viewMode, setViewMode] = useState<ViewMode>('assistencial');
  const [assistencialFilter, setAssistencialFilter] = useState<AssistencialFilter>('todos');
  const [selectedLead, setSelectedLead] = useState<UILead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [examIntervals, setExamIntervals] = useState<Record<string, number>>(() => {
    const intervals: Record<string, number> = {};
    PREMIUM_EXAMS.forEach(ex => intervals[ex.id] = ex.defaultInterval);
    return intervals;
  });

  // Estados do Formulário de Reengajamento
  const [formData, setFormData] = useState({
    mensagem_followup: '',
    prioridade_followup: FollowUpPriority.INDEFINIDA,
    data_followup: '',
    justificativa_followup: ''
  });

  // Lógica de Categorização Assistencial por tempo sem resposta
  const categorizedLeads = useMemo(() => {
    const now = new Date().getTime();
    const buckets = {
      '48h': [] as UILead[],
      '96h': [] as UILead[],
      'retencao': [] as UILead[],
      'recentes': [] as UILead[]
    };

    leads.forEach(lead => {
      // Ignorar finalizados ou recusados na visualização assistencial de pendências
      if (lead.stage === LeadStage.CONFIRMADO || lead.stage === LeadStage.RECUSADO) return;

      const diffHours = (now - lead.updatedAt.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 168) { // 7 dias
        buckets['retencao'].push(lead);
      } else if (diffHours >= 96) { // 4 dias
        buckets['96h'].push(lead);
      } else if (diffHours >= 48) { // 2 dias
        buckets['48h'].push(lead);
      } else {
        buckets['recentes'].push(lead);
      }
    });

    return buckets;
  }, [leads]);

  const filteredAssistencialLeads = useMemo(() => {
    if (assistencialFilter === 'todos') {
      return [...categorizedLeads['48h'], ...categorizedLeads['96h'], ...categorizedLeads['retencao']];
    }
    return categorizedLeads[assistencialFilter];
  }, [categorizedLeads, assistencialFilter]);

  // Carrega dados ao selecionar um lead
  useEffect(() => {
    if (selectedLead) {
      setFormData({
        mensagem_followup: selectedLead.followUp.message || '',
        prioridade_followup: selectedLead.followUp.priority || FollowUpPriority.INDEFINIDA,
        data_followup: selectedLead.followUp.nextDate 
          ? new Date(selectedLead.followUp.nextDate).toISOString().slice(0, 16) 
          : '',
        justificativa_followup: selectedLead.followUp.justification || ''
      });
    }
  }, [selectedLead]);

  useEffect(() => {
    if (patientIdParam && leads.length > 0) {
      const lead = leads.find(l => l.id === patientIdParam);
      if (lead) setSelectedLead(lead);
    }
  }, [patientIdParam, leads]);

  const handleGenerateAI = async () => {
    if (!selectedLead || !process.env.API_KEY) return;
    setIsGenerating(true);
    try {
      const { data: promptData } = await supabase
        .from('agent_prompts')
        .select('prompt')
        .eq('nome', 'agent_dashboard')
        .single();

      const systemInstruction = promptData?.prompt || "Atue como um especialista em reengajamento clínico.";

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const userPrompt = `
        Ação Requirida: Gere uma mensagem de reengajamento para o paciente abaixo.
        Paciente: ${selectedLead.patientName}
        Exame de Interesse: ${selectedLead.interestExam}
        Necessidade/Motivo: ${selectedLead.examReason}
        Objeção Identificada: ${selectedLead.refusalReason || "Nenhuma registrada"}
        
        Responda APENAS com o texto da mensagem para o WhatsApp e uma breve justificativa estratégica separados por "---".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction
        }
      });

      const [msg, just] = (response.text || "").split('---');
      setFormData(prev => ({
        ...prev,
        mensagem_followup: msg?.trim() || "",
        justificativa_followup: just?.trim() || "Abordagem baseada nos protocolos clínicos salvos."
      }));
    } catch (err) {
      console.error("Erro IA:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = async (newStatus: FollowUpStatus | null = null) => {
    if (!selectedLead) return;
    setIsProcessing(true);
    try {
      const updatePayload: any = {
        mensagem_followup: formData.mensagem_followup,
        prioridade_followup: formData.prioridade_followup,
        data_followup: formData.data_followup ? new Date(formData.data_followup).toISOString() : null,
        justificativa_followup: formData.justificativa_followup,
        updated_at: new Date().toISOString()
      };

      if (newStatus) {
        updatePayload.status_followup = newStatus;
      }

      const { error } = await supabase
        .from('Clinica')
        .update(updatePayload)
        .eq('id', selectedLead.id);

      if (error) throw error;
      await refreshLeads();
      setSelectedLead(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading && leads.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-medical-bg">
      <Activity className="animate-spin text-medical-primary" size={32} />
    </div>
  );

  return (
    <div className="p-8 lg:p-12 space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24">
      {/* CABEÇALHO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-medical-primary p-3 rounded-2xl shadow-clinical">
            <Phone className="text-white" size={24} />
          </div>
          <div>
            <nav className="flex items-center space-x-2 text-[10px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-1">
              <span>ULTRAMED</span>
              <ChevronRight size={10} />
              <span className="text-medical-primary">Gestão de Contatos</span>
            </nav>
            <h1 className="text-4xl font-serif font-bold text-medical-text tracking-tight">Follow-Up Assistencial</h1>
          </div>
        </div>
        
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setViewMode('assistencial')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              viewMode === 'assistencial' 
              ? 'bg-white text-medical-primary shadow-sm' 
              : 'text-slate-400 hover:text-medical-primary'
            }`}
          >
            Assistencial
          </button>
          <button 
            onClick={() => setViewMode('premium')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              viewMode === 'premium' 
              ? 'bg-medical-primary text-white shadow-md' 
              : 'text-slate-400 hover:text-medical-primary'
            }`}
          >
            <Star size={12} fill={viewMode === 'premium' ? 'white' : 'transparent'} />
            Premium
          </button>
        </div>
      </header>

      {viewMode === 'assistencial' ? (
        <>
          {/* ÁREA DE CARTÕES DE ORIENTAÇÃO (FUNCIONAIS) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OrientationCard 
              title="Alerta 48h" 
              icon={Clock} 
              count={categorizedLeads['48h'].length}
              isActive={assistencialFilter === '48h'}
              onClick={() => setAssistencialFilter(assistencialFilter === '48h' ? 'todos' : '48h')}
              message="“Oi! Verificamos que você ainda não confirmou seu comparecimento. Alguma dúvida sobre o preparo?”" 
            />
            <OrientationCard 
              title="Pendente 96h" 
              icon={AlertCircle} 
              count={categorizedLeads['96h'].length}
              isActive={assistencialFilter === '96h'}
              onClick={() => setAssistencialFilter(assistencialFilter === '96h' ? 'todos' : '96h')}
              message="“Olá! Notamos que sua triagem está aberta há alguns dias. Temos horários disponíveis para esta semana.”" 
              color="bg-medical-accent/5 border-medical-accent/20 text-medical-accent"
              activeColor="bg-medical-accent text-white border-medical-accent"
            />
            <OrientationCard 
              title="Retenção" 
              icon={ShieldCheck} 
              count={categorizedLeads['retencao'].length}
              isActive={assistencialFilter === 'retencao'}
              onClick={() => setAssistencialFilter(assistencialFilter === 'retencao' ? 'todos' : 'retencao')}
              message="“Deseja manter sua prioridade para o exame de imagem ou podemos liberar seu horário para outro paciente?”" 
              color="bg-medical-secondary/5 border-medical-secondary/20 text-medical-secondary"
              activeColor="bg-medical-secondary text-white border-medical-secondary"
            />
          </section>

          {/* LISTA DE PACIENTES FILTRADA */}
          <section className="bg-white rounded-[3rem] border border-slate-200 shadow-clinical overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-medical-text uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-medical-secondary" /> 
                  Base de Acompanhamento {assistencialFilter !== 'todos' ? `(${assistencialFilter})` : '(Geral)'}
                </h3>
                {assistencialFilter !== 'todos' && (
                  <button 
                    onClick={() => setAssistencialFilter('todos')}
                    className="text-[10px] font-bold text-medical-primary uppercase tracking-widest hover:underline"
                  >
                    Ver Todos
                  </button>
                )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-medical-secondary font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Paciente</th>
                    <th className="px-8 py-5">Exame de Interesse</th>
                    <th className="px-8 py-5">Tempo s/ Resposta</th>
                    <th className="px-8 py-5 text-right">Abordagem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssistencialLeads.map(lead => {
                    const diffDays = Math.floor((new Date().getTime() - lead.updatedAt.getTime()) / (1000 * 3600 * 24));
                    return (
                      <tr 
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)} 
                        className={`cursor-pointer transition-colors group ${selectedLead?.id === lead.id ? 'bg-medical-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-medical-text">{lead.patientName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{lead.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-medical-text font-medium">{lead.interestExam}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border flex items-center gap-1.5 w-fit ${
                            diffDays >= 7 ? 'bg-medical-alert/10 text-medical-alert border-medical-alert/20' : 
                            diffDays >= 4 ? 'bg-medical-accent/10 text-medical-accent border-medical-accent/20' :
                            'bg-medical-secondary/10 text-medical-secondary border-medical-secondary/20'
                          }`}>
                            <Clock size={10} />
                            {diffDays} dias
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-[10px] font-bold text-medical-primary uppercase rounded-xl border border-slate-100 group-hover:bg-medical-primary group-hover:text-white transition-all">
                            Ação Individual <ChevronRight size={12} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAssistencialLeads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                        Nenhum registro encontrado nesta categoria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          {/* BANNER PREMIUM */}
          <div className="bg-medical-primary rounded-[3rem] p-10 shadow-professional relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Star className="text-white fill-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Reengajamento Premium Inteligente</h2>
                </div>
                <p className="text-white/70 font-medium max-w-xl">
                  Gestão proativa de ciclos de retorno periódico para exames de rotina. Melhore a retenção e o cuidado preventivo dos seus pacientes.
                </p>
              </div>
              <button className="bg-white text-medical-primary px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-medical-secondary hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Zap size={14} fill="currentColor" />
                Enviar Todos Automaticamente
              </button>
            </div>
          </div>

          {/* GRADE DE CATEGORIAS DE EXAME */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {PREMIUM_EXAMS.map(rule => (
              <PremiumExamCard 
                key={rule.id}
                rule={rule}
                leads={leads.filter(l => l.interestExam.toLowerCase().includes(rule.name.toLowerCase()))}
                interval={examIntervals[rule.id]}
                onIntervalChange={(val) => setExamIntervals(prev => ({ ...prev, [rule.id]: val }))}
              />
            ))}
          </div>
        </section>
      )}

      {/* PAINEL LATERAL (FLEXIBLE FOR BOTH MODES) */}
      {selectedLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedLead(null)}></div>
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-medical-primary/10 text-medical-primary flex items-center justify-center font-bold text-lg border border-medical-primary/20">
                  {selectedLead.patientName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-medical-text">Follow-Up Individual</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-medical-primary">{selectedLead.patientName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.phoneNumber}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 shadow-sm border border-slate-100">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Exame de Interesse</span>
                  <span className="text-[11px] font-bold text-medical-text block">{selectedLead.interestExam}</span>
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Fase Atual</span>
                  <span className="text-[10px] font-bold text-medical-accent uppercase block">{selectedLead.stage}</span>
                </div>
              </div>

              <div className="bg-medical-primary/5 p-6 rounded-[2rem] border border-medical-primary/10 flex items-start gap-4">
                <HeartPulse className="text-medical-primary mt-1 shrink-0" size={20} />
                <div>
                  <h4 className="text-[10px] font-bold text-medical-primary uppercase tracking-[0.2em] mb-2">Histórico Assistencial</h4>
                  <p className="text-xs text-medical-text italic leading-relaxed">
                    {selectedLead.examReason || "Paciente aguarda confirmação de agenda clínica."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-medical-secondary uppercase tracking-[0.2em]">Mensagem de Reengajamento</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-medical-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-medical-primary hover:text-white transition-all border border-medical-primary/20"
                    >
                      {isGenerating ? <RefreshCcw size={12} className="animate-spin" /> : <Bot size={14} />}
                      <span>Sugestão IA</span>
                    </button>
                    <button 
                      onClick={() => handleAction()}
                      disabled={isProcessing}
                      className="flex items-center space-x-2 px-4 py-2 bg-medical-success text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-medical-text transition-all shadow-md active:scale-95"
                    >
                      <Save size={14} />
                      <span>Salvar Mensagem</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Corpo da Mensagem (Editável)</label>
                    <textarea 
                      className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm h-48 resize-none outline-none focus:bg-white focus:border-medical-primary transition-all shadow-inner leading-relaxed placeholder:italic"
                      value={formData.mensagem_followup}
                      onChange={e => setFormData({...formData, mensagem_followup: e.target.value})}
                      placeholder="Personalize a abordagem para o paciente..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Prioridade</label>
                      <select 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-medical-text outline-none focus:border-medical-primary shadow-sm"
                        value={formData.prioridade_followup}
                        onChange={e => setFormData({...formData, prioridade_followup: e.target.value as FollowUpPriority})}
                      >
                        <option value={FollowUpPriority.INDEFINIDA}>Indefinida</option>
                        <option value={FollowUpPriority.BAIXA}>Baixa</option>
                        <option value={FollowUpPriority.MEDIA}>Média</option>
                        <option value={FollowUpPriority.ALTA}>Alta</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Previsão de Retorno</label>
                      <input 
                        type="datetime-local" 
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-medical-text focus:border-medical-primary outline-none shadow-sm"
                        value={formData.data_followup}
                        onChange={e => setFormData({...formData, data_followup: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
               <button 
                 onClick={() => setSelectedLead(null)}
                 className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-medical-alert transition-all"
               >
                 Fechar Painel
               </button>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleAction(FollowUpStatus.SCHEDULED)}
                    disabled={isProcessing}
                    className="flex-1 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-medical-text uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <RefreshCcw size={14} className="animate-spin" /> : <Clock size={16} />}
                    Agendar Retorno
                  </button>
                  <button 
                    onClick={() => handleAction(FollowUpStatus.SENT)}
                    disabled={isProcessing}
                    className="flex-1 px-10 py-4 bg-medical-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-medical-text transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isProcessing ? <RefreshCcw size={14} className="animate-spin" /> : <Send size={16} />}
                    Confirmar Envio
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrientationCard: React.FC<{ 
  title: string, 
  message: string, 
  icon: any, 
  count: number,
  isActive: boolean,
  onClick: () => void,
  color?: string,
  activeColor?: string
}> = ({ title, message, icon: Icon, count, isActive, onClick, color, activeColor }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-7 rounded-[2.5rem] border transition-all duration-300 cursor-pointer shadow-clinical relative group overflow-hidden ${
        isActive 
          ? (activeColor || 'bg-medical-primary text-white border-medical-primary scale-[1.02]') 
          : (color || 'bg-white border-slate-200 hover:border-medical-primary/30')
      }`}
    >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20' : (color ? 'bg-white/50' : 'bg-medical-primary/10')}`}>
              <Icon size={18} className={isActive ? 'text-white' : (color ? 'text-current' : 'text-medical-primary')} />
            </div>
            <span className={`text-[12px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : (color ? 'text-current' : 'text-medical-secondary')}`}>{title}</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isActive ? 'bg-white text-medical-primary' : 'bg-medical-primary text-white'}`}>
            {count}
          </div>
        </div>
        <p className={`text-[13px] leading-relaxed italic font-medium relative z-10 ${isActive ? 'text-white/90' : (color ? 'text-current opacity-80' : 'text-medical-text')}`}>
          {message}
        </p>
        <div className={`absolute right-0 bottom-0 p-4 transition-transform ${isActive ? 'scale-100' : 'scale-0'}`}>
          <CheckCircle2 size={16} />
        </div>
    </div>
  );
};

const PremiumExamCard: React.FC<{ 
  rule: PremiumExamRule; 
  leads: UILead[]; 
  interval: number;
  onIntervalChange: (val: number) => void;
}> = ({ rule, leads, interval, onIntervalChange }) => {
  const [customMsg, setCustomMsg] = useState('');

  const generateDefaultMessage = (lead: UILead) => {
    const formattedLast = lead.updatedAt.toLocaleDateString('pt-BR');
    return `Olá ${lead.patientName}, seu último exame de ${rule.name} foi realizado em ${formattedLast}. Recomendamos retornar para manutenção da saúde hoje ou o mais breve possível.`;
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-clinical flex flex-col h-[650px] overflow-hidden group hover:border-medical-primary/30 transition-all">
      <div className="p-8 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-medical-primary">
            <rule.icon size={24} />
          </div>
          <div className="bg-medical-primary text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
            {leads.length} Pacientes
          </div>
        </div>
        <h3 className="text-sm font-bold text-medical-text uppercase tracking-widest mb-6 leading-tight min-h-[40px]">{rule.name}</h3>
        
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest">Ciclo (meses)</span>
          <input 
            type="number" 
            className="w-16 bg-transparent text-right font-bold text-medical-primary outline-none text-sm"
            value={interval}
            onChange={(e) => onIntervalChange(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-clinical-mesh/10">
        {leads.length > 0 ? leads.map(lead => (
          <div key={lead.id} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-medical-primary text-white flex items-center justify-center font-bold text-sm">
                  {lead.patientName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-medical-text leading-tight">{lead.patientName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{lead.phoneNumber}</span>
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[8px] font-bold text-medical-secondary tracking-widest uppercase">DEMO</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-bold text-medical-secondary uppercase tracking-[0.2em] ml-1">Mensagem Customizada</label>
              <textarea 
                className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-[11px] h-24 resize-none outline-none focus:border-medical-primary shadow-sm leading-relaxed italic text-medical-text/70"
                value={customMsg || generateDefaultMessage(lead)}
                onChange={(e) => setCustomMsg(e.target.value)}
              />
              <button className="flex items-center gap-2 text-[9px] font-bold text-medical-primary uppercase tracking-widest hover:underline px-1">
                <Save size={12} /> Salvar Alterações
              </button>
            </div>

            <div className="p-4 bg-medical-primary/5 rounded-2xl border border-medical-primary/10 space-y-3">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-medical-secondary opacity-60">
                <span>Último Exame</span>
                <span>{lead.updatedAt.toLocaleDateString('pt-BR')}</span>
              </div>
              <button className="w-full py-3 bg-medical-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-medical-text transition-all flex items-center justify-center gap-2 active:scale-95">
                <Send size={12} /> Enviar Mensagem
              </button>
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4 py-20">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200">
              <Info size={32} className="text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-medical-text">Célula Vazia</p>
              <p className="text-[9px] text-slate-400 mt-1 max-w-[140px] mx-auto">Nenhum paciente identificado neste protocolo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
