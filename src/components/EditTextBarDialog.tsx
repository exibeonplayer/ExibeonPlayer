import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MediaInstance } from '@/hooks/useMediaTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function EditTextBarDialog({instance,onClose,onSaved}:{instance:MediaInstance|null;onClose:()=>void;onSaved:()=>void}){
  const {user}=useAuth(),{toast}=useToast();
  const [text,setText]=useState(''),[position,setPosition]=useState('bottom'),[color,setColor]=useState('#ffffff'),[background,setBackground]=useState('#111827'),[scroll,setScroll]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
  useEffect(()=>{const c=instance?.custom_config||{};setText(c.bar_text||'');setPosition(c.bar_position==='top'?'top':'bottom');setColor(/^#[a-f0-9]{6}$/i.test(c.bar_text_color)?c.bar_text_color:'#ffffff');setBackground(/^#[a-f0-9]{6}$/i.test(c.bar_background_color)?c.bar_background_color:'#111827');setScroll(c.bar_scroll===true);setError('');},[instance]);
  async function save(){
    if(!instance||!user||saving)return;if(!text.trim()){setError('Digite o texto da faixa.');return;}
    setSaving(true);setError('');
    try{
      const custom_config={...instance.custom_config,bar_text:text.trim(),bar_position:position,bar_text_color:color,bar_background_color:background,bar_scroll:scroll};
      const {error,data}=await supabase.from('media_instances' as any).update({custom_config,updated_at:new Date().toISOString()}).eq('id',instance.id).eq('created_by',user.id).select('id').single();
      if(error||!data)throw error||new Error('Mídia indisponível');
      toast({title:'Faixa atualizada',description:'O texto será atualizado nos players que reproduzem esta mídia.'});onSaved();onClose();
    }catch{setError('Não foi possível salvar a faixa. Tente novamente.');}finally{setSaving(false);}
  }
  return <Dialog open={!!instance} onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Editar faixa: {instance?.name}</DialogTitle><DialogDescription>Ao adicionar esta faixa à playlist, ela aparece sobre os conteúdos da programação. A altura se adapta ao player.</DialogDescription></DialogHeader>
    <fieldset disabled={saving} className="min-w-0 space-y-4">
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="relative aspect-video overflow-hidden rounded-md bg-slate-900 text-slate-400"><div className="absolute inset-0 flex items-center justify-center text-sm">Conteúdos da playlist</div><div className="absolute left-0 right-0 flex h-[18%] items-center overflow-hidden px-3 text-sm font-semibold" style={{[position]:0,color,backgroundColor:background}}><span className="truncate">{text||'Prévia do texto da faixa'}</span></div></div>
      <div className="space-y-2"><Label htmlFor="edit-bar-text">Texto da barra</Label><Textarea id="edit-bar-text" maxLength={500} value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Digite seu aviso ou promoção"/><p className="text-xs text-muted-foreground">{text.length}/500 caracteres</p></div>
      <div className="space-y-2"><Label htmlFor="edit-bar-position">Posição</Label><select id="edit-bar-position" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={position} onChange={e=>setPosition(e.target.value)}><option value="bottom">Rodapé</option><option value="top">Topo</option></select></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="edit-bar-color">Cor do texto</Label><Input id="edit-bar-color" type="color" value={color} onChange={e=>setColor(e.target.value)}/></div><div className="space-y-2"><Label htmlFor="edit-bar-background">Cor do fundo</Label><Input id="edit-bar-background" type="color" value={background} onChange={e=>setBackground(e.target.value)}/></div></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={scroll} onChange={e=>setScroll(e.target.checked)}/> Texto em movimento (rolagem)</label>
      <Button onClick={save} disabled={saving}>{saving?'Salvando…':'Salvar texto da barra'}</Button>
    </fieldset>
  </DialogContent></Dialog>;
}
