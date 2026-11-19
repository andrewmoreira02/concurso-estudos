// Integração sem dados pessoais / sem Supabase real: login falso e API PostgREST simulada.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw new Error('Chromium indisponível');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files']});
const USER_ID='10000000-0000-4000-8000-000000000001';
const remote=new Map();
let calls=0;
const auth={access_token:'test-access',refresh_token:'test-refresh',expires_in:3600,user:{id:USER_ID,email:'teste@example.org'}};
function ok(route,body,status=200){return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});}
async function attach(page){
 await page.route('https://test.supabase.co/**',async route=>{
   const req=route.request(),u=new URL(req.url()),p=u.pathname,method=req.method();calls++;
   if(p==='/auth/v1/token'&&method==='POST')return ok(route,auth);
   if(p==='/auth/v1/user'&&method==='GET')return ok(route,auth.user);
   if(p==='/auth/v1/signup')return ok(route,{user:auth.user});
   if(p==='/auth/v1/logout')return ok(route,{},204);
   if(p==='/rest/v1/concurso_sync_items'&&method==='GET')return ok(route,[...remote].map(([item_key,value])=>({item_key,payload:{value}})));
   if(p==='/rest/v1/concurso_sync_items'&&method==='POST'){
     const entries=JSON.parse(req.postData()||'[]');
     for(const e of entries){if(e.user_id!==USER_ID)throw new Error('User id inválido no envio');remote.set(e.item_key,e.payload.value);}
     return ok(route,[]);
   }
   throw Error('Endpoint inesperado: '+method+' '+p);
 });
}
async function open(page,seed={}){
 await page.addInitScript(({seed})=>{
   Object.defineProperty(window,'CONCURSO_SYNC_CONFIG',{configurable:false,writable:false,value:{url:'https://test.supabase.co',publishableKey:'sb_publishable_test_123456789012345'}});
   for(const [key,value] of Object.entries(seed))localStorage.setItem(key,JSON.stringify(value));
 },{seed});
 await page.goto(pathToFileURL(resolve('conta.html')).href,{waitUntil:'domcontentloaded'});
 await page.locator('#syncSignedOut:not([hidden])').waitFor({timeout:10000});
 await page.locator('input[name=email]').fill('teste@example.org');
 await page.locator('input[name=password]').fill('senha-superteste');
 await page.locator('#syncLoginForm button[type=submit]').click();
 await page.locator('#syncSignedIn:not([hidden])').waitFor({timeout:10000});
 await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('ce_private_sync_meta_v1')||'null'),{timeout:10000});
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
 await phone.evaluate(()=>window.ConcursoSync.sync());
 assert(remote.get('read:rlm:m4-s1')===false,'Desmarcação não foi enviada ao banco');
 await pc.evaluate(()=>window.ConcursoSync.sync());
 const pcAfter=await pc.evaluate(key=>JSON.parse(localStorage.getItem(key)).readSections,rlm);
 assert(!pcAfter.includes('m4-s1')&&pcAfter.includes('m4-s2'),'Desmarcação não chegou ao computador');
 const log={id:'session-123456-abc123',date:'2026-11-19',exam:'casan',subject:'rlm',topic:'Estatística',valid:3,correct:2,annulled:0,kind:'nao-classificado',source:''};
 await pc.evaluate(log=>localStorage.setItem('ce_question_logs_v1',JSON.stringify([log])),log);
 await pc.evaluate(()=>window.ConcursoSync.sync());
 await phone.evaluate(()=>window.ConcursoSync.sync());
 const phoneLogs=await phone.evaluate(()=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]'));
 assert(phoneLogs.length===1&&phoneLogs[0].id===log.id,'Sessão de questões não sincronizada');
 await phone.evaluate(()=>localStorage.setItem('ce_question_logs_v1','[]'));
 await phone.evaluate(()=>window.ConcursoSync.sync());
 await pc.evaluate(()=>window.ConcursoSync.sync());
 const afterDelete=await pc.evaluate(()=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]'));
 assert(afterDelete.length===0,'Exclusão de sessão não sincronizada');
 assert(calls>=12,'Fluxo de API não executado');
 console.log('OK: migração conservadora, 2 aparelhos, leitura, reversão, Engenharia, Português, sessões e exclusão; '+calls+' requisições simuladas');
}finally{await a.close();await b.close();await browser.close();}
