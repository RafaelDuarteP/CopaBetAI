import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { registerUser, deleteUser, getUsers } from '../services/storageService';
import ConfirmModal from './ConfirmModal';
import { UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';

interface UserManagementProps {
  onUpdate: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUpdate }) => {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, userId: string | null }>({
    isOpen: false,
    userId: null
  });

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newName || !newUsername || !newPassword) {
        setError("All fields are required");
        return;
    }

    try {
      const newUser: User = {
        id: Date.now().toString(),
        name: newName,
        username: newUsername,
        password: newPassword,
        role: newRole,
        points: 0
      };

      registerUser(newUser);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setSuccess('User created successfully');
      refreshUsers();
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ isOpen: true, userId: id });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.userId) {
        deleteUser(deleteModal.userId);
        refreshUsers();
        onUpdate();
    }
    setDeleteModal({ isOpen: false, userId: null });
  };

  return (
    <div className="space-y-8">
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Excluir Usuário"
        message="Tem certeza que deseja excluir este usuário? Todos os palpites e pontos associados serão removidos permanentemente."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, userId: null })}
      />

      {/* Create User Form */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-500" />
          Criar novo usuário
        </h2>
        
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Nome de exibição</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. jdoe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Role</label>
             <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
             >
                 <option value={UserRole.USER}>User</option>
                 <option value={UserRole.ADMIN}>Admin</option>
             </select>
          </div>

          <div className="md:col-span-2">
            {error && <p className="text-rose-500 text-sm mb-2">{error}</p>}
            {success && <p className="text-emerald-500 text-sm mb-2">{success}</p>}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all"
            >
              Criar usuário
            </button>
          </div>
        </form>
      </div>

      {/* User List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 bg-slate-900/50 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">System Users</h3>
        </div>
        <div className="divide-y divide-slate-700">
          {users.map(u => (
            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                    ${u.role === UserRole.ADMIN ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {u.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                      {u.name}
                      {u.role === UserRole.ADMIN && <Shield className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <div className="text-slate-500 text-sm">@{u.username}</div>
                </div>
              </div>
              
              {/* Prevent deleting yourself or the main admin if you want strict rules, but for now simple delete */}
              {u.username !== 'admin' && (
                  <button
                    onClick={() => handleDeleteClick(u.id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove User"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;