import React, { useState, useEffect } from 'react';
import { Match, Bet, UserRole, isKnockoutStage } from '../types';
import { saveBet, getUserBet, calculateBetPoints, getBets, getUsers } from '../services/storageService';
import { Calendar, Clock, Lock, Sparkles, Save, CheckCircle2, Users, AlertCircle } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  currentUserRole: UserRole;
  currentUserId: string;
  onRefresh: () => void;
}

interface UserBetDisplay {
  userName: string;
  home: number;
  away: number;
  penaltyWinner?: string;
}

// Mapeamento de nomes de times para códigos ISO (flagcdn)
const countryMap: { [key: string]: string } = {
  'Brazil': 'br', 'Brasil': 'br',
  'Argentina': 'ar',
  'France': 'fr', 'França': 'fr',
  'Germany': 'de', 'Alemanha': 'de',
  'Spain': 'es', 'Espanha': 'es',
  'England': 'gb-eng', 'Inglaterra': 'gb-eng',
  'Portugal': 'pt',
  'Netherlands': 'nl', 'Holanda': 'nl',
  'Belgium': 'be', 'Bélgica': 'be',
  'Italy': 'it', 'Itália': 'it',
  'Croatia': 'hr', 'Croácia': 'hr',
  'Uruguay': 'uy', 'Uruguai': 'uy',
  'USA': 'us', 'United States': 'us', 'EUA': 'us', 'Estados Unidos': 'us',
  'Mexico': 'mx', 'México': 'mx',
  'Canada': 'ca', 'Canadá': 'ca',
  'Japan': 'jp', 'Japão': 'jp',
  'South Korea': 'kr', 'Coreia do Sul': 'kr',
  'Morocco': 'ma', 'Marrocos': 'ma',
  'Senegal': 'sn',
  'Switzerland': 'ch', 'Suíça': 'ch',
  'Denmark': 'dk', 'Dinamarca': 'dk',
  'Sweden': 'se', 'Suécia': 'se',
  'Poland': 'pl', 'Polônia': 'pl',
  'Saudi Arabia': 'sa', 'Arábia Saudita': 'sa',
  'Iran': 'ir', 'Irã': 'ir',
  'Australia': 'au', 'Austrália': 'au',
  'Ecuador': 'ec', 'Equador': 'ec',
  'Qatar': 'qa', 'Catar': 'qa',
  'Wales': 'gb-wls', 'País de Gales': 'gb-wls',
  'Cameroon': 'cm', 'Camarões': 'cm',
  'Ghana': 'gh', 'Gana': 'gh',
  'Costa Rica': 'cr',
  'Serbia': 'rs', 'Sérvia': 'rs',
  'Tunisia': 'tn', 'Tunísia': 'tn',
  'Colombia': 'co', 'Colômbia': 'co',
  'Chile': 'cl',
  'South Africa': 'za', 'África do Sul': 'za'
};

const getFlagUrl = (teamName: string) => {
    // Tenta encontrar exato ou normaliza para Title Case se necessário
    const code = countryMap[teamName] || countryMap[Object.keys(countryMap).find(k => k.toLowerCase() === teamName.toLowerCase()) || ''];
    return code ? `https://flagcdn.com/w160/${code}.png` : null;
};

const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserRole, currentUserId, onRefresh }) => {
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [penaltyWinner, setPenaltyWinner] = useState<string | undefined>(undefined);
  
  const [isLocked, setIsLocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [pointsReasons, setPointsReasons] = useState<string[]>([]);
  
  // Estado para palpites visíveis apenas para Admin
  const [adminUserBets, setAdminUserBets] = useState<UserBetDisplay[]>([]);

  useEffect(() => {
    // Check if match is locked (1 hour before)
    const matchTime = new Date(match.date).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Lock if match started or is about to start
    setIsLocked(now > matchTime - oneHour || match.status === 'FINISHED');

    // Load existing bet for current user
    const existingBet = getUserBet(match.id, currentUserId);
    if (existingBet) {
      setHomeScore(existingBet.homeScore.toString());
      setAwayScore(existingBet.awayScore.toString());
      setPenaltyWinner(existingBet.penaltyWinner);

      if (match.status === 'FINISHED') {
        const result = calculateBetPoints(existingBet, match);
        setPointsEarned(result.points);
        setPointsReasons(result.reasons);
      }
    }

    // Load all bets if Admin
    if (currentUserRole === UserRole.ADMIN) {
        const allBets = getBets();
        const allUsers = getUsers();
        const betsForMatch = allBets
            .filter(b => b.matchId === match.id)
            .map(b => {
                const u = allUsers.find(user => user.id === b.userId);
                return {
                    userName: u?.name || 'Desconhecido',
                    home: b.homeScore,
                    away: b.awayScore,
                    penaltyWinner: b.penaltyWinner
                };
            });
        setAdminUserBets(betsForMatch);
    }

  }, [match, currentUserId, currentUserRole]);

  const handleSaveBet = () => {
    if (homeScore === '' || awayScore === '') return;

    // Se for empate e mata-mata, exige penaltyWinner
    const isDraw = parseInt(homeScore) === parseInt(awayScore);
    const isKnockout = isKnockoutStage(match.group);

    if (isDraw && isKnockout && !penaltyWinner) {
        alert("Por favor, selecione quem classifica nos pênaltis.");
        return;
    }

    const bet: Bet = {
      matchId: match.id,
      userId: currentUserId,
      homeScore: parseInt(homeScore),
      awayScore: parseInt(awayScore),
      penaltyWinner: (isDraw && isKnockout) ? penaltyWinner : undefined,
      timestamp: new Date().toISOString()
    };

    saveBet(bet);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onRefresh();
  };

  const matchDate = new Date(match.date);
  const formattedDate = matchDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedTime = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  // Helpers de visualização
  const isKnockout = isKnockoutStage(match.group);
  const currentDraw = homeScore !== '' && awayScore !== '' && parseInt(homeScore) === parseInt(awayScore);

  const homeFlag = getFlagUrl(match.homeTeam);
  const awayFlag = getFlagUrl(match.awayTeam);

  return (
    <div className={`bg-slate-800 rounded-xl overflow-hidden shadow-lg border transition-all duration-300 relative
        ${match.status === 'FINISHED' ? 'border-emerald-500/50 shadow-emerald-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
      
      {match.status === 'FINISHED' && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
              FINISHED
          </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/50 p-4 flex justify-between items-center text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formattedDate}</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
          <Clock className="w-4 h-4" />
          <span>{formattedTime}</span>
        </div>
        <div className="font-semibold text-emerald-500 pr-12">{match.group}</div>
      </div>

      {/* Teams & Scores */}
      <div className="p-6">
        <div className="flex justify-between items-center gap-4 mb-6">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden mb-2 shadow-lg relative shrink-0">
                {homeFlag ? (
                    <img src={homeFlag} alt={match.homeTeam} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl">
                        {match.homeTeam.charAt(0)}
                    </div>
                )}
                
                {match.penaltyWinner === match.homeTeam && match.status === 'FINISHED' && (
                    <div className="absolute top-0 right-0 bg-yellow-500 rounded-full p-1 border border-slate-900 shadow-sm" title="Classified">
                        <CheckCircle2 className="w-3 h-3 text-black" />
                    </div>
                )}
            </div>
            <span className="font-bold text-white text-lg leading-tight">{match.homeTeam}</span>
          </div>

          {/* VS / Score Inputs */}
          <div className="flex flex-col items-center gap-2">
            
            {/* If finished, show Final Score prominently */}
            {match.status === 'FINISHED' ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="text-3xl font-black text-white tracking-widest bg-emerald-900/30 px-6 py-2 rounded-lg border border-emerald-500/30">
                        {match.homeScore} : {match.awayScore}
                    </div>
                    {match.penaltyWinner && (
                        <div className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300 mt-1">
                            Pên: {match.penaltyWinner}
                        </div>
                    )}
                    <span className="text-xs uppercase text-emerald-400 font-bold mt-1 tracking-wider">Final Score</span>
                </div>
            ) : (
                <>
                    {/* Admin vê inputs desabilitados com placeholder ou valor */}
                    {isLocked || currentUserRole === UserRole.ADMIN ? (
                    <div className="text-2xl font-mono font-bold text-white tracking-widest bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
                        {homeScore || '-'} : {awayScore || '-'}
                    </div>
                    ) : (
                    <div className="flex items-center gap-2">
                        <input
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        className="w-12 h-12 text-center text-xl font-bold bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                        <span className="text-slate-500 font-bold">:</span>
                        <input
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        className="w-12 h-12 text-center text-xl font-bold bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                    )}
                </>
            )}
            
            {isLocked && match.status !== 'FINISHED' && (
              <span className="text-xs font-medium text-rose-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden mb-2 shadow-lg relative shrink-0">
                {awayFlag ? (
                    <img src={awayFlag} alt={match.awayTeam} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-600 to-pink-700 flex items-center justify-center text-white font-bold text-xl">
                        {match.awayTeam.charAt(0)}
                    </div>
                )}
                
                {match.penaltyWinner === match.awayTeam && match.status === 'FINISHED' && (
                    <div className="absolute top-0 right-0 bg-yellow-500 rounded-full p-1 border border-slate-900 shadow-sm" title="Classified">
                        <CheckCircle2 className="w-3 h-3 text-black" />
                    </div>
                )}
            </div>
            <span className="font-bold text-white text-lg leading-tight">{match.awayTeam}</span>
          </div>
        </div>

        {/* --- KNOCKOUT PENALTY SELECTION FOR USER --- */}
        {!isLocked && currentUserRole === UserRole.USER && match.status !== 'FINISHED' && isKnockout && currentDraw && (
            <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/30 mb-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Quem classifica?
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPenaltyWinner(match.homeTeam)}
                        className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
                            penaltyWinner === match.homeTeam 
                            ? 'bg-indigo-500 text-white shadow-lg' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                        {match.homeTeam}
                    </button>
                    <button
                        onClick={() => setPenaltyWinner(match.awayTeam)}
                        className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
                            penaltyWinner === match.awayTeam 
                            ? 'bg-indigo-500 text-white shadow-lg' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                        {match.awayTeam}
                    </button>
                </div>
            </div>
        )}

        {/* User's Prediction (if finished and showing final score) */}
        {match.status === 'FINISHED' && currentUserRole === UserRole.USER && (
            <div className="bg-slate-900/50 rounded-lg p-3 text-center mb-4 border border-slate-700">
                 <div className="text-xs text-slate-400 mb-1">Seu palpite</div>
                 <div className="font-mono text-lg font-bold text-slate-300">
                     {homeScore !== '' ? `${homeScore} - ${awayScore}` : 'Sem palpite'}
                 </div>
                 {penaltyWinner && (
                     <div className="text-xs text-indigo-400 mt-1">
                         Classifica: <span className="font-bold">{penaltyWinner}</span>
                     </div>
                 )}
                 
                 {/* Exibição de Pontos e Categorias */}
                 {pointsEarned !== null && (
                     <div className="mt-3">
                         <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1 mb-2">
                             <CheckCircle2 className="w-5 h-5" />
                             +{pointsEarned} Pontos
                         </div>
                         {pointsReasons.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {pointsReasons.map((reason, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] rounded-full uppercase font-bold tracking-wide">
                                        {reason}
                                    </span>
                                ))}
                            </div>
                         )}
                     </div>
                 )}
            </div>
        )}

        {/* Description */}
        {match.description && match.status !== 'FINISHED' && (
          <p className="text-slate-400 text-sm text-center italic mb-4">
            "{match.description}"
          </p>
        )}

        {/* Actions for User */}
        {!isLocked && currentUserRole === UserRole.USER && match.status !== 'FINISHED' && (
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleSaveBet}
              disabled={homeScore === '' || awayScore === ''}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${saved 
                  ? 'bg-green-600 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Palpite salvo!' : 'Salvar Palpite'}
            </button>
          </div>
        )}
        
        {/* Admin View: User Predictions */}
        {currentUserRole === UserRole.ADMIN && (
            <div className="mt-6 border-t border-slate-700 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Palpites
                </h4>
                {adminUserBets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {adminUserBets.map((bet, idx) => (
                            <div key={idx} className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700 text-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-slate-300 truncate max-w-[100px]" title={bet.userName}>
                                        {bet.userName}
                                    </span>
                                    <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                                        {bet.home} - {bet.away}
                                    </span>
                                </div>
                                {bet.penaltyWinner && (
                                    <div className="text-[10px] text-indigo-400 text-right">
                                        Classifica: {bet.penaltyWinner}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-600 text-xs italic">
                        Nenhum palpite foi feito ainda.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
