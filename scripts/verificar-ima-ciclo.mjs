/* IMA-SC: valida matriz, quizzes específicos e separação de avaliações CASAN.
 * Teste com navegador descartável e dados inventados; nenhum dado pessoal acessado. */
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('.');
const binary=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!binary)throw Error('Chromium não disponível');
const coverage=JSON.parse(await readFile('dados/cobertura-ima.json','utf8'));
assert.equal(coverage.schema,1);
assert.equal(coverage.areas.length,5);
assert.deepEqual(coverage.areas.map(a=>a.questions),[36,6,6,6,6]);
const topics=coverage.areas.flatMap(a=>a.topics);
assert.equal(topics.length,66,'Matriz IMA deve conter 66 conjuntos de itens');
assert.equal(new Set(topics.map(x=>x.id)).size,66);
for(const t of topics){
 assert(['parcial','lacuna','desenvolvido'].includes(t.depth),'Cobertura inválida '+t.id);
 assert(t.title.length>=15&&t.note.length>=25,'Resumo insuficiente '+t.id);
 if(t.depth==='lacuna')assert.equal(t.lessons.length,0,'Lacuna não pode ser rotulada como coberta');
 for(const link of t.lessons){
  const [file,hash]=link.href.split('#');
  assert(file.startsWith('aulas/')&&hash,'Link de tópico inválido '+link.href);
  const html=await readFile(file,'utf8');
  assert(html.includes('id="'+hash+'"'),'Tópico IMA sem âncora válida '+link.href);
 }
}
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':extname(file)==='.js'?'text/javascript':extname(file)==='.json'?'application/json':extname(file)==='.css'?'text/css':'text/html','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/planejamento.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#ce-cobertura-ima tbody tr').length===66,{timeout:16000});
  const report=await page.evaluate(()=>{
   const host=document.getElementById('ce-ima-study-cycle');
   return {sections:document.querySelectorAll('#ce-cobertura-ima tbody tr').length,
    min:document.documentElement.scrollWidth,core:host?.textContent.includes('Núcleo — 120 minutos'),
    optional:host?.textContent.includes('Extensão opcional — +120 minutos'),
    noFake:host?.textContent.includes('Ainda não há avaliações IMA'),
    score:document.querySelector('#ce-ima-diagnostico')?.textContent||'',
    links:document.querySelectorAll('#ce-cobertura-ima a').length};
  });
  assert.equal(report.sections,66,'Matriz não renderizou os 66 tópicos');
  assert(report.core&&report.optional&&report.noFake,'Agenda 2–4h ou diagnóstico não inicializado');
  assert(report.links>10,'Referências do edital e aulas ausentes');
  assert(report.min<=width+3,'Overflow no planejamento IMA '+width+'px: '+report.min);
  // CENÁRIO: existe avaliação CASAN, mas nenhuma avaliação IMA.
  await page.evaluate(()=>{
   localStorage.setItem('ce_question_logs_v1',JSON.stringify([{id:'session-1000-casan1',date:'2026-11-19',exam:'casan',subject:'ti',topic:'Teste CASAN sintético',valid:2,correct:0,wrongQuestionIds:['x','y']}]));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('ce-ima-diagnostico')?.textContent.includes('Ainda não há avaliações IMA'));
  const noCross=await page.locator('#ce-ima-diagnostico').textContent();
  assert(noCross.includes('CASAN')&&!noCross.includes('2/2 questões'),'Contaminação CASAN → IMA');
  await page.goto(base+'/aulas/questoes-ima-especificas.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('form[data-ce-quiz][data-exam="ima"] [data-ce-question]').length===9,{timeout:16000});
  const quest=await page.evaluate(()=>{
   const f=document.querySelector('form[data-ce-quiz]');
   const q=[...f.querySelectorAll('[data-ce-question]')];
   return {n:q.length,subjects:q.reduce((x,y)=>(x[y.dataset.ceSubject]=(x[y.dataset.ceSubject]||0)+1,x),{}),
    opts:q.map(y=>y.querySelectorAll('input[type="radio"]').length),
    labels:q.map(y=>y.querySelector('legend')?.textContent?.length||0),
    source:q.every(y=>y.querySelector('.ce-original-source a[href^="https://"]')),
    beforeLogs:JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length,
    width:document.documentElement.scrollWidth};
  });
  assert.deepEqual(quest.subjects,{ti:1,adm:5,legislacao:3},'Simulado IMA incorretamente distribuído');
  assert(quest.opts.every(n=>n===5)&&quest.labels.every(n=>n>=55)&&quest.source,'Enunciados, opções ou referências não disponíveis');
  assert.equal(quest.beforeLogs,1,'Abriu o treino e gravou avaliação indevida');
  assert(quest.width<=width+3,'Overflow no simulado IMA '+width+'px: '+quest.width);
  await page.locator('form[data-ce-quiz] button[type="submit"]').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]').length),1,'Envio incompleto salvou resultado');
  // Duas respostas erradas, somente uma por área para testar revisão.
  await page.evaluate(()=>{
   const form=document.querySelector('form[data-ce-quiz]');
   for(const [i,q] of [...form.querySelectorAll('[data-ce-question]')].entries()){
    const all=[...q.querySelectorAll('input[type=radio]')];
    const input=i===0||i===6?all.find(v=>v.value!==q.dataset.correct):all.find(v=>v.value===q.dataset.correct);
    input.checked=true;
   }
  });
  await page.locator('form[data-ce-quiz] button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector('form[data-ce-quiz]')?.dataset.ceSubmitted==='true',{timeout:9000});
  const stored=await page.evaluate(()=>({
   logs:JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]'),
   done:JSON.parse(localStorage.getItem('ce_review_done_v1')||'{}')
  }));
  assert.equal(stored.logs.length,4,'Três sessões IMA não foram registradas');
  assert.equal(stored.logs[0].exam,'casan','Sessão CASAN original alterada');
  assert.deepEqual(stored.logs.slice(1).map(x=>x.exam),['ima','ima','ima'],'Mistura de editais');
  assert.deepEqual(stored.logs.slice(1).map(x=>x.valid),[1,5,3],'Totais por disciplina inválidos');
  assert.equal(Object.keys(stored.done).length,0,'Revisão foi marcada sem enviar novo quiz');
  await page.goto(base+'/planejamento.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('ce-ima-diagnostico')?.textContent.includes('questões válidas corretas'),{timeout:16000});
  const next=await page.locator('#ce-ima-diagnostico').textContent();
  assert(next.includes('CASAN separadas')&&next.includes('questões válidas corretas'),'Diagnóstico contaminado ou ausente');
  assert.equal(errors.length,0,'Erros de JavaScript em '+width+'px: '+errors.join(' | '));
  console.log('OK '+width+'px: 66 tópicos, núcleo 2h+2h, 9 adaptações FURB, 3 sessões IMA, CASAN isolada, revisão não antecipada');
  await context.close();
 }
 console.log('SUCESSO: 66 subtópicos IMA, matriz mobile, simulado adicional com avaliação exclusiva e diagnóstico privado.');
}finally{await browser.close();server.close();}
