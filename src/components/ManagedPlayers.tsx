import {notifyPlaylistsChanged} from '@/lib/playlist-events';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformRole } from '@/hooks/usePlatformRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Player {id:string; name:string; user_id:string; online:boolean; device_id?:string; revoked_at?:string; assigned_playlist_id?:string; last_heartbeat?:string; owner?:{email:string}; telemetry?:{videoTitle?:string;isPlaying?:boolean}; license_status?:string;license_expires?:string;}
interface Log {id:string;created_at:string;log_type:string;message:string;}
export default function ManagedPlayers({supervision=false}:{supervision?:boolean}) {
  const {user}=useAuth(); const {role}=usePlatformRole(); const {toast}=useToast();
  const [players,setPlayers]=useState<Player[]>([]),[playlists,setPlaylists]=useState<{id:string;name:string}[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [capacity,setCapacity]=useState<{max:number;used:number;available:number}|null>(null);
  const [search,setSearch]=useState(''),[page,setPage]=useState(0),[total,setTotal]=useState(0);
  const [pairOpen,setPairOpen]=useState(false),[playlistId,setPlaylistId]=useState(''),[target,setTarget]=useState<string|null>(null);
  const [pair,setPair]=useState<{code:string;expires_at:string}|null>(null);
  const [logs,setLogs]=useState<{player:Player;rows:Log[]}|null>(null);
  const inFlight=useRef(false),epoch=useRef(0);
  const readOnly=role==='supervisor'||supervision;
  const call=useCallback(async (action:string,values:Record<string,unknown>={})=>{
    const {data,error}=await supabase.functions.invoke('manage-devices',{body:{action,...values}});
    if(error||!data?.success){
      let message=data?.error;
      if(!message&&error?.context instanceof Response){try{message=(await error.context.json()).error;}catch{}}
      throw new Error(message||(error?.name==='FunctionsFetchError'?'Não foi possível conectar ao serviço de players. Verifique a conexão e tente atualizar.':error?.message)||'Não foi possível acessar o serviço de players.');
    }
    return data;
  },[]);
  const refresh=useCallback(async()=>{
    if(!user||inFlight.current)return;
    const version=epoch.current; inFlight.current=true;
    try {const data=await call('list',{scope:supervision?'all':'own',offset:page*50,limit:50}); if(version===epoch.current){setPlayers(data.players);setTotal(data.total||0);setCapacity(data.capacity??null);setError('');}}
    catch(e){if(version===epoch.current)setError((e as Error).message);}
    finally{inFlight.current=false;if(version===epoch.current)setLoading(false);}
  },[user?.id,supervision,page,call]);
  useEffect(()=>{
    epoch.current++;setPlayers([]);setCapacity(null);setLogs(null);setPair(null);setLoading(true);inFlight.current=false;
    refresh(); const timer=setInterval(refresh,30000);
    return ()=>{epoch.current++;clearInterval(timer);};
  },[refresh]);
  useEffect(()=>{let active=true;setPlaylists([]);if(user&&!supervision)supabase.from('playlists').select('id,name').eq('user_id',user.id).then(({data})=>{if(active)setPlaylists(data||[]);});return()=>{active=false;};},[user?.id,supervision]);
  const perform=async(task:()=>Promise<unknown>)=>{setBusy(true);try{await task();if(user)notifyPlaylistsChanged(user.id);await refresh();}catch(e){toast({title:'Não foi possível concluir',description:(e as Error).message,variant:'destructive'});}finally{setBusy(false);}};
  const reusablePlayers=players.filter(p=>p.user_id===user?.id&&(!p.device_id||p.revoked_at));
  const openPair=(id:string|null=null)=>{
    const existing=!id&&capacity?.available===0&&reusablePlayers.length===1?reusablePlayers[0].id:null;
    setTarget(id??existing);setPlaylistId('');setPair(null);setPairOpen(true);
  };
  const copyCode=async()=>{
    if(!pair)return;
    try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(pair.code);}else{
      const field=document.getElementById('generated-pair-code') as HTMLInputElement|null;
      if(!field)throw new Error('Campo indisponível');field.focus();field.select();
      toast({title:'Código selecionado',description:'Pressione Ctrl+C para copiar. A cópia automática fica disponível no acesso HTTPS.'});return;
    }toast({title:'Código copiado'});}catch{toast({title:'Selecione o código e copie com Ctrl+C.'});}
  };
  const generate=()=>perform(async()=>{const data=await call('generate-code',{playlist_id:playlistId||null,player_id:target});setPair({code:data.code,expires_at:data.expires_at});});
  const loadLogs=(player:Player)=>perform(async()=>{const data=await call('logs',{player_id:player.id});setLogs({player,rows:data.logs});});
  const moreLogs=()=>logs&&perform(async()=>{const data=await call('logs',{player_id:logs.player.id,before:logs.rows[logs.rows.length-1]?.created_at});setLogs({...logs,rows:[...logs.rows,...data.logs]});});
  const filtered=players.filter(p=>`${p.name} ${p.owner?.email||''} ${p.id}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">{supervision?'Supervisão de players':'Meus players'}</h1><p className="text-muted-foreground mt-2">{supervision?'Status e logs de todas as contas. Esta tela é somente de leitura.':'Gere um código no site e informe o código e o nome no aplicativo Exibeon.'}</p></div><div className="flex gap-2"><Button variant="outline" onClick={refresh} disabled={busy}>Atualizar</Button>{!readOnly&&<Button onClick={()=>openPair()} disabled={loading||busy||!!error}>Adicionar player</Button>}</div></div>
    <div className="grid gap-3 sm:grid-cols-3">{[['Registrados',total],['Online nesta página',players.filter(p=>p.online).length],['Offline nesta página',players.filter(p=>!p.online).length]].map(([label,value])=><Card key={label}><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-semibold">{value}</p></CardContent></Card>)}</div>
    {!supervision&&capacity&&<p role="status" className="text-sm text-muted-foreground">Vagas da licença: {capacity.used} de {capacity.max} ocupadas. {capacity.available===0?'Para vincular este aplicativo, reutilize um cadastro existente ou ajuste a licença em Licenças.':`${capacity.available} disponível(is).`}</p>}
    <Input aria-label="Buscar player nesta página" placeholder="Buscar por nome, conta ou identificação nesta página" value={search} onChange={e=>setSearch(e.target.value)}/>
    {error&&<div role="alert" className="border border-destructive rounded-lg p-4">{error}<p className="text-sm mt-1">Confira se as migrações e funções do novo vínculo foram aplicadas.</p></div>}
    {loading?<p role="status">Carregando players…</p>:error&&!players.length?null:!filtered.length?<Card><CardContent className="pt-6">Nenhum player encontrado. {readOnly?'Os equipamentos aparecerão após o cadastro.':'Clique em Adicionar player para gerar o código de vínculo.'}</CardContent></Card>:<div className="grid gap-4 lg:grid-cols-2">{filtered.map(p=><Card key={p.id}><CardHeader><CardTitle className="flex justify-between gap-3"><span>{p.name}</span><span className={`text-sm ${p.online?'text-green-600':'text-muted-foreground'}`}>{p.revoked_at?'Revogado':p.online?'Online':'Offline'}</span></CardTitle></CardHeader><CardContent className="space-y-3">
      {supervision&&<p className="text-sm">Conta: {p.owner?.email||p.user_id}</p>}
      <p className="text-xs text-muted-foreground break-all">{p.id}</p>
      <p className="text-sm">Último contato: {p.last_heartbeat?new Date(p.last_heartbeat).toLocaleString('pt-BR'):'Ainda não recebido'}</p>
      <p className="text-sm">Licença: {p.license_status||'Sem licença'} · {p.license_expires?`vence em ${new Date(p.license_expires).toLocaleString('pt-BR')}`:'sem vencimento definido'}</p>
      <p className="text-sm">{p.telemetry?.videoTitle?`Conteúdo: ${p.telemetry.videoTitle}`:'Nenhum conteúdo informado'}</p>
      {!readOnly&&<label className="block text-sm">Programação<select aria-label={`Programação de ${p.name}`} className="mt-1 w-full rounded-md border bg-background p-2" value={p.assigned_playlist_id||''} disabled={busy||!!p.revoked_at} onChange={e=>perform(()=>call('update',{player_id:p.id,playlist_id:e.target.value||null}))}><option value="">Sem programação</option>{playlists.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={()=>loadLogs(p)}>Ver logs</Button>{!readOnly&&<><Button variant="outline" disabled={busy} onClick={()=>{const name=window.prompt('Nome do player',p.name);if(name?.trim())perform(()=>call('update',{player_id:p.id,name:name.trim()}));}}>Renomear</Button>{(!p.device_id||p.revoked_at)?<Button variant="outline" onClick={()=>openPair(p.id)}>Gerar código de vínculo</Button>:<Button variant="destructive" disabled={busy} onClick={()=>{if(window.confirm('Revogar o vínculo? O equipamento receberá o bloqueio quando se conectar.'))perform(()=>call('revoke',{player_id:p.id}));}}>Revogar vínculo</Button>}</>}</div>
    </CardContent></Card>)}</div>}
    <div className="flex justify-between items-center"><Button variant="outline" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Anterior</Button><span>Página {page+1}</span><Button variant="outline" disabled={(page+1)*50>=total||loading} onClick={()=>setPage(p=>p+1)}>Próxima</Button></div>
    <Dialog open={pairOpen} onOpenChange={setPairOpen}><DialogContent><DialogHeader><DialogTitle>Vincular aplicativo Exibeon</DialogTitle><DialogDescription>Gere o código para conectar o equipamento à sua conta.</DialogDescription></DialogHeader><p className="text-sm text-muted-foreground">O código pertence à sua conta, vale por 15 minutos e pode ser usado uma única vez. O limite de equipamentos será verificado pelo servidor.</p><label className="text-sm">Cadastro do player<select aria-label="Cadastro do player" className="mt-1 w-full border rounded-md p-2 bg-background" value={target||''} disabled={busy} onChange={e=>{setTarget(e.target.value||null);setPair(null);}}><option value="" disabled={capacity?.available===0}>Novo cadastro{capacity?.available===0?' — limite atingido':''}</option>{reusablePlayers.map(p=><option key={p.id} value={p.id}>Reutilizar {p.name}</option>)}</select></label>{target&&<p className="text-sm text-muted-foreground">O aplicativo será vinculado ao registro selecionado. Um cadastro antigo ainda não vinculado já ocupa uma vaga e será reaproveitado.</p>}<label className="text-sm">Programação inicial<select className="mt-1 w-full border rounded-md p-2 bg-background" value={playlistId} onChange={e=>setPlaylistId(e.target.value)}><option value="">Escolher depois</option>{playlists.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label><Button onClick={generate} disabled={busy||(!target&&capacity?.available===0)}>{pair?'Gerar outro código':'Gerar código'}</Button>{pair&&<div className="space-y-3 rounded-lg bg-muted p-4"><Input id="generated-pair-code" aria-label="Código de vínculo" readOnly value={pair.code} onFocus={e=>e.target.select()} className="font-mono text-lg tracking-wider"/><p className="text-sm">Válido até {new Date(pair.expires_at).toLocaleTimeString('pt-BR')}. No player, informe este código e um nome para o equipamento.</p><Button variant="outline" onClick={copyCode}>{window.isSecureContext?'Copiar código':'Selecionar código'}</Button></div>}</DialogContent></Dialog>
    <Dialog open={!!logs} onOpenChange={open=>!open&&setLogs(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Logs · {logs?.player.name}</DialogTitle><DialogDescription>Eventos recebidos deste equipamento.</DialogDescription></DialogHeader><div className="max-h-[60vh] overflow-auto space-y-3">{!logs?.rows.length?<p>Nenhum log recebido.</p>:logs.rows.map(l=><div key={l.id} className="border-b pb-2"><p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')} · {l.log_type}</p><p className="text-sm whitespace-pre-wrap break-words">{l.message}</p></div>)}</div>{!!logs?.rows.length&&logs.rows.length%100===0&&<Button variant="outline" onClick={moreLogs} disabled={busy}>Carregar anteriores</Button>}</DialogContent></Dialog>
  </div>;
}
