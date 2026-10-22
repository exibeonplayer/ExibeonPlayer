import {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {supabase} from '@/integrations/supabase/client';
import {useToast} from '@/hooks/use-toast';
import {Eye, EyeOff} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (email: string) => Promise<void>;
}

export default function CreateUserDialog({open, onOpenChange, onCreated}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const {toast} = useToast();
  useEffect(() => { if (!open) {setName(''); setEmail(''); setPassword(''); setConfirmation(''); setVisible(false); setError('');} }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError('');
    if (password !== confirmation) {setError('As senhas não coincidem'); return;}
    if (new TextEncoder().encode(password).length > 72) {setError('A senha deve ter no máximo 72 bytes'); return;}
    setPending(true);
    try {
      const {data, error: failure} = await supabase.functions.invoke('manage-devices', {body:{action:'create-user', name, email, password}});
      if (failure || !data?.success) {
        let message = data?.error || 'Não foi possível criar a conta. Tente novamente.';
        if (failure?.context instanceof Response) {
          try {message = (await failure.context.json()).error || message;} catch { /* Network response without JSON. */ }
        }
        setError(message); return;
      }
      setPassword(''); setConfirmation('');
      toast({title:'Usuário criado', description:'A conta já pode entrar com o e-mail e a senha cadastrados.'});
      onOpenChange(false);
      await onCreated(data.user.email);
    } catch {
      setError('Não foi possível confirmar a operação. Atualize a lista antes de tentar novamente.');
    } finally {setPending(false);}
  }

  return <Dialog open={open} onOpenChange={next => {if (!pending) onOpenChange(next);}}>
    <DialogContent className="sm:max-w-md" onEscapeKeyDown={event => {if (pending) event.preventDefault();}} onPointerDownOutside={event => {if (pending) event.preventDefault();}}>
      <DialogHeader><DialogTitle>Criar novo usuário</DialogTitle>
        <DialogDescription>Crie uma conta de cliente. Não será enviado e-mail de confirmação. A licença inicial permite 1 player por 30 dias; você pode ajustá-la em Licenças.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={pending} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="new-user-name">Nome (opcional)</Label><Input id="new-user-name" value={name} onChange={event => setName(event.target.value)} maxLength={100} autoComplete="off" /></div>
          <div className="space-y-2"><Label htmlFor="new-user-email">E-mail</Label><Input id="new-user-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} autoComplete="off" /></div>
          <div className="space-y-2"><Label htmlFor="new-user-password">Senha</Label><div className="relative">
            <Input id="new-user-password" className="pr-10" type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
            <button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-3" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div><p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p></div>
          <div className="space-y-2"><Label htmlFor="new-user-confirm">Confirmar senha</Label><Input id="new-user-confirm" type={visible ? 'text' : 'password'} value={confirmation} onChange={event => setConfirmation(event.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" /></div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? 'Criando...' : 'Criar usuário'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
