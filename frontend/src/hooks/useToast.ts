import { useState, useRef, useCallback } from 'react';

export interface ToastState {
  message: string;
  type: string;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, type = '') => {
    clearTimeout(timerRef.current);
    setToast({ message, type, visible: true });
    timerRef.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      3500
    );
  }, []);

  return { toast, showToast };
}
