import type { ToastState } from '../hooks/useToast';

const ICONS: Record<string, string> = {
  success: 'ti-circle-check',
  error:   'ti-alert-circle',
  warning: 'ti-alert-triangle',
  info:    'ti-info-circle',
};

interface ToastProps extends ToastState {
  onClose: () => void;
}

export function Toast({ message, type, visible, id, onClose }: ToastProps) {
  const variant = type || 'info';
  const icon    = ICONS[variant] ?? 'ti-info-circle';

  return (
    <div
      className={`toast-wrap toast-${variant}${visible ? ' is-visible' : ''}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast-body">
        <i className={`ti ${icon} toast-icon`} aria-hidden="true" />
        <span className="toast-message">{message}</span>
        <button
          className="toast-close"
          onClick={onClose}
          aria-label="Fechar notificação"
          type="button"
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>

      {visible && <div className="toast-progress" key={id} />}
    </div>
  );
}
