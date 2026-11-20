/* Auditoria mínima de densidade didática para todas as aulas publicadas.
 * Não confunde uma seção com conteúdo apenas por conter o botão Lido.
 * Limiar de vazio é conservador: avisos curtos são registrados para curadoria.
 * Este script não altera leitura nem progresso pessoal. */
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium não encontrado');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files']});
const configs=[
 {file:'aulas/rlm.html',label:'RLM',selector:'h3[data-lesson-step],h4[data-lesson-step]',expected:71},
 {file:'aulas/engenharia-qualidade.html',label:'Engenharia/Qualidade',selector:'.step-marker[id^="etapa-"]',expected:37},
 {file:'aulas/portugues-casan-19-11.html',label:'Português',selector:'article.subsection[id^="pt19-"]',expected:21},
 {file:'aulas/banco-dados.html',label:'Banco de Dados',selector:'article.nl-section',expected:9},
 {file:'aulas/seguranca.html',label:'Segurança',selector:'article.nl-section',expected:9},
 {file:'aulas/algoritmos-oo.html',label:'Algoritmos e OO',selector:'article.nl-section',expected:9},
 {file:'aulas/administracao-publica-ima.html',label:'Administração IMA',selector:'article.nl-section',expected:9},
 {file:'aulas/legislacao-ambiental-ima.html',label:'Legislação IMA',selector:'article.nl-section',expected:9},
 {file:'aulas/legislacao-casan-20-11.html',label:'Legislação CASAN',selector:'article.nl-section',expected:15}
];
let empty=0,shallow=0;
try{
 for(const spec of configs){
   const page=await browser.newPage();
   await page.goto(pathToFileURL(resolve(spec.file)).href,{waitUntil:'domcontentloaded'});
   const values=await page.evaluate(({selector,label})=>{
      const sections=[...document.querySelectorAll(selector)];
      const out=[];
      for(let i=0;i<sections.length;i++){
        const current=sections[i],next=sections[i+1];
        let html='',text='';
        if(label==='Português'||current.matches('article.nl-section')){
          const copy=current.cloneNode(true);
          copy.querySelectorAll('label.read-control,.ce-end-reading,.subhead,.nl-end-read,.nl-next,h3').forEach(n=>n.remove());
          text=copy.textContent||'';html=copy.innerHTML;
        }else{
          const range=document.createRange();
          range.setStartAfter(current);
          if(next)range.setEndBefore(next);
          else{
            const chapter=current.closest('section.chapter,.module,.section-block,.chapter-block')||current.parentElement;
            if(chapter)range.setEndAfter(chapter.lastChild);
            else range.setEndAfter(current.parentElement?.lastChild||current);
          }
          const fragment=range.cloneContents();
          fragment.querySelectorAll?.('.step-toolbar,.ce-end-reading,nav,.step-navigation').forEach(n=>n.remove());
          text=fragment.textContent||'';
          const wrap=document.createElement('div');wrap.append(fragment);html=wrap.innerHTML;
        }
        const clean=text.replace(/\s+/g,' ').replace(/(Marcar|Lido|Próxima|Anterior)/gi,' ').trim();
        const words=clean.split(/\s+/).filter(Boolean).length;
        const hasDiagram=/<(?:svg|table|figure)\b/i.test(html);
        out.push({id:current.id,words,hasDiagram});
      }
      return out;
   },spec);
   if(values.length!==spec.expected)throw Error(spec.label+' número de seções incorreto '+values.length);
   const blanks=values.filter(v=>v.words<35&&!v.hasDiagram),thin=values.filter(v=>v.words<85&&!blanks.includes(v)&&!v.hasDiagram);
   empty+=blanks.length;shallow+=thin.length;
   console.log(spec.label+': '+values.length+' seções; vazias/insuficientes='+blanks.length+'; concisas='+thin.length);
   if(blanks.length)console.log('  CRÍTICO:',blanks.map(v=>v.id+' ('+v.words+' palavras)').join(', '));
   if(thin.length)console.log('  PARA CURADORIA:',thin.map(v=>v.id+' ('+v.words+' palavras)').join(', '));
   await page.close();
 }
 console.log('RESUMO: '+empty+' seções sem teoria suficiente; '+shallow+' concisas para auditoria editorial.');
 if(empty>0)process.exitCode=1;
}finally{await browser.close();}
