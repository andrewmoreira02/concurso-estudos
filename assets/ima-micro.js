/* IMA: uma seção por endereço, preservando o estado de leitura original.
   Nenhuma abertura/leitura cria Avaliado ou Estudado. */
(()=>{'use strict';
const root=document.getElementById('microRoot'), params=new URLSearchParams(location.search);
if(!root)return;
const $=id=>document.getElementById(id);
const qid=params.get('u');
const esc=s=>String(s||'');
const text=(id,value)=>{const n=$(id);if(n)n.textContent=value;};
const link=(id,url,label)=>{const n=$(id);if(n){n.href=url;n.textContent=label;}};
const get=key=>{try{const d=JSON.parse(localStorage.getItem(key)||'null');return d&&typeof d==='object'&&!Array.isArray(d)?d:{};}catch{return {};}};
const key=slug=>'ce_lesson_read_v1:'+slug;
let unit=null,check=null;
const saved=()=>{const d=get(key(unit.source.lesson));return new Set(Array.isArray(d.read)?d.read.filter(x=>typeof x==='string'):[]);};
function draw(){
 if(!unit||!check)return;
 const read=saved().has(unit.source.section);
 check.checked=read;
 text('microCount',read?'1 de 1 seção Lido':'0 de 1 seção Lido');
 text('microState',read?'Leitura declarada. Próxima sugestão: responder as questões deste assunto. Não é avaliação nem domínio.':'Leia a seção e marque Lido para receber as questões correspondentes.');
 $('microNext').hidden=!read;
 $('microMarkGo').textContent=read?'Abrir questões deste assunto':'Marcar Lido e abrir questões';
}
function mark(value){
 if(!unit)return false;
 const storageKey=key(unit.source.lesson),before=get(storageKey);
 const set=new Set(Array.isArray(before.read)?before.read.filter(x=>typeof x==='string'):[]);
 if(value)set.add(unit.source.section);else set.delete(unit.source.section);
 try{
   localStorage.setItem(storageKey,JSON.stringify({...before,version:1,lesson:unit.source.lesson,read:[...set],savedAt:new Date().toISOString()}));
   dispatchEvent(new CustomEvent('concurso:read-change'));draw();return true;
 }catch(e){text('microState','Não foi possível guardar Lido neste navegador; verifique o armazenamento e faça backup do progresso.');return false;}
}
async function init(){
 try{
  const response=await fetch('../dados/microaulas-ima.json',{cache:'no-store'});
  if(!response.ok)throw Error('Catálogo de unidades indisponível');
  const data=await response.json();
  if(data.schema_version!==1||!Array.isArray(data.units)||data.units.length!==25)throw Error('Catálogo incompleto');
  const units=data.units;
  unit=units.find(x=>x.id===qid);
  if(!unit)throw Error('Unidade não encontrada: escolha uma das microaulas no catálogo');
  if(!/^aulas\/[a-z0-9-]+\.html$/.test(unit.source.href)||!/^[a-z0-9-]+$/.test(unit.source.section)||!/^[a-z0-9-]+$/.test(unit.source.lesson))throw Error('Origem inválida');
  document.title=unit.title+' — microaula IMA | Concurso Estudos';
  text('microTitle',unit.title);text('microSubject',unit.subject_label+' · IMA/FURB');
  text('microOrdinal','Unidade '+(units.indexOf(unit)+1)+' de '+units.length+' · uma seção por página');
  link('microSource','../'+unit.source.href+'#'+unit.source.section,'Consultar aula completa original');
  link('microToQuiz','../'+unit.questions_href,'Resolver somente estas '+unit.question_ids.length+' questões');
  const previous=units[units.indexOf(unit)-1],next=units[units.indexOf(unit)+1];
  if(previous)link('microPrevious','microaula-ima.html?u='+previous.id,'← Microaula anterior');else $('microPrevious').hidden=true;
  if(next)link('microFollowing','microaula-ima.html?u='+next.id,'Próxima microaula →');else $('microFollowing').hidden=true;
  const page=await fetch('../'+unit.source.href,{cache:'no-store'});
  if(!page.ok)throw Error('Conteúdo original indisponível');
  const parsed=new DOMParser().parseFromString(await page.text(),'text/html');
  const article=parsed.getElementById(unit.source.section);
  if(!article?.classList.contains('nl-section'))throw Error('Seção original não encontrada');
  const view=document.importNode(article,true);
  view.removeAttribute('id'); // A subseção é exclusiva desta página, e os controles mantêm o ID original.
  view.id=unit.source.section;
  root.replaceChildren(view);
  check=view.querySelector('input[data-ce-read="'+unit.source.section+'"]');
  if(!check)throw Error('Controle Lido original não encontrado');
  check.addEventListener('change',()=>{if(!mark(check.checked))check.checked=!check.checked;});
  $('microMarkGo').addEventListener('click',()=>{
   if(mark(true))location.href='questoes-micro-ima.html?u='+unit.id;
  });
  addEventListener('storage',e=>{if(e.key===key(unit.source.lesson))draw();});
  addEventListener('concurso:sync-status',e=>{if(e.detail?.message?.startsWith('Sincronizado'))draw();});
  draw();
 }catch(e){root.replaceChildren();const p=document.createElement('p');p.textContent='Não foi possível abrir a microaula: '+e.message+'. Nenhum progresso foi alterado.';root.append(p);$('microMarkGo').hidden=true;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();