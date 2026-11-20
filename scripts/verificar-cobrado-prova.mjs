/* QA no Chromium: bancos separados exibem só a faixa solicitada.
 * Logs sintéticos em navegador descartável; não acessa Supabase nem dados pessoais. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium indisponível');
const sets=JSON.parse(readFileSync('dados/blocos-questoes-casan.json','utf8')).sets;
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files']});
let count=0;
try{
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true});
  for(const s of sets){
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const url=pathToFileURL(resolve(s.href)).href+'?de=1&ate=3';
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('[data-ce-practice="topic"] [data-ce-question]').length===3,{timeout:15000});
   const details=await page.evaluate(()=>({
    ids:[...document.querySelectorAll('[data-ce-practice="topic"] [data-ce-question]')].map(el=>el.dataset.ceQuestion),
    title:document.title,
    width:document.documentElement.scrollWidth,
    forms:document.querySelectorAll('[data-ce-practice="topic"] [data-ce-quiz]').length,
    exam:document.querySelector('[data-ce-practice="topic"] form')?.dataset.exam,
    opt:[...document.querySelectorAll('[data-ce-practice="topic"] [data-ce-question]')].map(el=>el.querySelectorAll('input[type="radio"]').length),
    reading:Object.keys(localStorage).filter(k=>/read|lido/.test(k)).sort(),
    logs:JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length
   }));
   assert.deepEqual(details.ids,s.question_ids.slice(0,3),s.id+' não isolou questões 1–3');
   assert.equal(details.forms,1,s.id+' formulário duplicado');
   assert.equal(details.exam,'casan',s.id+' editou outra prova');
   assert(details.opt.every(n=>n>=4&&n<=5),s.id+' alternativas faltando');
   assert(details.width<=width+3,s.id+' overflow mobile '+width+'px: '+details.width);
   assert.equal(errors.length,0,s.id+' erro JS: '+errors.join(' | '));
   const form=page.locator('[data-ce-practice="topic"] form[data-ce-quiz]');
   await form.locator('button[type="submit"]').click();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length),details.logs,
    s.id+' envio incompleto criou sessão');
   const items=form.locator('[data-ce-question]');
   for(let i=0;i<3;i++){
    const field=items.nth(i);
    const correct=await field.getAttribute('data-correct');
    await field.locator('input[type="radio"][value="'+correct+'"]').check({force:true});
   }
   await form.locator('button[type="submit"]').click();
   await page.waitForFunction(n=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length>n,details.logs,{timeout:5000});
   const after=await page.evaluate(()=>({
    logs:JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]'),
    reading:Object.keys(localStorage).filter(k=>/read|lido/.test(k)).sort()
   }));
   assert.deepEqual(after.reading,details.reading,s.id+' questões alteraram estado de leitura');
   assert(after.logs.length===details.logs+1,s.id+' envio deveria gravar uma sessão');
   assert(after.logs.at(-1).exam==='casan'&&after.logs.at(-1).valid===3&&after.logs.at(-1).correct===3,
    s.id+' correção/registro incorretos');
   count++;
   console.log('OK '+width+'px '+s.id+' · só 1–3 e correção após envio');
   await page.close();
  }
  await context.close();
 }
 // Recusar faixa fora dos limites, jamais exibir todas as questões como fallback.
 const bad=await browser.newPage();
 const url=pathToFileURL(resolve(sets[0].href)).href+'?de=40&ate=50';
 await bad.goto(url,{waitUntil:'domcontentloaded'});
 await bad.waitForFunction(()=>document.querySelector('[data-ce-practice="topic"]')?.textContent?.includes('Faixa de questões inválida'),{timeout:15000});
 assert.equal(await bad.locator('[data-ce-practice="topic"] [data-ce-question]').count(),0,
  'Faixa inválida não pode exibir questões não solicitadas');
 await bad.close();
 console.log('SUCESSO: '+count+' blocos mobile isolados, faixas exatas, alternativas, envio e Lido preservado.');
}finally{await browser.close();}
