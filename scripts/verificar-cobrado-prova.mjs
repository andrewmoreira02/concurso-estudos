/* Regressão da área Cobrado assim na prova, inline na subseção e avaliações explícitas.
 * Rodada em navegador sem qualquer dado pessoal conectado, exclusivamente perfil descartável. */
import {chromium} from 'playwright-core';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium não encontrado');
const dbtext=readFileSync('assets/cobranca-dados.js','utf8');
const json=JSON.parse(dbtext.slice(dbtext.indexOf('window.ConcursoCobrancaData=')+'window.ConcursoCobrancaData='.length).trim().replace(/;$/,''));
const pages=[['rlm.html','rlm'],['portugues-casan-19-11.html','portugues'],['engenharia-qualidade.html','engenharia'],
 ['banco-dados.html','banco-dados'],['seguranca.html','seguranca'],['algoritmos-oo.html','algoritmos-oo'],
 ['administracao-publica-ima.html','administracao-publica-ima'],['legislacao-ambiental-ima.html','legislacao-ambiental-ima']];
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files']});
let count=0;
try{
 for(const width of [320,390,430,1280]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<700,hasTouch:width<700});
  for(const [path,slug] of pages){
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(resolve('aulas/'+path)).href,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('.ce-cobranca-inline').length>0,{timeout:16000});
   await page.waitForTimeout(175);
   const info=await page.evaluate(()=>{
    const panels=[...document.querySelectorAll('.ce-cobranca-inline')];
    return {cards:document.querySelectorAll('.ce-cobranca-card').length,panels:panels.length,
      sources:[...document.querySelectorAll('.ce-cobranca-card')].map(card=>({
       prompt:card.querySelector('.ce-cobranca-prompt')?.textContent,
       opt:card.querySelectorAll('.ce-cobranca-choice input').length,
       origin:card.querySelector('.ce-cobranca-origin')?.textContent,
       links:[...card.querySelectorAll('.ce-cobranca-links a')].map(a=>a.getAttribute('href')),
       correct:card.querySelector('.ce-cobranca-correct')?.textContent,
       explanation:card.querySelector('.ce-cobranca-answer p:not(.ce-cobranca-correct):not(.ce-cobranca-comparison)')?.textContent,
       kind:card.querySelector('.ce-cobranca-kind')?.textContent,
       form:!!card.querySelector('form[data-ce-quiz]'),
       closed:!card.querySelector('.ce-cobranca-answer')?.open
      })),
      groups:panels.map(p=>({id:p.dataset.forSection,items:p.querySelectorAll('.ce-cobranca-item').length,open:p.querySelectorAll('.ce-cobranca-item[open]').length,
       withinArticle:!!p.closest('article.nl-section,article.subsection'),
       beforeRead:(()=>{
        const near=p.closest('article.nl-section,article.subsection');
        const foot=near?.querySelector('.nl-end-read,.ce-end-reading');
        return !foot||Boolean(p.compareDocumentPosition(foot)&Node.DOCUMENT_POSITION_FOLLOWING);
       })()})),
      width:document.documentElement.scrollWidth,
      readings:Object.keys(localStorage).filter(k=>/lido|read|steps/.test(k)).map(k=>k+'='+localStorage.getItem(k)).sort(),
      logs:JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length
    };
   });
   const exp=dbtext&&json.cases[slug].length;
   assert.equal(info.cards,exp,path+' número de exercícios');
   assert(info.panels>=1&&info.panels<=exp,path+' grupos 1 a 5');
   assert(info.width<=width+3,path+' overflow em '+width+'px: '+info.width);
   assert(info.groups.every(x=>x.open===1&&x.items>=1&&x.items<=5&&x.beforeRead),path+' posições ou recolhimento incorretos');
   for(const card of info.sources){
    assert(card.prompt?.length>=45&&card.opt===5&&card.origin?.includes('questão')&&card.kind?.includes('ADAPTADA'),path+' exercício incompleto');
    assert(card.links.length===3&&card.links[0].startsWith('#')&&card.links.slice(1).every(x=>x.startsWith('https://')),path+' fonte ausente');
    assert(/^Resposta da adaptação: [A-E]$/.test(card.correct)&&card.explanation?.length>=75,path+' correção própria ausente');
    assert(card.form&&card.closed,path+' formulário ou solução inicial inválidos');
   }
   const card=page.locator('.ce-cobranca-card').first();
   // Algumas aulas mantêm capítulos de teoria recolhidos; abrir o capítulo
   // antes de simular a resposta, como um estudante faria no navegador.
   await card.evaluate(el=>{for(let a=el.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;});
   // A rolagem suave da aula não pode tornar o clique do robô uma corrida de animações.
   await page.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});
   await card.locator('.ce-cobranca-choice input').first().check({timeout:7000});
   await card.locator('.ce-cobranca-reveal').click();
   const step=await page.evaluate(()=>({
    readings:Object.keys(localStorage).filter(k=>/lido|read|steps/.test(k)).map(k=>k+'='+localStorage.getItem(k)).sort(),
    logs:JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length
   }));
   assert.deepEqual(step.readings,info.readings,path+' conferir alterou Lido');
   assert.equal(step.logs,info.logs,path+' conferir gravou quiz');
   assert(await card.locator('.ce-cobranca-answer').evaluate(x=>x.open),path+' a resolução não foi exibida');
   await card.locator('.ce-cobranca-submit').click();
   const saved=await page.evaluate(()=>({
    readings:Object.keys(localStorage).filter(k=>/lido|read|steps/.test(k)).map(k=>k+'='+localStorage.getItem(k)).sort(),
    logs:JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]'),
   }));
   assert.deepEqual(saved.readings,info.readings,path+' enviar quiz alterou Lido');
   assert.equal(saved.logs.length,step.logs+1,path+' envio explícito não gravou sessão');
   assert.equal(saved.logs.at(-1).subject,slug==='rlm'?'rlm':slug==='portugues'?'portugues':slug==='administracao-publica-ima'?'adm':slug==='legislacao-ambiental-ima'?'legislacao':'ti');
   assert.equal(errors.length,0,path+' erros no navegador: '+errors.join(' | '));
   count++;console.log('OK '+width+'px '+path+' · '+exp+' adaptações inline, conferir sem registro e envio com registro');
   await page.close();
  }
  await context.close();
 }
 console.log('SUCESSO: '+count+' páginas × 4 tamanhos, 37 questões completas, envio somente explícito, Lido intacto.');
}finally{await browser.close();}
