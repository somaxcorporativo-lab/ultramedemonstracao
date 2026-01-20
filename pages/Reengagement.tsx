
import React, { useState, useMemo } from 'react';
import { useLeads } from '../contexts/LeadContext';
import { supabase } from '../services/supabaseClient';
import { UILead, FollowUpStatus } from '../types';
import { 
  Star, Search, Calendar, ChevronRight, Activity, 
  RefreshCcw, HeartPulse, Stethoscope, Send, CheckCircle2,
  Clock, Filter, ShieldCheck, AlertCircle
} from 'lucide-react';

interface ExamRule {
  id: string;
  name: string;
  intervalMonths: number;
  nextStepLabel: string;
  icon: any;
}

const EXAM_RULES: ExamRule[] = [
  { id: 'morf1', name: 'Ultrassonografia Morfológica do 1º Trimestre', intervalMonths: 3, nextStepLabel: 'Morf. 2º Trimestre', icon: HeartPulse },
  { id: 'abd_total', name: 'Ultrassonografia de Abdome Total', intervalMonths: 12, nextStepLabel: 'Manutenção Anual', icon: Activity },
  { id: 'transvaginal', name: 'Ultrassonografia Transvaginal', intervalMonths: 9, nextStepLabel: 'Controle Ginecológico', icon: ShieldCheck },
  { id: 'mamaria', name: 'Ultrassonografia Mamária', intervalMonths: 12, nextStepLabel: 'Check-up Anual', icon: Activity },
  { id: 'tireoide', name: 'Ultrassonografia de Tireoide com Doppler', intervalMonths: 12, nextStepLabel: 'Monitoramento Anual', icon: Stethoscope },
  { id: 'rins', name: 'Ultrassonografia de Rins e Vias Urinárias', intervalMonths: 12, nextStepLabel: 'Avaliação Renal', icon: Activity },
  { id: 'obstetrica', name: 'Ultrassonografia Obstétrica/Gestacional', intervalMonths: 1, nextStepLabel: 'Protocolo Pré-natal', icon: HeartPulse },
  { id: 'abd_inf', name: 'Ultrassonografia de Abdome Inferior', intervalMonths: 12, nextStepLabel: 'Manutenção Anual', icon: Activity },
  { id: 'abd_sup', name: 'Ultrassonografia de Abdome Superior', intervalMonths: 12, nextStepLabel: 'Manutenção Anual', icon: Activity },
];

export const Reengagement: React.FC = () => {
  const { leads, loading, refreshLeads } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const calculateReturnDate = (lastDate: Date, months: number) => {
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const getSuggestedReturn = (lead: UILead) => {
    const rule = EXAM_RULES.find(r => lead.interestExam?.toLowerCase().includes(r.name.toLowerCase()));
    const months = rule?.intervalMonths || 12;
    // Tenta usar a data do agendamento se existir, senão usa updatedAt
    const baseDate = lead.updatedAt;
    return calculateReturnDate(baseDate, months);
  };

  const generateMessage = (lead: UILead, returnDate: Date) => {
    const formattedLast = lead.updatedAt.toLocaleDateString('pt-BR');
    const formattedReturn = returnDate.toLocaleDateString('pt-BR');
    return `Olá ${lead.patientName}, seu último exame de ${lead.interestExam} foi realizado em ${formattedLast}. Recomendamos retornar para manutenção da saúde em ${formattedReturn}. Deseja agendar seu comparecimento?`;
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phoneNumber.includes(searchTerm) ||
      l.interestExam.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  const handleSendReengagement = async (lead: UILead) => {
    const returnDate = getSuggestedReturn(lead);
    const message = generateMessage(lead, returnDate);
    
    setIsProcessing(lead.id);
    try {
      const { error } = await supabase
        .from('Clinica')
        .update({
          status_followup: 'scheduled',
          mensagem_followup: message,
          data_followup: returnDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;
      await refreshLeads();
      alert(`Reengajamento agendado para ${lead.patientName}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar reengajamento.");
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-medical-bg">
        <div className="flex flex-col items-center">
            <Star className="w-12 h-12 text-medical-secondary mb-4 animate-spin" />
            <span className="text-sm font-bold tracking-widest text-medical-primary uppercase">Calculando Ciclos de Retorno...</span>
        </div>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <nav className="flex items-center space-x-2 text-[10px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-2">
            <span>ULTRAMED</span>
            <ChevronRight size={10} />
            <span className="text-medical-primary">Retenção de Pacientes</span>
          </nav>
          <h1 className="text-4xl font-serif font-bold text-medical-text tracking-tight flex items-center">
            <Star className="mr-4 text-medical-secondary fill-medical-secondary" size={32} /> Reengajamento Premium
          </h1>
          <p className="text-medical-text/60 mt-2 font-medium">Gestão automatizada de ciclos de retorno para manutenção da saúde.</p>
        </div>
        
        <div className="relative w-72">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Filtrar base de retorno..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none text-sm shadow-sm focus:border-medical-primary transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {EXAM_RULES.map(rule => {
          const patientsInRule = filteredLeads.filter(l => l.interestExam?.toLowerCase().includes(rule.name.toLowerCase()));
          
          return (
            <div key={rule.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-clinical flex flex-col h-[500px] overflow-hidden group hover:border-medical-secondary/30 transition-all">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <rule.icon size={20} className="text-medical-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-medical-text uppercase tracking-widest line-clamp-1">{rule.name}</h3>
                    <span className="text-[10px] font-bold text-medical-secondary uppercase">Ciclo: {rule.intervalMonths} meses</span>
                  </div>
                </div>
                <div className="bg-medical-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {patientsInRule.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {patientsInRule.length > 0 ? patientsInRule.map(lead => {
                  const returnDate = getSuggestedReturn(lead);
                  const isScheduled = lead.followUp.status === FollowUpStatus.SCHEDULED;
                  
                  return (
                    <div key={lead.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4 border-l-4 border-l-medical-accent">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-medical-text">{lead.patientName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{lead.phoneNumber}</p>
                        </div>
                        {isScheduled && <CheckCircle2 size={16} className="text-medical-success" />}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-medical-secondary font-bold uppercase mb-1">Sugestão de Retorno:</p>
                        <p className="text-xs text-medical-text leading-relaxed italic">
                          "{generateMessage(lead, returnDate)}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase">
                          <Calendar size={12} className="mr-1.5" /> {returnDate.toLocaleDateString('pt-BR')}
                        </div>
                        <button 
                          onClick={() => handleSendReengagement(lead)}
                          disabled={isProcessing === lead.id || isScheduled}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isScheduled 
                            ? 'bg-medical-success/10 text-medical-success cursor-default' 
                            : 'bg-medical-primary text-white hover:bg-medical-text shadow-md active:scale-95'
                          }`}
                        >
                          {isProcessing === lead.id ? (
                            <RefreshCcw size={12} className="animate-spin" />
                          ) : isScheduled ? (
                            <>Agendado</>
                          ) : (
                            <><Send size={12} /> Agendar</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                    <Activity size={40} className="mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Nenhum paciente neste protocolo</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center space-x-2 text-[9px] font-bold text-medical-secondary uppercase tracking-widest">
                  <AlertCircle size={10} />
                  <span>Próxima etapa: {rule.nextStepLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
