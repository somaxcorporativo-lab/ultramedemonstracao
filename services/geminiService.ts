import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Variáveis de ambiente do Render (Node)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY não configurada no Render");
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase envs não configuradas");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

/**
 * Busca prompt do sistema
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

/**
 * Gera insights clínicos
 */
export const generateLeadInsights = async (leads: any[]) => {
  if (!leads.length) return [];

  const systemPrompt = await getSystemPrompt();

  const userPrompt = `
Analise os dados reais de atendimento e triagem abaixo para gerar insights estratégicos.
Retorne exatamente 3 insights em formato JSON.
Dados: ${JSON.stringify(leads)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "[]");
};

/**
 * Gera análise do funil
 */
export const generateFunnelAnalysis = async (
  funnelData: any,
  refusalReasons: any[]
) => {
  const systemPrompt = await getSystemPrompt();

  const userPrompt = `
Analise o funil de agendamento da clínica ULTRAMED.
Métricas: ${JSON.stringify(funnelData)}
Motivos de recusa: ${JSON.stringify(refusalReasons)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt
    }
  });

  return response.text;
};
