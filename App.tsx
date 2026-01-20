
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LeadProvider } from './contexts/LeadContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Funnel } from './pages/Funnel';
import { LeadList } from './pages/LeadList';
import { FollowUp } from './pages/FollowUp';
import { AiCustomization } from './pages/AiCustomization';
import { Inbox as InboxPage } from './pages/Inbox';
import { UsersChannels } from './pages/UsersChannels';

const App: React.FC = () => {
  return (
    <LeadProvider>
      <Router>
        {/* Root container: h-screen e overflow-hidden para travar o scroll do body e usar layout de app */}
        <div className="flex h-screen overflow-hidden bg-medical-bg text-medical-text font-sans selection:bg-medical-accent selection:text-white">
          <Sidebar />
          {/* Main: O único ponto de rolagem (vertical e horizontal). 
              Como h-full (100% da altura disponível), a barra horizontal estará SEMPRE no rodapé do navegador. */}
          <main className="ml-64 flex-1 h-full relative z-0 bg-medical-bg overflow-auto">
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden opacity-30">
               <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-medical-accent/20 blur-[100px] rounded-full"></div>
               <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-medical-primary/10 blur-[80px] rounded-full"></div>
            </div>
            
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/funnel" element={<Funnel />} />
              <Route path="/leads" element={<LeadList />} />
              <Route path="/follow-up" element={<FollowUp />} />
              <Route path="/ai-customization" element={<AiCustomization />} />
              <Route path="/channels" element={<UsersChannels />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LeadProvider>
  );
};

export default App;
