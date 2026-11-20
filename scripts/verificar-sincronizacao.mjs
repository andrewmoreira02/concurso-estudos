// Integração sem dados pessoais / sem Supabase real: pareamento privado e API Edge Function simulados.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';

const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw new Error('Chromium indisponível');
// Usar mesma origem HTTP para todas as páginas: file:// isola localStorage por arquivo.
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+name);
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(file);
  const mime=extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':extname(file)==='.json'?'application/json':'text/html';
  res.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Cache-Control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(0,'127.0.0.1');
await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
browser.on('disconnected',()=>{});
const remote=new Map();
let calls=0;
const PAIR='U'.repeat(43);
function ok(route,body,status=200){return route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,apikey,x-concurso-key','Access-Control-Allow-Methods':'GET,POST,OPTIONS'},body:JSON.stringify(body)});}
async function attach(page){
 await page.route('https://test.supabase.co/**',async route=>{
   const req=route.request(),u=new URL(req.url()),p=u.pathname,method=req.method();calls++;
   if(method==='OPTIONS')return ok(route,{},200);
   if(p!=='/functions/v1/concurso-pareamento')throw Error('Endpoint inesperado: '+method+' '+p);
   if(req.headers()['x-concurso-key']!==PAIR)return ok(route,{error:'Código inválido'},401);
   if(method==='GET')return ok(route,{items:[...remote].map(([item_key,value])=>({item_key,payload:{value}}))});
   if(method==='POST'){
     const entries=JSON.parse(req.postData()||'{}').items||[];
     for(const e of entries)remote.set(e.item_key,e.payload.value);
     return ok(route,{ok:true,count:entries.length});
   }
   throw Error('Método inesperado: '+method);

 });
}
async function open(page,seed={}){
 await page.addInitScript(({seed})=>{
   Object.defineProperty(window,'CONCURSO_SYNC_CONFIG',{configurable:false,writable:false,value:{url:'https://test.supabase.co',publishableKey:'sb_publishable_test_123456789012345'}});
   if(localStorage.getItem('__sync_test_seeded__')!=='1'){
     for(const [key,value] of Object.entries(seed))localStorage.setItem(key,JSON.stringify(value));
     localStorage.setItem('__sync_test_seeded__','1');
   }
 },{seed});
 await page.goto(base+'/conta.html',{waitUntil:'domcontentloaded'});
 await page.locator('#syncSignedOut:not([hidden])').waitFor({timeout:10000});
 await page.locator('#syncPairCode').fill(PAIR);
 await page.locator('#syncConnect').click();
 await page.locator('#syncSignedIn:not([hidden])').waitFor({timeout:10000});
 await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('ce_private_sync_pair_meta_v2')||'null'),{timeout:10000});
}
async function syncPage(page){
 try{await page.evaluate(()=>window.ConcursoSync.sync());}
 catch(e){
   // A aplicação recarrega a aula para recompor controles quando chegam marcações remotas.
   if(!/Execution context was destroyed|navigation|Cannot find context/i.test(String(e)))throw e;
 }
 await page.waitForLoadState('domcontentloaded',{timeout:15000});
}
const pt='concursos:casan2026:portugues:2026-11-19:subsections:v1';
const rlm='concursos_rlm_sections_read_v3';
const eng='concurso_eng_qualidade_steps_v1';
const keys=['m4-s1','m4-s2','m4-s3','m4-s4','m4-s5','m4-s6'];
function assert(cond,message){if(!cond)throw new Error(message);}
const a=await browser.newContext({viewport:{width:1280,height:800}});
const b=await browser.newContext({viewport:{width:390,height:780},isMobile:true,hasTouch:true});
const pc=await a.newPage(),phone=await b.newPage();
try{
 await attach(pc);await attach(phone);
 await open(pc,{[rlm]:{format:'concursos-rlm-leitura',version:3,readSections:keys},[eng]:['1.1','2.1'],[pt]:{version:1,lesson:'CASAN_2026_PT_2026_11_19',read:{'pt19-1-1':true}},ce_plan_done_v1:{'2026-11-20::revisao':true}});
 for(const k of keys)assert(remote.get('read:rlm:'+k)===true,'Primeiro aparelho não enviou '+k);
 // Teste crítico: clicar no botão real da aula deve disparar envio sem aguardar 15 segundos.
 await pc.goto(base+'/aulas/rlm.html',{waitUntil:'domcontentloaded'});
 await pc.locator('[data-step-read="m5-s1"]').click({force:true,timeout:10000});
 for(let attempt=0;attempt<100&&remote.get('read:rlm:m5-s1')!==true;attempt++)await new Promise(done=>setTimeout(done,100));
 assert(remote.get('read:rlm:m5-s1')===true,'Botão Lido da aula RLM não sincronizou imediatamente');
 console.log('OK botão real Lido da RLM enviou m5-s1 automaticamente');
 await open(phone,{[rlm]:{format:'concursos-rlm-leitura',version:3,readSections:[]}});
 const merged=await phone.evaluate(key=>JSON.parse(localStorage.getItem(key)).readSections,rlm);
 for(const k of keys)assert(merged.includes(k),'Celular não recebeu '+k);
 const ptMerged=await phone.evaluate(key=>JSON.parse(localStorage.getItem(key)).read,pt);
 assert(ptMerged['pt19-1-1']===true,'Português não foi propagado');
 const engMerged=await phone.evaluate(key=>JSON.parse(localStorage.getItem(key)),eng);
 assert(engMerged.includes('1.1'),'Engenharia não foi propagada');
 await phone.evaluate(key=>{
   const data=JSON.parse(localStorage.getItem(key));data.readSections=data.readSections.filter(x=>x!=='m4-s1');localStorage.setItem(key,JSON.stringify(data));
 },rlm);
 await syncPage(phone);
 assert(remote.get('read:rlm:m4-s1')===false,'Desmarcação não foi enviada ao banco');
 await syncPage(pc);
 await pc.waitForFunction(key=>{
   const v=JSON.parse(localStorage.getItem(key)||'{}').readSections||[];
   return !v.includes('m4-s1')&&v.includes('m4-s2');
 },rlm,{timeout:15000});
 const log={id:'session-123456-abc123',date:'2026-11-19',exam:'casan',subject:'rlm',topic:'Estatística',valid:3,correct:2,annulled:0,kind:'nao-classificado',source:''};
 await pc.evaluate(log=>localStorage.setItem('ce_question_logs_v1',JSON.stringify([log])),log);
 await syncPage(pc);
 await syncPage(phone);
 await phone.waitForFunction(id=>{
   const arr=JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]');
   return arr.length===1&&arr[0].id===id;
 },log.id,{timeout:15000});
 await phone.evaluate(()=>localStorage.setItem('ce_question_logs_v1','[]'));
 await syncPage(phone);
 await syncPage(pc);
 await pc.waitForFunction(()=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length===0,null,{timeout:15000});
 assert(calls>=12,'Fluxo de API não executado');
 console.log('OK: migração conservadora, 2 aparelhos, leitura, reversão, Engenharia, Português, sessões e exclusão; '+calls+' requisições simuladas');
}finally{await a.close();await b.close();await browser.close();server.closeAllConnections?.();await new Promise(done=>server.close(done));}
