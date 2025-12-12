import React from 'react';
import { User, UserRole } from '../types';
import { Trophy, Medal, Crown } from 'lucide-react';

interface LeaderboardProps {
  users: User[];
  currentUserId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserId }) => {
  // Filter only standard users (exclude admins if needed, though prompt implies showing user ranking)
  // Prompt: "ranking de todos os users com role user"
  const userList = users.filter(u => u.role === UserRole.USER);

  // Sort users by points (descending)
  const sortedUsers = [...userList].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="bg-slate-900/80 p-4 border-b border-slate-700 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-white">Ranking Global</h3>
      </div>
      
      <div className="max-h-[500px] overflow-y-auto">
        {sortedUsers.map((user, index) => {
          const rank = index + 1;
          
          let rankIcon;
          if (rank === 1) rankIcon = <Crown className="w-5 h-5 text-yellow-400" />;
          else if (rank === 2) rankIcon = <Medal className="w-5 h-5 text-slate-300" />;
          else if (rank === 3) rankIcon = <Medal className="w-5 h-5 text-amber-600" />;
          else rankIcon = <span className="text-slate-500 font-bold w-5 text-center text-sm">#{rank}</span>;

          return (
            <div 
              key={user.id}
              className={`flex items-center justify-between p-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8">
                    {rankIcon}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-white">
                        {user.name}
                    </span>
                    <span className="text-xs text-slate-500">@{user.username}</span>
                </div>
              </div>
              <div className="font-mono font-bold text-lg text-emerald-500">
                {user.points} <span className="text-xs text-slate-500 font-sans">pts</span>
              </div>
            </div>
          );
        })}

        {sortedUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
                Nenhum participante registrado.
            </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
