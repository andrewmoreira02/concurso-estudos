/* Matriz pública curricular: NUNCA usar estado pessoal para afirmar domínio.
   Escopo exato do cargo 404 CASAN, com lacunas transparentes. */
(()=>{'use strict';
const el=(t,c,text)=>{const v=document.createElement(t);if(c)v.className=c;if(text!=null)v.textContent=String(text);return v;};
async function init(){
 const host=document.getElementById('ce-cobertura-casan');if(!host)return;
 let data;
 try{const response=await fetch('dados/cobertura-casan.json?v=20261120six',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);data=await response.json();}
 catch{host.append(el('p','ce-coverage-error','Não foi possível carregar a matriz. Consulte o edital oficial no portal AOCP.'));return;}
 host.append(el('p','ce-coverage-eyebrow','CASAN 404 · Prova 22/11/2026 · 50 questões'));
 host.append(el('h2','', 'Cobertura do edital — o que falta estudar'));
 host.append(el('p','', 'Esta matriz mostra a correspondência documental entre subtópicos exigidos e os materiais realmente disponíveis. “Desenvolvido” indica material, não estudo concluído, retenção nem acerto. Consulte retificações no edital original.'));
 const sources=el('p','ce-coverage-sources');
 for(const [url,label] of [[data.source.official,'Edital e retificações AOCP'],[data.source.secondary,'Texto do conteúdo programático (referência secundária)']]){
  const a=el('a','',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a,' · ');
 }
 host.append(sources);
 const totals=data.areas.reduce((a,b)=>a.concat(b.topics),[]);
 const counts=totals.reduce((o,x)=>(o[x.depth]=(o[x.depth]||0)+1,o),{});
 const summary=el('p','ce-coverage-count');
 summary.textContent=totals.length+' tópicos mapeados · '+(counts.desenvolvido||0)+' desenvolvidos · '+(counts.parcial||0)+' parciais · '+(counts.lacuna||0)+' lacunas documentais';
 host.append(summary);
 const controls=el('div','ce-coverage-controls');
 const label=el('label','','Mostrar cobertura: '),sel=el('select','','');
 for(const [value,txt] of [['all','Todos'],['lacuna','Lacunas'],['parcial','Parciais'],['desenvolvido','Desenvolvidos']]){
  const opt=el('option','',txt);opt.value=value;sel.append(opt);
 }
 label.append(sel);controls.append(label);host.append(controls);
 const body=el('div','ce-coverage-areas');host.append(body);
 const sections=[];
 for(const area of data.areas){
   const section=el('section','ce-coverage-area');const h=el('h3','',area.label+' · '+area.questions+' questões');section.append(h);
   const table=el('table','ce-coverage-table'),thead=el('thead'),header=el('tr');
   for(const head of ['Edital','Cobertura','Aula / verificação'])header.append(el('th','',head));
   thead.append(header);table.append(thead);
   const tbody=el('tbody');for(const topic of area.topics){
    const tr=el('tr','');tr.dataset.depth=topic.depth;
    const t=el('th','ce-coverage-topic',topic.id+' · '+topic.title);t.scope='row';tr.append(t);
    const state=el('td','');const badge=el('strong','ce-coverage-state ce-state-'+topic.depth,topic.depth);state.append(badge);tr.append(state);
    const links=el('td','ce-coverage-links');
    for(const lesson of topic.lessons){const a=el('a','',lesson.label);a.href=lesson.href;links.append(a);}
    const note=el('small','',topic.note);links.append(note);tr.append(links);tbody.append(tr);sections.push(tr);
   }
   table.append(tbody);const wrap=el('div','ce-coverage-overflow');wrap.append(table);section.append(wrap);body.append(section);
 }
 sel.addEventListener('change',()=>{for(const row of sections)row.hidden=sel.value!=='all'&&row.dataset.depth!==sel.value;
  for(const area of body.children){const any=[...area.querySelectorAll('tbody tr')].some(tr=>!tr.hidden);area.hidden=!any;}
 });
 if(location.hash==='#ce-cobertura-casan')host.scrollIntoView({block:'start'});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();