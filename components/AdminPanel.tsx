import React, { useState } from 'react';
import { Match, isKnockoutStage } from '../types';
import { saveMatch, deleteMatch } from '../services/storageService';
import { generateMatchDescription } from '../services/geminiService';
import { Plus, Trash2, Wand2, Calendar, Loader2, Save, Trophy, Pencil, X } from 'lucide-react';

interface AdminPanelProps {
  matches: Match[];
  onUpdate: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ matches, onUpdate }) => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [group, setGroup] = useState('Group A');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for editing mode
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // For setting scores
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editHomeScore, setEditHomeScore] = useState('');
  const [editAwayScore, setEditAwayScore] = useState('');
  const [editPenaltyWinner, setEditPenaltyWinner] = useState<string>('');

  const resetForm = () => {
    setHomeTeam('');
    setAwayTeam('');
    setMatchDate('');
    setMatchTime('');
    setGroup('Group A');
    setEditingMatchId(null);
  };

  const handleEdit = (match: Match) => {
    setEditingMatchId(match.id);
    setHomeTeam(match.homeTeam);
    setAwayTeam(match.awayTeam);
    
    const dateObj = new Date(match.date);
    // Format YYYY-MM-DD
    const dateStr = dateObj.toISOString().split('T')[0];
    // Format HH:MM
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    setMatchDate(dateStr);
    setMatchTime(timeStr);
    setGroup(match.group);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam || !awayTeam || !matchDate || !matchTime) return;

    if (editingMatchId) {
      // Update Existing Match
      const originalMatch = matches.find(m => m.id === editingMatchId);
      if (!originalMatch) return;

      const updatedMatch: Match = {
        ...originalMatch,
        homeTeam,
        awayTeam,
        date: new Date(`${matchDate}T${matchTime}`).toISOString(),
        group,
        // We preserve the original description and status/scores
      };

      await saveMatch(updatedMatch);
      resetForm();
      onUpdate();

    } else {
      // Create New Match
      setIsGenerating(true);
      
      // Auto-generate description using Gemini
      const description = await generateMatchDescription(homeTeam, awayTeam, group);

      const newMatch: Match = {
        id: Date.now().toString(),
        homeTeam,
        awayTeam,
        date: new Date(`${matchDate}T${matchTime}`).toISOString(),
        group,
        description,
        status: 'SCHEDULED'
      };

      await saveMatch(newMatch);
      setIsGenerating(false);
      resetForm();
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this match?')) {
      await deleteMatch(id);
      // If we deleted the match currently being edited, reset form
      if (editingMatchId === id) {
        resetForm();
      }
      onUpdate();
    }
  };

  const startEditingScore = (match: Match) => {
    setEditingScoreId(match.id);
    setEditHomeScore(match.homeScore?.toString() || '');
    setEditAwayScore(match.awayScore?.toString() || '');
    setEditPenaltyWinner(match.penaltyWinner || '');
  };

  const handleSaveScore = async (match: Match) => {
    if (editHomeScore === '' || editAwayScore === '') return;

    const hScore = parseInt(editHomeScore);
    const aScore = parseInt(editAwayScore);
    const isKnockout = isKnockoutStage(match.group);
    
    // Validate penalty winner if draw in knockout
    if (isKnockout && hScore === aScore && !editPenaltyWinner) {
        alert("Select who won on penalties.");
        return;
    }

    const updatedMatch: Match = {
      ...match,
      homeScore: hScore,
      awayScore: aScore,
      penaltyWinner: (isKnockout && hScore === aScore) ? editPenaltyWinner : undefined,
      status: 'FINISHED'
    };

    await saveMatch(updatedMatch);
    setEditingScoreId(null);
    setEditPenaltyWinner('');
    onUpdate();
  };

  return (
    <div className="space-y-8">
      {/* Create/Edit Match Form */}
      <div className={`p-6 rounded-xl border shadow-xl transition-colors ${editingMatchId ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {editingMatchId ? (
               <>
                <Pencil className="w-5 h-5 text-indigo-400" />
                Editar partida
               </>
            ) : (
               <>
                <Plus className="w-5 h-5 text-emerald-500" />
                Criar nova partida
               </>
            )}
          </h2>
          {editingMatchId && (
            <button 
              onClick={resetForm}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-sm bg-slate-800 px-3 py-1 rounded-lg border border-slate-700"
            >
              <X className="w-4 h-4" /> Cancelar edição
            </button>
          )}
        </div>
        
        <form onSubmit={handleSaveForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Seleção A</label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              placeholder="e.g. Brasil"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Seleção B</label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              placeholder="e.g. Argentina"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Data</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Hora</label>
            <input
              type="time"
              value={matchTime}
              onChange={(e) => setMatchTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
             <label className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Grupo / Fase</label>
             <select 
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
             >
                 {['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H', 'Oitavas de final', 'Quartas de final', 'Semi-Final', 'Final'].map(g => (
                     <option key={g} value={g}>{g}</option>
                 ))}
             </select>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={isGenerating || !homeTeam || !awayTeam || !matchDate}
              className={`w-full font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                ${editingMatchId 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 text-white'}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando detalhes com IA...
                </>
              ) : editingMatchId ? (
                <>
                  <Save className="w-5 h-5" />
                  Atualizar detalhes da partida
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Criar partida & Gerar Descrção
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Match List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 bg-slate-900/50 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Gerenciar partidas</h3>
        </div>
        <div className="divide-y divide-slate-700">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhuma partida criada</div>
          ) : (
            matches.map(match => {
                const isPast = new Date(match.date).getTime() < Date.now();
                const isEditingThis = editingMatchId === match.id;
                const isScoreEditing = editingScoreId === match.id;
                
                return (
                  <div key={match.id} className={`p-4 flex flex-col transition-colors ${isEditingThis ? 'bg-indigo-900/20' : 'hover:bg-slate-700/30'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-white text-lg">{match.homeTeam}</span>
                            <span className="text-slate-500 text-sm">vs</span>
                            <span className="font-bold text-white text-lg">{match.awayTeam}</span>
                            {match.status === 'FINISHED' && (
                                <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded border border-emerald-500/30">
                                    FT: {match.homeScore} - {match.awayScore}
                                    {match.penaltyWinner && ` (Pen: ${match.penaltyWinner})`}
                                </span>
                            )}
                            {isEditingThis && (
                                <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded">
                                    Editando...
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(match.date).toLocaleString()}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">{match.group}</span>
                        </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Result Input Area */}
                            {isScoreEditing ? (
                                <div className="flex flex-col gap-2 bg-slate-900 p-3 rounded-lg border border-slate-600">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="A" 
                                            min="0"
                                            className="w-12 p-1 bg-slate-800 text-white rounded text-center border border-slate-700"
                                            value={editHomeScore}
                                            onChange={(e) => setEditHomeScore(e.target.value)}
                                        />
                                        <span className="text-slate-500">:</span>
                                        <input 
                                            type="number" 
                                            placeholder="B" 
                                            min="0"
                                            className="w-12 p-1 bg-slate-800 text-white rounded text-center border border-slate-700"
                                            value={editAwayScore}
                                            onChange={(e) => setEditAwayScore(e.target.value)}
                                        />
                                        <button 
                                            onClick={() => handleSaveScore(match)}
                                            className="p-1.5 bg-green-600 text-white rounded hover:bg-green-500"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Penalty Selector if Draw in Knockout */}
                                    {isKnockoutStage(match.group) && editHomeScore !== '' && editAwayScore !== '' && parseInt(editHomeScore) === parseInt(editAwayScore) && (
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-slate-400 mr-1">Classificado:</span>
                                            <button 
                                                onClick={() => setEditPenaltyWinner(match.homeTeam)}
                                                className={`px-2 py-1 rounded ${editPenaltyWinner === match.homeTeam ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                                            >
                                                A
                                            </button>
                                            <button 
                                                onClick={() => setEditPenaltyWinner(match.awayTeam)}
                                                className={`px-2 py-1 rounded ${editPenaltyWinner === match.awayTeam ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                                            >
                                                B
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                (isPast || match.status === 'FINISHED') && (
                                    <button
                                        onClick={() => startEditingScore(match)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded text-sm font-medium transition-colors"
                                    >
                                        <Trophy className="w-3.5 h-3.5" />
                                        {match.status === 'FINISHED' ? 'Editar placar' : 'Definir placar'}
                                    </button>
                                )
                            )}

                            {/* Edit Details Button (Only for scheduled/not finished matches) */}
                            {match.status === 'SCHEDULED' && (
                                <button
                                    onClick={() => handleEdit(match)}
                                    disabled={!!editingMatchId}
                                    className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Edit Details"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={() => handleDelete(match.id)}
                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Match"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                  </div>
                );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
