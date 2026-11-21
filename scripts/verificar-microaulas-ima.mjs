/* Verificação fim-a-fim da nova trilha IMA com navegador descartável.
 * Confirma 1 seção, Lido reversível, questões no mesmo assunto,
 * correção/sessão IMA ao enviar e link para o próximo texto. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium indisponível');
const units=JSON.parse(readFileSync('dados/microaulas-ima.json','utf8')).units;
const bank=JSON.parse(readFileSync('dados/questoes-ima-micro.json','utf8'));
assert.equal(units.length,25);
assert.equal(bank.questions.length,64);
assert.equal(units.reduce((n,u)=>n+u.question_ids.length,0),78);
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files']});
const context=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const file=(path)=>pathToFileURL(resolve(path)).href;
try{
 const first=units[0];
 await page.goto(file('aulas/microaula-ima.html')+'?u='+first.id,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#microRoot article.nl-section').length===1,{timeout:15000});
 const rendered=await page.evaluate(()=>({
   article:document.querySelector('#microRoot article.nl-section')?.id,
   inputs:[...document.querySelectorAll('#microRoot input[data-ce-read]')].map(x=>x.dataset.ceRead),
   width:document.documentElement.scrollWidth
 }));
 assert.equal(rendered.article,first.source.section);
 assert.deepEqual(rendered.inputs,[first.source.section]);
 assert(rendered.width<=393,'Microaula transborda 390px: '+rendered.width);
 const check=page.locator('#microRoot input[data-ce-read]');
 await check.check();
 assert(await page.evaluate(id=>JSON.parse(localStorage.getItem('ce_lesson_read_v1:algoritmos-oo')).read.includes(id),first.source.section));
 assert.equal(await page.locator('#microNext').isVisible(),true,'Questões não foram sugeridas após Lido');
 await check.uncheck();
 assert.equal(await page.locator('#microNext').isVisible(),false,'Lido não pode ser irreversível');
 await page.locator('#microMarkGo').click();
 await page.waitForURL(/questoes-micro-ima\.html\?u=ima-alg-1-1/,{timeout:15000});
 await page.waitForFunction(()=>document.querySelectorAll('[data-ce-practice="ima-micro"] fieldset[data-ce-question]').length===3,{timeout:15000});
 assert.equal(await page.locator('[data-ce-practice="ima-micro"] form').getAttribute('data-exam'),'ima');
 const q=await page.locator('[data-ce-practice="ima-micro"] fieldset[data-ce-question]').count();
 assert.equal(q,3);
 const quizWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert(quizWidth<=393,'Quiz transborda 390px: '+quizWidth);
 await page.evaluate(()=>{
  for(const field of document.querySelectorAll('[data-ce-practice="ima-micro"] [data-ce-question]')){
   field.querySelector('input[type="radio"][value="'+field.dataset.correct+'"]').checked=true;
  }
 });
 await page.locator('[data-ce-practice="ima-micro"] form button[type="submit"]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length>0,{timeout:8000});
 const logs=await page.evaluate(()=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]'));
 assert.equal(logs.length,1);assert.equal(logs[0].exam,'ima');assert.equal(logs[0].valid,3);assert.equal(logs[0].correct,3);
 await page.waitForFunction(()=>document.querySelector('#imaNextLink')?.getAttribute('href')?.includes('u=ima-alg-2-1'),{timeout:5000});
 assert.deepEqual(errors,[],'Erros JS: '+errors.join(' | '));
 console.log('SUCESSO: microaula IMA única, Lido reversível, questões específicas, 3/3 enviado, próximo texto e layout mobile.');
}finally{await context.close();await browser.close();}
