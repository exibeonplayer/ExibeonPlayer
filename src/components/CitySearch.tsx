import {useEffect,useState} from 'react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {searchCities,CityChoice} from '@/lib/city-search';
export default function CitySearch({value,onChange}:{value:string;onChange:(city:CityChoice|null)=>void}){
 const [query,setQuery]=useState(value),[results,setResults]=useState<CityChoice[]>([]),[status,setStatus]=useState(''),[searching,setSearching]=useState(false);
 useEffect(()=>{setQuery(value);setResults([]);setSearching(false);},[value]);
 useEffect(()=>{
  if(!searching)return;const abort=new AbortController();setResults([]);
  if(query.trim().length<3){setStatus('Digite pelo menos 3 letras.');return()=>abort.abort();}
  setStatus('Buscando cidades…');
  const timer=setTimeout(async()=>{try{
   const cities=await searchCities(query,abort.signal);if(abort.signal.aborted)return;
   setResults(cities);setStatus(cities.length?'Selecione a cidade nos resultados.':'Nenhuma cidade encontrada. Tente incluir o estado.');
  }catch{if(!abort.signal.aborted)setStatus('Não foi possível buscar cidades. Tente novamente.');}},400);
  return()=>{clearTimeout(timer);abort.abort();};
 },[query,searching]);
 return <div className="space-y-2"><Label htmlFor="weather-city-search">Buscar cidade pelo nome</Label><Input id="weather-city-search" value={query} maxLength={80} placeholder="Ex.: Teresina, PI" onChange={e=>{setQuery(e.target.value);setSearching(true);onChange(null);}}/>{searching&&<><p role="status" className="text-xs text-muted-foreground">{status}</p><ul className="max-h-40 overflow-y-auto rounded-md border">{results.map((c,index)=><li key={index}><button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={()=>{setSearching(false);setQuery(c.city);setResults([]);setStatus('');onChange(c);}}>{c.city}</button></li>)}</ul></>}<p className="text-xs text-muted-foreground">{!searching&&value?`Cidade selecionada: ${value}. `:''}Busca: Open-Meteo / GeoNames.</p></div>;
}
