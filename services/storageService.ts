import { Match, Bet, User, UserRole, isKnockoutStage } from '../types';import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { auth, db } from '../firebase';


const STORAGE_KEY = 'copabet_data';
const SESSION_KEY = 'copabet_session_user_id';


const usersCol = collection(db, "users");
const matchesCol = collection(db, "matches");
const betsCol = collection(db, "bets");

// Estado em memória
let state = {
  matches: [] as Match[],
  bets: [] as Bet[],
  users: [] as User[]
};

// Helper para salvar no localStorage

const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(cleanObject);
  if (typeof obj !== 'object') return obj;

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined) // remove undefined
      .filter(([k]) => k !== 'id')
      .map(([k, v]) => [k, cleanObject(v)])
  );
};

const saveToStorage = async (): Promise<void> => {
  try {
    const { matches, bets, users } = state;

    await Promise.all([
      Promise.all(users.map(user =>
        setDoc(doc(usersCol, user.id!), cleanObject(user))
      )),
      Promise.all(matches.map(match =>
        setDoc(doc(matchesCol, match.id), cleanObject(match))
      )),
      Promise.all(bets.map(bet =>
        setDoc(doc(betsCol, `${bet.userId}_${bet.matchId}`), cleanObject(bet))
      ))
    ]);
    await reloadStorage();
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
};


// --- Inicialização ---

const initStorage = async (): Promise<void> => {
  const usersSnap = await getDocs(usersCol);
  const matchesSnap = await getDocs(matchesCol);
  const betsSnap = await getDocs(betsCol);

  console.log('Fetched data from Firestore', {
    users: usersSnap.docs.map(d => d.data()),
    matches: matchesSnap.docs.map(d => d.data()),
    bets: betsSnap.docs.map(d => d.data())
  });

  state.users = usersSnap.docs.map(d => ({ ...d.data(), id: d.id }) as User);
  state.matches = matchesSnap.docs.map(d => ({ ...d.data(), id: d.id }) as Match);
  state.bets = betsSnap.docs.map(d => d.data() as Bet);
};

const reloadStorage = async (): Promise<void> => {
  await initStorage();
}

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
    await recalculateStandingsInternal();
  }

  await saveToStorage();
};

export const deleteMatch = async (id: string): Promise<void> => {
  state.matches = state.matches.filter(m => m.id !== id);
  const betsToDelete = state.bets.filter(b => b.matchId === id);
  state.bets = state.bets.filter(b => b.matchId !== id);
  await Promise.all(betsToDelete.map(bet => 
    deleteDoc(doc(betsCol, `${bet.userId}_${bet.matchId}`))
  ));
  await deleteDoc(doc(matchesCol, id));
  await recalculateStandingsInternal();
};

// --- Bets ---

export const getBets = (): Bet[] => {
  return state.bets;
};

export const saveBet = async (bet: Bet): Promise<void> => {
  state.bets = state.bets.filter(b => !(b.matchId === bet.matchId && b.userId === bet.userId));
  state.bets.push(bet);
  await saveToStorage();
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

  const cred = await createUserWithEmailAndPassword(
    auth,
    newUser.username + '@email.com',
    newUser.password
  );

  const { password, ...sanitized } = newUser;
  sanitized.id = cred.user.uid;

  state.users.push(sanitized as User);
  await saveToStorage();
};


export const updateUser = async (updatedUser: User): Promise<void> => {
  const index = state.users.findIndex(u => u.id === updatedUser.id);
  if (index === -1) {
    throw new Error('Usuário não encontrado');
  }
  state.users[index] = updatedUser;

  if (updatedUser.password) {
    await updatePassword(auth.currentUser!, updatedUser.password);
  }
  await saveToStorage();
};

export const deleteUser = async (userId: string): Promise<void> => {
    state.users = state.users.filter(u => u.id !== userId);
    const betsToDelete = state.bets.filter(b => b.userId === userId);
    state.bets = state.bets.filter(b => b.userId !== userId);
    console.log('Deleting bets for user:', betsToDelete);
    await Promise.all(betsToDelete.map(bet => 
      deleteDoc(doc(betsCol, `${bet.userId}_${bet.matchId}`))
    ));
    await deleteDoc(doc(usersCol, userId));
    await saveToStorage();
}

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
 try { const userCredentials = await signInWithEmailAndPassword(auth, username+'@email.com', password);
  console.log('Authenticated user:', userCredentials);
  await initStorage();
  const user = state.users.find(u => u.id === userCredentials.user.uid) || null;
  console.log('Loaded user', user);
  return user || null;}
  catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

// Sessão
export const getSession =  async (): Promise<User | null> => {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  await  initStorage(); // Garantir que o estado está carregado
  return state.users.find(u => u.id === userId) || null;
};

export const setSession = (user: User): void => {
  localStorage.setItem(SESSION_KEY, user.id);
};

export const clearSession = async (): Promise<void> => {
  await signOut(auth);
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

const recalculateStandingsInternal = async (): Promise<void> => {
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
  await saveToStorage();
};

export const recalculateStandings = async (): Promise<void> => {
  await recalculateStandingsInternal();
};
