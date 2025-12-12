
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string; // ISO string
  group: string;
  description?: string; // AI generated description
  homeScore?: number; // Final score (set by admin later)
  awayScore?: number; // Final score (set by admin later)
  penaltyWinner?: string; // Name of the team that won penalties (if draw in knockout)
  status: 'SCHEDULED' | 'FINISHED';
}

export interface Bet {
  matchId: string;
  userId: string;
  homeScore: number;
  awayScore: number;
  penaltyWinner?: string; // Name of the team predicted to win penalties
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // Optional when retrieving for display to avoid leaking
  role: UserRole;
  points: number;
}

export const isKnockoutStage = (group: string): boolean => {
  const stages = ['Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
  return stages.includes(group);
};
