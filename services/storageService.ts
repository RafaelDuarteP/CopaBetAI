import { Match, Bet, User, UserRole, isKnockoutStage } from '../types';

const STORAGE_KEY = 'copabet_data';
const SESSION_KEY = 'copabet_session_user_id';

// Estado em memória
let state = {
  matches: [] as Match[],
  bets: [] as Bet[],
  users: [] as User[]
};

// Helper para salvar no localStorage
const saveToStorage = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Erro ao salvar no localStorage', e);
  }
};

// --- Inicialização ---

export const initStorage = async (): Promise<void> => {
  // Mantemos a assinatura async para compatibilidade com o App.tsx, 
  // embora o localStorage seja síncrono.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state = JSON.parse(stored);
    } else {
      // Inicializa com dados padrão se estiver vazio
      state.users = [{
        id: 'admin_001',
        name: 'Administrator',
        username: 'admin',
        password: 'admin',
        role: UserRole.ADMIN,
        points: 0
      }];
      saveToStorage();
    }
  } catch (error) {
    console.error('Erro ao inicializar storage', error);
  }
};

// --- Matches ---

export const getMatches = (): Match[] => {
  return state.matches;
};

export const saveMatch = async (match: Match): Promise<void> => {
  const existingIndex = state.matches.findIndex(m => m.id === match.id);
  
  if (existingIndex >= 0) {
    state.matches[existingIndex] = match;
  } else {
    state.matches.push(match);
  }
  
  if (match.status === 'FINISHED') {
    recalculateStandingsInternal();
  }

  saveToStorage();
};

export const deleteMatch = async (id: string): Promise<void> => {
  state.matches = state.matches.filter(m => m.id !== id);
  recalculateStandingsInternal();
  saveToStorage();
};

// --- Bets ---

export const getBets = (): Bet[] => {
  return state.bets;
};

export const saveBet = async (bet: Bet): Promise<void> => {
  state.bets = state.bets.filter(b => !(b.matchId === bet.matchId && b.userId === bet.userId));
  state.bets.push(bet);
  saveToStorage();
};

export const getUserBet = (matchId: string, userId: string): Bet | undefined => {
  return state.bets.find(b => b.matchId === matchId && b.userId === userId);
};

// --- Users & Auth ---

export const getUsers = (): User[] => {
  return state.users;
};

export const registerUser = async (newUser: User): Promise<void> => {
  if (state.users.some(u => u.username === newUser.username)) {
    throw new Error('Nome de usuário já existe');
  }
  state.users.push(newUser);
  saveToStorage();
};

export const updateUser = async (updatedUser: User): Promise<void> => {
  const index = state.users.findIndex(u => u.id === updatedUser.id);
  if (index === -1) {
    throw new Error('Usuário não encontrado');
  }
  state.users[index] = updatedUser;
  saveToStorage();
};

export const deleteUser = async (userId: string): Promise<void> => {
    state.users = state.users.filter(u => u.id !== userId);
    saveToStorage();
}

export const authenticateUser = (username: string, password: string): User | null => {
  const user = state.users.find(u => u.username === username && u.password === password);
  return user || null;
};

// Sessão
export const getSession = (): User | null => {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  return state.users.find(u => u.id === userId) || null;
};

export const setSession = (user: User): void => {
  localStorage.setItem(SESSION_KEY, user.id);
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// --- Scoring Logic ---

export interface ScoreResult {
    points: number;
    reasons: string[];
}

export const calculateBetPoints = (bet: Bet, match: Match): ScoreResult => {
  if (match.status !== 'FINISHED' || match.homeScore === undefined || match.awayScore === undefined) {
    return { points: 0, reasons: [] };
  }

  const mHome = match.homeScore;
  const mAway = match.awayScore;
  const bHome = bet.homeScore;
  const bAway = bet.awayScore;
  const isKnockout = isKnockoutStage(match.group);
  const isDraw = mHome === mAway;

  // 1. Placar Exato
  if (mHome === bHome && mAway === bAway) {
      // Regra Especial: Placar Exato em Empate de Mata-Mata
      if (isKnockout && isDraw) {
          // Se admin cadastrou quem ganhou nos penaltis
          if (match.penaltyWinner) {
              if (bet.penaltyWinner === match.penaltyWinner) {
                  return { points: 10, reasons: ['Placar Exato + Classificação (+10)'] };
              } else {
                  return { points: 7, reasons: ['Placar Exato (Errou Classificado) (+7)'] };
              }
          }
      }
      
      return { 
          points: 10, 
          reasons: ['Placar Exato (+10)'] 
      };
  }

  let points = 0;
  const reasons: string[] = [];

  const matchSign = Math.sign(mHome - mAway); // 1 = Casa, -1 = Visitante, 0 = Empate
  const betSign = Math.sign(bHome - bAway);

  // 2. Acertou Vencedor (+3) ou Empate (+2)
  if (matchSign === betSign) {
      if (matchSign === 0) {
          points += 2;
          reasons.push('Empate (+2)');
      } else {
          points += 3;
          reasons.push('Vencedor (+3)');
      }
  }

  // 3. Acertou placar de 1 dos times (+5 por time)
  if (bHome === mHome) {
      points += 5;
      reasons.push('Gols Mandante (+5)');
  }
  
  if (bAway === mAway) {
      points += 5;
      reasons.push('Gols Visitante (+5)');
  }

  // 4. Acertou o total de gols (+1)
  const matchTotalGoals = mHome + mAway;
  const betTotalGoals = bHome + bAway;
  if (matchTotalGoals === betTotalGoals) {
      points += 1;
      reasons.push('Total de Gols (+1)');
  }

  // 5. Acertou Classificação (Cumulativo caso não seja Placar Exato)
  // Só conta se foi empate no jogo real E é mata-mata
  if (isKnockout && isDraw && match.penaltyWinner) {
      if (bet.penaltyWinner === match.penaltyWinner) {
          points += 3;
          reasons.push('Acertou Classificado (+3)');
      }
  }

  return { points, reasons };
};

const recalculateStandingsInternal = (): void => {
  const finishedMatches = state.matches.filter(m => m.status === 'FINISHED');
  
  state.users = state.users.map(user => {
    let totalPoints = 0;
    const userBets = state.bets.filter(b => b.userId === user.id);
    
    userBets.forEach(bet => {
      const match = finishedMatches.find(m => m.id === bet.matchId);
      if (match) {
        const result = calculateBetPoints(bet, match);
        totalPoints += result.points;
      }
    });

    return { ...user, points: totalPoints };
  });
};

export const recalculateStandings = async (): Promise<void> => {
  recalculateStandingsInternal();
  saveToStorage();
};
