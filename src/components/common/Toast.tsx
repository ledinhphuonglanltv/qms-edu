'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng bên trong ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Container hiển thị danh sách Toast ở góc trên cùng bên phải */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  let bgClass = 'bg-white border-slate-200 text-slate-800';
  let icon = 'ℹ️';

  switch (toast.type) {
    case 'success':
      bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100';
      icon = '✅';
      break;
    case 'error':
      bgClass = 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100';
      icon = '❌';
      break;
    case 'warning':
      bgClass = 'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100';
      icon = '⚠️';
      break;
    case 'info':
    default:
      bgClass = 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-indigo-100';
      icon = '⏳';
      break;
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg pointer-events-auto transition-all duration-300 animate-slide-in ${bgClass}`}
      role="alert"
    >
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="flex-grow text-xs font-bold leading-relaxed">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 text-sm font-bold cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
