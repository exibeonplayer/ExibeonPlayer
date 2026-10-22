import { XMLParser } from 'npm:fast-xml-parser@5.11.2';

export const SOURCES: Record<string,{name:string;url:string}> = {
  g1:{name:'G1',url:'https://g1.globo.com/rss/g1/'},
  agencia_brasil:{name:'Agência Brasil',url:'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml'},
  bbc:{name:'BBC News Brasil',url:'https://feeds.bbci.co.uk/portuguese/rss.xml'},
  ge:{name:'ge — esportes',url:'https://ge.globo.com/rss/ge/'},
};
export function normalizeOverlays(value:unknown):any[] {
  if(!Array.isArray(value))return [];
  const used=new Set();
  return value.slice(0,4).flatMap<any>(o=>{
    if(!o||typeof o!=='object'||used.has(o.kind)||o.enabled===false)return [];
    used.add(o.kind);
    if(o.kind==='text'&&typeof o.text==='string'&&o.text.trim())return [{kind:'text',text:o.text.trim().slice(0,500),position:o.position==='top'?'top':'bottom',color:/^#[a-f0-9]{6}$/i.test(o.color)?o.color:'#ffffff',background:/^#[a-f0-9]{6}$/i.test(o.background)?o.background:'#111827',scroll:o.scroll===true}];
    if(o.kind==='rss'&&Object.hasOwn(SOURCES,o.source))return [{kind:'rss',source:o.source}];
    if(o.kind==='clock')return [{kind:'clock',timezone:safeTimezone(o.timezone),position:['footer-left','footer-right'].includes(o.position)?o.position:corner(o.position,'top-right')}];
    if(o.kind==='weather'&&typeof o.lat==='number'&&typeof o.lon==='number'&&Number.isFinite(o.lat)&&Number.isFinite(o.lon)&&Math.abs(o.lat)<=90&&Math.abs(o.lon)<=180&&typeof o.city==='string')return [{kind:'weather',lat:Math.round(o.lat*1000)/1000,lon:Math.round(o.lon*1000)/1000,city:o.city.slice(0,60),position:corner(o.position,'top-left'),mode:o.mode==='details'?'details':'compact'}];
    return [];
  });
}
export const corner=(value:unknown,fallback='top-right')=>['top-left','top-right','bottom-left','bottom-right'].includes(String(value))?String(value):fallback;
export function safeTimezone(value:unknown){try{const zone=String(value||'America/Fortaleza').slice(0,80);new Intl.DateTimeFormat('pt-BR',{timeZone:zone});return zone;}catch{return 'America/Fortaleza';}}
const cache=new Map<string,{until:number;data:any}>();
const cityCache=new Map<string,{lat:number;lon:number}>();
export async function cityWeather(config:{city:string;country:string;units:string}):Promise<any>{
  try{
    const key=JSON.stringify({city:config.city,country:config.country});let coordinates=cityCache.get(key);
    if(!coordinates){
      const url=new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.search=new URLSearchParams({name:config.city.split(',')[0].trim(),count:'10',language:'pt',format:'json',countryCode:config.country}).toString();
      const response=JSON.parse(await boundedText(url.href));
      const city=(response.results||[]).find((r:any)=>r.country_code===config.country&&Number.isFinite(r.latitude)&&Number.isFinite(r.longitude));
      if(!city)throw new Error('Cidade não encontrada');
      coordinates={lat:city.latitude,lon:city.longitude};
      if(cityCache.size>=128)cityCache.delete(cityCache.keys().next().value!);cityCache.set(key,coordinates);
    }
    const [data]=await informationData([{kind:'weather',city:config.city,...coordinates}]);
    return {...data,temperature:typeof data.temperature==='number'&&config.units==='imperial'?Math.round((data.temperature*9/5+32)*10)/10:data.temperature,unit:config.units==='imperial'?'°F':'°C'};
  }catch{return {kind:'weather',city:config.city,unavailable:true};}
}
async function boundedText(url:string):Promise<string>{
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{'Accept':'application/rss+xml, application/xml, application/json','User-Agent':'Exibeon-Information/1.0'}});
  if(!response.ok||!response.body)throw new Error('Fonte indisponível');
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000)throw new Error('Resposta excede o limite');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  return new TextDecoder().decode(bytes);
}
export function parseHeadlines(xml:string):string[]{
  return parseArticles(xml).map(article=>article.title);
}
const plain=(value:any,max=320)=>String(typeof value==='string'?value:value?.['#text']||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim().slice(0,max);
export function newsImageUrl(value:unknown):string|null {
  try{const u=new URL(String(value||'').replace(/&amp;/g,'&'));return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(/^(s2(?:-[a-z0-9]+)?|s)\.glbimg\.com$/.test(u.hostname)||['ichef.bbci.co.uk','c.files.bbci.co.uk','imagens.ebc.com.br','agenciabrasil.ebc.com.br'].includes(u.hostname))?u.href.slice(0,8192):null;}catch{return null;}
}
export function parseArticles(xml:string):any[]{
  if(xml.length>1500000||/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('XML não permitido');
  const doc=new XMLParser({ignoreAttributes:false,processEntities:false,parseTagValue:false}).parse(xml);
  const items=doc?.rss?.channel?.item??doc?.feed?.entry??[];
  const seen=new Set<string>(),articles:any[]=[];
  for(const i of (Array.isArray(items)?items:[items]).slice(0,50)){
    const title=plain(i.title);if(!title||seen.has(title))continue;seen.add(title);
    const links=Array.isArray(i.link)?i.link:[i.link],link=links.find((l:any)=>typeof l==='string'||!l?.['@_rel']||l['@_rel']==='alternate');
    let url:string|null=null;try{const u=new URL(typeof link==='string'?link:link?.['@_href']);if(u.protocol==='https:'&&!u.username&&!u.password)url=u.href.slice(0,4096);}catch{}
    const candidates=[i['imagem-destaque'],i['media:content'],i['media:thumbnail'],i.enclosure,i['media:group']?.['media:content'],i['media:group']?.['media:thumbnail']].flat();
    let image_url=candidates.map(c=>newsImageUrl(typeof c==='string'?c:c?.['@_url'])).find(Boolean)||null;
    if(!image_url){const html=String(i.description||i['content:encoded']||'');image_url=newsImageUrl(html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]);}
    const time=Date.parse(plain(i.pubDate||i.published||i.updated,100));
    articles.push({title,url,image_url,published_at:Number.isFinite(time)?new Date(time).toISOString():null});if(articles.length===15)break;
  }
  return articles;
}
export async function completeArticleImages(articles:any[],source:string):Promise<any[]> {
  // Only official article origins are fetched; never follow feed-supplied redirects.
  const hosts:Record<string,string[]>={g1:['g1.globo.com'],ge:['ge.globo.com'],bbc:['www.bbc.com','www.bbc.co.uk'],agencia_brasil:['agenciabrasil.ebc.com.br']};
  const output=articles.map(a=>({...a}));let index=0;
  const worker=async()=>{while(index<output.length){const article=output[index++];if(article.image_url||!article.url)continue;try{
    const url=new URL(article.url);if(url.protocol!=='https:'||url.username||url.password||url.port||!hosts[source]?.includes(url.hostname))continue;
    const response=await fetch(url.href,{redirect:'error',signal:AbortSignal.timeout(2000),headers:{Accept:'text/html','User-Agent':'Exibeon-Information/1.0'}});if(!response.ok||!response.body)continue;
    const reader=response.body.getReader(),decoder=new TextDecoder();let html='',bytes=0;try{while(bytes<262144){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>262144)break;html+=decoder.decode(value,{stream:true});if(/<\/head\s*>/i.test(html))break;}}finally{await reader.cancel().catch(()=>{});}
    for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const attrs:Record<string,string>={};for(const match of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g))attrs[match[1].toLowerCase()]=match[2];if((attrs.property||attrs.name)?.toLowerCase()==='og:image'){article.image_url=newsImageUrl(attrs.content);if(article.image_url)break;}}
  }catch{/* The title remains available if the publisher has no usable image. */}}};
  await Promise.all(Array.from({length:5},worker));return output;
}
export async function informationData(raw:unknown):Promise<any[]> {
  return Promise.all(normalizeOverlays(raw).map(async o=>{
    if(o.kind==='clock'||o.kind==='text')return {...o};
    const key=JSON.stringify(o),old=cache.get(key);
    if(old&&old.until>Date.now())return old.data;
    try{
      let data:any;
      const fetched_at=new Date().toISOString();
      if(o.kind==='rss'){
        const source=SOURCES[o.source];const articles=await completeArticleImages(parseArticles(await boundedText(source.url)),o.source),headlines=articles.map(a=>a.title);
        if(!headlines.length)throw new Error('Feed vazio');
        data={...o,publisher:source.name,headlines,articles,fetched_at,expires_at:new Date(Date.now()+6*3600000).toISOString()};
      }else{
        const apiKey=Deno.env.get('OPEN_METEO_API_KEY');
        const url=new URL(apiKey?'https://customer-api.open-meteo.com/v1/forecast':'https://api.open-meteo.com/v1/forecast');
        url.search=new URLSearchParams({latitude:String(o.lat),longitude:String(o.lon),current:'temperature_2m,weather_code',timezone:'GMT',...(apiKey?{apikey:apiKey}:{})}).toString();
        const weather=JSON.parse(await boundedText(url.href));
        const temperature=weather.current?.temperature_2m,code=weather.current?.weather_code;
        const observed=Date.parse(String(weather.current?.time)+'Z');
        if(typeof temperature!=='number'||!Number.isFinite(temperature)||typeof code!=='number'||!Number.isFinite(observed)||Math.abs(Date.now()-observed)>3600000)throw new Error('Clima inválido ou desatualizado');
        data={...o,temperature,code,publisher:'Open-Meteo',fetched_at,expires_at:new Date(observed+3600000).toISOString()};
      }
      if(cache.size>=128)cache.delete(cache.keys().next().value!);
      cache.set(key,{until:Date.now()+(o.kind==='rss'?300000:600000),data});return data;
    }catch{
      // A fonte falhar nunca bloqueia vídeo/licença. Cache mantém o prazo original.
      if(old&&Date.parse(old.data.expires_at)>Date.now())return old.data;
      return {...o,unavailable:true};
    }
  }));
}
