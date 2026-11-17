import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {join, extname, normalize, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
 try{
  const route=decodeURIComponent((req.url||'/').split('?')[0]);
  const candidate=normalize(join(root,route==='/'?'index.html':route.replace(/^\/+/,'')));
  if(!candidate.startsWith(root)||candidate.includes(`${sep}.${sep}`))throw new Error('Acceso denegado');
  if(!(await stat(candidate)).isFile())throw new Error('No encontrado');
  res.writeHead(200,{'Content-Type':types[extname(candidate)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
  res.end(await readFile(candidate));
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Archivo no encontrado');}
}).listen(port,()=>console.log(`Despieces Ring Lock: http://localhost:${port}`));