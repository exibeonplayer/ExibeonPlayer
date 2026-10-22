import { supabase } from '@/integrations/supabase/client';

// Apenas URLs de apresentação em memória. O banco mantém a referência estável.
export async function resolvePrivateMedia<T>(rows:T[]):Promise<T[]> {
  const ids=new Set<string>();
  const collect=(value:any):void=>{if(!value||typeof value!=='object')return;if(value.id&&typeof value.file_url==='string'&&/\.r2\.(?:dev|cloudflarestorage\.com)(?:\/|$)/.test(value.file_url))ids.add(value.id);for(const child of Object.values(value))if(child&&typeof child==='object')collect(child);};
  collect(rows);if(!ids.size)return rows;
  const links=new Map<string,{file_url:string;thumbnail_url?:string}>();
  const all=[...ids];
  for(let offset=0;offset<all.length;offset+=100){
    const {data,error}=await supabase.functions.invoke('manage-devices',{body:{action:'media-urls',ids:all.slice(offset,offset+100)}});
    if(error||!data?.success)throw new Error(data?.error||'Não foi possível autorizar as mídias privadas.');
    for(const media of data.media)links.set(media.id,media);
  }
  const replace=(value:any):any=>{
    if(Array.isArray(value))return value.map(replace);
    if(!value||typeof value!=='object')return value;
    const copy=Object.fromEntries(Object.entries(value).map(([key,child])=>[key,child&&typeof child==='object'?replace(child):child]));
    const signed=links.get(value.id);if(signed){copy.file_url=signed.file_url;if(signed.thumbnail_url)copy.thumbnail_url=signed.thumbnail_url;}
    return copy;
  };
  return replace(rows);
}
