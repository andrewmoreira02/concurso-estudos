// Confere DOM real de leitura em posição final e fórmulas de PA/PG.
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium indisponível');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files']});
let count=0;
function check(x,message){count++;if(!x)throw Error(message);}
try{
 for(const test of [
 {path:'aulas/rlm.html',name:'RLM',expected:71,heading:'[data-lesson-step]',first:'m1-s1',selector:'.step-toolbar'},
 {path:'aulas/engenharia-qualidade.html',name:'Engenharia',expected:37,heading:'.step-marker[id^="etapa-"]',first:'etapa-1-1',selector:'.read-btn'},
 {path:'aulas/portugues-casan-19-11.html',name:'Português',expected:21,heading:'article.subsection[id^="pt19-"]',first:'pt19-1-1',selector:'.read-control'},
 {path:'aulas/banco-dados.html',name:'Nova Banco',expected:9,heading:'article.nl-section',first:'bd-1-1',selector:'.nl-end-read'},
 {path:'aulas/seguranca.html',name:'Nova Segurança',expected:9,heading:'article.nl-section',first:'seg-1-1',selector:'.nl-end-read'},
 {path:'aulas/algoritmos-oo.html',name:'Nova Algoritmos',expected:9,heading:'article.nl-section',first:'alg-1-1',selector:'.nl-end-read'},
 {path:'aulas/administracao-publica-ima.html',name:'Nova Administração',expected:9,heading:'article.nl-section',first:'adm-1-1',selector:'.nl-end-read'},
 {path:'aulas/legislacao-ambiental-ima.html',name:'Nova Legislação',expected:9,heading:'article.nl-section',first:'la-1-1',selector:'.nl-end-read'}
 ]){
  const page=await browser.newPage({viewport:{width:390,height:780},isMobile:true,hasTouch:true});
  await page.goto(pathToFileURL(resolve(test.path)).href,{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(({test})=>{
   const sections=[...document.querySelectorAll(test.heading)];
   const errors=[],footers=[...document.querySelectorAll('.ce-end-reading')];
   function comesAfter(a,b){return !!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);}
   sections.forEach((heading,i)=>{
      let footer;
      if(test.name==='RLM')footer=document.querySelector('[data-step-toolbar="'+heading.id+'"]')?.closest('.ce-end-reading');
      else if(test.name==='Engenharia')footer=document.querySelector('[data-read="'+heading.id+'"]')?.closest('.ce-end-reading');
      else if(test.name.startsWith('Nova '))footer=heading.querySelector('.nl-end-read');
      else footer=heading.querySelector('.ce-end-reading');
      if(!footer){errors.push('Falta rodapé em '+heading.id);return;}
      const content=heading.tagName==='ARTICLE'?heading.querySelector('.subhead')||heading:heading;
      if(!comesAfter(content,footer))errors.push('Controle não aparece após conteúdo: '+heading.id);
      if(test.name==='Português'&&footer!==heading.lastElementChild)errors.push('Português Lido não é o último filho: '+heading.id);
      if(test.name.startsWith('Nova ')){
        const nextNav=heading.querySelector('.nl-next');
        if(!nextNav||nextNav.previousElementSibling!==footer)errors.push('Lido não aparece após a teoria antes da navegação: '+heading.id);
        if(!footer.querySelector('input[data-ce-read="'+heading.id+'"]'))errors.push('Lido e seção divergentes: '+heading.id);
      }
      if(test.name==='RLM'){
       const next=sections[i+1];
       if(next&&!comesAfter(footer,next))errors.push('Rodapé invadiu a próxima seção: '+heading.id);
      }
   });
   return {sections:sections.length,footers:test.name.startsWith('Nova ')?document.querySelectorAll('.nl-end-read').length:footers.length,errors,pa:document.querySelectorAll('.ce-formula-card').length,
    paLegend:[...document.querySelectorAll('.ce-formula-card .ce-legend')].map(n=>n.querySelectorAll('dt').length)};
  },{test});
  check(result.sections===test.expected,'Contagem incorreta de seções '+test.name+': '+result.sections);
  check(result.footers===test.expected,'Contagem incorreta de rodapés '+test.name+': '+result.footers);
  check(!result.errors.length,'Posicionamento inválido '+test.name+': '+result.errors.join('; '));
  if(test.name==='RLM'){
    check(result.pa>=6,'RLM precisa de quadros de PA/PG no módulo 9 e revisão 11');
    check(result.paLegend.every(n=>n>=4),'Toda fórmula PA/PG deve ter legenda com variáveis');
  }
  const box=page.locator(test.name.startsWith('Nova ')?'.nl-end-read':'.ce-end-reading').first();
  check(await box.isVisible(),'Lido ao final não está visível: '+test.name);
  console.log('OK '+test.name+': '+result.footers+' controles Lido ao final da subseção');
  await page.close();
 }
 console.log('SUCESSO: '+count+' asserções sobre 156 controles e fórmulas em quadros.');
}finally{await browser.close();}
