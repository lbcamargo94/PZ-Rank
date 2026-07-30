import { useState, useRef, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastState {
  message: string;
  type: ToastType | '';
  visible: boolean;
  id: number;
}

const DURATION = 5000;

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: '', visible: false, id: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const idRef    = useRef(0);

  const showToast = useCallback((message: string, type: string = '') => {
    clearTimeout(timerRef.current);
    idRef.current += 1;
    setToast({ message, type: type as ToastType | '', visible: true, id: idRef.current });
    timerRef.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      DURATION
    );
  }, []);

  const clearToast = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(t => ({ ...t, visible: false }));
  }, []);

  return { toast, showToast, clearToast };
}
