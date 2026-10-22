import type {MediaInstance} from '@/hooks/useMediaTemplates';
const sources=['g1','bbc','agencia_brasil','ge'];
export function availableInstance(instance:MediaInstance,fileIds:Set<string>,owner?:string){
 const c=instance.custom_config||{},type=instance.template?.media_type;
 if(!owner||instance.created_by!==owner||!instance.is_active||!type)return false;
 if(c.background_media_id&&type!=='rss'&&!fileIds.has(c.background_media_id))return false;
 if(type==='static')return fileIds.has(c.media_file_id||c.video_file_id);
 if(type==='overlay')return !!String(c.bar_text||'').trim();
 if(type==='weather')return !!String(c.city_name||'').trim();
 if(type==='rss')return sources.includes(c.rss_source)||['611232f1-ca1d-4425-b640-b2c67305e9b5','71faa4c3-27d6-4898-aab8-dda44590accd'].includes(c.rss_source_id);
 if(type==='webpage'){try{return new URL(c.web_url).protocol==='https:';}catch{return false;}}
 return ['clock','calendar','counter'].includes(type);
}
