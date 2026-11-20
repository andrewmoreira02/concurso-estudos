/* Navegação móvel contextual sem presumir Lido.
 * Usa somente perfil Chromium descartável e armazenamento sintético. */
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const binary=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!binary)throw Error('Chromium não encontrado');
const browser=await chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--allow-file-access-from-files','--disable-dev-shm-usage']});
const plans=[
 {p:'aulas/rlm.html',selector:'[data-lesson-step]',id:'m1-s1',next:'m1-s2'},
 {p:'aulas/engenharia-qualidade.html',selector:'.step-marker[id^="etapa-"]',id:'etapa-1-1',next:'etapa-1-2'},
 {p:'aulas/portugues-casan-19-11.html',selector:'article.subsection',id:'pt19-1-1',next:'pt19-1-2'},
 {p:'aulas/banco-dados.html',selector:'article.nl-section',id:'bd-1-1',next:'bd-1-2'},
 {p:'aulas/seguranca.html',selector:'article.nl-section',id:'seg-1-1',next:'seg-1-2'},
 {p:'aulas/algoritmos-oo.html',selector:'article.nl-section',id:'alg-1-1',next:'alg-1-2'},
 {p:'aulas/administracao-publica-ima.html',selector:'article.nl-section',id:'adm-1-1',next:'adm-1-2'},
 {p:'aulas/legislacao-ambiental-ima.html',selector:'article.nl-section',id:'la-1-1',next:'la-1-2'}
];
try{
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  for(const x of plans){
   const errors=[];const handler=e=>errors.push(e.message);page.on('pageerror',handler);
   await page.goto(pathToFileURL(resolve(x.p)).href,{waitUntil:'domcontentloaded'});
   await page.locator('.ce-reader-bottom').waitFor({timeout:10000});
   const state=await page.evaluate(id=>({
     barVisible:getComputedStyle(document.querySelector('.ce-reader-bottom')).display!=='none',
     groupCount:document.querySelectorAll('.ce-module-collapse').length,
     left:document.documentElement.scrollWidth,
     firstLink:document.querySelector('.ce-reader-bottom a')?.textContent,
     nextLink:document.querySelector('.ce-reader-bottom a:last-of-type')?.textContent,
     headingFound:!!document.getElementById(id)
   }),x.id);
   assert(state.barVisible&&state.headingFound,x.p+' barra de leitura não visível');
   assert(state.groupCount>=2,x.p+' índice de módulos não recolhível');
   assert(state.left<=width+3,x.p+' barra provoca rolagem horizontal '+state.left);
   assert(state.firstLink.includes('Anterior')&&state.nextLink.includes('Próxima'),x.p+' navegação inválida');
   assert.equal(errors.length,0,x.p+' JS: '+errors.join(' | '));
   console.log('OK '+width+'px '+x.p+' índice agrupado e barra móvel');
   page.off('pageerror',handler);
  }
  await ctx.close();
 }
}finally{await browser.close();}
console.log('SUCESSO: navegação acessível por módulos e anterior/próxima nas oito aulas, três tamanhos.');
