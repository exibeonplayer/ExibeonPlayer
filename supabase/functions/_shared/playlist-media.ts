import { check, unwrap, uuid } from './devices.ts';
import { normalizeOverlays, safeTimezone, SOURCES } from './information.ts';

const sourceAliases:Record<string,string>={'611232f1-ca1d-4425-b640-b2c67305e9b5':'g1','71faa4c3-27d6-4898-aab8-dda44590accd':'bbc'};
const number=(v:any,fallback:number,min:number,max:number)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
const text=(v:any,max=100)=>String(v??'').slice(0,max);
function configFor(type:string,c:any):any{
  const common={timezone:safeTimezone(c.timezone),color:/^#[a-f0-9]{6}$/i.test(c.color)?c.color:'#f5f9ff',background:/^#[a-f0-9]{6}$/i.test(c.background)?c.background:'#102b40'};
  if(type==='clock')return {...common,format:c.format==='12h'?'12h':'24h',show_date:c.show_date!==false,show_seconds:c.show_seconds!==false};
  if(type==='calendar')return {...common,first_day_of_week:c.first_day_of_week==='monday'?'monday':'sunday',highlight_today:c.highlight_today!==false,show_week_numbers:c.show_week_numbers===true};
  if(type==='counter')return {...common,start_value:number(c.start_value,0,-1e9,1e9),end_value:number(c.end_value,100,-1e9,1e9),speed:number(c.speed,100,10,10000),direction:c.direction==='down'?'down':'up',prefix:text(c.prefix,40),suffix:text(c.suffix,40)};
  if(type==='rss'){
    const source=c.rss_source||sourceAliases[c.rss_source_id];check(source&&Object.hasOwn(SOURCES,source),'Escolha uma fonte RSS compatível no editor da mídia',422);
    return {source,max_items:number(c.max_items,10,1,15),item_duration:number(c.item_duration,8,4,60)};
  }
  if(type==='webpage'){
    let url:URL;try{url=new URL(c.web_url);}catch{check(false,'URL da página inválida',422);throw new Error('URL inválida');}
    check(url.protocol==='https:'&&!url.username&&!url.password&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[|::)|\.(local|internal)$/i.test(url.hostname),'Use uma página HTTPS pública, sem credenciais',422);
    return {...common,web_url:url.href.slice(0,4096),refresh_interval:number(c.refresh_interval,60,30,3600)};
  }
  return common;
}
const fileAsset=(f:any)=>({mediaId:f.id,title:f.title,url:f.file_url,size:f.file_size_bytes||0,mimeType:f.content_type,cloudflareKey:`${f.id}:${f.updated_at||f.created_at}`});
export async function loadPlaylistItems(db:any,playlistId:string,owner:string):Promise<any[]>{
  const items=unwrap<any[]>(await db.from('playlist_items').select('*,media_files(*),media_instances(*,template:media_templates(*))').eq('playlist_id',playlistId).order('display_order').order('id'));
  validateItems(items,owner);
  const ids=[...new Set(items.flatMap(i=>{const c=i.media_instances?.custom_config||{},type=i.media_instances?.template?.media_type;return [type==='static'?(c.media_file_id||c.video_file_id):null,type==='rss'?null:c.background_media_id].filter(Boolean);} ))];
  check(ids.every(uuid),'Referência de arquivo inválida',422);
  const files=ids.length?unwrap<any[]>(await db.from('media_files').select('*').in('id',ids).eq('user_id',owner)):[];
  for(const item of items){
    const instance=item.media_instances,c=instance?.custom_config||{};
    if(instance?.template?.media_type==='static'&&!item.media_files){item.media_files=files.find(f=>f.id===(c.media_file_id||c.video_file_id));check(item.media_files,'Arquivo desta mídia não está mais disponível',422);}
    if(c.background_media_id&&instance?.template?.media_type!=='rss'){const bg=files.find(f=>f.id===c.background_media_id);check(bg?.content_type==='image','Imagem de fundo indisponível',422);item.backgroundAsset=fileAsset(bg);}
  }
  return items;
}
export const targetPlatform=(value:unknown)=>['windows','android','android_tv'].includes(String(value))?String(value):'all';
export const platformMatches=(target:unknown,platform:unknown)=>targetPlatform(target)==='all'||targetPlatform(target)===targetPlatform(platform);

function weatherConfig(value:any){
  const city=String(value?.city_name||value?.city||'').trim().slice(0,80);
  check(city.length>1,'Informe a cidade da mídia de tempo',422);
  const country=String(value?.country_code||'BR').toUpperCase();
  check(/^[A-Z]{2}$/.test(country),'País da mídia de tempo inválido',422);
  return {city,country,units:value?.units==='imperial'?'imperial':'metric'};
}
function validateItems(items:any[],owner:string){
  check(items.length<=100,'Programação excede o limite de itens',422);
  // Validate every reference before returning any content, including disabled rows.
  for(const item of items){
    check((item.media_files||item.media_instances)&&(!item.media_files||item.media_files.user_id===owner)&&(!item.media_instances||item.media_instances.created_by===owner),'Recurso indisponível ou de outra conta',409);
  }
}
export function playlistTextOverlays(items:any[],owner:string,base:unknown):any[]{
  validateItems(items,owner);
  const bars=items.filter(i=>i.is_overlay&&!i.media_files&&i.media_instances?.template?.media_type==='overlay'&&i.media_instances.is_active!==false);
  check(bars.length<=1,'Use apenas uma faixa de texto por playlist',422);
  const config=bars[0]?{...bars[0].media_instances.template.template_config,...bars[0].media_instances.custom_config}:null;
  const [bar]=config?normalizeOverlays([{kind:'text',text:config.bar_text,position:config.bar_position,color:config.bar_text_color,background:config.bar_background_color,scroll:config.bar_scroll}]):[];
  const current=normalizeOverlays(base);
  return bar?[...current.filter(o=>o.kind!=='text'),{...bar,starts_at:bars[0].starts_at||null,ends_at:bars[0].ends_at||null}]:current;
}
export function playbackItems(items:any[],owner:string,active:boolean):any[]{
  validateItems(items,owner);
  if(!active)return [];
  return items.filter(i=>(!i.media_instances||i.media_instances.is_active!==false)&&!(i.is_overlay&&!i.media_files&&i.media_instances?.template?.media_type==='overlay')).map(i=>{
    const instance=i.media_instances,file=i.media_files;
    const orientation=instance?.template?.orientation||file?.orientation||'horizontal';
    if(instance){
      if(instance.template?.media_type==='overlay'){
        check(file&&file.content_type==='video','A barra precisa de um vídeo de fundo da sua conta',422);
        const config={...instance.template.template_config,...instance.custom_config};
        const [textBar]=normalizeOverlays([{kind:'text',text:config.bar_text,position:config.bar_position,color:config.bar_text_color,background:config.bar_background_color,scroll:config.bar_scroll}]);
        return {id:i.id,mediaId:file.id,title:instance.name,url:file.file_url,duration:i.duration_override_seconds??file.duration_seconds??10,size:file.file_size_bytes||0,mimeType:'video',cloudflareKey:`${file.id}:${file.updated_at||file.created_at}`,...(textBar?{textBar}:{})};
      }
      if(instance.template?.media_type==='static'){
        check(file&&(file.content_type==='video'||file.content_type==='image'),'Selecione um vídeo ou imagem para esta mídia',422);
        const duration=file.content_type==='image'?number(i.duration_override_seconds??instance.custom_config?.display_duration,10,5,300):(i.duration_override_seconds??file.duration_seconds??10);
        return {...fileAsset(file),id:i.id,title:instance.name,duration,preferred_orientation:orientation};
      }
      if(['clock','calendar','counter','rss','webpage'].includes(instance.template?.media_type)){
        const type=instance.template.media_type,config=configFor(type,{...instance.template.template_config,...instance.custom_config});
        return {id:i.id,mediaId:instance.id,title:instance.name,mimeType:type,duration:number(i.duration_override_seconds??instance.custom_config?.display_duration,type==='rss'?config.max_items*config.item_duration:20,5,300),config,preferred_orientation:orientation,...(i.backgroundAsset?{backgroundAsset:i.backgroundAsset}:{})};
      }
      check(instance.template?.media_type==='weather','Tipo de mídia avançada ainda não compatível com este player',422);
      check(!i.is_overlay,'Use Notícias, clima e relógio para configurar sobreposições',422);
      return {id:i.id,mediaId:instance.id,title:instance.name,mimeType:'weather',duration:Math.max(5,Math.min(300,Number(i.duration_override_seconds)||Number(instance.custom_config?.display_duration)||20)),preferred_orientation:orientation,weather:weatherConfig({...instance.template?.template_config,...instance.custom_config})};
    }
    if(file.content_type==='weather_realtime'){
      const value=String(file.file_url).replace(/^inmet:\/\//,'');
      check(String(file.file_url).startsWith('inmet://'),'Configuração da mídia de tempo indisponível',422);
      return {id:i.id,mediaId:file.id,title:file.title,mimeType:'weather',duration:Math.max(5,Math.min(300,Number(i.duration_override_seconds)||20)),weather:weatherConfig({city_name:value.replace(/,[A-Z]{2}$/,''),country_code:value.match(/,([A-Z]{2})$/)?.[1]||'BR'})};
    }
    check(file.content_type==='video'||file.content_type==='image','Tipo de conteúdo ainda não compatível',422);
    return {id:i.id,mediaId:file.id,title:file.title,url:file.file_url,duration:i.duration_override_seconds??file.duration_seconds??10,size:file.file_size_bytes||0,mimeType:file.content_type,cloudflareKey:`${file.id}:${file.updated_at||file.created_at}`};
  });
}
export const weatherMediaConfig=(videos:any[])=>videos.filter(v=>v.mimeType==='weather'||v.mimeType==='rss').map(v=>v.mimeType==='weather'?{id:v.id,weather:v.weather}:{id:v.id,rss:{source:v.config.source}});
