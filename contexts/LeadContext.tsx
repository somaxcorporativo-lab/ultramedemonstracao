
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isConfigured } from '../services/supabaseClient';
import { mapLeadToUI } from '../utils/leadMapper';
import { UILead, SupabaseLead, LeadTag } from '../types';

interface LeadContextType {
  leads: UILead[];
  loading: boolean;
  error: string | null;
  refreshLeads: () => Promise<void>;
  isMockData: boolean;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const BAKERY_TAGS: Record<string, LeadTag> = {
  NEW: { id: 'tag-1', label: 'Novo Paciente', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  RECURRENT: { id: 'tag-2', label: 'Recorrente', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  VIP: { id: 'tag-3', label: 'Prioritário', color: 'bg-indigo-600 text-white shadow-sm' },
};

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<UILead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      if (!isConfigured) {
        setError('Supabase não configurado corretamente.');
        setLoading(false);
        return;
      }

      const { data, error: sbError } = await supabase
        .from('Clinica')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) throw new Error(sbError.message);

      if (!data) {
        setLeads([]);
      } else {
        const mappedLeads = (data as SupabaseLead[]).map(mapLeadToUI);
        setLeads(mappedLeads);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar dados do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    if (isConfigured) {
      const subscription = supabase
        .channel('public:Clinica')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Clinica' }, () => fetchLeads())
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, []);

  return (
    <LeadContext.Provider value={{ leads, loading, error, refreshLeads: fetchLeads, isMockData: false }}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (context === undefined) throw new Error('useLeads must be used within a LeadProvider');
  return context;
};
