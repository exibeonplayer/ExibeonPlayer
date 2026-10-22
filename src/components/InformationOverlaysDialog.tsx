import CitySearch from '@/components/CitySearch';
import { useEffect, useState } from 'react';
import { Radio, CloudSun, Clock, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Information = {kind:'rss'|'weather'|'clock'|'text';source?:string;city?:string;lat?:number;lon?:number;timezone?:string;text?:string;position?:'top'|'bottom'|'top-left'|'top-right'|'bottom-left'|'bottom-right'|'footer-left'|'footer-right';mode?:'compact'|'details';color?:string;background?:string;scroll?:boolean};
type Row = {id:string;name:string;information_overlays?:Information[]};
const cities = [
  {city:'Fortaleza, CE',lat:-3.7327,lon:-38.527}, {city:'São Paulo, SP',lat:-23.5505,lon:-46.6333},
  {city:'Rio de Janeiro, RJ',lat:-22.9068,lon:-43.1729}, {city:'Brasília, DF',lat:-15.7939,lon:-47.8828},
  {city:'Recife, PE',lat:-8.0476,lon:-34.877}, {city:'Salvador, BA',lat:-12.9777,lon:-38.5016},
  {city:'Belo Horizonte, MG',lat:-19.9167,lon:-43.9345},
];
const previewCorner=(position:string):React.CSSProperties=>({[position.includes('bottom')?'bottom':'top']:'20%',[position.includes('right')?'right':'left']:12});
function CornerSelect({id,value,onChange}:{id:string;value:string;onChange:(v:string)=>void}){return <div className="space-y-2"><Label htmlFor={id}>Canto fixo</Label><select id={id} className={selectClass} value={value} onChange={e=>onChange(e.target.value)}><option value="top-left">Superior esquerdo</option><option value="top-right">Superior direito</option><option value="bottom-left">Inferior esquerdo</option><option value="bottom-right">Inferior direito</option></select></div>;}
const selectClass='h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm';

export default function InformationOverlaysDialog({open,onOpenChange,draftPlaylist,onDraftSave}:{open:boolean;onOpenChange:(v:boolean)=>void;draftPlaylist?:Row;onDraftSave?:(config:Information[])=>void}) {
  const {user}=useAuth();const {toast}=useToast();
  const [rows,setRows]=useState<Row[]>([]),[selected,setSelected]=useState(''),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
  const [clockPosition,setClockPosition]=useState('footer-right'),[weatherPosition,setWeatherPosition]=useState('top-left'),[weatherMode,setWeatherMode]=useState<'compact'|'details'>('compact');
  const [rss,setRss]=useState(false),[weather,setWeather]=useState(false),[clock,setClock]=useState(false);
  const [textEnabled,setTextEnabled]=useState(false),[barText,setBarText]=useState(''),[barPosition,setBarPosition]=useState<'top'|'bottom'>('bottom'),[barColor,setBarColor]=useState('#ffffff'),[barBackground,setBarBackground]=useState('#111827'),[barScroll,setBarScroll]=useState(false);
  const [source,setSource]=useState('g1'),[city,setCity]=useState(cities[0].city),[lat,setLat]=useState(String(cities[0].lat)),[lon,setLon]=useState(String(cities[0].lon)),[timezone,setTimezone]=useState('America/Fortaleza');
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!open||!user)return;
    if(draftPlaylist){setRows([draftPlaylist]);setSelected(draftPlaylist.id);setLoading(false);setError('');return;}
    let active=true;setLoading(true);setError('');
    supabase.from('playlists' as any).select('id,name,information_overlays').eq('user_id',user.id).order('name').then(({data,error})=>{
      if(!active)return;setLoading(false);
      if(error){setRows([]);setError('Não foi possível carregar as configurações de sobreposição.');return;}
      const list=(data||[]) as unknown as Row[];setRows(list);setSelected(list[0]?.id||'');
    });return ()=>{active=false;};
  },[open,user?.id,draftPlaylist?.id]);
  useEffect(()=>{
    const config=rows.find(r=>r.id===selected)?.information_overlays||[];
    const news=config.find(o=>o.kind==='rss'),w=config.find(o=>o.kind==='weather'),c=config.find(o=>o.kind==='clock');
    setClockPosition(c?.position?.endsWith('left')?'footer-left':'footer-right');setWeatherPosition(w?.position||'top-left');setWeatherMode(w?.mode==='details'?'details':'compact');
    setRss(!!news);setWeather(!!w);setClock(!!c);setSource(news?.source||'g1');
    const bar=config.find(o=>o.kind==='text');setTextEnabled(!!bar);setBarText(bar?.text||'');setBarPosition(bar?.position==='top'?'top':'bottom');setBarColor(bar?.color||'#ffffff');setBarBackground(bar?.background||'#111827');setBarScroll(bar?.scroll===true);
    setCity(w?.city||cities[0].city);setLat(String(w?.lat??cities[0].lat));setLon(String(w?.lon??cities[0].lon));setTimezone(c?.timezone||'America/Fortaleza');
  },[selected,rows]);
  async function save(){
    if(!user||!selected||saving)return;
    if(clock&&weather&&clockPosition===weatherPosition){setError('Escolha cantos diferentes para o relógio e o clima.');return;}
    if(textEnabled&&!barText.trim()){setError('Digite o texto que será exibido na faixa.');return;}
    if(weather&&(!city.trim()||!lat.trim()||!lon.trim()||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||Math.abs(Number(lat))>90||Math.abs(Number(lon))>180)){setError('Busque e selecione uma cidade nos resultados.');return;}
    const information_overlays:Information[]=[...(rss?[{kind:'rss' as const,source}]:[]),...(weather?[{kind:'weather' as const,city:city.trim(),lat:Number(lat),lon:Number(lon),position:weatherPosition as Information['position'],mode:weatherMode}]:[]),...(clock?[{kind:'clock' as const,timezone,position:clockPosition as Information['position']}]:[]),...(textEnabled?[{kind:'text' as const,text:barText.trim(),position:barPosition,color:barColor,background:barBackground,scroll:barScroll}]:[])];
    if(onDraftSave){onDraftSave(information_overlays);onOpenChange(false);return;}
    setSaving(true);setError('');
    try{
      const {data,error}=await supabase.from('playlists' as any).update({information_overlays,updated_at:new Date().toISOString()}).eq('id',selected).eq('user_id',user.id).select('id').single();
      if(error||!data)throw error||new Error('Playlist indisponível');
      toast({title:'Sobreposições salvas',description:'Os players desta playlist receberão a configuração na próxima sincronização.'});onOpenChange(false);
    }catch{setError('Não foi possível salvar. Confira sua conexão e tente novamente.');}finally{setSaving(false);}
  }
  return <Dialog open={open} onOpenChange={v=>{if(!saving)onOpenChange(v);}}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle>Informações sobre o vídeo</DialogTitle><DialogDescription>Exiba notícias, clima, horário e uma faixa de texto junto às mídias da playlist, sem interromper a reprodução.</DialogDescription></DialogHeader>
    {error&&<p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
    {loading?<p>Carregando playlists…</p>:rows.length===0?<p className="text-sm text-muted-foreground">Crie uma playlist para configurar suas sobreposições.</p>:<fieldset disabled={saving} className="min-w-0 space-y-4">
      <div className="space-y-2"><Label htmlFor="information-playlist">Playlist</Label><select id="information-playlist" className={selectClass} value={selected} onChange={e=>setSelected(e.target.value)}>{rows.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-slate-900 text-white" aria-label="Prévia ilustrativa das sobreposições">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400"><span className="text-sm">Vídeo inteiro, ajustado à área livre</span><span className="text-[10px]">Prévia ilustrativa • não são dados ao vivo</span></div>
        {weather&&<div style={previewCorner(weatherPosition)} className="absolute max-w-[55%] rounded bg-black/80 px-3 py-2"><span className="block truncate text-[10px]">{city}</span><span className="text-xl font-semibold">26°</span><span className="ml-2 text-[10px]">{weatherMode==='compact'?'☀':'Clima'}</span></div>}
        {clock&&<div style={{bottom:0,[clockPosition.endsWith('left')?'left':'right']:0,height:'18%',zIndex:3}} className="absolute rounded bg-black/80 px-3 py-2 text-sm">14:30 <span className="block text-[9px]">Horário local</span></div>}
        {rss&&<div style={{bottom:textEnabled&&barPosition==='bottom'?'18%':0}} className="absolute left-0 right-0 flex gap-3 bg-black/90 p-3 text-xs"><b className="text-orange-300">{source==='g1'?'G1':source==='bbc'?'BBC News Brasil':'Agência Brasil'}</b><span>As manchetes se alternam nesta faixa</span></div>}
        {textEnabled&&<div className="absolute left-0 right-0 flex h-[18%] items-center overflow-hidden px-3 text-xs font-semibold" style={{[barPosition]:0,color:barColor,backgroundColor:barBackground,paddingLeft:clock&&barPosition==='bottom'&&clockPosition.endsWith('left')?'25%':undefined,paddingRight:clock&&barPosition==='bottom'&&clockPosition.endsWith('right')?'25%':undefined}}><span className="truncate">{barText||'Digite o texto da sua faixa'}</span></div>}
      </div>
      <section className="space-y-3 rounded-lg border p-4"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={textEnabled} onChange={e=>setTextEnabled(e.target.checked)}/> Mensagem de rodapé</label>{textEnabled&&<>
        <div className="space-y-2"><Label htmlFor="information-bar-text">Texto da faixa</Label><Textarea id="information-bar-text" maxLength={500} value={barText} onChange={e=>setBarText(e.target.value)} placeholder="Ex.: Confira nossas promoções de hoje!" rows={3}/><p className="text-xs text-muted-foreground">{barText.length}/500 caracteres. Para mensagens longas, ative a rolagem.</p></div>
        <div className="space-y-2"><Label htmlFor="information-bar-position">Posição da faixa</Label><select id="information-bar-position" className={selectClass} value={barPosition} onChange={e=>setBarPosition(e.target.value as 'top'|'bottom')}><option value="bottom">Rodapé</option><option value="top">Topo</option></select></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="information-bar-color">Cor do texto</Label><Input id="information-bar-color" type="color" value={barColor} onChange={e=>setBarColor(e.target.value)}/></div><div className="space-y-2"><Label htmlFor="information-bar-background">Cor do fundo</Label><Input id="information-bar-background" type="color" value={barBackground} onChange={e=>setBarBackground(e.target.value)}/></div></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={barScroll} onChange={e=>setBarScroll(e.target.checked)}/> Texto em movimento (rolagem)</label>
        <p className="text-xs text-muted-foreground">Você pode voltar aqui, editar e salvar a mensagem a qualquer momento. A faixa acompanha todas as mídias da playlist. O vídeo se ajusta ao espaço restante sem cortes.</p>
      </>}</section>
      <section className="space-y-3 rounded-lg border p-4"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={rss} onChange={e=>setRss(e.target.checked)}/><Radio size={17}/> Notícias RSS</label>{rss&&<><Label htmlFor="information-source">Fonte das manchetes</Label><select id="information-source" className={selectClass} value={source} onChange={e=>setSource(e.target.value)}><option value="g1">G1 — últimas notícias</option><option value="agencia_brasil">Agência Brasil</option><option value="bbc">BBC News Brasil</option></select><p className="text-xs text-muted-foreground">Faixa inferior com fonte identificada. Atualização a cada 5 minutos, conforme disponibilidade do feed.</p></>}</section>
      <section className="space-y-3 rounded-lg border p-4"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={weather} onChange={e=>setWeather(e.target.checked)}/><CloudSun size={17}/> Clima</label>{weather&&<>
        <CornerSelect id="weather-corner" value={weatherPosition} onChange={setWeatherPosition}/><div className="space-y-2"><Label htmlFor="weather-mode">Exibição do clima</Label><select id="weather-mode" className={selectClass} value={weatherMode} onChange={e=>setWeatherMode(e.target.value as 'compact'|'details')}><option value="compact">Miniatura: ícone, temperatura e cidade</option><option value="details">Cartão com detalhes</option></select></div>
        <CitySearch value={city} onChange={c=>{if(c){setCity(c.city);setLat(String(c.lat));setLon(String(c.lon));}else{setLat('');setLon('');}}}/>
        <p className="text-xs text-muted-foreground">Clima no canto escolhido, sem substituir o vídeo. Fonte: Open-Meteo.</p>
      </>}</section>
      <section className="space-y-3 rounded-lg border p-4"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={clock} onChange={e=>setClock(e.target.checked)}/><Clock size={17}/> Relógio</label>{clock&&<><Label htmlFor="clock-footer">Posição no rodapé</Label><select id="clock-footer" className={selectClass} value={clockPosition} onChange={e=>setClockPosition(e.target.value)}><option value="footer-left">Rodapé esquerdo</option><option value="footer-right">Rodapé direito</option></select><Label htmlFor="information-timezone">Fuso horário</Label><select id="information-timezone" className={selectClass} value={timezone} onChange={e=>setTimezone(e.target.value)}><option value="America/Fortaleza">Fortaleza / Nordeste</option><option value="America/Sao_Paulo">Brasília / São Paulo</option><option value="America/Manaus">Manaus</option><option value="America/Rio_Branco">Rio Branco</option></select></>}</section>
      <p className="text-xs text-muted-foreground">Sem internet, o vídeo segue a licença. Notícias em cache aparecem por até 6 horas e clima por até 1 hora, com horário da consulta. Depois, essas informações ficam ocultas até atualizar.</p>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4"/>{saving?'Salvando…':onDraftSave?'Aplicar ao rascunho':'Salvar sobreposições'}</Button></div>
    </fieldset>}
  </DialogContent></Dialog>;
}
