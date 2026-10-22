import {useEffect,useState} from 'react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {supabase} from '@/integrations/supabase/client';
import {useToast} from '@/hooks/use-toast';

export default function DeleteUserDialog({user,onClose,onDeleted}:{user:{id:string;email:string}|null;onClose:()=>void;onDeleted:()=>Promise<void>}) {
  const [confirmation,setConfirmation]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState('');
  const {toast}=useToast();
  useEffect(()=>{setConfirmation('');setError('');},[user?.id]);
  async function submit(event:React.FormEvent){
    event.preventDefault();if(pending||!user)return;setPending(true);setError('');
    try{
      const {data,error:failure}=await supabase.functions.invoke('manage-devices',{body:{action:'delete-user',user_id:user.id,confirm_email:confirmation}});
      if(failure||!data?.success){let message=data?.error||'Não foi possível excluir o usuário.';if(failure?.context instanceof Response){try{message=(await failure.context.json()).error||message;}catch{}}setError(message);return;}
      toast({title:'Usuário excluído',description:'A conta foi removida da gestão de licenças.'});onClose();await onDeleted();
    }catch{setError('Não foi possível confirmar a exclusão. Atualize a lista antes de tentar novamente.');}finally{setPending(false);}
  }
  return <Dialog open={!!user} onOpenChange={open=>{if(!open&&!pending)onClose();}}><DialogContent onEscapeKeyDown={e=>{if(pending)e.preventDefault();}} onPointerDownOutside={e=>{if(pending)e.preventDefault();}}>
    <DialogHeader><DialogTitle>Excluir usuário</DialogTitle><DialogDescription>Esta ação é permanente. A conta, licença, players, playlists e registros de exibição deste usuário serão removidos. Players desconectados receberão o bloqueio quando voltarem à rede.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-4"><p className="break-all font-medium">{user?.email}</p><div className="space-y-2"><Label htmlFor="delete-user-confirm">Digite o e-mail acima para confirmar</Label><Input id="delete-user-confirm" value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={pending} autoComplete="off" required /></div>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button><Button type="submit" variant="destructive" disabled={pending||confirmation.trim().toLowerCase()!==user?.email.toLowerCase()}>{pending?'Excluindo...':'Excluir permanentemente'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}
