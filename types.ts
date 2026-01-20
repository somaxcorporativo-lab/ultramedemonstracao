
export enum LeadStage {
  RECEBIDO = 'Novos Pacientes',
  TRIAGEM = 'Triagem IA',
  COMPARECIMENTO = 'Em Comparecimento',
  CONFIRMADO = 'Comp. Confirmado',
  RECUSADO = 'Não Compareceu'
}

export enum FollowUpPriority {
  ALTA = 'alta',
  MEDIA = 'media',
  BAIXA = 'baixa',
  INDEFINIDA = 'indefinida'
}

export enum FollowUpStatus {
  PENDENTE = 'pending',
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FINALIZADO = 'finalizado',
  CANCELLED = 'cancelled'
}

export interface SupabaseLead {
  id: string;
  created_at: string;
  updated_at: string;
  nome_contato: string | null;
  nome_paciente: string | null;
  numero: string | number | null;
  sexo: string | null;
  data_nascimento: string | null;
  exame_interesse: string | null;
  motivo_exame: string | null;
  plano_ou_particular: string | null;
  agendamento: string | null;
  recusou_agendamento: string | null;
  status_followup: string | null;
  mensagem_followup: string | null;
  prioridade_followup: string | null;
  justificativa_followup: string | null;
  data_followup: string | null;
  prompt_usuario: string | null;
}

export interface UILead {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  patientName: string;
  contactName: string;
  phoneNumber: string;
  sex: string;
  age: number | null;
  birthDate: string | null;
  interestExam: string;
  examReason: string;
  paymentType: string;
  stage: LeadStage;
  isScheduled: boolean;
  scheduleDetails: string;
  isRefused: boolean;
  refusalReason: string;
  tags: any[];
  followUp: {
    status: FollowUpStatus;
    message: string;
    priority: FollowUpPriority;
    justification: string;
    nextDate: Date | null;
  };
  daysSinceCreation: number;
  reminders: Reminder[];
  prompt_usuario: string | null;
}

export interface LeadTag {
  id: string;
  label: string;
  color: string;
  isAiGenerated?: boolean;
}

export interface Insight {
  id: string;
  title: string;
  type: 'info' | 'alert' | 'success';
  details: {
    what: string;
    why: string;
    impact: string;
    recommendation: string;
  };
}

// Added missing chat-related types
export enum ChatStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  ATTENTION = 'attention'
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  patientName: string;
  lastMessage: string;
  timestamp: Date;
  status: ChatStatus;
  channel: 'WhatsApp' | 'Instagram' | 'Facebook' | 'Email';
  messages: ChatMessage[];
  unreadCount: number;
}

// Added missing Reminder interface
export interface Reminder {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
}

// Added missing N8N response interface
export interface N8NFollowUpResponse {
  acao_recommended: string;
  mensagem_sugerida: string;
  nivel_prioridade: 'Alto' | 'Médio' | 'Baixo';
  justificativa: string;
}
