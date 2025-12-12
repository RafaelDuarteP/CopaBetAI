import React, { useState } from 'react';
import { User } from '../types';
import { updateUser } from '../services/storageService';
import { User as UserIcon, Lock, Save, Trophy, Loader2 } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: User = { ...user, password: newPassword };
      await updateUser(updatedUser);
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar senha.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      {/* Header Profile */}
      <div className="relative h-24 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-800 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>

      <div className="pt-12 pb-6 px-4 text-center">
        <h2 className="text-xl font-bold text-white">{user.name}</h2>
        <p className="text-sm text-slate-400">@{user.username}</p>
        
        <div className="mt-6 flex justify-center">
           <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 w-full max-w-[200px]">
               <div className="flex items-center justify-center gap-2 mb-1 text-emerald-400 font-bold uppercase text-xs tracking-wider">
                   <Trophy className="w-4 h-4" />
                   Sua Pontuação
               </div>
               <div className="text-4xl font-mono font-bold text-white">
                   {user.points}
               </div>
           </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="border-t border-slate-700 pt-6">
          <button 
             onClick={() => {
                 setIsEditing(!isEditing);
                 setMessage(null);
             }}
             className="w-full flex items-center justify-between text-slate-300 hover:text-white transition-colors text-sm font-semibold mb-4"
          >
              <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Segurança da Conta
              </span>
              <span className="text-xs text-emerald-500 hover:underline">
                  {isEditing ? 'Cancelar' : 'Alterar Senha'}
              </span>
          </button>

          {isEditing && (
            <form onSubmit={handleUpdatePassword} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                    <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nova Senha"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div>
                    <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar Senha"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                
                {message && (
                    <div className={`text-xs p-2 rounded ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!newPassword || !confirmPassword || isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Atualizar Senha
                </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
