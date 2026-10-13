import { STATES, CITIES, statePrices, cityData, mapData, geocode, cached } from './data.mjs';
const page = __PAGE__;
const client = __SCRIPT__;
const headers={'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default {
 async fetch(request,env,ctx){
  if(request.method!=='GET')return json({error:'Use GET'},405);
  let url=new URL(request.url),path=url.pathname;
  if(path==='/')return new Response(page,{headers:{...headers,'content-type':'text/html; charset=utf-8'}});
  if(path==='/app.js')return new Response(client,{headers:{...headers,'content-type':'text/javascript; charset=utf-8','cache-control':'public,max-age=60'}});
  if(path==='/favicon.ico')return new Response(null,{status:204});
  try{
   if(path==='/api/catalog')return json({states:STATES,cities:CITIES});
   if(path==='/api/geo'){let q=url.searchParams.get('q')?.trim();if(!q||q.length>100)return json({error:'Enter a US city or ZIP code (up to 100 characters).'},400);return json({places:await geocode(q,ctx)});}
   if(path==='/api/reverse'){let lat=Number(url.searchParams.get('lat')),lon=Number(url.searchParams.get('lon'));if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return json({error:'Invalid coordinates'},400);let data=await cached('reverse-'+lat.toFixed(3)+'-'+lon.toFixed(3),604800,ctx,async()=>{let response=await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&limit=1`,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Location service unavailable');let raw=await response.json(),p=raw.features?.[0]?.properties;if(p?.countrycode!=='US')throw Error('US gas prices are supported currently.');let state=Object.entries(STATES).find(([code,name])=>name===p.state||code===p.state)?.[0];if(!state)throw Error('Could not resolve a US state.');return {name:p.city||p.name||p.county,state,lat,lon};});return json(data);}
   if(path==='/api/map')return json(await mapData(ctx));
   if(path==='/api/state'||path==='/api/city'){let state=url.searchParams.get('state')||'NY';if(!STATES[state])return json({error:'Choose a valid US state.'},400);let metro=url.searchParams.get('metro')||'';if(metro.length>140)return json({error:'Metro name too long'},400);if(path==='/api/state')return json(await statePrices(state,ctx));return json(await cityData(state,metro,ctx));}
   return json({error:'Not found'},404);
  }catch(e){console.error(JSON.stringify({route:path,message:e.message}));return json({error:e.message||'Data service unavailable. Please retry.',status:'unavailable'},502);}
 }
};
