/* Estrutura comum de aulas: apenas leitura na área principal.
 * Configurações e backup permanecem acessíveis ao fim da aula; IDs e eventos preservados.
 */
(() => {
'use strict';
const $=selector=>document.querySelector(selector);
function isLesson(){return document.body.classList.contains('ce-lesson-page');}
function createTools(main){
 const d=document.createElement('details');d.className='ce-lesson-tools';d.id='ferramentas-da-aula';
 const summary=document.createElement('summary');summary.textContent='Configurações e backup da aula';
 const box=document.createElement('div');box.className='ce-lesson-tools-content';
 d.append(summary,box);
 const footer=main.querySelector(':scope > footer');
 if(footer)main.insertBefore(d,footer);else main.append(d);
 return box;
}
function removeOnlyMeta(root,selectors,words){
 for(const selector of selectors){
   for(const node of root.querySelectorAll(selector)){
     if(words.some(word=>node.textContent?.toLocaleLowerCase('pt-BR').includes(word)))node.remove();
   }
 }
}
function compactRlm(main,tools){
 // Retira explicações administrativas que podem estar defasadas após a sincronização.
 removeOnlyMeta(main,[':scope > .notice',':scope > .foundation-note','.chapter > .foundation-note'],['como usar a aula','estado real do estudo','lido começa vazia','marcaçao de leitura desta pagina começa vazia','marcação de leitura desta página começa vazia']);
 const opts=$('#markOnNext')?.closest('fieldset.reading-options');
 if(opts)tools.append(opts);
 for(const id of ['copyProgress','exportProgress','importProgress','importProgressFile','printBtn']){
   const el=document.getElementById(id);if(el)tools.append(el);
 }
 const existing=document.getElementById('backup');
 if(existing)tools.append(existing);
 const indicator=$('#sidebar .progressbox .save-help');
 if(indicator)indicator.textContent='Acompanhe a leitura pelo índice; cada subseção pode ser desmarcada.';
}
function compactEngineering(main,tools){
 removeOnlyMeta(main,[':scope > .notice',':scope > .notice.before-sections'],['como usar esta aula','prioridade atual de estudos']);
 const bar=main.querySelector(':scope > .study-tools');
 if(bar){
   const intro=bar.firstElementChild;
   if(intro?.textContent?.includes('Registro de leitura (não é avaliação)'))intro.remove();
   tools.append(bar);
 }
 const side=$('#sidebar .side-footer');
 if(side){
   const p=[...side.querySelectorAll('p')].find(p=>p.textContent?.includes('Marque “Lido”'));
   if(p)p.textContent='Subseções lidas e progresso por módulo.';
 }
}
function compactPortuguese(main,tools){
 main.querySelector('.hero .intro')?.remove();
 const settings=main.querySelector('.hero .toolbelt');
 if(settings)tools.append(settings);
 const data=main.querySelector(':scope > .data-panel');
 if(data){
   const lead=[...data.children].find(n=>n.tagName==='P'&&n.textContent?.includes('A marcação'));
   if(lead)lead.remove();
   tools.append(data);
 }
 const sidebar=$('#sidebar');
 if(sidebar){
   const p=[...sidebar.querySelectorAll('p')].find(p=>p.textContent?.includes('Índice clicável e estado real'));
   if(p)p.remove();
 }
}
function compactNew(main,tools){
 const own=main.querySelector('.nl-tools');
 if(own){
   const parent=own.parentElement;
   tools.append(own);
   const status=document.getElementById('nl-status');
   if(status)tools.append(status);
   if(parent?.classList.contains('nl-chapter')&&!parent.querySelector('.nl-section,.nl-quiz'))parent.remove();
 }
}
function portugueseHeader(){
 if($('.ce-standard-header'))return;
 const header=document.createElement('header');header.className='ce-standard-header';
 const brand=document.createElement('strong');brand.textContent='CE · CONCURSOS / PORTUGUÊS';
 const nav=document.createElement('nav');nav.setAttribute('aria-label','Navegação do site');
 for(const [label,url] of [['Painel','../index.html'],['Aulas','../aulas.html'],['Planejamento','../planejamento.html']]){
   const a=document.createElement('a');a.href=url;a.textContent=label;nav.append(a);
 }
 header.append(brand,nav);
 document.body.insertBefore(header,document.body.querySelector('.layout'));
}

/* Compatibilidade mobile: tabelas extensas viram cartões completos e os rótulos
 * de SVGs continuam legíveis. Não altera o HTML-fonte nem os IDs de leitura.
 * Os elementos originais seguem disponíveis fora do breakpoint mobile. */
function responsiveLessonContent(root){
 for(const table of root.querySelectorAll('table:not([data-ce-mobile-table])')){
   if(table.querySelector('input,select,button,textarea,[contenteditable]'))continue;
   const headings=[...table.querySelectorAll('thead tr:last-child th')].map(el=>el.textContent.trim());
   const trs=[...table.querySelectorAll('tbody tr')];
   if(!trs.length || !headings.length)continue;
   const cards=document.createElement('div');
   cards.className='ce-mobile-table-cards';
   const caption=table.querySelector('caption')?.textContent.trim() || table.getAttribute('aria-label') || 'Tabela comparativa';
   cards.setAttribute('aria-label', 'Leitura vertical: '+caption);
   for(const tr of trs){
     const cells=[...tr.children].filter(el=>/^(TD|TH)$/.test(el.tagName));
     if(!cells.length)continue;
     const item=document.createElement('section'); item.className='ce-mobile-table-card';
     const dl=document.createElement('dl');
     cells.forEach((cell,i)=>{
       const dt=document.createElement('dt');dt.textContent=headings[i] || 'Coluna '+(i+1);
       const dd=document.createElement('dd');
       for(const child of cell.childNodes)dd.appendChild(child.cloneNode(true));
       dl.append(dt,dd);
     });
     item.append(dl);cards.append(item);
   }
   if(!cards.children.length)continue;
   table.dataset.ceMobileTable='ready';
   table.insertAdjacentElement('afterend',cards);
 }
 for(const svg of root.querySelectorAll('.ce-visual-example svg, .diagram svg')){
   if(svg.dataset.ceMobileLegend)continue;
   const vb=svg.viewBox?.baseVal;
   if(!vb || vb.width<440)continue;
   const labels=[...new Set([...svg.querySelectorAll('text')].map(el=>el.textContent.trim().replace(/\s+/g,' ')).filter(Boolean))];
   const description=svg.getAttribute('aria-label')||'Diagrama vetorial';
   if(!labels.length && !description)continue;
   const legend=document.createElement('div');legend.className='ce-mobile-diagram-legend';
   const title=document.createElement('strong');title.textContent='Leitura legível do diagrama';
   const note=document.createElement('p');note.textContent=description;
   legend.append(title,note);
   if(labels.length){
     const ul=document.createElement('ul');
     labels.forEach(label=>{const li=document.createElement('li');li.textContent=label;ul.append(li)});
     legend.append(ul);
   }
   svg.dataset.ceMobileLegend='ready';
   svg.insertAdjacentElement('afterend',legend);
 }
}
function initResponsiveContent(main){
 responsiveLessonContent(main);
 let queued=false;
 const observer=new MutationObserver(()=>{
   if(queued)return;
   queued=true;
   requestAnimationFrame(()=>{queued=false;responsiveLessonContent(main)});
 });
 observer.observe(main,{childList:true,subtree:true});
}

function init(){
 if(!isLesson())return;
 const main=document.querySelector('main');if(!main)return;
 initResponsiveContent(main);
 if(main.querySelector('#ferramentas-da-aula'))return;
 const tools=createTools(main);
 const kind=document.body.classList;
 if(kind.contains('ce-rlm'))compactRlm(main,tools);
 else if(kind.contains('ce-eng'))compactEngineering(main,tools);
 else if(kind.contains('ce-pt')){compactPortuguese(main,tools);portugueseHeader();}
 else compactNew(main,tools);
 if(!tools.children.length)tools.closest('details')?.remove();
 const summary=main.querySelector('#ferramentas-da-aula summary');
 if(summary)summary.setAttribute('aria-label','Mostrar ou ocultar as opções de leitura e backup');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Exemplos de prova agora usam assets/cobranca-na-pratica.js para manter
   padrão único, fontes verificáveis e respostas independentes nas oito aulas. */
