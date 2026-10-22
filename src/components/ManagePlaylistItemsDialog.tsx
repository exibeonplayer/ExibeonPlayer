import {useState} from 'react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {ChevronUp,ChevronDown,Trash2,Plus,Save} from 'lucide-react';
import {usePlaylistDraft} from '@/hooks/usePlaylistDraft';
import type {Playlist} from '@/hooks/usePlaylists';
import {MediaSelector,SelectedMedia} from './MediaSelector';
import {formatAdvancedMediaDuration} from '@/utils/mediaDuration';
import {useToast} from '@/hooks/use-toast';
interface Props{playlist:Playlist|null;open:boolean;onOpenChange:(open:boolean)=>void;onPlaylistUpdated?:()=>void;}
export default function ManagePlaylistItemsDialog({playlist,open,onOpenChange,onPlaylistUpdated}:Props){
 const draft=usePlaylistDraft(playlist?.id,open),[selecting,setSelecting]=useState(false),{toast}=useToast();
 function close(value:boolean){if(draft.saving)return;if(!value&&draft.dirty&&!window.confirm('Descartar as alterações não salvas? O player continuará com a programação atual.'))return;setSelecting(false);onOpenChange(value);}
 function add(media:SelectedMedia){try{draft.add({id:crypto.randomUUID(),playlist_id:playlist!.id,display_order:0,created_at:new Date().toISOString(),media_file_id:media.type==='video'?media.id:undefined,media_instance_id:media.type==='media_instance'?media.id:undefined,is_overlay:media.isOverlay,media_files:media.file,media_instances:media.instance});setSelecting(false);}catch(e){draft.setError((e as Error).message);}}
 async function save(){try{await draft.save();toast({title:'Playlist salva',description:'Os players receberão a programação completa na próxima sincronização.'});onPlaylistUpdated?.();setSelecting(false);onOpenChange(false);}catch{/* Draft and error remain visible for retry. */}}
 return <Dialog open={open} onOpenChange={close}><DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Gerenciar mídias: {playlist?.name}</DialogTitle><DialogDescription>Adicione, remova e organize até 5 mídias. O player só recebe as alterações depois de Salvar.</DialogDescription></DialogHeader>
  {draft.error&&<p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{draft.error}</p>}
  {draft.loading?<p>Carregando playlist…</p>:<fieldset disabled={draft.saving||!draft.ready} className="min-w-0 space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{draft.items.length}/5 mídias · {draft.dirty?'Alterações não salvas':'Programação salva'}</span><Button variant="outline" disabled={draft.items.length>=5||draft.saving} onClick={()=>setSelecting(true)}><Plus className="mr-2 h-4 w-4"/>Adicionar mídia</Button></div>
   {selecting&&<section className="rounded-lg border p-4"><MediaSelector onSelect={add} onClose={()=>setSelecting(false)} excludedIds={draft.items.flatMap(i=>[i.media_file_id,i.media_instance_id].filter(Boolean) as string[])}/></section>}
   {draft.items.length===0?<p className="rounded-lg border p-6 text-sm text-muted-foreground">Nenhuma mídia nesta playlist. Adicione mídias e clique em Salvar para publicar.</p>:<ol className="space-y-2">{draft.items.map((item,index)=><li key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3"><span className="w-6 text-sm text-muted-foreground">{index+1}</span><div className="min-w-0 flex-1"><p className="break-words font-medium">{item.media_instances?.name||item.media_files?.title||'Mídia indisponível'}</p><div className="mt-1 flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.is_overlay?'Mensagem de rodapé':item.media_instances?.template?.media_type==='rss'?'Notícias':item.media_files?.content_type==='image'?'Imagem':item.media_files?.content_type==='video'?'Vídeo':'Mídia criada'}</Badge><span className="text-xs text-muted-foreground">{item.media_instances?formatAdvancedMediaDuration(item.media_instances):item.media_files?.duration_seconds?`${item.media_files.duration_seconds}s`:''}</span></div></div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label="Mover para cima" disabled={index===0||draft.saving} onClick={()=>draft.move(item.id,-1)}><ChevronUp className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label="Mover para baixo" disabled={index===draft.items.length-1||draft.saving} onClick={()=>draft.move(item.id,1)}><ChevronDown className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label="Remover mídia do rascunho" onClick={()=>draft.remove(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></li>)}</ol>}
  </fieldset>}
  <div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" disabled={draft.saving} onClick={()=>close(false)}>Cancelar</Button><Button disabled={draft.loading||draft.saving||!draft.ready||!draft.dirty} onClick={save}><Save className="mr-2 h-4 w-4"/>{draft.saving?'Salvando…':'Salvar e fechar'}</Button></div>
 </DialogContent></Dialog>;
}
