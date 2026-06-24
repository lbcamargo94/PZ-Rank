import { useState } from 'react';
import { toast } from 'sonner';
import { apiCreateModerator } from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconLoader2 } from '@tabler/icons-react';

interface Props {
  token:     string;
  onClose:   () => void;
  onSuccess: () => void;
}

export function CreateModeratorModal({ token, onClose, onSuccess }: Props) {
  const [login,    setLogin]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login || !password) return;
    setLoading(true);
    try {
      await apiCreateModerator(token, { login, password });
      toast.success(`Moderador ${login} criado com sucesso.`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo Moderador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cm-login">Login</Label>
            <Input id="cm-login" type="text" placeholder="nome_do_moderador"
              value={login} onChange={e => setLogin(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cm-pass">Senha inicial</Label>
            <Input id="cm-pass" type="password" placeholder="mínimo 6 caracteres"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading || !login || !password}>
              {loading
                ? <><IconLoader2 size={16} className="animate-spin" /> Criando...</>
                : 'Criar moderador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}