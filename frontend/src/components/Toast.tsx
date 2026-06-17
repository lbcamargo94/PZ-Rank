import type { ToastState } from '../hooks/useToast';

export function Toast({ message, type, visible }: ToastState) {
  return (
    <div
      className={['toast', visible ? 'show' : '', type].filter(Boolean).join(' ')}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
