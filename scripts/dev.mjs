import http from 'node:http';
import worker from '../dist/server/index.js';
const entries=new Map();
globalThis.caches={default:{async match(req){let hit=entries.get(req.url);if(!hit||hit.expires<Date.now())return undefined;return new Response(hit.body,{headers:hit.headers});},async put(req,response){let age=+(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||60);entries.set(req.url,{body:await response.text(),headers:Object.fromEntries(response.headers),expires:Date.now()+age*1000});}}};
http.createServer(async(req,res)=>{try{let response=await worker.fetch(new Request('http://localhost:4173'+req.url),{}, {waitUntil:p=>p.catch(console.error)});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end(e.message);}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
