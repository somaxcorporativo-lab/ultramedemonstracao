import { GoogleGenAI, Type } from "@google/genai";
import { UILead, LeadStage, Insight } from "../types";
import { supabase } from "./supabaseClient";

/**
 * Vite: variáveis de ambiente DEVEM começar com VITE_
 * process.env NÃO existe no browser
 */
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string;

if (!apiKey) {
  throw new Error("VITE_GOOGLE_API_KEY não configurada no ambiente");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Busca o prompt de sistema configurado pelo usuário na aba AiCustomization.
 */
export const getSystemPrompt = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("agent_prompts")
      .select("prompt")
      .eq("nome", "agent_dashboard")
      .single();

    if (error || !data?.prompt) {
      return "Você é a ULTRAMED, assistente virtual inteligente focada em diagnósticos clínicos.";
    }

    return data.prompt;
  } catch {
    return "Você é a ULTRAMED, assistente virtual inteligente focada em diagnósticos clínicos.";
  }
};

export const generateLeadInsights = async (
  leads: UILead[]
): Promise<Insight[]> => {
  if (!apiKey || leads.length === 0) return [];

  const systemPrompt = await getSystemPrompt();

  const summary = {
    totalPacientes: leads.length,
    confirmados: leads.filter(l => l.stage === LeadStage.CONFIRMADO).length,
    emAgendamento: leads.filter(l => l.stage === LeadStage.COMPARECIMENTO).length,
    desistencias: leads.filter(l => l.isRefused).length,
    examesTop: leads.reduce((acc: Record<string, number>, l) => {
      const exam = l.interestExam || "Não Informado";
      acc[exam] = (acc[exam] || 0) + 1;
      return acc;
    }, {})
  };

  const userPrompt = `
Analise os dados reais de atendimento e triagem abaixo para gerar insights estratégicos.

DADOS DO DASHBOARD:
- Total de Pacientes: ${summary.totalPacientes}
- Confirmados: ${summary.confirmados}
- Em Fase de Definição: ${summary.emAgendamento}
- Desistências: ${summary.desistencias}
- Distribuição de Exames: ${JSON.stringify(summary.examesTop)}
