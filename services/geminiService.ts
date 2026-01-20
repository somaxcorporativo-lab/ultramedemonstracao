/**
 * ⚠️ USO EXCLUSIVO NO BACKEND (Node.js)
 * NÃO importar este arquivo no frontend (React / Vite)
 */

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { UILead, LeadStage, Insight } from "../types";

/* ============================================================================
   VALIDAÇÃO DE AMBIENTE
============================================================================ */
if (typeof window !== "undefined") {
  throw new Error(
    "geminiService.ts não pode ser executado no browser. Use apenas no backend."
  );
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Variável de ambiente GEMINI_API_KEY não configurada.");
}

/* ============================================================================
   CLIENTES
============================================================================ */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ============================================================================
   SYSTEM PROMPT
============================================================================ */
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

/* ============================================================================
   INSIGHTS DE LEADS
============================================================================ */
export const generateLeadInsights = async (
  leads: UILead[]
): Promise<Insight[]> => {
  if (!leads || leads.length === 0) return [];

  const systemPrompt = await getSystemPrompt();

  const summary = {
    totalPacientes: leads.length,
    confirmados: leads.filter(l => l.stage === LeadStage.CONFIRMADO).length,
    emAgendamento: leads.filter(l => l.stage === LeadStage.COMPARECIMENTO).length,
    desistencias: leads.filter(l => l.isRefused).length,
    examesTop: leads.reduce((acc: Record<string, number>, l) => {
      const exam = l.interestExam || "Não Informado";
      acc[exam] = (acc[exam] || 0)
