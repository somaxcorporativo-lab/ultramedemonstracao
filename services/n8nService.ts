
import { supabase } from './supabaseClient';
import { UILead, N8NFollowUpResponse, FollowUpPriority, LeadStage } from '../types';

const AGENT_NAME = 'n8n_followup_medical_agent';

export const getGlobalFollowUpPrompt = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('system_prompt')
      .eq('agent_name', AGENT_NAME)
      .single();

    if (error || !data) {
      return `Gere uma mensagem ética e humana de acompanhamento para um paciente que iniciou triagem na ULTRAMED, mas não concluiu o agendamento do exame.`;
    }
    return data.system_prompt;
  } catch (err) {
    return `Gere uma mensagem humana de acompanhamento para triagem diagnóstica.`;
  }
};

export const saveGlobalFollowUpPrompt = async (prompt: string): Promise<boolean> => {
  try {
    const { data: existing } = await supabase
      .from('ai_settings')
      .select('id')
      .eq('agent_name', AGENT_NAME)
      .single();

    if (existing) {
      await supabase
        .from('ai_settings')
        .update({ system_prompt: prompt, updated_at: new Date().toISOString() })
        .eq('agent_name', AGENT_NAME);
    } else {
      await supabase
        .from('ai_settings')
        .insert([{ agent_name: AGENT_NAME, system_prompt: prompt }]);
    }
    return true;
  } catch (err) {
    return true;
  }
};

export const generateN8NStrategy = async (
  lead: UILead, 
  customPrompt: string, 
  objection: string
): Promise<N8NFollowUpResponse> => {
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  const isExamInterested = !!lead.interestExam;
  const hasRefusal = !!objection;

  let action = "Acompanhamento Assistencial";
  let priority: 'Alto' | 'Médio' | 'Baixo' = "Médio";
  let justification = "Paciente em triagem sem retorno recente.";
  let message = `Olá ${lead.patientName}! 😊 Passando para verificar se você ainda precisa agendar o seu exame de ${lead.interestExam || 'diagnóstico'}. Temos horários disponíveis para esta semana. Podemos ajudar com a guia médica?`;

  if (hasRefusal) {
    action = "Apoio Técnico & Administrativo";
    priority = "Alto";
    justification = "Paciente com dificuldade em cobertura de convênio ou preparo complexo.";
    message = `Oi ${lead.patientName}! Entendemos seu ponto sobre "${objection}". 🏥 Na ULTRAMED, temos uma equipe dedicada para liberação de guias. Se desejar, podemos tentar contato direto com sua operadora de saúde para facilitar seu exame de ${lead.interestExam || 'imagem'}. Vamos tentar?`;
  } else if (isExamInterested) {
    action = "Incentivo ao Agendamento Rápido";
    priority = "Alto";
    justification = "Interesse em exame com alta demanda ou urgência clínica.";
    message = `Olá ${lead.patientName}, tudo bem? 🩺 Notamos sua solicitação para ${lead.interestExam}. Como esse exame costuma ter agenda concorrida, gostaríamos de priorizar seu agendamento para garantir o resultado o quanto antes. Deseja ver os horários de amanhã?`;
  }

  return {
    acao_recommended: action,
    mensagem_sugerida: message,
    nivel_prioridade: priority,
    justificativa: justification
  };
};

export const saveLeadStrategy = async (
  leadId: string, 
  response: N8NFollowUpResponse,
  objection: string
) => {
  const mapPriority = {
    'Alto': FollowUpPriority.ALTA,
    'Médio': FollowUpPriority.MEDIA,
    'Baixo': FollowUpPriority.BAIXA
  };

  await supabase
    .from('Clinica')
    .update({
      mensagem_followup: response.mensagem_sugerida,
      prioridade_followup: mapPriority[response.nivel_prioridade],
      justificativa_followup: response.justificativa,
      recusou_agendamento: objection,
      status_followup: 'aguardando_resposta',
      data_followup: new Date().toISOString()
    })
    .eq('id', leadId);
};
