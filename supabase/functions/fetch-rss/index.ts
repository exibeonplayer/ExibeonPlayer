// Retired legacy endpoint. Current feeds use the authenticated device-api path.
Deno.serve((request:Request)=>{
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Content-Type':'application/json','Cache-Control':'no-store'};
 if(request.method==='OPTIONS')return new Response('ok',{headers});
 return new Response(JSON.stringify({success:false,error:'Integração RSS antiga desativada. Use as notícias do editor de playlists.'}),{status:410,headers});
});
