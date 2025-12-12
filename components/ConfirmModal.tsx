import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Excluir',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" role="dialog" aria-modal="true">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
            </div>
          </div>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-8 ml-1">
            {message}
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white font-medium transition-colors text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold transition-colors text-sm shadow-lg shadow-rose-900/20 flex items-center gap-2"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;