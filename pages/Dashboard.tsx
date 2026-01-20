
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '../contexts/LeadContext';
import { LeadStage, Insight, UILead, FollowUpStatus } from '../types';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Area, AreaChart, Cell
} from 'recharts';
import { 
  Users, CalendarCheck, Stethoscope, Sparkles, TrendingUp, Info, 
  Target, Activity, Clock, ChevronRight, AlertCircle, HeartPulse, 
  CreditCard, Bot, ArrowUpRight, CheckCircle2, MessageSquare
} from 'lucide-react';
import { generateLeadInsights } from '../services/geminiService';

const getTooltipStyle = () => ({ 
  backgroundColor: '#ffffff', 
  border: '1px solid #e2e8f0', 
  borderRadius: '12px', 
  color: '#1e293b',
  fontSize: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' 
});

export const Dashboard: React.FC = () => {
  const { leads, loading, error } = useLeads();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const navigate = useNavigate();

  // KPIs REAIS DO BANCO
  const totalPatients = leads.length;
  
  // Comp. Confirmado: LeadStage.CONFIRMADO
  const confirmedAttendance = leads.filter(l => l.stage === LeadStage.CONFIRMADO).length;
  const attendanceRate = totalPatients > 0 ? ((confirmedAttendance / totalPatients) * 100).toFixed(1) : '0';
  
  // Triagens IA: LeadStage.TRIAGEM
  const triagesInIA = leads.filter(l => l.stage === LeadStage.TRIAGEM).length;

  // Pendências > 24h: Pendente (Novos Pacientes) criados há mais de 24h
  const pendingAttendance = leads.filter(l => {
    if (l.stage !== LeadStage.RECEBIDO) return false;
    const hoursSinceCreated = (new Date().getTime() - l.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated > 24;
  }).length;

  // Dados para Gráficos Reais
  const examStats = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const exam = l.interestExam || 'Consulta Geral';
      counts[exam] = (counts[exam] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('pt-BR', { weekday: 'short' });
    });

    const dataMap: Record<string, number> = {};
    last7Days.forEach(day => dataMap[day] = 0);

    leads.forEach(l => {
      const day = new Date(l.createdAt).toLocaleDateString('pt-BR', { weekday: 'short' });
      if (dataMap[day] !== undefined) dataMap[day]++;
    });

    return last7Days.map(name => ({ name, comparecimentos: dataMap[name] }));
  }, [leads]);

  const recentActivities = useMemo(() => {
    return [...leads]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
  }, [leads]);

  useEffect(() => {
    if (leads.length > 0) {
      setLoadingInsights(true);
      generateLeadInsights(leads)
        .then((res) => {
          if (res && res.length > 0) setInsights(res);
        })
        .catch(err => console.error("Falha ao carregar insights:", err))
        .finally(() => setLoadingInsights(false));
    }
  }, [leads]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-medical-bg">
        <div className="flex flex-col items-center">
            <Activity className="w-12 h-12 text-medical-accent mb-4 animate-pulse" />
            <span className="text-sm font-bold tracking-widest text-medical-primary uppercase">Sincronizando prontuários reais...</span>
        </div>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center space-x-2 text-[10px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-2">
            <span>ULTRAMED</span>
            <ChevronRight size={10} />
            <span className="text-medical-primary">Performance Hospitalar Real</span>
          </nav>
          <h1 className="text-4xl font-serif font-bold text-medical-text tracking-tight">Painel Assistencial</h1>
        </div>
        
        <div className="flex items-center space-x-2 bg-white p-2 px-4 rounded-full border border-slate-200 shadow-sm">
          <Clock size={16} className="text-medical-accent" />
          <span className="text-[11px] font-bold text-medical-text uppercase tracking-wider">Dados em Tempo Real</span>
        </div>
      </header>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <KPICard label="Novos Pacientes" value={leads.filter(l => l.stage === LeadStage.RECEBIDO).length.toString()} icon={Users} />
          <KPICard label="Triagens IA" value={triagesInIA.toString()} icon={Bot} color="brand" />
          <KPICard label="Em Comparecimento" value={leads.filter(l => l.stage === LeadStage.COMPARECIMENTO).length.toString()} icon={Clock} color="brand" />
          <KPICard label="Comp. Confirmados" value={confirmedAttendance.toString()} icon={CheckCircle2} color="success" />
          <KPICard label="Não Compareceram" value={leads.filter(l => l.stage === LeadStage.RECUSADO).length.toString()} icon={AlertCircle} color="alert" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-clinical flex flex-col h-[400px]">
            <h3 className="text-[11px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-8">Demanda por Exame</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examStats} layout="vertical" margin={{ left: -10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={110} stroke="#1e293b" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                        <Tooltip contentStyle={getTooltipStyle()} cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                          {examStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0891b2' : '#1e40af'} />
                          ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-clinical lg:col-span-2 flex flex-col h-[400px]">
            <h3 className="text-[11px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-8">Volume de Triagens Reais</h3>
            <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                        <defs>
                            <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#1e293b" fontSize={11} tickLine={false} axisLine={false} dy={10} fontWeight="bold" />
                        <YAxis stroke="#1e293b" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                        <Tooltip contentStyle={getTooltipStyle()} />
                        <Area type="monotone" dataKey="comparecimentos" stroke="#1e40af" strokeWidth={4} fillOpacity={1} fill="url(#colorAttend)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-clinical p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-bold text-medical-secondary uppercase tracking-[0.2em] flex items-center">
              <HistoryIcon size={16} className="mr-2" /> Atividade Recente Real
            </h3>
            <button 
              onClick={() => navigate('/funnel')}
              className="text-[10px] font-bold text-medical-primary uppercase hover:underline"
            >
              Ver Fluxo Completo
            </button>
          </div>
          <div className="space-y-6">
            {recentActivities.length > 0 ? recentActivities.map(lead => (
              <ActivityItem key={lead.id} lead={lead} onClick={() => navigate(`/leads?highlight=${lead.id}`)} />
            )) : (
              <p className="text-center py-10 text-slate-400 italic text-sm">Nenhuma atividade registrada.</p>
            )}
          </div>
        </div>

        <div className="bg-medical-primary rounded-[2.5rem] shadow-professional p-10 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-125"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-bold text-medical-secondary uppercase tracking-[0.2em] flex items-center">
                <Sparkles size={16} className="mr-2" /> Insights Clínicos IA
              </h3>
              {loadingInsights && <Activity size={14} className="text-white animate-spin" />}
            </div>
            <div className="flex-1 space-y-6">
              {insights.length > 0 ? insights.map((insight, idx) => (
                <InsightCard key={insight.id} insight={insight} />
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
                  <Bot size={40} className="text-white" />
                  <p className="text-sm text-white/70 italic">
                    {loadingInsights ? 'Gerando diagnósticos operacionais...' : 'Aguardando massa de dados para análise estratégica.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ 
  label: string, 
  value: string, 
  icon: any, 
  color?: 'brand' | 'success' | 'alert' 
}> = ({ label, value, icon: Icon, color }) => {
  const colors = {
    brand: 'text-medical-primary',
    success: 'text-medical-success',
    alert: 'text-medical-alert',
    default: 'text-medical-secondary'
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-clinical hover:shadow-professional transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-slate-50 shadow-sm border border-slate-100">
              <Icon size={20} className={color ? colors[color] : colors.default} />
            </div>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-medical-secondary block mb-1">{label}</span>
          <p className="text-2xl font-serif font-bold text-medical-text">{value}</p>
        </div>
    </div>
  );
}

const ActivityItem: React.FC<{ lead: UILead; onClick: () => void }> = ({ lead, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-start space-x-4 p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group"
  >
    <div className="relative">
      <div className="w-10 h-10 rounded-xl bg-medical-bg border border-slate-200 flex items-center justify-center font-bold text-medical-primary text-xs shadow-sm group-hover:bg-medical-primary group-hover:text-white transition-colors">
        {lead.patientName.charAt(0)}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-bold text-medical-text truncate">{lead.patientName}</h4>
        <span className="text-[9px] font-bold text-slate-400 uppercase">
          {lead.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-tight">
        Fase: <span className="font-bold text-medical-secondary">{lead.stage}</span> • {lead.interestExam}
      </p>
    </div>
    <ChevronRight size={14} className="text-slate-300 group-hover:text-medical-primary mt-3" />
  </div>
);

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => (
  <div className="bg-white/10 border border-white/20 rounded-3xl p-6 transition-all hover:bg-white/15">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl ${insight.type === 'alert' ? 'bg-medical-alert/20 text-medical-alert' : 'bg-medical-secondary/20 text-medical-secondary'}`}>
          {insight.type === 'alert' ? <AlertCircle size={14} /> : <TrendingUp size={14} />}
        </div>
        <h4 className="text-xs font-bold text-white tracking-wide uppercase">{insight.title}</h4>
      </div>
      <ArrowUpRight size={14} className="text-white/40" />
    </div>
    <p className="text-xs text-white/80 leading-relaxed mb-4 italic">
      "{insight.details.what}"
    </p>
    <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3">
       <CheckCircle2 size={12} className="text-medical-secondary" />
       <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Sugestão: {insight.details.recommendation}</span>
    </div>
  </div>
);

const HistoryIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);
