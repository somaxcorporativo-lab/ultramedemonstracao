
import React, { useState, useEffect } from 'react';
import { Bot, Save, History, Stethoscope, Sparkles, ChevronRight, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const AiCustomization: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Carrega o prompt real do Supabase ao iniciar
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('agent_prompts')
          .select('prompt, updated_at')
          .eq('nome', 'agent_dashboard')
          .single();

        if (error) {
          console.error("Erro ao buscar prompt:", error);
          // Caso a tabela ou registro não exista, inicializamos vazio ou tratamos
          setPrompt('');
        } else if (data) {
          setPrompt(data.prompt || '');
          setLastSaved(data.updated_at ? new Date(data.updated_at) : null);
        }
      } catch (err) {
        console.error("Falha na conexão com Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompt();
  }, []);

  const handleSave = async () => {
    if (isLoading) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_prompts')
        .upsert({ 
          nome: 'agent_dashboard', 
          prompt: prompt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'nome' });

      if (error) throw error;
      
      setLastSaved(new Date());
      alert("Personalidade Assistencial atualizada no Supabase!");
    } catch (err) {
      console.error("Erro ao salvar prompt:", err);
      alert("Erro ao salvar o prompt. Verifique as permissões da tabela 'agent_prompts'.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <nav className="flex items-center space-x-2 text-[10px] font-bold text-medical-secondary uppercase tracking-[0.2em] mb-2">
            <span>ULTRAMED</span>
            <ChevronRight size={10} />
            <span className="text-medical-primary">Cérebro da IA</span>
          </nav>
          <h1 className="text-4xl font-serif font-bold text-medical-text tracking-tight flex items-center">
            <Bot className="mr-4 text-medical-primary" size={32} /> Cérebro da IA - Editor de Prompt
          </h1>
          <p className="text-medical-text/60 mt-2 font-medium">Configure a identidade e as instruções do agente assistencial no Supabase.</p>
        </div>
        <div className="flex items-center space-x-3">
             <div className="px-4 py-2 rounded-full bg-medical-success/10 border border-medical-success/20 text-medical-success text-[10px] font-bold uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 rounded-full bg-medical-success mr-2 animate-pulse"></span>
                Conexão Real Supabase Ativa
             </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-clinical overflow-hidden flex flex-col h-[650px]">
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-medical-secondary">Personalidade Assistencial</span>
                      {isLoading && <RefreshCcw size={12} className="animate-spin text-medical-primary" />}
                    </div>
                    <Sparkles size={16} className="text-medical-accent opacity-50" />
                </div>
                <div className="flex-1 relative bg-white">
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                         <div className="flex flex-col items-center gap-4">
                            <RefreshCcw size={32} className="animate-spin text-medical-primary" />
                            <span className="text-xs font-bold uppercase text-medical-secondary">Carregando Prompt do Banco...</span>
                         </div>
                      </div>
                    ) : (
                      <textarea 
                          className="w-full h-full bg-transparent text-medical-text font-medium text-sm p-10 outline-none resize-none leading-relaxed italic placeholder:text-slate-300"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Digite aqui o prompt do sistema para o agente (será salvo em agent_prompts)..."
                          spellCheck={false}
                      />
                    )}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-[10px] font-bold text-medical-secondary uppercase tracking-widest flex items-center">
                        <History size={14} className="mr-2"/> 
                        Último Sincronismo: {lastSaved ? lastSaved.toLocaleString('pt-BR') : 'Ainda não salvo'}
                    </span>
                    <button 
                      onClick={handleSave} 
                      disabled={isSaving || isLoading} 
                      className="w-full sm:w-auto px-10 py-4 bg-medical-primary hover:bg-medical-text text-white text-sm font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
                    >
                        {isSaving ? (
                          <>
                            <RefreshCcw size={18} className="mr-2 animate-spin" />
                            Salvando no Supabase...
                          </>
                        ) : (
                          <>
                            <Save size={18} className="mr-2" />
                            Salvar Protocolo
                          </>
                        )}
                    </button>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-clinical">
                <h3 className="text-medical-text font-bold mb-6 flex items-center uppercase tracking-widest text-xs">
                    <CheckCircle2 className="w-4 h-4 text-medical-success mr-2" />
                    Status do Agente
                </h3>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tabela</span>
                      <span className="text-xs font-bold text-medical-text uppercase">agent_prompts</span>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Registro</span>
                      <span className="text-xs font-bold text-medical-text uppercase">agent_dashboard</span>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Impacto</span>
                      <span className="text-xs font-bold text-medical-secondary uppercase leading-tight block">Todo o sistema utiliza este prompt como System Instruction.</span>
                   </div>
                </div>
            </div>

            <div className="bg-medical-primary p-8 rounded-[2rem] border border-medical-primary shadow-professional text-white">
                <Stethoscope className="mb-4 opacity-50" size={32} />
                <h4 className="font-serif font-bold text-xl mb-2">Protocolo Dinâmico</h4>
                <p className="text-sm text-white/70 leading-relaxed italic">
                  "O Supabase agora é o único cérebro. Qualquer alteração aqui reflete instantaneamente em como a IA trata seus pacientes e exames."
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
