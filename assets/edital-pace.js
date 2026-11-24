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
function meter(labelText,n,total){const w=el("div",undefined,"ce-pace-metric");w.append(el("strong",labelText),el("span",n+" / "+total));const m=el("progress");m.max=Math.max(1,total);m.value=n;m.setAttribute("aria-label",labelText);w.append(m);return w;}
function para(s){host.append(el("p",s));}
function link(title,href){const a=el("a",title,"btn alt");a.href=href;return a;}
let config,matrix;
function render(){
 if(!config||!matrix)return;
 const date=today(),rule=config.priority_windows.find(x=>x.from<=date&&date<=x.through),exam=rule?.exam;
 host.replaceChildren(el("span","EDITAL • RITMO DE ESTUDO","eyebrow"),el("h2","Estou adiantado ou atrasado?"));
 if(exam!=="ima"){para("Sem indicador curricular configurado para o concurso prioritário. Consulte o planejamento.");return;}
 const lessons=config.adaptive_study.lessons,confirmed=read("ce_study_confirmed_v1",{})?.confirmed||{},availability=read("ce_available_days_v1",[]);
 const days=Array.isArray(availability)?[...new Set(availability.filter(x=>Number.isInteger(x)&&x>=0&&x<7))]:[];
 const daily=calcDaily(lessons,confirmed,exam,date),stats=groupStats(matrix,lessons,confirmed,exam);
 const policy=config.curriculum_pace?.[exam],start=policy?.start||rule.from,deadline=config.exams[exam].deadline,revisionDays=policy?.revision_days??14,target=dateAdd(deadline,-revisionDays-1);
 host.append(el("h3","Ritmo das aulas diárias"),el("strong",daily.total?daily.status:"Sem aulas agendadas","ce-pace-status"));
 para("Módulos com estudo confirmado: "+daily.actual+" · previstos até ontem: "+daily.target+" · diferença: "+(daily.delta>0?"+":"")+daily.delta+". "+daily.late+" módulo(s) de datas anteriores ainda pendentes.");
 host.append(meter("Estudo confirmado das aulas agendadas",daily.actual,daily.total));
 para("Compara apenas as aulas diárias cadastradas, não todo o edital. A aula de hoje ainda não conta como atraso; datas são sugestões.");
 if(daily.next)host.append(link("Próxima aula pendente",daily.next.url));
 host.append(el("h3","Cobertura editorial do edital — matriz preliminar"));
 para(stats.total+" grupos registrados: "+stats.developed+" classificados como desenvolvidos, "+stats.partial+" parciais, "+stats.missing+" sem teoria mapeada. Não são subitens auditados integralmente.");
 host.append(meter("Grupos classificados como desenvolvidos",stats.developed,stats.total));
 para("Meta de fechamento da teoria: "+label(target)+" · "+revisionDays+" dias reservados para revisão antes da prova de "+label(deadline)+".");
 if(stats.invalid)para("Atenção: "+stats.invalid+" grupo(s) com vínculo incompatível com o catálogo; revisar âncoras e conteúdo.");
 host.append(el("h3","Trajetória curricular provisória"));
 host.append(meter("Grupos desenvolvidos com todos os módulos vinculados confirmados",stats.confirmed,stats.total));
 para("Proxy conservador por grupos da matriz: confirmações IMA, não leitura nem domínio; vínculos ainda precisam de auditoria semântica e podem não refletir novas aulas.");
 if(!days.length){para("Defina os dias disponíveis no planejamento para calcular a meta acumulada e a previsão.");}
 else {
 const totalDays=availableBetween(start,dateAdd(target,1),days),elapsed=availableBetween(start,date<start?start:date>target?dateAdd(target,1):date,days);
 const expected=totalDays?Math.floor(stats.total*Math.min(1,elapsed/totalDays)):0;
 if(totalDays){const delta=stats.confirmed-expected;para("Meta acumulada provisória: "+expected+" de "+stats.total+" grupos · diferença "+(delta>0?"+":"")+delta+" · "+(delta>0?"Adiantado":delta<0?"Atrasado":"No ritmo")+". Grupos têm pesos iguais nesta aproximação; não representam horas equivalentes.");}
 else para("Não há dias de estudo disponíveis antes da meta.");
 const remaining=availableBetween(date,dateAdd(target,1),days);
 if(remaining)para("Ritmo necessário: "+((stats.total-stats.confirmed)/remaining).toFixed(2).replace(".",",")+" grupos por dia disponível (aproximação).");
 else if(stats.confirmed<stats.total)para("Alerta: prazo teórico esgotado ou sem dias disponíveis; replanejar.");
 const key="ce_curriculum_pace_observations_v1:"+exam;
 const signature=JSON.stringify([matrix.updated,stats.groups.map(t=>[t.id,t.depth,t.lessons]),days,start,target]);
 let history=read(key,{signature,observations:[]});
 if(history?.signature!==signature||!Array.isArray(history?.observations))history={signature,observations:[]};
 history.observations=history.observations.filter(o=>/^\d{4}-\d{2}-\d{2}$/.test(o?.date||"")&&o.date<date&&Number.isInteger(o.count)&&o.count>=0&&o.count<=stats.total).slice(-89);
 history.observations.push({date,count:stats.confirmed});
 try{localStorage.setItem(key,JSON.stringify(history));}catch{}
 const obs=history.observations,first=obs[0],span=availableBetween(first.date,date,days),calendarSpan=(Date.parse(date)-Date.parse(first.date))/86400000,velocity=span>0?(stats.confirmed-first.count)/span:0;
 if(stats.confirmed===stats.total&&stats.total>0)para("Todos os grupos desta matriz têm módulos vinculados confirmados; ainda é necessária auditoria integral do edital.");
 else if(obs.length>=3&&calendarSpan>=7&&velocity>0){
 let need=Math.ceil((stats.total-stats.confirmed)/velocity),projected=date;for(let i=0;i<730&&need>0;i++){projected=dateAdd(projected,1);if(days.includes((new Date(projected+"T12:00:00Z").getUTCDay()+6)%7))need--;}
 para(need?"Projeção provisória excede dois anos no ritmo observado.":"Previsão provisória de fechamento: "+label(projected)+(projected>target?" — após a meta de teoria.":" — dentro da meta teórica."));
 }else para("Previsão de término: dados insuficientes ou sem avanço líquido. Exige pelo menos três registros em dias distintos, sete dias de observação e progresso positivo. Série local deste navegador.");
 }
 const gaps=stats.groups.filter(t=>t.depth!=="desenvolvido"||!t.valid).sort((a,b)=>(b.weight||0)-(a.weight||0)||Number(b.depth==="lacuna")-Number(a.depth==="lacuna")||a.id.localeCompare(b.id));
 if(gaps.length){host.append(el("h3","Lacunas para a próxima produção editorial"));const list=el("ul");for(const g of gaps.slice(0,5))list.append(el("li",g.id+" · "+g.title+" — "+(g.depth==="lacuna"?"sem teoria mapeada":g.valid?"parcial":"vínculo a revisar")));host.append(list);}
 host.append(link("Ver matriz e configurar disponibilidade","planejamento.html#ce-cobertura-ima"));
 para("O painel recalcula localmente; a publicação de novas aulas e a auditoria integral são tarefas editoriais. Não grava resultados pessoais no GitHub.");
}
function safeRender(){try{render();}catch(e){host.replaceChildren(el("h2","Ritmo de preparação"),el("p","Não foi possível calcular o indicador. Confira os dados do planejamento."));}}
Promise.all(["dados/concursos.json","dados/cobertura-ima.json"].map(url=>fetch(url,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}))).then(([c,m])=>{config=c;matrix=m;safeRender();}).catch(()=>{host.replaceChildren(el("h2","Ritmo de preparação"),el("p","Dados curriculares indisponíveis."));});
for(const event of ["storage","concurso:progress-change","concurso:adaptive-update","focus"])addEventListener(event,safeRender);
})();