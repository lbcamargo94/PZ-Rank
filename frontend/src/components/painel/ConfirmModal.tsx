import { useEffect } from 'react';
import {
  IconX,
  IconAlertTriangle,
  IconHelpCircle,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react';

interface Props {
  title:         string;
  message:       string;
  confirmLabel?: string;
  danger?:       boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  return (
    <div className="modal-overlay active" role="alertdialog" aria-modal="true">
      <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onCancel}>
          <IconX size={16} />
        </button>
        <h2 className="modal-title">
          {danger ? <IconAlertTriangle size={18} /> : <IconHelpCircle size={18} />} {title}
        </h2>
        <p className="confirm-modal-msg">{message}</p>
        <div className="confirm-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {danger ? <IconTrash size={16} /> : <IconCheck size={16} />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}