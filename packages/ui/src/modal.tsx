import * as React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Modal = ({ isOpen, onClose, children, title, className }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-slate-900/90 border border-slate-700 rounded-xl p-6 shadow-xl ${className || ''}`}>
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
