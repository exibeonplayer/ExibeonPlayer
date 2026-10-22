export type CityChoice={city:string;lat:number;lon:number;country:string};
export async function searchCities(query:string,signal:AbortSignal):Promise<CityChoice[]>{
 const params=new URLSearchParams({name:query.trim(),count:'8',language:'pt',format:'json'});
 const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`,{signal});
 if(!response.ok)throw new Error('Busca indisponível');
 const data=await response.json();
 return (data.results||[]).filter((r:any)=>typeof r.name==='string'&&Number.isFinite(r.latitude)&&Math.abs(r.latitude)<=90&&Number.isFinite(r.longitude)&&Math.abs(r.longitude)<=180).map((r:any)=>({city:[r.name,r.admin1,r.country].filter(Boolean).join(', ').slice(0,60),lat:r.latitude,lon:r.longitude,country:r.country_code}));
}
