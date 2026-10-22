function parts(value:Date,zone:string){const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(value);const get=(type:string)=>p.find(v=>v.type===type)?.value;return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;}
export const toScheduleInput=(iso:string|null|undefined,zone:string)=>iso?parts(new Date(iso),zone):'';
export function scheduleToIso(value:string,zone:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Informe data e hora completas.');
 const stamp=Date.parse(value+'Z');if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,16)!==value)throw new Error('Data ou hora inválida.');
 let candidate=stamp;for(let n=0;n<4;n++){const local=Date.parse(parts(new Date(candidate),zone)+'Z');const offset=stamp-local;if(!offset)break;candidate+=offset;}
 if(parts(new Date(candidate),zone)!==value)throw new Error('Esse horário não existe no fuso escolhido.');return new Date(candidate).toISOString();
}
export function scheduleLabel(item:{starts_at?:string|null;ends_at?:string|null},zone:string){const fmt=(s:string)=>new Date(s).toLocaleString('pt-BR',{timeZone:zone,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});return item.starts_at&&item.ends_at?`${fmt(item.starts_at)} → ${fmt(item.ends_at)}`:'Sem restrição de horário';}
