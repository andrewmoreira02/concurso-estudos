/* Concurso Estudos — sincronização privada opcional (sem SDK externo).
   Somente HTTPS + Supabase Auth e PostgREST com RLS. Nunca enviar dados ao GitHub. */
(() => {
'use strict';
const cfg = window.CONCURSO_SYNC_CONFIG || {};
const url = typeof cfg.url === 'string' ? cfg.url.trim().replace(/\/+$/, '') : '';
const publicKey = typeof cfg.publishableKey === 'string' ? cfg.publishableKey.trim() : '';
let validURL = false;
try { const u = new URL(url); validURL = u.protocol === 'https:' && /(^|\.)supabase\.co$/.test(u.hostname) && !u.username && !u.password && !u.port; } catch {}
const configured = validURL && publicKey.length > 20 && !/service_role|sb_secret_/i.test(publicKey);
const AUTH_KEY='ce_private_sync_auth_v1', META_KEY='ce_private_sync_meta_v1', OWNER_KEY='ce_private_sync_owner_v1';
const RLM='concursos_rlm_sections_read_v3', RLM_SITE='concurso_rlm_steps_v1';
const ENG='casan1811_subsections_v3', ENG_SITE='concurso_eng_qualidade_steps_v1';
const PT='concursos:casan2026:portugues:2026-11-19:subsections:v1';
const PLAN='ce_plan_done_v1', AVAILABLE='ce_available_days_v1', LOGS='ce_question_logs_v1', REVIEW='ce_review_done_v1';
const VALID={
 readRlm:/^read:rlm:m(?:[1-9]|10|11)-s\d{1,2}$/,
 readEng:/^read:eng:etapa-(?:[1-9]|10)-\d{1,2}$/,
 readPt:/^read:pt:pt19-[1-6]-\d{1,2}$/,
 plan:/^plan:\d{4}-\d{2}-\d{2}::[a-z0-9-]{2,30}$/,
 available:/^available:[0-6]$/,
 review:/^review:session-\d+-[a-z0-9]+-\d{1,2}$/,
 log:/^log:session-\d+-[a-z0-9]+$/,
 pref:/^pref:pt:autoMark$/
};
const booleanKey=k=>VALID.readRlm.test(k)||VALID.readEng.test(k)||VALID.readPt.test(k)||VALID.plan.test(k)||VALID.available.test(k)||VALID.review.test(k)||VALID.pref.test(k);
const allowed=k=>typeof k==='string'&&k.length<=180&&(booleanKey(k)||VALID.log.test(k));
const valueOK=(k,v)=>booleanKey(k)?typeof v==='boolean':VALID.log.test(k)?v===null||(v&&typeof v==='object'&&!Array.isArray(v)&&v.id===k.slice(4)&&JSON.stringify(v).length<3000):false;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const json=(k,fallback=null)=>{try{const v=JSON.parse(localStorage.getItem(k));return v===null?fallback:v;}catch{return fallback;}};
const raw=k=>{try{return localStorage.getItem(k);}catch{return null;}};
const store=(k,v)=>{try{const next=JSON.stringify(v);if(localStorage.getItem(k)!==next){localStorage.setItem(k,next);return true;}return false;}catch{return false;}};
function snapshot(){
 const out={};
 const mark=(k,v)=>{if(allowed(k)&&valueOK(k,v))out[k]=v;};
 const rlm=json(RLM);
 const fromRlm=rlm&&Array.isArray(rlm.readSections)?rlm.readSections:null;
 const fallback=fromRlm===null?json(RLM_SITE,[]):null;
 for(const id of (fromRlm||((Array.isArray(fallback)?fallback:[]).map(code=>{
   const m=String(code).match(/^(\d+)\.(\d+)$/);return m?'m'+m[1]+'-s'+m[2]:'';
 })))) if(typeof id==='string')mark('read:rlm:'+id,true);
 const engSites=json(ENG_SITE,null),engDoc=json(ENG,{});
 const engCodes=Array.isArray(engSites)?engSites:Object.entries(engDoc?.subsections||{}).filter(x=>x[1]===true).map(x=>x[0].replace('etapa-','').replace('-','.'));
 for(const code of engCodes){const m=String(code).match(/^([1-9]|10)\.(\d{1,2})$/);if(m)mark('read:eng:etapa-'+m[1]+'-'+m[2],true);}
 const pt=json(PT,{});
 for(const [id,yes] of Object.entries(pt?.read&&typeof pt.read==='object'?pt.read:{}))if(yes===true)mark('read:pt:'+id,true);
 for(const [id,done] of Object.entries(json(PLAN,{})||{}))mark('plan:'+id,done);
 const available=json(AVAILABLE,[]);
 if(Array.isArray(available))for(const day of available)mark('available:'+day,true);
 for(const [id,done] of Object.entries(json(REVIEW,{})||{}))mark('review:'+id,done);
 const logs=json(LOGS,[]);
 if(Array.isArray(logs))for(const log of logs)if(log&&typeof log.id==='string')mark('log:'+log.id,log);
 const settings=json(PT+':settings');
 if(settings&&typeof settings.autoMark==='boolean')mark('pref:pt:autoMark',settings.autoMark);
 return out;
}
function apply(items){
 const groups={rlm:[],eng:[],pt:[],plan:[],available:[],review:[],logs:[],pref:[]};
 for(const [key,value] of Object.entries(items)){
   if(!allowed(key)||!valueOK(key,value))continue;
   if(VALID.readRlm.test(key))groups.rlm.push([key.slice(9),value]);
   else if(VALID.readEng.test(key))groups.eng.push([key.slice(9),value]);
   else if(VALID.readPt.test(key))groups.pt.push([key.slice(8),value]);
   else if(VALID.plan.test(key))groups.plan.push([key.slice(5),value]);
   else if(VALID.available.test(key))groups.available.push([Number(key.slice(10)),value]);
   else if(VALID.review.test(key))groups.review.push([key.slice(7),value]);
   else if(VALID.log.test(key))groups.logs.push([key.slice(4),value]);
   else if(VALID.pref.test(key))groups.pref.push([key,value]);
 }
 let changed=false;
 if(groups.rlm.length){
   const doc=json(RLM,{});
   const sections=new Set(Array.isArray(doc.readSections)?doc.readSections:[]);
   for(const [id,yes] of groups.rlm){if(yes)sections.add(id);else sections.delete(id);}
   const sorted=[...sections].sort((a,b)=>{const x=a.match(/\d+/g).map(Number),y=b.match(/\d+/g).map(Number);return x[0]-y[0]||x[1]-y[1];});
   changed=store(RLM,{...doc,format:doc.format||'concursos-rlm-leitura',version:3,readSections:sorted})||changed;
   const codes=sorted.map(id=>id.replace(/^m(\d+)-s(\d+)$/,'$1.$2'));
   changed=store(RLM_SITE,codes)||changed;
 }
 if(groups.eng.length){
   const doc=json(ENG,{});
   const saved=new Set(Array.isArray(json(ENG_SITE,null))?json(ENG_SITE,[]):Object.entries(doc.subsections||{}).filter(e=>e[1]===true).map(e=>e[0].replace('etapa-','').replace('-','.')));
   const sections={...(doc.subsections||{})};
   for(const [id,yes] of groups.eng){
     sections[id]=yes;
     const code=id.replace('etapa-','').replace('-','.');
     if(yes)saved.add(code);else saved.delete(code);
   }
   const codes=[...saved].sort((a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);return x[0]-y[0]||x[1]-y[1];});
   changed=store(ENG,{...doc,schemaVersion:3,subsections:sections})||changed;
   changed=store(ENG_SITE,codes)||changed;
 }
 if(groups.pt.length){
   const doc=json(PT,{});
   const read={...(doc.read||{})};
   for(const [id,yes] of groups.pt)read[id]=yes;
   changed=store(PT,{...doc,version:1,lesson:'CASAN_2026_PT_2026_11_19',read})||changed;
 }
 for(const [storageKey,group] of [[PLAN,groups.plan],[REVIEW,groups.review]]){
   if(!group.length)continue;
   const value={...(json(storageKey,{})||{})};
   for(const [id,yes] of group)value[id]=yes;
   changed=store(storageKey,value)||changed;
 }
 if(groups.available.length){
   const value=new Set(Array.isArray(json(AVAILABLE,[]))?json(AVAILABLE,[]):[]);
   for(const [day,yes] of groups.available){if(yes)value.add(day);else value.delete(day);}
   changed=store(AVAILABLE,[...value].sort((a,b)=>a-b))||changed;
 }
 if(groups.logs.length){
   const logs=json(LOGS,[]);const byId=new Map((Array.isArray(logs)?logs:[]).filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x]));
   for(const [id,value] of groups.logs){if(value===null)byId.delete(id);else byId.set(id,value);}
   changed=store(LOGS,[...byId.values()].sort((a,b)=>a.id.localeCompare(b.id)))||changed;
 }
 if(groups.pref.length){
   const prefs={...(json(PT+':settings',{})||{})};
   prefs.autoMark=groups.pref[0][1];
   changed=store(PT+':settings',prefs)||changed;
 }
 return changed;
}
let auth=null,user=null,syncPromise=null,lastStatus=''; 
const configuredState=()=>configured;
function report(msg,error=false){
 lastStatus=String(msg);
 const el=document.getElementById('syncMessage');
 if(el){el.textContent=lastStatus;el.dataset.error=String(error);}
 dispatchEvent(new CustomEvent('concurso:sync-status',{detail:{message:lastStatus,error}}));
}
function saveAuth(value){
 auth=value;
 if(value)store(AUTH_KEY,value);
 else {try{localStorage.removeItem(AUTH_KEY);}catch{}}
}
function sessionFromToken(data){
 if(!data?.access_token||!data?.refresh_token||!Number.isFinite(Number(data.expires_in)))throw Error('Resposta de autenticação incompleta.');
 return {access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+Number(data.expires_in)*1000};
}
async function api(endpoint,options={},token=''){
 if(!configured)throw Error('Supabase ainda não configurado.');
 const headers={apikey:publicKey,...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}) ,...(options.headers||{})};
 const result=await fetch(url+endpoint,{...options,headers,cache:'no-store',credentials:'omit'});
 if(!result.ok){
   let message='HTTP '+result.status;
   try{const d=await result.json();message=(d.msg||d.error_description||d.message||d.error||message).slice(0,220);}catch{}
   const err=new Error(message);err.status=result.status;throw err;
 }
 if(result.status===204)return null;
 const body=await result.text();
 return body?JSON.parse(body):null;
}
async function ensureSession(){
 if(!auth)auth=json(AUTH_KEY);
 if(!auth?.refresh_token)return false;
 if(auth.expires_at<Date.now()+90*1000){
   try{
     const next=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:auth.refresh_token})});
     saveAuth(sessionFromToken(next));
   }catch(e){saveAuth(null);user=null;throw new Error('Sessão expirada. Entre novamente em Conta.');}
 }
 if(!user){
   user=await api('/auth/v1/user',{method:'GET'},auth.access_token);
   if(!/^[0-9a-f-]{36}$/i.test(String(user?.id||'')))throw Error('Identidade da sessão inválida.');
 }
 return true;
}
async function register(email,password){
 const result=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});
 if(result?.access_token){saveAuth(sessionFromToken(result));user=null;await ensureSession();await sync();}
 return result?.access_token?'Conta criada e conectada.':'Cadastro solicitado. Confirme o e-mail para entrar.';
}
async function login(email,password){
 const result=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
 saveAuth(sessionFromToken(result));user=null;await ensureSession();
 await sync();
 return 'Sessão iniciada.';
}
async function logout(){
 if(auth?.access_token)try{await api('/auth/v1/logout',{method:'POST'},auth.access_token);}catch{}
 saveAuth(null);user=null;
 report('Você saiu da conta. Os dados continuam neste navegador.');
 renderAccount();
}
function metaFor(id){const meta=json(META_KEY);return meta&&meta.user_id===id&&meta.version===1&&meta.synced&&typeof meta.synced==='object'?meta:null;}
function ownerCheck(id,interactive){
 const owner=raw(OWNER_KEY);
 if(owner&&owner!==id){
   if(!interactive)throw Error('Este navegador foi conectado a outra conta. Abra Conta e autorize explicitamente a migração.');
   if(!confirm('Os dados locais podem pertencer a outra conta. Deseja vincular o progresso deste navegador à conta atual? Faça backup JSON antes de confirmar.'))throw Error('Migração entre contas cancelada.');
 }
}
async function fetchRows(){
 const data=await api('/rest/v1/concurso_sync_items?select=item_key,payload&limit=5000',{method:'GET'},auth.access_token);
 if(!Array.isArray(data))throw Error('Formato de dados remoto inesperado.');
 const remote={};
 for(const row of data){
   const k=row?.item_key,v=row?.payload?.value;
   if(allowed(k)&&valueOK(k,v))remote[k]=v;
 }
 return remote;
}
async function pushRows(entries){
 for(let i=0;i<entries.length;i+=150){
   const payload=entries.slice(i,i+150).map(([item_key,value])=>({user_id:user.id,item_key,payload:{value}}));
   await api('/rest/v1/concurso_sync_items?on_conflict=user_id%2Citem_key',{
     method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)
   },auth.access_token);
 }
}
function isPositive(k){return /^(read:|plan:|available:|review:)/.test(k);}
function tombstone(k){return VALID.log.test(k)?null:false;}
function cleanMap(map){
 const out={};
 for(const [k,v] of Object.entries(map||{}))if(allowed(k)&&valueOK(k,v))out[k]=v;
 return out;
}
async function sync(options={}){
 if(!configured)throw Error('Projeto Supabase não configurado.');
 if(syncPromise)return syncPromise;
 syncPromise=(async()=>{
   if(!(await ensureSession()))throw Error('Entre na sua conta para sincronizar.');
   ownerCheck(user.id,options.interactive===true);
   const meta=metaFor(user.id);
   const remote=await fetchRows();
   const current=cleanMap(snapshot());
   const base=meta?cleanMap(meta.synced):null;
   const result={...remote},upload=[];
   const keys=new Set([...Object.keys(remote),...Object.keys(current),...Object.keys(base||{})]);
   let conflicts=0;
   for(const k of keys){
     const r=Object.prototype.hasOwnProperty.call(remote,k), l=Object.prototype.hasOwnProperty.call(current,k);
     const local=l?current[k]:tombstone(k);
     const baseline=base&&Object.prototype.hasOwnProperty.call(base,k)?base[k]:undefined;
     if(base===null){
       // Primeiro login neste aparelho: não apagar nenhuma marcação positiva anterior.
       if(isPositive(k)){
         result[k]=(Boolean(l&&local)||Boolean(r&&remote[k]));
       }else if(VALID.log.test(k)){
         result[k]=l?local:(r?remote[k]:null);
       }else{
         result[k]=r?remote[k]:local;
       }
     }else{
       const localChanged=!same(local,baseline);
       const remoteChanged=r&&!same(remote[k],baseline);
       if(localChanged){
         if(remoteChanged&&!same(local,remote[k]))conflicts++;
         result[k]=local;
       }else if(r)result[k]=remote[k];
       else result[k]=local;
     }
     if(!valueOK(k,result[k]))delete result[k];
     else if(!r||!same(remote[k],result[k]))upload.push([k,result[k]]);
   }
   if(upload.length)await pushRows(upload);
   const localChanged=apply(result);
   store(META_KEY,{version:1,user_id:user.id,synced:cleanMap(result),last_sync:new Date().toISOString()});
   try{localStorage.setItem(OWNER_KEY,user.id);}catch{}
   const msg='Sincronizado'+(upload.length?' · '+upload.length+' alteração(ões) enviada(s)':'')+(conflicts?' · '+conflicts+' conflito(s) priorizando o aparelho atual':'')+'.';
   report(msg);
   if(localChanged&&location.pathname.split('/').pop()!=='conta.html'){
     // Aplicações de leitura usam estado em memória; reconstruir indicadores sem perder a âncora.
     const active=document.activeElement;
     const editing=active&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)&&!active.readOnly&&!active.disabled;
     if(!editing){
       try{sessionStorage.setItem('ce_sync_restore_scroll',JSON.stringify({href:location.pathname+location.search+location.hash,y:scrollY}));}catch{}
       location.reload();
     }else{
       report('Dados recebidos. Salve sua edição e atualize a página para visualizar o progresso sincronizado.');
     }
   }
   renderAccount();
   return msg;
 })().catch(e=>{report('Sincronização: '+e.message,true);throw e;}).finally(()=>{syncPromise=null;});
 return syncPromise;
}
function renderAccount(){
 const un=document.getElementById('syncUnconfigured'),out=document.getElementById('syncSignedOut'),inside=document.getElementById('syncSignedIn');
 if(!un||!out||!inside)return;
 un.hidden=configured;out.hidden=!configured||!user;inside.hidden=!configured||!!user;
 if(user){
   const label=document.getElementById('syncAccountEmail');
   if(label)label.textContent=user.email||'Conta autenticada';
   const time=document.getElementById('syncLastTime');
   const meta=metaFor(user.id);
   if(time)time.textContent=meta?.last_sync?'Última sincronização confirmada: '+new Date(meta.last_sync).toLocaleString('pt-BR'): 'Ainda sem primeira sincronização confirmada.';
 }
}
function menu(){
 const filename=location.pathname.split('/').pop()||'index.html';
 const parent=location.pathname.includes('/aulas/')?'../':'';
 const href=parent+'conta.html';
 const nav=document.querySelector('.primary-nav');
 if(nav&&!nav.querySelector('a[href="conta.html"]')){
   const a=document.createElement('a');a.href=href;a.textContent='Conta';if(filename==='conta.html')a.setAttribute('aria-current','page');nav.append(a);
 }else if(!nav){
   const area=document.querySelector('.topactions,.header-actions');
   if(area&&!area.querySelector('a[href="../conta.html"]')){
     const a=document.createElement('a');a.href=href;a.className=area.classList.contains('topactions')?'tiny-btn':'btn';a.textContent='Conta';area.append(a);
   }else{
     const side=document.querySelector('aside.sidebar');
     if(side&&!side.querySelector('a[href="../conta.html"]')){
       const a=document.createElement('a');a.href=href;a.textContent='Conta / sincronização';a.style.display='block';a.style.margin='10px 0';side.prepend(a);
     }
   }
 }
}
function init(){
 menu();
 renderAccount();
 const form=document.getElementById('syncLoginForm'),signup=document.getElementById('syncSignup');
 async function authAction(mode){
   if(!configured)return;
   const fd=new FormData(form),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
   if(!email||password.length<8){report('Informe e-mail e senha de pelo menos 8 caracteres.',true);return;}
   form.querySelectorAll('button').forEach(b=>b.disabled=true);
   try{report(mode==='signup'?'Criando conta…':'Autenticando…');
     const msg=mode==='signup'?await register(email,password):await login(email,password);
     report(msg);form.reset();
   }catch(e){report('Conta: '+e.message,true);}
   finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);renderAccount();}
 }
 form?.addEventListener('submit',e=>{e.preventDefault();void authAction('login');});
 signup?.addEventListener('click',()=>{void authAction('signup');});
 document.getElementById('syncNow')?.addEventListener('click',()=>{void sync({interactive:true}).catch(()=>{});});
 document.getElementById('syncLogout')?.addEventListener('click',()=>{void logout();});
 if(!configured){renderAccount();return;}
 try{
   const restore=jsonSessionScroll();
   if(restore){requestAnimationFrame(()=>{scrollTo(0,restore.y);});}
 }catch{}
 void ensureSession().then(ok=>{renderAccount();if(ok)return sync({interactive:false});}).catch(e=>{report(e.message,true);renderAccount();});
 setInterval(()=>{if(!document.hidden&&auth)void sync().catch(()=>{});},25000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&auth)void sync().catch(()=>{});});
 window.addEventListener('online',()=>{if(auth)void sync().catch(()=>{});});
 window.addEventListener('storage',e=>{if(e.key===AUTH_KEY){auth=json(AUTH_KEY);user=null;renderAccount();if(auth)void ensureSession().then(()=>sync()).catch(()=>{});}});
}
function jsonSessionScroll(){
 try{const rawState=sessionStorage.getItem('ce_sync_restore_scroll');if(!rawState)return null;
 sessionStorage.removeItem('ce_sync_restore_scroll');const data=JSON.parse(rawState);
 return data.href===location.pathname+location.search+location.hash&&Number.isFinite(data.y)?data:null;
 }catch{return null;}
}
window.ConcursoSync={configured:configuredState,sync:()=>sync({interactive:true}),getStatus:()=>lastStatus};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();