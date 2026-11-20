/* Leitura das novas aulas: cada seção tem controle no FINAL no próprio HTML.
   Progresso reversível e backups versionados; Lido não comprova domínio. */
(()=>{'use strict';
const main=document.body,slug=main.dataset.ceLesson;
if(!/^[a-z][a-z0-9-]{2,40}$/.test(slug||''))return;
const KEY='ce_lesson_read_v1:'+slug;
const $$=s=>[...document.querySelectorAll(s)],$=s=>document.querySelector(s);
const ids=$$('input[data-ce-read]').map(x=>x.dataset.ceRead);
const allowed=new Set(ids);
const parse=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return Array.isArray(x.read)?x:{};}catch{return {};}};
const current=()=>{const read=parse().read;return new Set(Array.isArray(read)?read.filter(x=>allowed.has(x)):[]);};
function status(text){const node=$('#nl-status');if(node)node.textContent=text;}
function save(idsToSave){
 const doc=parse(),read=[...idsToSave].filter(x=>allowed.has(x)).sort((a,b)=>ids.indexOf(a)-ids.indexOf(b));
 try{localStorage.setItem(KEY,JSON.stringify({...doc,version:1,lesson:slug,read,savedAt:new Date().toISOString()}));}
 catch{status('Não foi possível salvar localmente. Exporte um backup para proteger seus dados.');return false;}
 dispatchEvent(new CustomEvent('concurso:read-change'));
 draw();
 return true;
}
function draw(){
 const list=current(),count=list.size;
 for(const x of $$('input[data-ce-read]'))x.checked=list.has(x.dataset.ceRead);
 for(const a of $$('a[data-ce-nav]'))a.dataset.read=list.has(a.dataset.ceNav)?'true':'false';
 const meter=$('#nl-meter'),label=$('#nl-count');
 if(meter)meter.value=count;
 if(label)label.textContent=count+' de '+ids.length+' subseções marcadas como Lido';
 const box=$('#nl-global-status');if(box)box.textContent=count===ids.length?'Todas as subseções estão marcadas como Lido; revise por questões para verificar retenção.':'Ainda restam '+(ids.length-count)+' subseções para ler.';
}
$$('input[data-ce-read]').forEach(x=>x.addEventListener('change',()=>{
 const next=current();if(x.checked)next.add(x.dataset.ceRead);else next.delete(x.dataset.ceRead);
 if(save(next))status('Marcação atualizada neste aparelho. A sincronização privada tentará enviar as alterações.');
}));
$('#nl-export')?.addEventListener('click',()=>{
 const v={...parse(),version:1,lesson:slug,read:[...current()],exportedAt:new Date().toISOString()};
 const url=URL.createObjectURL(new Blob([JSON.stringify(v,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='concurso-'+slug+'-leitura-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status('Backup JSON baixado.');
});
$('#nl-import')?.addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 try{
  if(file.size>75000)throw Error('arquivo excede 75 kB');
  const v=JSON.parse(await file.text());
  if(v.version!==1||v.lesson!==slug||!Array.isArray(v.read)||v.read.some(x=>!allowed.has(x)))throw Error('backup não corresponde a esta aula');
  const merged=current();for(const id of v.read)merged.add(id);
  if(confirm('Mesclar as marcações Lido do backup com as atuais, sem apagar leituras?')){save(merged);status('Backup importado e mesclado.');}
 }catch(err){status('Importação recusada: '+err.message);}
});
const select=$('#nl-exam'),form=$('[data-ce-quiz]');
if(select&&form){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=k=>parts.find(p=>p.type===k)?.value;const day=get('year')+'-'+get('month')+'-'+get('day');
 select.value=day<='2026-11-22'?'casan':'ima';
 form.dataset.exam=select.value;
 select.addEventListener('change',()=>{form.dataset.exam=select.value;});
}
addEventListener('concurso:sync-status',e=>{if(e.detail?.message?.startsWith('Sincronizado')){draw();status('Leitura sincronizada com seu banco privado.');}});
addEventListener('storage',e=>{if(e.key===KEY)draw();});
draw();
})();