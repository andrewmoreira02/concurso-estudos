/* Indicadores privados de ritmo; não confundem leitura, agenda ou publicação com estudo. */
(()=>{"use strict";
function calcDaily(lessons,confirmed,exam,today){
 const daily=lessons.filter(l=>l.daily===true&&l.subjects?.[exam]&&/^\d{4}-\d{2}-\d{2}$/.test(l.date||"")&&Array.isArray(l.sections_per_module));
 const due=daily.filter(l=>l.date<today);
 const count=ls=>ls.reduce((n,l)=>n+l.sections_per_module.reduce((s,_,i)=>s+(confirmed[exam+":"+l.id+":"+(i+1)]===true?1:0),0),0);
 const target=due.reduce((n,l)=>n+l.sections_per_module.length,0),actual=count(daily),late=target-count(due);
 return {total:daily.reduce((n,l)=>n+l.sections_per_module.length,0),target,actual,late,delta:actual-target,status:actual<target?"Atrasado":actual>target?"Adiantado":"No ritmo",next:daily.filter(l=>count([l])<l.sections_per_module.length).sort((a,b)=>a.date.localeCompare(b.date))[0]};
}
function groupStats(matrix,lessons,confirmed,exam){
 const seen=new Set(),groups=[];
 for(const area of matrix.areas||[])for(const t of area.topics||[]){
  if(!t.id||seen.has(t.id))throw Error("ID curricular duplicado ou ausente");seen.add(t.id);
  const keys=[];let valid=Array.isArray(t.lessons)&&t.lessons.length>0;
  for(const item of t.lessons||[]){
   const [path,anchor]=String(item.href||"").split("#");
   const lesson=lessons.find(l=>l.url===path&&l.subjects?.[exam]);
   const match=lesson&&(lesson.section_prefix==="m"?/^m(\d+)-s(\d+)$/:new RegExp("^"+lesson.section_prefix+"-(\\d+)-(\\d+)$")).exec(anchor||"");
   if(!match||!lesson.sections_per_module?.[Number(match[1])-1]||Number(match[2])<1||Number(match[2])>lesson.sections_per_module[Number(match[1])-1]){valid=false;continue;}
   keys.push(exam+":"+lesson.id+":"+Number(match[1]));
  }
  groups.push({...t,area:area.label,weight:area.questions||0,valid,confirmed:t.depth==="desenvolvido"&&valid&&keys.every(k=>confirmed[k]===true)});
 }
 return {groups,total:groups.length,developed:groups.filter(t=>t.depth==="desenvolvido").length,partial:groups.filter(t=>t.depth==="parcial").length,missing:groups.filter(t=>t.depth==="lacuna").length,confirmed:groups.filter(t=>t.confirmed).length,invalid:groups.filter(t=>t.depth!=="lacuna"&&!t.valid).length};
}
function dateAdd(iso,n){const d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function availableBetween(start,end,days){let n=0;for(let d=start;d<end;d=dateAdd(d,1)){if(days.includes((new Date(d+"T12:00:00Z").getUTCDay()+6)%7))n++;if(n>2000)break;}return n;}
const host=document.getElementById("ce-edital-pace");if(!host)return;
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};
const today=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const label=d=>d?d.split("-").reverse().join("/"):"—";
const el=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;};
function paceSegments(actual,expected,total){
 const clamp=n=>Math.max(0,Math.min(100,100*n/Math.max(1,total)));
 const a=clamp(actual),e=expected===null?null:clamp(expected);
 if(e===null)return [{kind:"unplanned",width:a}];
 return [{kind:"planned",width:Math.min(a,e)},{kind:a<e?"late":"ahead",width:Math.abs(a-e)}];
}
function pct(n,total){return n===null?"—":new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(100*n/Math.max(1,total))+"%";}
function paceBar(actual,expected,total){
 const track=el("div",undefined,"ce-pace-track");
 track.setAttribute("role","img");track.setAttribute("aria-label","Estudado: "+pct(actual,total)+"; meta: "+pct(expected,total)+(expected===null?" não calculada":actual<expected?"; atraso":actual>expected?"; adiantamento":"; no ritmo"));
 for(const part of paceSegments(actual,expected,total)){
  const segment=el("span",undefined,"ce-pace-segment "+part.kind);
  segment.style.width=part.width+"%";track.append(segment);
 }
 if(expected!==null){
  const marker=el("span",undefined,"ce-pace-marker");marker.style.left=Math.max(0,Math.min(100,100*expected/Math.max(1,total)))+"%";marker.title="Meta: "+pct(expected,total);track.append(marker);
 }
 return track;
}
function para(s){host.append(el("p",s));}
function link(title,href){const a=el("a",title,"btn alt");a.href=href;return a;}
let config,matrix,curriculum;
function render(){
 if(!config||!matrix||!curriculum)return;
 const date=today(),rule=config.priority_windows.find(x=>x.from<=date&&date<=x.through),exam=rule?.exam;
 host.replaceChildren(el("h2","Progresso do edital · IMA"));
 if(exam!=="ima"){para("Sem indicador curricular configurado para o concurso prioritário. Consulte o planejamento.");return;}
 const lessons=config.adaptive_study.lessons,confirmed=read("ce_study_confirmed_v1",{})?.confirmed||{},availability=read("ce_available_days_v1",[]);
 const days=Array.isArray(availability)?[...new Set(availability.filter(x=>Number.isInteger(x)&&x>=0&&x<7))]:[];
 const api=window.CECurriculum,normalized={...confirmed};
 for(const [id,entries] of curriculum.byLesson)for(const m of new Set(entries.map(u=>u.module)))normalized[exam+':'+id+':'+m]=entries.filter(u=>u.module===m).every(u=>api.studied(u,confirmed,curriculum));
 const daily=calcDaily(lessons,normalized,exam,date),groups=groupStats(matrix,lessons,confirmed,exam),effort=api.stats(curriculum,confirmed),stats={...groups,total:effort.total,confirmed:effort.done};
 const policy=config.curriculum_pace?.[exam],start=policy?.start||rule.from,deadline=config.exams[exam].deadline,revisionDays=policy?.revision_days??14,target=dateAdd(deadline,-revisionDays-1);
 const totalDays=days.length?availableBetween(start,dateAdd(target,1),days):0;
 const elapsed=totalDays?availableBetween(start,date<start?start:date>target?dateAdd(target,1):date,days):0;
 const expected=totalDays?stats.total*Math.min(1,elapsed/totalDays):null;
 const diff=expected===null?null:stats.confirmed-expected;
 const comparison=el("div",undefined,"ce-pace-comparison");
 const head=el("div",undefined,"ce-pace-head");
 head.append(el("strong",pct(stats.confirmed,stats.total)+" estudado","ce-pace-value"),el("strong",diff===null?"Meta não calculada":diff>0?"Adiantado":diff<0?"Atrasado":"No ritmo","ce-pace-status "+(diff===null?"unknown":diff<0?"late":diff>0?"ahead":"onpace")));
 comparison.append(head,paceBar(stats.confirmed,expected,stats.total));
 const caption=el("div",undefined,"ce-pace-caption");
 caption.append(el("span","Meta até hoje: "+pct(expected,stats.total)),el("span",diff===null?"Selecione os dias disponíveis":(diff>0?"+":"")+new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1}).format(100*diff/Math.max(1,stats.total))+" p.p."));
 comparison.append(caption);
 const legend=el("div",undefined,"ce-pace-legend");
 for(const [kind,name] of [["planned","Dentro da meta"],["ahead","Adiantamento"],["late","Atraso"]]){
  const item=el("span");item.append(el("i",undefined,kind),document.createTextNode(name));legend.append(item);
 }
 comparison.append(legend,el("small","Início: "+label(start)+" · meta de conclusão: "+label(target)+" · "+(totalDays?"meta média: "+pct(stats.total/totalDays,stats.total)+"/dia disponível":"configure os dias disponíveis")+". Estimativa provisória."));
 host.append(comparison);
 if(expected===null)host.append(link("Configurar disponibilidade","planejamento.html#availabilityDays"));
 const details=el("details",undefined,"ce-pace-details");
 details.append(el("summary","Detalhes da previsão e da cobertura"));
 host.append(details);
 const detailPara=t=>details.append(el("p",t));
 detailPara("Estimativa de esforço teórico: "+stats.confirmed+" de "+stats.total+" minutos ponderados confirmados. "+effort.allocated+" minutos já vinculados às aulas diárias; "+effort.remainingUnmapped+" reservados a conteúdos ainda sem vínculo granular. Inclui fundamentos de programação a auditar no edital. Questões não alteram esta barra; não mede domínio nem cobertura oficial auditada.");
 detailPara("Início: "+label(start)+". Revisão reservada: "+revisionDays+" dias. "+(totalDays?"Meta média por dia disponível: "+pct(stats.total/totalDays,stats.total)+".":"Configure a disponibilidade para calcular a meta diária."));
 detailPara("Aulas diárias: "+daily.status.toLowerCase()+". "+daily.late+" módulo(s) de datas anteriores pendentes. A aula de hoje ainda não conta como atraso.");
 if(daily.next)details.append(link("Próxima aula pendente",daily.next.url));
 if(stats.invalid)detailPara("Há "+stats.invalid+" vínculo(s) a revisar no catálogo.");
 if(!totalDays)detailPara("Previsão indisponível até configurar dias de estudo.");
 else{
 const remaining=availableBetween(date,dateAdd(target,1),days);
 if(remaining)detailPara("Ritmo necessário: "+((stats.total-stats.confirmed)/remaining).toFixed(2).replace(".",",")+" minutos de teoria estimada por dia disponível (aproximação).");
 else if(stats.confirmed<stats.total)detailPara("Prazo teórico esgotado ou sem dias disponíveis; replanejar.");
 const key="ce_curriculum_pace_observations_v1:"+exam;
 const signature=JSON.stringify(["effort-v1",stats.total,[...curriculum.units.values()].map(u=>[u.id,u.minutes,u.group]),days,start,target]);
 let history=read(key,{signature,observations:[]});
 if(history?.signature!==signature||!Array.isArray(history?.observations))history={signature,observations:[]};
 history.observations=history.observations.filter(o=>/^\d{4}-\d{2}-\d{2}$/.test(o?.date||"")&&o.date<date&&Number.isInteger(o.count)&&o.count>=0&&o.count<=stats.total).slice(-89);
 history.observations.push({date,count:stats.confirmed});
 try{localStorage.setItem(key,JSON.stringify(history));}catch{}
 const obs=history.observations,first=obs[0],span=availableBetween(first.date,date,days),calendarSpan=(Date.parse(date)-Date.parse(first.date))/86400000,velocity=span>0?(stats.confirmed-first.count)/span:0;
 if(stats.confirmed===stats.total&&stats.total>0)detailPara("Todo o esforço estimado está confirmado; ainda é necessária auditoria integral do edital.");
 else if(obs.length>=3&&calendarSpan>=7&&velocity>0){
 let need=Math.ceil((stats.total-stats.confirmed)/velocity),projected=date;for(let i=0;i<730&&need>0;i++){projected=dateAdd(projected,1);if(days.includes((new Date(projected+"T12:00:00Z").getUTCDay()+6)%7))need--;}
 detailPara(need?"Projeção provisória excede dois anos no ritmo observado.":"Previsão provisória de fechamento: "+label(projected)+(projected>target?" — após a meta de teoria.":" — dentro da meta teórica."));
 }else detailPara("Previsão de término: dados insuficientes ou sem avanço líquido. Exige pelo menos três registros em dias distintos, sete dias de observação e progresso positivo. Série local deste navegador.");
 }
 const gaps=stats.groups.filter(t=>t.depth!=="desenvolvido"||!t.valid).sort((a,b)=>(b.weight||0)-(a.weight||0)||Number(b.depth==="lacuna")-Number(a.depth==="lacuna")||a.id.localeCompare(b.id));
 if(gaps.length){details.append(el("h3","Lacunas para a próxima produção editorial"));const list=el("ul");for(const g of gaps.slice(0,5))list.append(el("li",g.id+" · "+g.title+" — "+(g.depth==="lacuna"?"sem teoria mapeada":g.valid?"parcial":"vínculo a revisar")));details.append(list);}
 details.append(link("Ver matriz curricular","planejamento.html#ce-cobertura-ima"));
 detailPara("O painel recalcula localmente; a publicação de novas aulas e a auditoria integral são tarefas editoriais. Não grava resultados pessoais no GitHub.");
}
function safeRender(){try{render();}catch(e){host.replaceChildren(el("h2","Ritmo de preparação"),el("p","Não foi possível calcular o indicador. Confira os dados do planejamento."));}}
Promise.all(["dados/concursos.json","dados/cobertura-ima.json"].map(url=>fetch(url,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}))).then(async ([c,m])=>{config=c;matrix=m;curriculum=await window.CECurriculum.load("",c,m);safeRender();}).catch(()=>{host.replaceChildren(el("h2","Ritmo de preparação"),el("p","Dados curriculares indisponíveis."));});
for(const event of ["storage","concurso:progress-change","concurso:adaptive-update","concurso:sync-status","focus"])addEventListener(event,safeRender);
})();