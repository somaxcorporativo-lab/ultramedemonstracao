
import { SupabaseLead, UILead, LeadStage, FollowUpPriority, FollowUpStatus } from '../types';

export const mapLeadToUI = (data: SupabaseLead): UILead => {
  const createdAt = new Date(data.created_at);
  const updatedAt = new Date(data.updated_at);
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));

  const calculateAge = (birthDateStr: string | null) => {
    if (!birthDateStr) return null;
    try {
      const birth = new Date(birthDateStr);
      if (isNaN(birth.getTime())) return null;
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  // NEW LOGIC FOR THE 5 STAGES
  let stage = LeadStage.RECEBIDO;
  
  if (data.recusou_agendamento || data.status_followup === 'cancelled') {
    stage = LeadStage.RECUSADO;
  } else if (data.status_followup === 'sent' || data.status_followup === 'finalizado') {
    stage = LeadStage.CONFIRMADO;
  } else if (data.status_followup === 'scheduled') {
    stage = LeadStage.COMPARECIMENTO;
  } else if (data.prompt_usuario) {
    stage = LeadStage.TRIAGEM;
  } else {
    stage = LeadStage.RECEBIDO;
  }

  let priority = FollowUpPriority.INDEFINIDA;
  if (data.prioridade_followup === 'alta') priority = FollowUpPriority.ALTA;
  if (data.prioridade_followup === 'media') priority = FollowUpPriority.MEDIA;
  if (data.prioridade_followup === 'baixa') priority = FollowUpPriority.BAIXA;

  let followUpStatus = FollowUpStatus.PENDENTE;
  if (data.status_followup === 'draft') followUpStatus = FollowUpStatus.DRAFT;
  if (data.status_followup === 'scheduled') followUpStatus = FollowUpStatus.SCHEDULED;
  if (data.status_followup === 'sent') followUpStatus = FollowUpStatus.SENT;
  if (data.status_followup === 'finalizado') followUpStatus = FollowUpStatus.FINALIZADO;
  if (data.status_followup === 'cancelled') followUpStatus = FollowUpStatus.CANCELLED;

  return {
    id: data.id,
    createdAt,
    updatedAt,
    patientName: data.nome_paciente || 'Não Identificado',
    contactName: data.nome_contato || '',
    phoneNumber: data.numero ? String(data.numero) : '',
    sex: data.sexo || 'N/I',
    age: calculateAge(data.data_nascimento),
    birthDate: data.data_nascimento,
    interestExam: data.exame_interesse || 'Geral',
    examReason: data.motivo_exame || '',
    paymentType: data.plano_ou_particular || 'Particular',
    stage,
    isScheduled: !!data.agendamento,
    scheduleDetails: data.agendamento || '',
    isRefused: !!data.recusou_agendamento,
    refusalReason: data.recusou_agendamento || '',
    tags: [],
    followUp: {
      status: followUpStatus,
      message: data.mensagem_followup || '',
      priority,
      justification: data.justificativa_followup || '',
      nextDate: data.data_followup ? new Date(data.data_followup) : null
    },
    daysSinceCreation,
    reminders: [],
    prompt_usuario: data.prompt_usuario
  };
};
