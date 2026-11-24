/* Concurso Estudos — sincronização sem contas, via chave privada de pareamento.
   Nunca inserir código pessoal em JavaScript público. O backend valida SHA-256.
   A sincronização funciona nos dois dispositivos com a mesma chave. */
(() => {
'use strict';
const cfg=window.CONCURSO_SYNC_CONFIG||{};
const url=typeof cfg.url==='string'?cfg.url.trim().replace(/\/+$/,''):'';
const publicKey=typeof cfg.publishableKey==='string'?cfg.publishableKey.trim():'';
let validURL=false;
try{const u=new URL(url);validURL=u.protocol==='https:'&&/(^|\.)supabase\.co$/.test(u.hostname)&&!u.username&&!u.password&&!u.port;}catch{}
const configured=validURL&&publicKey.length>20&&!/service_role|sb_secret_/i.test(publicKey);
const PAIR_KEY='ce_private_sync_pair_v1',META_KEY='ce_private_sync_pair_meta_v2',OWNER_ID='single-pair-owner-v1';
const RLM='concursos_rlm_sections_read_v3', RLM_SITE='concurso_rlm_steps_v1';
const ENG='casan1811_subsections_v3', ENG_SITE='concurso_eng_qualidade_steps_v1';
const PT='concursos:casan2026:portugues:2026-11-19:subsections:v1';
const PLAN='ce_plan_done_v1', AVAILABLE='ce_available_days_v1', LOGS='ce_question_logs_v1', REVIEW='ce_review_done_v1', REGISTRATION='ce_registration_v1', STUDY='ce_study_confirmed_v1';
const VALID={
 readRlm:/^read:rlm:m(?:[1-9]|10|11)-s\d{1,2}$/,
 readEng:/^read:eng:etapa-(?:[1-9]|10)-\d{1,2}$/,
 readPt:/^read:pt:pt19-[1-6]-\d{1,2}$/,
 readNew:/^read:new:[a-z][a-z0-9-]{2,40}:[a-z][a-z0-9-]{1,18}-[1-9]\d?-[1-9]\d?$/,
 plan:/^plan:\d{4}-\d{2}-\d{2}::[a-z0-9-]{2,30}$/,
 available:/^available:[0-6]$/,
 review:/^review:session-\d+-[a-z0-9]+-\d{1,2}$/,
 log:/^log:session-\d+-[a-z0-9]+$/,
 pref:/^pref:pt:autoMark$/,
 registration:/^registration:ima$/,
 study:/^study:(?:casan|ima):[a-z][a-z0-9-]{2,40}:(?:[1-9]|1\d|20)$/
};
const booleanKey=k=>VALID.readRlm.test(k)||VALID.readEng.test(k)||VALID.readPt.test(k)||VALID.readNew.test(k)||VALID.plan.test(k)||VALID.available.test(k)||VALID.review.test(k)||VALID.pref.test(k)||VALID.registration.test(k)||VALID.study.test(k);
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
 const study=json(STUDY,{});
 if(study?.version===1&&study.confirmed&&typeof study.confirmed==='object'&&!Array.isArray(study.confirmed))
  for(const [id,value] of Object.entries(study.confirmed))mark('study:'+id,value);
 const available=json(AVAILABLE,[]);
 if(Array.isArray(available))for(const day of available)mark('available:'+day,true);
 for(const [id,done] of Object.entries(json(REVIEW,{})||{}))mark('review:'+id,done);
 const logs=json(LOGS,[]);
 if(Array.isArray(logs))for(const log of logs)if(log&&typeof log.id==='string')mark('log:'+log.id,log);
 // Novas aulas preservam IDs estáveis e compartilham a leitura entre aparelhos.
 try{for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(!key?.startsWith('ce_lesson_read_v1:'))continue;
   const slug=key.slice('ce_lesson_read_v1:'.length),doc=json(key,{});
   if(!/^[a-z][a-z0-9-]{2,40}$/.test(slug)||!Array.isArray(doc?.read))continue;
   for(const section of doc.read)mark('read:new:'+slug+':'+section,true);
 }}catch{}
 const registration=json(REGISTRATION,{});if(typeof registration?.ima==='boolean')mark('registration:ima',registration.ima);
 const settings=json(PT+':settings');
 if(settings&&typeof settings.autoMark==='boolean')mark('pref:pt:autoMark',settings.autoMark);
 return out;
}
function apply(items){
 const groups={rlm:[],eng:[],pt:[],newLessons:new Map(),plan:[],available:[],review:[],logs:[],pref:[],registration:[],study:[]};
 for(const [key,value] of Object.entries(items)){
   if(!allowed(key)||!valueOK(key,value))continue;
   if(VALID.readRlm.test(key))groups.rlm.push([key.slice(9),value]);
   else if(VALID.readEng.test(key))groups.eng.push([key.slice(9),value]);
   else if(VALID.readPt.test(key))groups.pt.push([key.slice(8),value]);
   else if(VALID.readNew.test(key)){
     const [, ,slug,...rest]=key.split(':');
     if(!groups.newLessons.has(slug))groups.newLessons.set(slug,[]);
     groups.newLessons.get(slug).push([rest.join(':'),value]);
   }
   else if(VALID.plan.test(key))groups.plan.push([key.slice(5),value]);
   else if(VALID.study.test(key))groups.study.push([key.slice(6),value]);
   else if(VALID.available.test(key))groups.available.push([Number(key.slice(10)),value]);
   else if(VALID.review.test(key))groups.review.push([key.slice(7),value]);
   else if(VALID.log.test(key))groups.logs.push([key.slice(4),value]);
   else if(VALID.pref.test(key))groups.pref.push([key,value]);
   else if(VALID.registration.test(key))groups.registration.push([key,value]);
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
 for(const [slug,group] of groups.newLessons){
   const key='ce_lesson_read_v1:'+slug,doc=json(key,{});
   const values=new Set(Array.isArray(doc.read)?doc.read:[]);
   for(const [id,yes] of group){if(yes)values.add(id);else values.delete(id);}
   const read=[...values].filter(id=>typeof id==='string').sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
   changed=store(key,{...doc,version:1,lesson:slug,read})||changed;
 }
 if(groups.pt.length){
   const doc=json(PT,{});
   const read={...(doc.read||{})};
   for(const [id,yes] of groups.pt)read[id]=yes;
   changed=store(PT,{...doc,version:1,lesson:'CASAN_2026_PT_2026_11_19',read})||changed;
 }
 if(groups.study.length){
  const doc=json(STUDY,{}),confirmed={...(doc?.confirmed&&typeof doc.confirmed==='object'&&!Array.isArray(doc.confirmed)?doc.confirmed:{})};
  for(const [id,yes] of groups.study)confirmed[id]=yes;
  changed=store(STUDY,{...doc,version:1,confirmed})||changed;
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
 if(groups.registration.length){
   const doc=json(REGISTRATION,{})||{};
   changed=store(REGISTRATION,{...doc,ima:groups.registration[0][1]})||changed;
 }
 if(groups.pref.length){
   const prefs={...(json(PT+':settings',{})||{})};
   prefs.autoMark=groups.pref[0][1];
   changed=store(PT+':settings',prefs)||changed;
 }
 return changed;
}

let pair=null,syncPromise=null,lastStatus='',syncAgain=false;
const configuredState=()=>configured;
function report(msg,error=false){
 lastStatus=String(msg);
 const el=document.getElementById('syncMessage');
 if(el){el.textContent=lastStatus;el.dataset.error=String(error);}
 dispatchEvent(new CustomEvent('concurso:sync-status',{detail:{message:lastStatus,error}}));
}
function setPair(value){
 if(!/^[a-zA-Z0-9_-]{43}$/.test(String(value||'')))throw Error('Código de pareamento inválido.');
 pair=value;
 try{localStorage.setItem(PAIR_KEY,value);}catch{throw Error('Armazenamento do navegador indisponível.');}
}
function readPair(){const rawValue=raw(PAIR_KEY);return /^[a-zA-Z0-9_-]{43}$/.test(rawValue||'')?rawValue:null;}
async function api(method,payload=null){
 if(!configured)throw Error('Supabase não configurado.');
 if(!pair)throw Error('Conecte este aparelho com o código privado.');
 const headers={apikey:publicKey,'x-concurso-key':pair};
 if(payload!==null)headers['Content-Type']='application/json';
 const response=await fetch(url+'/functions/v1/concurso-pareamento',{
 method,headers,cache:'no-store',credentials:'omit',
 ...(payload!==null?{body:JSON.stringify(payload)}:{})
 });
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error((body?.error||('HTTP '+response.status)).slice(0,160));
 return body;
}
function meta(){const m=json(META_KEY);return m&&m.version===2&&m.owner===OWNER_ID&&m.synced&&typeof m.synced==='object'?m:null;}
async function fetchRows(){
 const data=await api('GET');
 if(!Array.isArray(data?.items))throw Error('Resposta remota inesperada.');
 const remote={};
 for(const row of data.items){
   const k=row?.item_key,v=row?.payload?.value;
   if(allowed(k)&&valueOK(k,v))remote[k]=v;
 }
 return remote;
}
async function pushRows(entries){
 for(let i=0;i<entries.length;i+=120){
   const items=entries.slice(i,i+120).map(([item_key,value])=>({item_key,payload:{value}}));
   const response=await api('POST',{items});
   if(response?.ok!==true)throw Error('Alterações não confirmadas pelo banco.');
 }
}
function isPositive(k){return /^(read:|plan:|available:|review:|study:)/.test(k);}
function tombstone(k){return VALID.log.test(k)?null:false;}
function cleanMap(map){
 const out={};
 for(const [k,v] of Object.entries(map||{}))if(allowed(k)&&valueOK(k,v))out[k]=v;
 return out;
}
function sameMap(a,b){const keys=new Set([...Object.keys(a),...Object.keys(b)]);return [...keys].every(k=>same(a[k],b[k]));}
async function sync(){
 if(!configured)throw Error('Sincronização não configurada.');
 if(!pair)throw Error('Este aparelho ainda não foi vinculado.');
 if(syncPromise){syncAgain=true;return syncPromise;}
 syncPromise=(async()=>{
   const saved=meta();
   const remote=await fetchRows();
   const current=cleanMap(snapshot());
   const baseline=saved?cleanMap(saved.synced):null;
   const result={...remote},upload=[];
   const keys=new Set([...Object.keys(remote),...Object.keys(current),...Object.keys(baseline||{})]);
   let conflicts=0;
   for(const k of keys){
     const r=Object.prototype.hasOwnProperty.call(remote,k);
     const l=Object.prototype.hasOwnProperty.call(current,k);
     const local=l?current[k]:tombstone(k);
     const hadBaseline=baseline!==null&&Object.prototype.hasOwnProperty.call(baseline,k);
     const base=hadBaseline?baseline[k]:undefined;
     if(baseline===null){
       if(isPositive(k))result[k]=Boolean(l&&local)||Boolean(r&&remote[k]);
       else if(VALID.log.test(k))result[k]=l?local:(r?remote[k]:null);
       else result[k]=r?remote[k]:local;
     }else{
       const localChanged=hadBaseline?!same(local,base):l;
       const remoteChanged=r&&(!hadBaseline||!same(remote[k],base));
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
   // Não sobrescrever marcações realizadas durante a requisição assíncrona.
   if(!sameMap(current,cleanMap(snapshot()))){
     syncAgain=true;
     report('Nova marcação detectada. Enviando progresso atualizado…');
     return 'Atualizando';
   }
   const changed=apply(result);
   const visibleChanged=!sameMap(current,cleanMap(snapshot()));
   store(META_KEY,{version:2,owner:OWNER_ID,synced:cleanMap(result),last_sync:new Date().toISOString()});
   const msg='Sincronizado'+(upload.length?' · '+upload.length+' alteração(ões) enviada(s)':'')+(conflicts?' · '+conflicts+' conflito(s) priorizando este aparelho':'')+'.';
   report(msg);
   if(changed&&visibleChanged&&location.pathname.split('/').pop()!=='conta.html'){
     const active=document.activeElement;
     const editing=active&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)&&!active.readOnly&&!active.disabled;
     if(!editing){
       try{sessionStorage.setItem('ce_sync_restore_scroll',JSON.stringify({href:location.pathname+location.search+location.hash,y:scrollY}));}catch{}
       location.reload();
     }else report('Dados recebidos. Salve sua edição e atualize a página para ver as marcações sincronizadas.');
   }
   renderAccount();
   return msg;
 })().catch(e=>{report('Sincronização: '+e.message,true);throw e;}).finally(()=>{syncPromise=null;if(syncAgain){syncAgain=false;setTimeout(()=>{if(pair)void sync().catch(()=>{});},100);}});
 return syncPromise;
}
async function connect(value){
 const old=pair;
 try{
   setPair(String(value||'').trim());
   report('Verificando código e reunindo progresso local…');
   await sync();
   return true;
 }catch(e){
   pair=old;
   try{if(old)localStorage.setItem(PAIR_KEY,old);else localStorage.removeItem(PAIR_KEY);}catch{}
   report('Não foi possível vincular: '+e.message,true);
   renderAccount();
   return false;
 }
}
function disconnect(){
 pair=null;try{localStorage.removeItem(PAIR_KEY);}catch{}
 report('Pareamento desativado neste aparelho. As marcações locais foram mantidas.');
 renderAccount();
}
function renderAccount(){
 const un=document.getElementById('syncUnconfigured'),out=document.getElementById('syncSignedOut'),inside=document.getElementById('syncSignedIn');
 if(!un||!out||!inside)return;
 un.hidden=configured;out.hidden=!configured||!!pair;inside.hidden=!configured||!pair;
 const time=document.getElementById('syncLastTime'),m=meta();
 if(time&&pair)time.textContent=m?.last_sync?'Última sincronização: '+new Date(m.last_sync).toLocaleString('pt-BR'):'Ainda sem sincronização confirmada.';
}
function installInlineStatus(){
 const area=document.querySelector('.topactions');
 if(!area||document.getElementById('syncInlineStatus'))return;
 const indicator=document.createElement('a');
 indicator.id='syncInlineStatus';
 indicator.className='tiny-btn';
 indicator.href='../conta.html';
 indicator.setAttribute('role','status');
 indicator.textContent=pair?'Sincronização conectada':'Vincular sincronização';
 area.append(indicator);
 addEventListener('concurso:sync-status',e=>{
   const d=e.detail||{};
   indicator.textContent=d.error?'⚠ Falha ao sincronizar':String(d.message||'').startsWith('Sincronizado')?'✓ Sincronizado':'Sincronizando…';
   indicator.title=String(d.message||'').slice(0,250);
 });
}
function menu(){
 const filename=location.pathname.split('/').pop()||'index.html';
 const parent=location.pathname.includes('/aulas/')?'../':'';
 const href=parent+'conta.html';
 const nav=document.querySelector('.primary-nav');
 if(nav&&![...nav.querySelectorAll('a[href]')].some(a=>{try{return new URL(a.href,location.href).pathname.split('/').pop()==='conta.html';}catch{return false;}})){
   const a=document.createElement('a');a.href=href;a.textContent='Sincronização';if(filename==='conta.html')a.setAttribute('aria-current','page');nav.append(a);
 }else if(!nav){
   const area=document.querySelector('.topactions,.header-actions');
   if(area&&!area.querySelector('a[href="../conta.html"]')){
     const a=document.createElement('a');a.href=href;a.className=area.classList.contains('topactions')?'tiny-btn':'btn';a.textContent='Sincronização';area.append(a);
   }else{
     const side=document.querySelector('aside.sidebar');
     if(side&&!side.querySelector('a[href="../conta.html"]')){
       const a=document.createElement('a');a.href=href;a.textContent='Sincronização';a.style.display='block';a.style.margin='10px 0';side.prepend(a);
     }
   }
 }
}
function restoreScroll(){
 try{const v=sessionStorage.getItem('ce_sync_restore_scroll');if(!v)return;
 sessionStorage.removeItem('ce_sync_restore_scroll');const d=JSON.parse(v);
 if(d.href===location.pathname+location.search+location.hash&&Number.isFinite(d.y))requestAnimationFrame(()=>scrollTo(0,d.y));
 }catch{}
}
function init(){
 menu();restoreScroll();
 const fragment=location.hash.match(/^#(?:vincular|parear)=([a-zA-Z0-9_-]{43})$/);
 if(fragment&&configured){
   // Remover o código da barra de endereço para evitar compartilhamento acidental.
   const code=fragment[1];history.replaceState(null,'',location.pathname+location.search);
   void connect(code);
 }else pair=readPair();
 renderAccount();installInlineStatus();
 const form=document.getElementById('syncPairForm');
 form?.addEventListener('submit',e=>{
   e.preventDefault();const code=document.getElementById('syncPairCode')?.value||'';
   void connect(code).then(success=>{if(success)form.reset();});
 });
 document.getElementById('syncNow')?.addEventListener('click',()=>{void sync().catch(()=>{});});
 document.getElementById('syncLogout')?.addEventListener('click',disconnect);
 document.getElementById('syncCopyLink')?.addEventListener('click',async()=>{
   if(!pair)return;
   const link=location.origin+location.pathname.replace(/[^/]*$/,'')+'conta.html#vincular='+pair;
   try{await navigator.clipboard.writeText(link);report('Link privado copiado. Abra-o somente no seu celular.');}
   catch{report('Não foi possível copiar. Use o código de pareamento para vincular o outro aparelho.',true);}
 });
 if(!configured){renderAccount();return;}
 if(pair&&!fragment)void sync().catch(()=>{});
 setInterval(()=>{if(!document.hidden&&pair)void sync().catch(()=>{});},15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&pair)void sync().catch(()=>{});});
 addEventListener('online',()=>{if(pair)void sync().catch(()=>{});});
 addEventListener('storage',e=>{
   if(e.key===PAIR_KEY){pair=readPair();renderAccount();if(pair)void sync().catch(()=>{});}
 });
 function onProgressChange(){
   if(!pair)return;
   report('Enviando alterações…');
   if(syncPromise){syncAgain=true;return;}
   void sync().catch(()=>{});
 }
 addEventListener('concurso:read-change',onProgressChange);
 addEventListener('concurso:progress-change',onProgressChange);
 addEventListener('ce:practice-recorded',onProgressChange);
}
window.ConcursoSync={configured:configuredState,sync,connect,getStatus:()=>lastStatus};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
