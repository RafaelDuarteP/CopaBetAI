import React, { useState, useEffect } from 'react';
import { User, UserRole, Match } from './types';
import { getSession, clearSession, getMatches, getUsers, initStorage } from './services/storageService';
import MatchCard from './components/MatchCard';
import AdminPanel from './components/AdminPanel';
import UserManagement from './components/UserManagement';
import UserProfile from './components/UserProfile';
import Leaderboard from './components/Leaderboard';
import Login from './components/Login';
import UserAudit from './components/UserAudit';
import { Trophy, ShieldCheck, LogOut, LayoutDashboard, Users, Loader2, CalendarClock, History, Search } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [view, setView] = useState<'DASHBOARD' | 'MATCHES' | 'USERS' | 'AUDIT'>('DASHBOARD');
  const [isInitializing, setIsInitializing] = useState(true);

  // Inicializa storage ao abrir o app
  useEffect(() => {
    const initialize = async () => {
      await initStorage();
      
      const sessionUser = getSession();
      if (sessionUser) {
          const currentUsers = getUsers();
          const updatedUser = currentUsers.find(u => u.id === sessionUser.id);
          setUser(updatedUser || sessionUser);
      }
      refreshData();
      setIsInitializing(false);
    };
    
    initialize();
  }, []);

  const refreshData = () => {
    setMatches([...getMatches()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setAllUsers(getUsers());
    
    if (user) {
        const currentUsers = getUsers();
        const updatedUser = currentUsers.find(u => u.id === user.id);
        if (updatedUser) setUser(updatedUser);
    }
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setUser(null);
    setView('DASHBOARD');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-emerald-500 gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="text-slate-400">Carregando CopaBet...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(loggedInUser) => {
        setUser(loggedInUser);
        refreshData();
    }} />;
  }

  // Filtragem de jogos para o dashboard
  const activeMatches = matches.filter(m => m.status === 'SCHEDULED');
  const finishedMatches = matches.filter(m => m.status === 'FINISHED');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('DASHBOARD')}>
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Trophy className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent hidden sm:block">
                CopaBet AI
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-right">
                 <div className="hidden sm:block">
                     <div className="text-sm font-bold text-white">{user.name}</div>
                     <div className="text-xs text-slate-500 flex justify-end gap-1">
                         <span className="capitalize">{user.role.toLowerCase()}</span>
                         {user.role === UserRole.USER && (
                             <span className="text-emerald-500 font-bold">• {user.points} pts</span>
                         )}
                     </div>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border border-slate-600">
                     {user.name.charAt(0)}
                 </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs (Only for Admin to switch views) */}
        {user.role === UserRole.ADMIN && (
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setView('DASHBOARD')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
                view === 'DASHBOARD' 
                  ? 'bg-slate-700 text-white shadow-lg border border-slate-600' 
                  : 'bg-transparent text-slate-500 hover:text-white border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setView('MATCHES')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
                view === 'MATCHES' 
                  ? 'bg-slate-700 text-white shadow-lg border border-slate-600' 
                  : 'bg-transparent text-slate-500 hover:text-white border border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Gerenciar Jogos
            </button>
            <button
              onClick={() => setView('USERS')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
                view === 'USERS' 
                  ? 'bg-slate-700 text-white shadow-lg border border-slate-600' 
                  : 'bg-transparent text-slate-500 hover:text-white border border-transparent'
              }`}
            >
              <Users className="w-4 h-4" />
              Gerenciar Usuários
            </button>
            <button
              onClick={() => setView('AUDIT')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
                view === 'AUDIT' 
                  ? 'bg-slate-700 text-white shadow-lg border border-slate-600' 
                  : 'bg-transparent text-slate-500 hover:text-white border border-transparent'
              }`}
            >
              <Search className="w-4 h-4" />
              Auditoria de Pontos
            </button>
          </div>
        )}

        {/* Content Rendering */}
        {view === 'MATCHES' && user.role === UserRole.ADMIN ? (
          <AdminPanel matches={matches} onUpdate={refreshData} />
        ) : view === 'USERS' && user.role === UserRole.ADMIN ? (
          <UserManagement onUpdate={() => {}} />
        ) : view === 'AUDIT' && user.role === UserRole.ADMIN ? (
          <UserAudit />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             {/* Left Column: Matches */}
             <div className="lg:col-span-3 space-y-12">
                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-white mb-2">Tabela de Jogos</h1>
                    <p className="text-slate-400">
                        {user.role === UserRole.ADMIN 
                            ? 'Acompanhe os palpites dos usuários' 
                            : 'Faça seus palpites até 1 hora antes do início!'}
                    </p>
                </div>
                
                {/* Seção 1: Jogos Ativos / Não Pontuados */}
                <section>
                    <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5" />
                        Próximos Jogos & Ativos
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeMatches.map(match => (
                            <MatchCard 
                                key={match.id} 
                                match={match} 
                                currentUserRole={user.role}
                                currentUserId={user.id}
                                onRefresh={refreshData}
                            />
                        ))}
                    </div>

                    {activeMatches.length === 0 && (
                        <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                            <p className="text-slate-400">Nenhum jogo ativo no momento.</p>
                            {user.role === UserRole.ADMIN && (
                                <button onClick={() => setView('MATCHES')} className="mt-2 text-emerald-400 hover:text-emerald-300 underline underline-offset-4 text-sm">
                                    Adicionar Jogo
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Seção 2: Jogos Finalizados & Pontuados */}
                {finishedMatches.length > 0 && (
                    <section className="border-t border-slate-700 pt-8">
                        <h2 className="text-xl font-bold text-slate-400 mb-4 flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Histórico e Resultados
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90">
                            {finishedMatches.map(match => (
                                <MatchCard 
                                    key={match.id} 
                                    match={match} 
                                    currentUserRole={user.role}
                                    currentUserId={user.id}
                                    onRefresh={refreshData}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {matches.length === 0 && (
                    <div className="hidden text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                        <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">Nenhum jogo agendado.</p>
                        {user.role === UserRole.ADMIN && (
                            <button onClick={() => setView('MATCHES')} className="mt-4 text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                                Ir para painel Admin
                            </button>
                        )}
                    </div>
                )}
             </div>

             {/* Right Column: User Profile or Leaderboard (for Admin) */}
             <div className="lg:col-span-1">
                <div className="sticky top-24">
                   {user.role === UserRole.ADMIN ? (
                       <Leaderboard users={allUsers} currentUserId={user.id} />
                   ) : (
                       <UserProfile user={user} onUpdate={refreshData} />
                   )}
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-slate-600 text-sm">
        <p>&copy; 2025 CopaBet AI. Vibe coding in partnership between Rafael and Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
