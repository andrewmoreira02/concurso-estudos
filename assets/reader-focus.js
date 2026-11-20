/* Navegação sem avaliações presumidas: índice por módulo, etapa atual e retomar.
 * Ao clicar Próxima no rodapé móvel, delega ao controle ORIGINAL para preservar
 * exatamente a regra Lido na subseção de ORIGEM e a preferência reversível. */
(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const slug=document.body.dataset.ceLesson||((p)=>p.includes('rlm')?'rlm':p.includes('engenharia')?'engenharia':p.includes('portugues')?'portugues':'')(location.pathname);
const secSel=slug==='rlm'?'[data-lesson-step]':slug==='engenharia'?'.step-marker[id^="etapa-"]':slug==='portugues'?'article.subsection[id^="pt19-"]':'article.nl-section[data-ce-topic]';
function groupIndex(){
 const nav=$('.nl-sidebar nav,#sidebar nav,.sidebar #sidenav');
 if(!nav)return;
 if(slug==='rlm')return; // O índice RLM já possui <details> reversíveis por módulo.
 if(slug==='engenharia'){
  $$('.sidebar #sidenav .subnav').forEach((group,i)=>{
   if(group.closest('details'))return;
   const wrap=document.createElement('details');wrap.className='ce-module-collapse';
   const title=document.createElement('summary');title.textContent='Subseções do módulo '+(i+1);
   group.parentNode.insertBefore(wrap,group);wrap.append(title,group);
  });
 } else if(slug==='portugues'){
  const parents=$$('#menu .module-link');
  parents.forEach((module,i)=>{
    let next=module.nextElementSibling;
    if(!next||next.matches('.module-link'))return;
    const wrap=document.createElement('details');wrap.className='ce-module-collapse';
    const title=document.createElement('summary');title.textContent='Subseções do módulo '+(i+1);
    module.parentNode.insertBefore(wrap,next);wrap.append(title);
    while(next&&!next.matches('.module-link')){
      const candidate=next.nextElementSibling;wrap.append(next);next=candidate;
    }
  });
 } else {
  // Cada aula nova contém 3 módulos com IDs estáveis no índice.
  const links=$$('[data-ce-nav]',nav),groups=new Map();
  links.forEach(a=>{const m=a.dataset.ceNav?.match(/-(\d+)-\d+$/)?.[1];if(!m)return;const arr=groups.get(m)||[];arr.push(a);groups.set(m,arr);});
  for(const [m,anchors] of groups){
   const wrap=document.createElement('details');wrap.className='ce-module-collapse';
   const summary=document.createElement('summary');summary.textContent='Módulo '+m+' · '+anchors.length+' subseções';
   anchors[0].parentElement.insertBefore(wrap,anchors[0]);wrap.append(summary,...anchors);
  }
 }
}
function init(){
 const sections=$$(secSel);
 if(!sections.length)return;
 groupIndex();
 const bar=document.createElement('nav');bar.className='ce-reader-bottom';bar.setAttribute('aria-label','Navegação móvel da aula');
 const prev=document.createElement('a');prev.href='#';prev.textContent='← Anterior';
 const cur=document.createElement('span');cur.className='ce-reader-step';
 const next=document.createElement('a');next.href='#';next.textContent='Próxima →';
 bar.append(prev,cur,next);document.body.append(bar);
 const moduleSelector='section.chapter,section.section,section.module,section.nl-chapter';
 const moduleOf=node=>node?.closest(moduleSelector)||null;
 let active=0,scheduled=false,introFor=-1;
 function focusIntro(index){
  if(index<0||index>=sections.length)return;
  const module=moduleOf(sections[index]);
  if(!module)return;
  introFor=index;active=Math.max(0,index-1);
  const number=module.id.match(/(\d+)$/)?.[1]||'';
  cur.textContent='Módulo '+number+' · Apresentação';
  prev.classList.toggle('ce-reader-inactive',index===0);
  prev.setAttribute('aria-disabled',index===0?'true':'false');
  next.classList.remove('ce-reader-inactive');next.setAttribute('aria-disabled','false');
  prev.href=index>0?'#'+sections[index-1].id:'#'+module.id;
  next.href='#'+sections[index].id;
  $$('.ce-index-current').forEach(a=>{a.classList.remove('ce-index-current');a.removeAttribute('aria-current');});
 }
 function focus(i){
  introFor=-1;
  if(i<0||i>=sections.length)return;
  active=i;const node=sections[i],name=node.id||node.dataset.lessonStep;
  const label=node.dataset.lessonStep||name?.replace(/^etapa-(\d+)-(\d+)$/,'$1.$2').replace(/^[a-z]+-(\d+)-(\d+)$/,'$1.$2');
  cur.textContent='Etapa '+label+' · '+(i+1)+'/'+sections.length;
  prev.classList.toggle('ce-reader-inactive',i===0);prev.setAttribute('aria-disabled',i===0?'true':'false');
  next.classList.toggle('ce-reader-inactive',i===sections.length-1);next.setAttribute('aria-disabled',i===sections.length-1?'true':'false');
  prev.href=i>0?'#'+sections[i-1].id:'#'+name;next.href=i<sections.length-1?'#'+sections[i+1].id:'#'+name;
  $$('.ce-index-current').forEach(a=>{a.classList.remove('ce-index-current');a.removeAttribute('aria-current');});
  const href='#'+name;
  const navLinks=$$('.nl-sidebar nav a,#sidebar nav a,.sidebar #sidenav a');
  const link=navLinks.find(a=>a.getAttribute('href')===href);
  if(link){
   link.classList.add('ce-index-current');link.setAttribute('aria-current','location');
   const details=link.closest('details');if(details)details.open=true;
  }
 }
 function update(){
  scheduled=false;
  // A barra fixa não deve cobrir o botão original de navegação.
  // Ao alcançar o controle legado do Português, este permanece clicável.
  const originalFooter=slug==='portugues'?document.getElementById('next-section'):null;
  if(originalFooter){const r=originalFooter.getBoundingClientRect();bar.style.display=r.bottom>0&&r.top<innerHeight?'none':'';}

  const hash=decodeURIComponent(location.hash.slice(1));
  if(hash){
   const module=document.getElementById(hash);
   if(module?.matches(moduleSelector)){
    const i=sections.findIndex(node=>moduleOf(node)===module);
    if(i>=0&&sections[i].getBoundingClientRect().top>65){
     focusIntro(i);return;
    }
   }
   const i=sections.findIndex(x=>x.id===hash);
   if(i>=0){const r=sections[i].getBoundingClientRect();if(r.top<innerHeight*0.78&&r.bottom>-50){focus(i);return;}}
  }
  let best=0,bestDiff=Infinity;
  for(let i=0;i<sections.length;i++){
   const top=sections[i].getBoundingClientRect().top;
   const diff=Math.abs(top-155)+(top>innerHeight*.7?800:0);
   if(diff<bestDiff){best=i;bestDiff=diff;}
  }
  focus(best);
 }
 function request(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
 function originalNext(node){
  const id=node.id;
  if(slug==='rlm')return $$(`a[data-next-of="${id}"]`)[0];
  if(slug==='engenharia')return $$(`a[data-next-step="${id}"]`)[0];
  if(slug==='portugues')return $('#next-section');
  return $$(`a.ce-step-next[data-ce-next="${id}"]`)[0];
 }
 next.addEventListener('click',e=>{
  e.preventDefault();
  // A apresentação é uma etapa de navegação real entre os módulos.
  // O segundo toque em Próxima entra na 3.1, sem avançar inadvertidamente à 3.2.
  if(introFor>=0){
   const i=introFor,dest=sections[i];
   dest.scrollIntoView({behavior:'instant',block:'start'});
   history.pushState(null,'','#'+dest.id);
   if(slug==='portugues')dispatchEvent(new Event('hashchange'));
   focus(i);return;
  }
  if(active>=sections.length-1)return;
  const following=sections[active+1];
  const boundary=!!following&&moduleOf(following)!==moduleOf(sections[active]);
  const original=originalNext(sections[active]);
  if(slug==='portugues'){
   // A navegação portuguesa usa índice interno; alinhar o índice à seção visível
   // antes de delegar ao botão original, para marcar Lido da origem correta.
   history.replaceState(null,'','#'+sections[active].id);
   dispatchEvent(new Event('hashchange'));
  }
  if(original){original.click();}
  else return; // nunca ignorar a preferência Lido usando navegação independente
  const nextIndex=Math.min(active+1,sections.length-1);
  if(boundary)focusIntro(nextIndex);else focus(nextIndex);
  setTimeout(()=>{if(boundary&&location.hash==='#'+moduleOf(sections[nextIndex])?.id)focusIntro(nextIndex);else focus(nextIndex);},120);
 });
 prev.addEventListener('click',e=>{
  e.preventDefault();
  const index=introFor>=0?introFor-1:active-1;
  if(index<0)return;
  const dest=sections[index];dest.scrollIntoView({behavior:'smooth',block:'start'});
  history.replaceState(null,'','#'+dest.id);
  if(slug==='portugues')dispatchEvent(new Event('hashchange'));
  focus(index);
 });
 addEventListener('hashchange',request);addEventListener('scroll',request,{passive:true});
 setTimeout(request,200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80),{once:true});
else setTimeout(init,80);
})();