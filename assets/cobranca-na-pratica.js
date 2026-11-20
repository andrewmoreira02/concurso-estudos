/* Cobrado assim na prova: referências reais + enunciados A–E adaptados.
 * Exemplos de estudo independentes do quiz, Lido, avaliação ou revisão.
 * Não transcrever cadernos sem licença. Não acessar dados privados.
 */
(() => {
  'use strict';
  const SLUGS={
    'rlm.html':'rlm',
    'engenharia-qualidade.html':'engenharia',
    'portugues-casan-19-11.html':'portugues'
  };
  const $=(selector,root=document)=>root.querySelector(selector);
  const make=(tag,klass,content)=>{
    const node=document.createElement(tag);
    if(klass)node.className=klass;
    if(content!==undefined&&content!==null)node.textContent=String(content);
    return node;
  };
  function addLink(box,url,label){
    if(!/^https:\/\//.test(url||''))return;
    const a=make('a','ce-cobranca-source',label);
    a.href=url;a.target='_blank';a.rel='noopener noreferrer';
    box.append(a);
  }
  function install(){
    const data=window.ConcursoCobrancaData;
    const slug=document.body.dataset.ceLesson||SLUGS[location.pathname.split('/').pop()];
    const main=$('main'),list=data?.cases?.[slug];
    if(!main||!Array.isArray(list)||!list.length||$('#cobrado-assim-na-prova'))return;
    const panel=make('section','ce-cobranca','');
    panel.id='cobrado-assim-na-prova';
    panel.setAttribute('aria-labelledby','ce-cobranca-title');
    panel.append(make('p','ce-cobranca-eyebrow','Exemplos reais de cobrança · exercícios adaptados'));
    const title=make('h2','ce-cobranca-title','Cobrado assim na prova');
    title.id='ce-cobranca-title';panel.append(title);
    panel.append(make('p','ce-cobranca-lead',
      'A banca, o cargo e o número da questão são referências de provas anteriores. Para estudar sem abrir PDFs, cada exemplo abaixo traz um enunciado e cinco alternativas de redação própria, baseados no assunto cobrado. A resposta da adaptação foi validada separadamente: não é uma transcrição nem herda a letra do gabarito oficial.'));
    const cards=make('div','ce-cobranca-grid');
    for(const [i,item] of list.slice(0,5).entries()){
      const source=data.sources?.[item.src];
      if(!source||!Array.isArray(item.options)||item.options.length!==5||
         !item.options.every(v=>typeof v==='string'&&v.trim())||
         !Number.isInteger(item.answer)||item.answer<0||item.answer>4)continue;
      const article=make('article','ce-cobranca-card');
      article.append(make('p','ce-cobranca-num','Exemplo '+(i+1)+' de '+Math.min(list.length,5)));
      article.append(make('h3','ce-cobranca-topic',item.originTopic||item.what));
      article.append(make('p','ce-cobranca-origin',source.bank+' · '+source.exam+' · '+source.year+' · questão '+item.n+' (prova anterior)'));
      article.append(make('p','ce-cobranca-asked','O que a banca cobrou: '+item.what));
      const links=make('div','ce-cobranca-links');
      const sectionLink=make('a','ce-cobranca-topic-link','Rever conteúdo desta aula');
      if(document.getElementById(item.section)){
        sectionLink.href='#'+item.section;links.append(sectionLink);
      }
      addLink(links,source.pdf,'Consultar questão na prova original (opcional)');
      addLink(links,source.key,'Consultar gabarito final da prova');
      article.append(links);
      article.append(make('p','ce-cobranca-kind','Questão ADAPTADA · texto e alternativas próprios'));
      article.append(make('p','ce-cobranca-prompt',item.prompt));
      const options=make('ol','ce-cobranca-options');
      options.type='A';
      for(const option of item.options)options.append(make('li','',option));
      article.append(options);
      const solution=make('details','ce-cobranca-answer');
      solution.append(make('summary','','Conferir resposta e resolução desta adaptação'));
      const answer=String.fromCharCode(65+item.answer);
      solution.append(make('p','ce-cobranca-correct','Resposta da adaptação: '+answer));
      solution.append(make('p','',item.explain));
      solution.append(make('p','ce-cobranca-comparison','Gabarito FINAL da questão original '+item.n+': '+item.origKey+'. Esta letra pertence apenas à prova original; não substitui a resposta recalculada da adaptação.'));
      article.append(solution);cards.append(article);
    }
    if(!cards.children.length)return;
    panel.append(cards);
    const tools=$('#ferramentas-da-aula',main);
    if(tools)main.insertBefore(panel,tools);
    else {
      const footer=$(':scope > footer',main);
      if(footer)main.insertBefore(panel,footer);
      else main.append(panel);
    }
    const index=$('.nl-sidebar nav, #sidebar nav, aside.sidebar nav');
    if(index&&!index.querySelector('[href="#cobrado-assim-na-prova"]')){
      const link=make('a','ce-cobranca-index-link','Cobrado assim na prova');
      link.href='#cobrado-assim-na-prova';index.append(link);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
