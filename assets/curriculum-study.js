/* Esforço curricular estimado. IDs canônicos evitam dupla contagem; chave compatível com sincronização v1. */
(function(root){
"use strict";
const key=id=>"ima:unit-"+id+":1";
const validId=id=>typeof id==="string"&&/^[a-z][a-z0-9-]{2,35}$/.test(id);
function build(matrix,lessons,sources){
 const groups=new Map(),units=new Map(),byLesson=new Map();
 for(const g of [...matrix.areas.flatMap(a=>a.topics),...(matrix.effort_policy?.support||[])]){
  if(groups.has(g.id)||!Number.isInteger(g.effort_minutes)||g.effort_minutes<=0)throw Error("Orçamento curricular inválido: "+g.id);
  groups.set(g.id,{id:g.id,minutes:g.effort_minutes,allocated:0});
 }
 for(const l of lessons.filter(l=>l.daily&&l.subjects?.ima)){
  const d=sources.find(s=>s.id===l.id);
  if(!d||d.curriculum_exam!=="ima"||d.modules.length!==l.sections_per_module.length)throw Error("Mapeamento diário ausente: "+l.id);
  const entries=[];
  d.modules.forEach((m,i)=>{
   if(m.sections.length!==l.sections_per_module[i])throw Error("Catálogo diverge: "+l.id);
   m.sections.forEach((s,j)=>{
    const u=s.curriculum,g=groups.get(u?.group);
    if(!g||!validId(u.id)||!Number.isInteger(u.minutes)||u.minutes<=0)throw Error("Unidade inválida: "+s.id);
    if(s.id!==l.section_prefix+"-"+(i+1)+"-"+(j+1))throw Error("Âncora diverge: "+s.id);
    const e={id:u.id,group:u.group,minutes:u.minutes,lesson:l.id,module:i+1,section:s.id,title:s.title};
    entries.push(e);
    const existing=units.get(u.id);
    if(existing){if(existing.group!==u.group||existing.minutes!==u.minutes)throw Error("Unidade repetida divergente: "+u.id);existing.refs.push(e);}
    else{units.set(u.id,{...e,refs:[e]});g.allocated+=u.minutes;}
   });
  });
  byLesson.set(l.id,entries);
 }
 for(const g of groups.values())if(g.allocated>g.minutes)throw Error("Esforço excede reserva: "+g.id);
 return {groups,units,byLesson,total:[...groups.values()].reduce((n,g)=>n+g.minutes,0)};
}
function studied(u,confirmed,model){
 const k=key(u.id);
 if(typeof confirmed[k]==="boolean")return confirmed[k];
 const refs=model?.units.get(u.id)?.refs||u.refs||[u];
 return refs.some(r=>confirmed["ima:"+r.lesson+":"+r.module]===true);
}
function stats(model,confirmed){
 let done=0,allocated=0;
 for(const u of model.units.values()){allocated+=u.minutes;if(studied(u,confirmed,model))done+=u.minutes;}
 return {total:model.total,done,allocated,remainingUnmapped:model.total-allocated};
}
function read(){try{return JSON.parse(localStorage.getItem("ce_study_confirmed_v1")||"{}")||{};}catch{return {};}}
function write(values){const doc=read();localStorage.setItem("ce_study_confirmed_v1",JSON.stringify({...doc,version:1,confirmed:{...(doc.confirmed||{}),...values},updatedAt:new Date().toISOString()}));window.dispatchEvent(new CustomEvent("concurso:progress-change"));}
async function load(prefix="",config=null,matrix=null){
 const fetchJSON=async p=>{const r=await fetch(prefix+p,{cache:"no-store"});if(!r.ok)throw Error(p+" indisponível");return r.json();};
 const [c,m]=await Promise.all([config||fetchJSON("dados/concursos.json"),matrix||fetchJSON("dados/cobertura-ima.json")]);
 const lessons=c.adaptive_study.lessons;
 const sources=await Promise.all(lessons.filter(l=>l.daily&&l.subjects?.ima).map(l=>fetchJSON("dados/aulas-diarias/"+l.id+".json")));
 return build(m,lessons,sources);
}
const api={key,build,studied,stats,read,write,load};
if(typeof module==="object"&&module.exports)module.exports=api;else root.CECurriculum=api;
})(typeof globalThis==="object"?globalThis:this);
