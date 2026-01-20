import { GoogleGenAI, Type } from "@google/genai";
import { UILead, LeadStage, Insight } from "../types";
import { supabase } from "./supabaseClient";

// 🔐 Variável de ambiente do Render (backend)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY não configurada no ambiente");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

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
  if (!leads.length) return [];

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

Retorne exatamente 3 insights em formato JSON.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              type: { type: Type.STRING },
              details: {
                type: Type.OBJECT,
                properties: {
                  what: { type: Type.STRING },
                  why: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                },
                required: ["what", "why", "impact", "recommendation"]
              }
            },
            required: ["id", "title", "type", "details"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar insights clínicos:", error);
    return [];
  }
};

export const generateFunnelAnalysis = async (
  funnelData: {
    total: number;
    qualified: number;
    negotiation: number;
    scheduled: number;
  },
  refusalReasons: {
    name: string;
    value: number;
    percentage: string;
  }[]
): Promise<string> => {
  const systemPrompt = await getSystemPrompt();

  const userPrompt = `
Analise o funil de agendamento da clínica de olhos ULTRAMED.
Retorne a análise EM TÓPICOS CURTOS (máximo 3).

MÉTRICAS:
- Triagens: ${funnelData.total}
- Em Agendamento: ${funnelData.negotiation}
- Confirmados: ${funnelData.scheduled}

Motivos de Recusa:
${JSON.stringify(refusalReasons)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt
      }
    });

    return response.text || "Dados insuficientes para diagnóstico em tópicos.";
  } catch {
    return "Erro ao processar análise diagnóstica.";
  }
};
