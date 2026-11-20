/* Interface de leitura: controle Lido no fim de cada subseção.
   Desloca o MESMO elemento já existente, preservando listeners, IDs e chaves
   de progresso das aulas publicadas. Não marca automaticamente nenhuma etapa. */
(() => {
  'use strict';
  function labelFooter(id){
    const f=document.createElement('div');
    f.className='ce-end-reading';
    f.setAttribute('role','group');
    f.setAttribute('aria-label','Confirmação de leitura da subseção '+id);
    const p=document.createElement('span');
    p.className='ce-end-reading-label';
    p.textContent='Fim da subseção '+id.replace(/^m(\d+)-s(\d+)$/,'$1.$2').replace(/^etapa-(\d+)-(\d+)$/,'$1.$2').replace(/^pt19-(\d+)-(\d+)$/,'$1.$2')+' · marque apenas depois de ler o conteúdo';
    f.append(p);
    return f;
  }
  function atEndRlm(){
    let n=0;
    const headings=[...document.querySelectorAll('h3[data-lesson-step],h4[data-lesson-step]')];
    for(const heading of headings){
      const id=heading.id,toolbar=document.querySelector('[data-step-toolbar="'+id+'"]');
      if(!id||!toolbar||!heading.parentElement)continue;
      const parent=heading.parentElement,footer=labelFooter(id);
      toolbar.classList.add('ce-step-toolbar-end');
      footer.append(toolbar);
      // Blocos independentes (.mini/.control) guardam exatamente uma subseção.
      const independent=(parent.classList.contains('mini')||parent.classList.contains('control')) &&
        parent.querySelectorAll('[data-lesson-step]').length===1;
      if(independent){parent.append(footer);n++;continue;}
      // Subseções de título direto (h3/h4) estão no módulo: insere o controle
      // imediatamente ANTES da próxima subseção ou dos avisos de fim de módulo.
      let cursor=heading.nextElementSibling,stop=null;
      while(cursor){
        if(cursor.matches('[data-lesson-step],.chapterend,.reading-next')||
          cursor.querySelector('[data-lesson-step]')){stop=cursor;break;}
        cursor=cursor.nextElementSibling;
      }
      if(stop)parent.insertBefore(footer,stop);else parent.append(footer);
      n++;
    }
    return n;
  }
  function atEndEngineering(){
    let n=0;
    for(const marker of document.querySelectorAll('.step-marker[id^="etapa-"]')){
      // Na versão revista de Engenharia, o botão já vem no rodapé do HTML.
      // Contá-lo como válido sem duplicar nem mover o controle novamente.
      const present=document.querySelector('.ce-end-reading .read-btn[data-read="'+marker.id+'"]');
      if(present){n++;continue;}
      const button=marker.querySelector('.read-btn[data-read]'),parent=marker.parentElement;
      if(!button||!parent)continue;
      const footer=labelFooter(marker.id);
      footer.append(button);
      let cursor=marker.nextElementSibling,stop=null;
      while(cursor){
        const another=cursor.matches('.step-marker')||!!cursor.querySelector('.step-marker');
        // Navegação Anterior/Próxima fica DEPOIS da marcação individual.
        const nav=cursor.matches('nav')&&(cursor.querySelector('[data-next-step]')||cursor.querySelector('.step-next'));
        if(another||nav){stop=cursor;break;}
        cursor=cursor.nextElementSibling;
      }
      if(stop)parent.insertBefore(footer,stop);else parent.append(footer);
      n++;
    }
    return n;
  }
  function atEndPortuguese(){
    let n=0;
    for(const article of document.querySelectorAll('article.subsection[id^="pt19-"]')){
      const control=article.querySelector('.subhead .read-control');
      if(!control)continue;
      const footer=labelFooter(article.id);
      footer.append(control);
      article.append(footer);
      n++;
    }
    return n;
  }
  function init(){
    let moved=0,expected=0;
    if(document.querySelector('[data-step-toolbar]')){expected=71;moved=atEndRlm();}
    else if(document.querySelector('.step-marker[id^="etapa-"]')){expected=37;moved=atEndEngineering();}
    else if(document.querySelector('article.subsection[id^="pt19-"]')){expected=21;moved=atEndPortuguese();}
    if(expected&&moved!==expected)console.warn('Concurso: controles Lido ao final:',moved,'de',expected);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
