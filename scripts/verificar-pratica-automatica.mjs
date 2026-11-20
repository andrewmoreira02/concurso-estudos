// Teste ponta a ponta: sábado -> correção automática -> sessões por disciplina
// -> fila de revisões -> novo quiz -> revisão marcada por evidência (sem formulário manual).
// Dados exclusivamente sintéticos; nenhuma conta ou chave pessoal.
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {resolve,sep,extname} from 'node:path';
const root=resolve('.');
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium indisponível.');
function assert(ok,text){if(!ok)throw Error(text);}
const data=JSON.parse(await readFile(resolve(root,'dados/concursos.json'),'utf8'));
assert(data.calendar.special['2026-11-21'].some(t=>t.href==='aulas/questoes-casan-21-11.html'), 'Sábado não contém questões no plano');
assert(Object.values(data.calendar.cycles[0].weekdays).filter(a=>a.some(t=>t.id==='ima-questions')).length>=2,'IMA não possui blocos semanais de questões');
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const bytes=await readFile(file);
  const type=extname(file)==='.js'?'text/javascript':extname(file)==='.json'?'application/json':extname(file)==='.css'?'text/css':'text/html';
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:780},isMobile:true,hasTouch:true});
await context.addInitScript(()=>{
 const Original=Date;
 const fixed='2026-11-21T14:00:00.000Z';
 class FixedDate extends Original{
   constructor(...args){super(...(args.length?args:[fixed]));}
   static now(){return new Original(fixed).valueOf();}
 }
 window.Date=FixedDate;
});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function goto(path){await page.goto(base+'/'+path,{waitUntil:'domcontentloaded'});}
async function ready(count){
 await page.waitForFunction(expected=>document.querySelectorAll('form[data-ce-quiz] [data-ce-question]').length===expected,count,{timeout:20000});
}
async function answerQuiz(wrong=0){
 await page.evaluate(count=>{
   const items=[...document.querySelectorAll('form[data-ce-quiz] [data-ce-question]')];
   for(let i=0;i<items.length;i++){
     const correct=items[i].dataset.correct;
     const answer=i<count?[...items[i].querySelectorAll('input[type="radio"]')].find(r=>r.value!==correct)?.value:correct;
     const chosen=items[i].querySelector('input[type="radio"][value="'+answer+'"]');
     chosen.checked=true;
   }
 },wrong);
 await page.locator('form[data-ce-quiz] button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector('form[data-ce-quiz]')?.dataset.ceSubmitted==='true',{timeout:12000});
}
async function inspect(){return await page.evaluate(()=>{
 const logs=JSON.parse(localStorage.getItem('ce_question_logs_v1')||'[]');
 const done=JSON.parse(localStorage.getItem('ce_review_done_v1')||'{}');
 return {logs,done};
});}
let failed=false;
try{
 await goto('aulas/questoes-casan-21-11.html');
 await ready(15);
 let distribution=await page.evaluate(()=>{
   const map={};for(const f of document.querySelectorAll('form[data-ce-quiz] [data-ce-question]'))map[f.dataset.ceSubject]=(map[f.dataset.ceSubject]||0)+1;
   return map;
 });
 assert(distribution.ti===8&&distribution.portugues===3&&distribution.rlm===2&&distribution.legislacao===1&&distribution.atualidades===1,
   'Distribuição da reta final incorreta: '+JSON.stringify(distribution));
 const originalCount=await page.locator('.ce-original-source').count();
 assert(originalCount===13,'O simulado da CASAN deve ter 13 questões adaptadas de fontes reais e 2 autorais, encontrado '+originalCount);
 const urls=await page.locator('.ce-original-source a').evaluateAll(anchors=>anchors.map(a=>a.href));
 assert(urls.every(url=>url.includes('qconcursos.com/prova/arquivo_prova/149463/')&&/#page=\d+$/.test(url)),
   'Questão adaptada sem URL opcional do caderno e página identificada');
 assert(await page.locator('.ce-original-source strong').evaluateAll(nodes=>nodes.every(n=>n.textContent.includes('Instituto AOCP')&&n.textContent.includes('2025'))),'Bloco CASAN contém referências que não são Instituto AOCP 2025');
 assert(await page.locator('input[type="radio"][value="e"]').count()===13,
   'Cada questão adaptada deve exibir cinco alternativas completas A–E');
 const inline=await page.locator('.ce-original-source').evaluateAll(nodes=>nodes.every(n=>{
   const item=n.closest('fieldset');
   const labels=[...item.querySelectorAll('label')];
   const legend=item.querySelector('legend')?.textContent||'';
   return legend.length>70&&!/consulte o caderno.*alternativas/i.test(legend)&&
     labels.length===5&&labels.every(l=>l.textContent.trim().length>=3)&&
     /Adaptaç[ãa]o|Adaptada/i.test(n.textContent)&&n.textContent.includes('opcional');
 }));
 assert(inline,'Questão adaptada sem enunciado, alternativas completas ou consulta opcional à prova');
 console.log('OK: sábado exibe 13 adaptações de itens Instituto AOCP 2025 e 2 autorais.');

 await page.locator('form[data-ce-quiz] button[type="submit"]').click();
 assert((await inspect()).logs.length===0,'Envio incompleto criou resultado inventado');
 await answerQuiz(2);
 let state=await inspect();
 assert(state.logs.length===5,'Simulado misto deveria gerar cinco registros, não '+state.logs.length);
 assert(state.logs.reduce((n,x)=>n+x.valid,0)===15,'Contagem de válidas incorreta');
 assert(state.logs.reduce((n,x)=>n+x.correct,0)===13,'Acertos não correspondem às respostas enviadas');
 assert(state.logs.every(x=>x.exam==='casan'&&x.date==='2026-11-21'),'Data ou concurso do simulado incorreto');
 assert(state.logs.every(x=>Array.isArray(x.questionIds)&&Array.isArray(x.wrongQuestionIds)),'Falta detalhe de erros por questão');
 console.log('OK: sábado, 15 questões, 5 disciplinas, 13/15 efetivamente enviados.');

 await goto('revisoes.html');
 await page.waitForFunction(()=>document.querySelectorAll('#reviewAutoList .ce-auto-review-item').length>=3,{timeout:20000});
 assert(await page.locator('#practiceForm').count()===0,'Página ainda exige cadastro manual de sessão');
 assert(await page.locator('#practiceDate').count()===0,'Página ainda exige data manual');
 const reviewId=await page.locator('[data-review-task]').first().getAttribute('data-review-task');
 assert(/^session-\d+-[a-z0-9]+-\d+$/.test(reviewId),'ID da revisão gerada é inválido');
 await page.locator('[data-review-task]').first().click();
 await page.waitForFunction(()=>document.querySelector('#reviewAutoPractice form[data-ce-quiz] [data-ce-question]')!==null,{timeout:15000});
 await answerQuiz(0);
 state=await inspect();
 assert(state.done[reviewId]===true,'Revisão não marcada após envio real de respostas');
 assert(state.logs.length===6,'Quiz de revisão não gerou novo registro de avaliação');
 assert(state.logs.at(-1).reviewOf===reviewId,'Faltou relação com revisão original');
 await page.waitForFunction(id=>!!document.querySelector('[data-undo-review="'+id+'"]'),reviewId,{timeout:10000});
 page.once('dialog',dialog=>{void dialog.accept();});
 await page.locator('[data-undo-review="'+reviewId+'"]').click();
 state=await inspect();
 assert(state.done[reviewId]===false,'Não foi possível desfazer status da revisão');
 assert(state.logs.length===6,'Desfazer revisão apagou respostas realmente enviadas');
 console.log('OK: revisão gerada, respondida e reversível sem apagar avaliação.');

 await goto('aulas/questoes-ima.html');
 await ready(12);
 assert(await page.locator('.ce-original-source').count()===12,
   'Treino IMA deve usar 12 questões adaptadas de temas da banca FURB.');
 assert(await page.locator('form[data-ce-quiz] fieldset label').count()===60,'Treino IMA deve exibir 12 × 5 alternativas completas');

 await answerQuiz(0);
 state=await inspect();
 assert(state.logs.length===9,'Treino IMA deveria gerar 3 sessões de disciplinas');
 assert(state.logs.slice(-3).every(x=>x.exam==='ima'),'Avaliação do IMA misturada com CASAN');
 console.log('OK: treino futuro IMA, 12 questões e separação de avaliações entre editais.');

 await goto('aulas/banco-dados.html');
 await page.waitForFunction(()=>document.querySelectorAll('form[data-ce-quiz]:not(.ce-cobranca-form) [data-ce-question]').length===3,{timeout:15000});
 await page.evaluate(()=>document.querySelectorAll('form[data-ce-quiz].ce-cobranca-form').forEach(f=>f.removeAttribute('data-ce-quiz')));
 await answerQuiz(1);
 state=await inspect();
 assert(state.logs.length===10&&state.logs.at(-1).topic.includes('Banco de Dados'),'Integração com quiz já publicado falhou');
 assert(state.logs.at(-1).correct===2&&state.logs.at(-1).valid===3,'Quiz antigo registrou escore errado');
 console.log('OK: compatibilidade com quiz de aula publicada.');

 await goto('index.html');
 await page.waitForFunction(()=>window.ConcursoAdaptive?.model()?.picks?.[0]?.type==='quiz',{timeout:20000});
 const link=await page.locator('#dynamicFocusLink').getAttribute('href');
 assert(link.includes('questoes-casan-21-11.html'),'Painel de sábado não destaca questões');
 assert(errors.length===0,'Erros JS: '+errors.join('; '));
 console.log('SUCESSO: planejamento, sábado, IMA, revisão automática e compatibilidade.');
}catch(e){failed=true;console.error(e);}
finally{await context.close();await browser.close();server.closeAllConnections?.();await new Promise(ok=>server.close(ok));}
if(failed)process.exitCode=1;
