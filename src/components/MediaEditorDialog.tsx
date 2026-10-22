import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MediaInstance, MediaTemplate, useMediaTemplates } from '@/hooks/useMediaTemplates';
import { useUpload } from '@/hooks/useUpload';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { videoThumbnail } from '@/lib/video-thumbnail';

const labels:Record<string,string>={static:'Vídeo ou imagem',overlay:'Mensagem de rodapé',weather:'Previsão do tempo',rss:'Notícias RSS',clock:'Relógio',calendar:'Calendário',counter:'Contador',webpage:'Página web'};
const rssAliases:Record<string,string>={'611232f1-ca1d-4425-b640-b2c67305e9b5':'g1','71faa4c3-27d6-4898-aab8-dda44590accd':'bbc'};
const selectClass='h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm';
export default function MediaEditorDialog({open,template,instance,onClose,onSaved,copyOnWrite=false}:{open:boolean;template:MediaTemplate|null;instance?:MediaInstance|null;onClose:()=>void;onSaved:(instance?:MediaInstance)=>void;copyOnWrite?:boolean}){
 const {user}=useAuth(),{toast}=useToast(),{createInstance,updateInstance}=useMediaTemplates(),{uploadFile}=useUpload(),{addVideo}=useVideos();
 const [name,setName]=useState(''),[description,setDescription]=useState(''),[config,setConfig]=useState<Record<string,any>>({}),[file,setFile]=useState<File|null>(null),[background,setBackground]=useState<File|null>(null),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const type=template?.media_type||'static';
 useEffect(()=>{
   if(!open||!template)return;
   const c={...template.template_config,...instance?.custom_config};
   c.rss_source=c.rss_source||rssAliases[c.rss_source_id]||(c.rss_source_id?'legacy-unavailable':'g1');c.timezone=c.timezone||'America/Fortaleza';c.display_duration=c.display_duration||(type==='rss'?Math.min(300,(c.max_items||5)*8):20);
   c.bar_text_color=/^#[a-f0-9]{6}$/i.test(c.bar_text_color)?c.bar_text_color:'#ffffff';c.bar_background_color=/^#[a-f0-9]{6}$/i.test(c.bar_background_color)?c.bar_background_color:'#111827';
   setConfig(c);setName(instance?.name||'');setDescription(instance?.description||'');setFile(null);setBackground(null);setError('');
 },[open,template?.id,instance?.id]);
 const change=(key:string,value:any)=>setConfig(c=>({...c,[key]:value}));
 const field=(key:string,label:string,kind='text',fallback:any='',attrs:Record<string,any>={})=><div className="space-y-2"><Label htmlFor={`media-${key}`}>{label}</Label><Input id={`media-${key}`} type={kind} value={config[key]??fallback} onChange={e=>change(key,kind==='number'?Number(e.target.value):e.target.value)} {...attrs}/></div>;
 const checkbox=(key:string,label:string,fallback=false)=><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config[key]??fallback} onChange={e=>change(key,e.target.checked)}/>{label}</label>;
 const select=(key:string,label:string,options:Record<string,string>,fallback:string)=><div className="space-y-2"><Label htmlFor={`media-${key}`}>{label}</Label><select id={`media-${key}`} className={selectClass} value={config[key]??fallback} onChange={e=>change(key,e.target.value)}>{Object.entries(options).map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></div>;
 async function storeFile(source:File){
   if(!user)throw new Error('Entre novamente na sua conta.');
   if(!/^(video\/(mp4|webm|quicktime)|image\/(jpeg|png|gif|webp))$/.test(source.type))throw new Error('Use MP4/WebM compatível ou imagem JPG, PNG, GIF ou WebP.');
   const file_url=await uploadFile(source,undefined,{silent:true});let thumbnail_url:string|undefined,duration_seconds:number|undefined;
   if(source.type.startsWith('video/')){try{const preview=await videoThumbnail(source);duration_seconds=preview.duration;thumbnail_url=await uploadFile(preview.file,undefined,{silent:true});}catch{toast({title:'Arquivo enviado sem miniatura',description:'O navegador não conseguiu extrair um quadro deste formato.'});}}
   const row=await addVideo({title:source.name,content_type:source.type.startsWith('video/')?'video':'image',file_url,file_size_bytes:source.size,user_id:user.id,thumbnail_url,duration_seconds});
   return (row as unknown as {id:string}).id;
 }
 async function save(){
   if(!template||!user||saving)return;setError('');
   if(!name.trim()){setError('Informe um nome para a mídia.');return;}
   if(type==='overlay'&&!String(config.bar_text||'').trim()){setError('Digite a mensagem de rodapé.');return;}
   if(type==='weather'&&!String(config.city_name||'').trim()){setError('Informe a cidade.');return;}
   if(type==='rss'&&!['g1','agencia_brasil','bbc','ge'].includes(config.rss_source)){setError('A fonte anterior não está disponível. Escolha uma das fontes atuais de notícias.');return;}
   if(type==='static'&&!file&&!config.media_file_id&&!config.video_file_id){setError('Selecione o arquivo da mídia.');return;}
   if(type==='static'&&file&&template.template_config.supports_video===false&&file.type.startsWith('video/')){setError('Este modelo é de imagem. Selecione uma imagem.');return;}
   if(type==='clock'||type==='calendar'){try{new Intl.DateTimeFormat('pt-BR',{timeZone:config.timezone});}catch{setError('Fuso horário inválido. Exemplo: America/Fortaleza.');return;}}
   if(type==='webpage'){try{const u=new URL(config.web_url);if(u.protocol!=='https:'||u.username||u.password||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[)|\.(local|internal)$/i.test(u.hostname))throw Error();}catch{setError('Use uma página HTTPS pública, sem usuário ou senha na URL.');return;}}
   setSaving(true);
   try{
     const finalConfig={...config};delete finalConfig.api_key;delete finalConfig.video_file;delete finalConfig.background_image;
     finalConfig.display_duration=Math.max(5,Math.min(300,Number(config.display_duration)||20));
     if(file)finalConfig.media_file_id=await storeFile(file);
     if(type==='rss'){delete finalConfig.background_media_id;delete finalConfig.background;delete finalConfig.color;}
     if(background&&type!=='rss')finalConfig.background_media_id=await storeFile(background);
     const saved=instance&&!copyOnWrite?await updateInstance(instance.id,{name:name.trim(),description:description.trim(),custom_config:finalConfig}):await createInstance(template.id,name.trim(),description.trim(),finalConfig);
     toast({title:copyOnWrite?'Mídia preparada no rascunho':instance?'Mídia atualizada':'Mídia criada',description:copyOnWrite?'Salve a playlist para enviar ao player. A mídia também fica disponível na biblioteca.':'Adicione esta mídia à playlist para reproduzir.'});onSaved(saved as unknown as MediaInstance);onClose();
   }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a mídia.');}finally{setSaving(false);}
 }
 return <Dialog open={open} onOpenChange={v=>{if(!v&&!saving)onClose();}}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{instance?'Editar':'Criar'} {labels[type]}</DialogTitle><DialogDescription>Modelo {template?.orientation==='vertical'?'vertical':'horizontal'}. A mídia se adapta à área definida no player; a orientação não altera o tamanho da janela.{copyOnWrite&&' A reprodução só muda após salvar a playlist.'}</DialogDescription></DialogHeader>
  <fieldset disabled={saving} className="min-w-0 space-y-4">
   {error&&<p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
   <div className="space-y-2"><Label htmlFor="media-name">Nome da mídia</Label><Input id="media-name" maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder={labels[type]}/></div>
   <div className="space-y-2"><Label htmlFor="media-description">Descrição</Label><Input id="media-description" maxLength={500} value={description} onChange={e=>setDescription(e.target.value)}/></div>
   {type==='static'&&<div className="space-y-2"><Label htmlFor="media-file">Arquivo {config.media_file_id||config.video_file_id?'(escolher outro é opcional)':''}</Label><Input id="media-file" type="file" accept={template?.template_config.supports_video===false?'image/jpeg,image/png,image/webp,image/gif':'video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/gif'} onChange={e=>setFile(e.target.files?.[0]||null)}/><p className="text-xs text-muted-foreground">Até 100 MB. Vídeos avançam ao final do arquivo. A compatibilidade de vídeo depende do codec; MP4 H.264 é a opção mais comum.</p></div>}
   {type==='overlay'&&<>
    <div className="space-y-2"><Label htmlFor="media-bar-text">Mensagem de rodapé</Label><Textarea id="media-bar-text" maxLength={500} rows={3} value={config.bar_text||''} onChange={e=>change('bar_text',e.target.value)}/><p className="text-xs text-muted-foreground">A faixa acompanha os conteúdos da playlist. Não é necessário enviar outro vídeo.</p></div>
    {select('bar_position','Posição',{bottom:'Rodapé',top:'Topo'},'bottom')}
    <div className="grid grid-cols-2 gap-3">{field('bar_text_color','Cor do texto','color','#ffffff')}{field('bar_background_color','Cor do fundo','color','#111827')}</div>
    {checkbox('bar_scroll','Texto em movimento (rolagem)')}
    <div className="overflow-hidden rounded-md px-3 py-3 text-sm font-semibold" style={{color:config.bar_text_color||'#fff',backgroundColor:config.bar_background_color||'#111827'}}>{config.bar_text||'Prévia da mensagem de rodapé'}</div>
   </>}
   {type==='weather'&&<>{field('city_name','Cidade e estado','text','',{placeholder:'Teresina, PI',maxLength:80})}{field('country_code','País (código)','text','BR',{maxLength:2})}{select('units','Unidade',{metric:'Celsius (°C)',imperial:'Fahrenheit (°F)'},'metric')}<p className="text-xs text-muted-foreground">Condições reais via Open-Meteo. Para uma miniatura sobre o vídeo, use Sobreposições → Clima no editor da playlist.</p></>}
   {type==='rss'&&<>{select('rss_source','Fonte das notícias',{...(config.rss_source==='legacy-unavailable'?{'legacy-unavailable':'Fonte anterior indisponível — escolha outra'}:{}),g1:'G1 — últimas notícias',agencia_brasil:'Agência Brasil',bbc:'BBC News Brasil',ge:'ge — esportes'},'g1')}{field('max_items','Quantidade de manchetes','number',5,{min:1,max:15})}{field('item_duration','Segundos por manchete','number',8,{min:4,max:60})}<p className="text-xs text-muted-foreground">Foto e título de cada notícia, fornecidos pela fonte original. Notícias sem foto são omitidas desta apresentação.</p></>}
   {(type==='clock'||type==='calendar')&&field('timezone','Fuso horário','text','America/Fortaleza',{maxLength:80})}
   {type==='clock'&&<>{select('format','Formato',{'24h':'24 horas','12h':'12 horas'},'24h')}{checkbox('show_seconds','Mostrar segundos',true)}{checkbox('show_date','Mostrar data',true)}<p className="text-xs text-muted-foreground">Este modelo ocupa a tela. Para fixar o relógio em um canto, use Sobreposições → Relógio no editor da playlist.</p></>}
   {type==='calendar'&&<>{select('first_day_of_week','Primeiro dia da semana',{sunday:'Domingo',monday:'Segunda-feira'},'sunday')}{checkbox('highlight_today','Destacar o dia atual',true)}{checkbox('show_week_numbers','Mostrar números das semanas')}</>}
   {type==='counter'&&<><div className="grid grid-cols-2 gap-3">{field('start_value','Valor inicial','number',0,{min:-1000000000,max:1000000000})}{field('end_value','Valor final','number',100,{min:-1000000000,max:1000000000})}</div>{select('direction','Direção',{up:'Crescente',down:'Decrescente'},'up')}{field('speed','Intervalo entre números (ms)','number',100,{min:10,max:10000})}<div className="grid grid-cols-2 gap-3">{field('prefix','Antes do número','text','',{maxLength:40})}{field('suffix','Depois do número','text','',{maxLength:40})}</div></>}
   {type==='webpage'&&<>{field('web_url','Endereço HTTPS','url','',{placeholder:'https://seusite.com/painel',maxLength:4096})}{field('refresh_interval','Atualizar página a cada (segundos)','number',60,{min:30,max:3600})}<p className="text-xs text-muted-foreground">Requer internet. O site precisa permitir incorporação em painéis; sites que bloqueiam iframe, exigem login ou permissões podem não funcionar. A página não tem acesso à configuração do player.</p></>}
   {type!=='overlay'&&field('display_duration',type==='static'?'Duração da imagem na playlist (segundos)':'Tempo na playlist (segundos)','number',20,{min:5,max:300})}
   {['clock','calendar','counter'].includes(type)&&<>
    <div className="grid grid-cols-2 gap-3">{field('color','Cor do conteúdo','color','#f5f9ff')}{field('background','Cor do fundo','color','#102b40')}</div>
    <div className="space-y-2"><Label htmlFor="media-background">Imagem de fundo opcional</Label><Input id="media-background" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>setBackground(e.target.files?.[0]||null)}/>{config.background_media_id&&<Button type="button" variant="outline" size="sm" onClick={()=>{change('background_media_id',null);setBackground(null);}}>Remover fundo desta mídia</Button>}</div>
   </>}
   <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving?'Salvando…':instance?'Salvar alterações':'Criar mídia'}</Button></div>
  </fieldset>
 </DialogContent></Dialog>;
}
