import {
  IconAlertTriangle,
  IconHelpCircle,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {danger ? <IconAlertTriangle size={18} /> : <IconHelpCircle size={18} />}
            {title}
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm}>
            {danger ? <IconTrash size={16} /> : <IconCheck size={16} />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}