import React, { useState, useEffect } from 'react';
import { User, Match, Bet, UserRole } from '../types';
import { getUsers, getMatches, getBets, calculateBetPoints } from '../services/storageService';
import { Search, Trophy, Calendar, CheckCircle2, XCircle, AlertCircle, Minus } from 'lucide-react';

const UserAudit: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);

  useEffect(() => {
    setUsers(getUsers());
    setMatches(getMatches().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); // Mais recentes primeiro
    setBets(getBets());
  }, []);

  const filteredUsers = users.filter(u => 
    u.role === UserRole.USER && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUserStats = (userId: string) => {
    const userBets = bets.filter(b => b.userId === userId);
    
    // Separa jogos finalizados de agendados
    const finishedMatches = matches.filter(m => m.status === 'FINISHED');
    const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED');

    const history = finishedMatches.map(match => {
      const bet = userBets.find(b => b.matchId === match.id);
      const scoreData = bet ? calculateBetPoints(bet, match) : { points: 0, reasons: ['Não palpitou'] };
      
      return {
        match,
        bet,
        points: scoreData.points,
        reasons: scoreData.reasons
      };
    });

    const upcoming = scheduledMatches.map(match => {
        const bet = userBets.find(b => b.matchId === match.id);
        return { match, bet };
    }).filter(item => item.bet !== undefined); // Mostra apenas se tiver palpite

    return { history, upcoming };
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-500" />
          Auditoria de Pontos
        </h2>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Buscar usuário por nome ou username..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedUser(null);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 pl-12 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
        </div>

        {/* User Selection List (if searching and none selected) */}
        {!selectedUser && searchTerm && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-left group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{user.name}</div>
                                <div className="text-xs text-slate-400">@{user.username}</div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="col-span-full text-center text-slate-500 py-4">
                        Nenhum usuário encontrado.
                    </div>
                )}
            </div>
        )}

        {/* Detailed View */}
        {selectedUser && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            {selectedUser.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                            <p className="text-slate-400">@{selectedUser.username}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Pontuação Total</div>
                        <div className="text-3xl font-mono font-bold text-emerald-400">{selectedUser.points}</div>
                    </div>
                </div>

                {(() => {
                    const stats = getUserStats(selectedUser.id);
                    return (
                        <div className="space-y-8">
                            {/* History Table */}
                            <div>
                                <h4 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                    Histórico de Jogos Finalizados
                                </h4>
                                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                                                <tr>
                                                    <th className="px-4 py-3">Data</th>
                                                    <th className="px-4 py-3">Jogo</th>
                                                    <th className="px-4 py-3 text-center">Placar Real</th>
                                                    <th className="px-4 py-3 text-center">Palpite</th>
                                                    <th className="px-4 py-3 text-center">Pontos</th>
                                                    <th className="px-4 py-3">Detalhes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {stats.history.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                            Nenhum jogo finalizado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stats.history.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-4 py-3 text-slate-400">
                                                                {new Date(item.match.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-semibold text-white">
                                                                    {item.match.homeTeam} <span className="text-slate-500 text-xs font-normal">vs</span> {item.match.awayTeam}
                                                                </div>
                                                                <div className="text-xs text-slate-500">{item.match.group}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-mono font-bold text-white">
                                                                {item.match.homeScore} - {item.match.awayScore}
                                                                {item.match.penaltyWinner && (
                                                                    <div className="text-[10px] text-emerald-400">Pen: {item.match.penaltyWinner}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {item.bet ? (
                                                                    <>
                                                                        <div className="font-mono font-bold text-slate-300">
                                                                            {item.bet.homeScore} - {item.bet.awayScore}
                                                                        </div>
                                                                        {item.bet.penaltyWinner && (
                                                                            <div className="text-[10px] text-indigo-400">Pen: {item.bet.penaltyWinner}</div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-slate-600 italic">Sem palpite</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center justify-center min-w-[2rem] py-1 px-2 rounded font-bold ${
                                                                    item.points > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
                                                                }`}>
                                                                    {item.points > 0 ? `+${item.points}` : '0'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {item.reasons.length > 0 ? (
                                                                        item.reasons.map((r, i) => (
                                                                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                                                                                {r}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-slate-600 text-xs">-</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Bets Table */}
                            {stats.upcoming.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                        Palpites em Aberto (Jogos Não Finalizados)
                                    </h4>
                                    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                                                <tr>
                                                    <th className="px-4 py-3">Data</th>
                                                    <th className="px-4 py-3">Jogo</th>
                                                    <th className="px-4 py-3 text-center">Palpite do Usuário</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {stats.upcoming.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-slate-400">
                                                            {new Date(item.match.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-white">
                                                                {item.match.homeTeam} vs {item.match.awayTeam}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="font-mono font-bold text-blue-300 bg-blue-500/10 inline-block px-3 py-1 rounded border border-blue-500/20">
                                                                {item.bet!.homeScore} - {item.bet!.awayScore}
                                                            </div>
                                                            {item.bet!.penaltyWinner && (
                                                                <div className="text-[10px] text-blue-400 mt-1">
                                                                    Classifica: {item.bet!.penaltyWinner}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        )}
      </div>
    </div>
  );
};

export default UserAudit;
