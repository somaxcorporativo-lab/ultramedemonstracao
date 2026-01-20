
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatConversation, ChatStatus, ChatMessage, LeadTag, Reminder } from '../types';
import { useLeads } from '../contexts/LeadContext';
import { 
  MessageSquare, Instagram, Phone, MoreVertical, Send, 
  User, Bot, CheckCircle2, ChevronRight, Search, Clock, 
  Trash2, UserPlus, Info, Activity, Sparkles, Tag as TagIcon,
  Stethoscope, Calendar, AlertCircle, Plus, Star, BookOpen,
  X, Filter, Zap, LayoutGrid, Facebook, Mail, PanelRightClose, PanelRightOpen, HeartPulse
} from 'lucide-react';

export const Inbox: React.FC = () => {
  const [searchParams] = useSearchParams();
  const chatIdParam = searchParams.get('chatId');
  const { leads, loading } = useLeads();
  
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showOnlyAttention, setShowOnlyAttention] = useState(false);

  // MOCK DATA REMOVED COMPLETELY AS REQUESTED.
  // Real implementation would fetch from a 'Messages' table in Supabase.
  const conversations: ChatConversation[] = []; 

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'WhatsApp': return <Phone size={12} className="text-green-600" />;
      case 'Instagram': return <Instagram size={12} className="text-pink-600" />;
      default: return <MessageSquare size={12} className="text-medical-secondary" />;
    }
  };

  return (
    <div className="flex h-screen bg-medical-bg overflow-hidden relative">
      <div className="w-96 flex flex-col border-r border-slate-200 bg-white flex-shrink-0">
        <div className="p-8 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-serif font-bold text-medical-text tracking-tight">Atendimentos Reais</h1>
            <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
              <LayoutGrid size={18} className="text-medical-secondary" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar em chats reais..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm text-medical-text shadow-sm focus:border-medical-primary transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
          {conversations.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Info className="mx-auto mb-3 opacity-20" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest italic">Aguardando integração de canais em tempo real via Supabase</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border-r border-slate-200 relative">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
             <HeartPulse className="w-12 h-12 text-slate-200 mb-4" />
             <h2 className="text-xl font-serif font-bold text-medical-text">Selecione uma Conversa Real</h2>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Módulo conectado ao Supabase agent_prompts</p>
          </div>
        ) : (
          <div className="p-10">Chat Selecionado</div>
        )}
      </div>
    </div>
  );
};
