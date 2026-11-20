// Teste sintético da recomendação automática, sem acessar Supabase real ou dados pessoais.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve,sep,extname } from 'node:path';

const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium não encontrado');
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
   const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=resolve(root,'.'+path);
   if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
   const data=await readFile(file);
   res.writeHead(200,{'Content-Type':extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':extname(file)==='.json'?'application/json':'text/html'});
   res.end(data);
 }catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:780},isMobile:true,hasTouch:true});
const page=await context.newPage();
let failed=false;
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await context.addInitScript(()=>{
  const NativeDate=window.Date;
  class TestDate extends NativeDate{
    constructor(...args){if(args.length)super(...args);else super('2026-11-20T14:00:00.000Z');}
    static now(){return new NativeDate('2026-11-20T14:00:00.000Z').getTime();}
  }
  window.Date=TestDate;
  const original=window.setInterval.bind(window);
  window.__adaptiveIntervals=[];
  window.setInterval=(fn,ms,...args)=>{window.__adaptiveIntervals.push(ms);return original(fn,ms,...args);};
  if(localStorage.getItem('__adaptive_seeded__')!=='1'){
    const rlm=[];
    for(const [module,count] of [4,7,9,6,3,7,5].entries()){
       const num=module+1;
       for(let n=1;n<=count;n++)rlm.push('m'+num+'-s'+n);
    }
    localStorage.setItem('concursos_rlm_sections_read_v3',JSON.stringify({format:'concursos-rlm-leitura',version:3,readSections:rlm}));
    localStorage.setItem('__adaptive_seeded__','1');
  }
});
function assert(ok,msg){if(!ok)throw Error(msg);}
async function loaded(expectPanel=false){
 if(expectPanel)await page.locator('#adaptiveRecommendations').waitFor({timeout:16000});
 await page.waitForFunction(()=>window.ConcursoAdaptive?.model()?.lessons?.length===8,{timeout:15000});
}
try{
 await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await loaded();
 let data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(data.exam==='casan','A prioridade de CASAN 20/11 não foi aplicada');
 assert(Math.abs(data.unreadEquivalents-(8-41/71))<0.01,'Aulas equivalentes não lidas incorretas');
 assert(data.minEquivalents===5,'Meta de 5 aulas equivalentes ausente');
 assert(data.lessons.find(l=>l.id==='administracao-publica-ima')?.total===9,'Administração IMA não está no modelo adaptativo');
 assert(data.lessons.find(l=>l.id==='legislacao-ambiental-ima')?.total===9,'Legislação IMA não foi incluída na fila');
 assert(data.lessons.find(l=>l.id==='administracao-publica-ima')?.weight===0,'Administração IMA não deve competir na prioridade CASAN');
 assert(data.lessons.find(l=>l.id==='legislacao-ambiental-ima')?.weight===0,'Legislação IMA não deve competir na prioridade CASAN');
 assert(data.lessons.find(l=>l.id==='rlm').read===41,'Progresso 41/71 incorreto');
 assert(data.lessons.find(l=>l.id==='rlm').first.id==='m8-s1','Próxima seção de RLM deveria ser 8.1');
 assert(data.picks[0].title.startsWith('Engenharia'),'Edital TI 25/50 deveria priorizar Engenharia');
 assert(data.picks[0].description.includes('25/50'),'Justificativa deve usar peso oficial do edital');
 assert(!JSON.stringify(data).includes('"studied":true'),'Não inferir Estudado de Lido');
 assert(await page.locator('#adaptiveRecommendations').count()===0,'Página inicial não deve mostrar caixa redundante Sugestões locais');
 assert((await page.locator('#dynamicFocus').innerText()).includes('Engenharia'),'Próximo foco do painel não foi atualizado');
 assert((await page.locator('#dynamicFocusLink').getAttribute('href')).includes('engenharia-qualidade.html'),'Link do foco no painel não foi atualizado');
 assert(!(await page.evaluate(()=>window.__adaptiveIntervals.includes(3600000))),'A manutenção editorial horária pertence à tarefa do GPT, não ao navegador');
 assert(await page.locator('#adaptiveRecommendations').count()===0,'Bloco redundante continua na página inicial');
 const width=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert(width<=390+2,'Painel adaptativo não é responsivo');
 console.log('OK: painel, pesos do edital, atualização local e 41/71 RLM.');
 
 await page.goto(base+'/planejamento.html',{waitUntil:'domcontentloaded'});
 await loaded();
 assert(await page.locator('#adaptiveRecommendations').count()===0,'Planejamento não deve exibir sugestões locais redundantes');
 await page.waitForFunction(()=>document.getElementById('nextLessonLink')?.href.includes('engenharia-qualidade'),{timeout:15000});
 assert((await page.locator('#nextLessonLink').getAttribute('href')).includes('engenharia-qualidade.html'),'Plano não mudou link para sugestão adaptativa');
 const planned=await page.evaluate(()=>localStorage.getItem('ce_plan_done_v1'));
 assert(planned===null,'Recomendação marcou atividade como executada');
 console.log('OK: planejamento adaptado, sem marcar atividades realizadas.');

 // Regressão: começar Engenharia não deve trocar automaticamente para Banco de Dados zerado.
 await page.evaluate(()=>{
   localStorage.setItem('concurso_eng_qualidade_steps_v1',JSON.stringify(['1.1','1.2','1.3']));
   dispatchEvent(new CustomEvent('concurso:progress-change'));
 });
 await page.waitForFunction(()=>window.ConcursoAdaptive.model()?.lessons.find(l=>l.id==='engenharia')?.read===3 && document.getElementById('nextLessonLink')?.href.includes('#etapa-1-4'),{timeout:15000});
 data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(data.picks[0].href.includes('engenharia-qualidade.html#etapa-1-4'),'Engenharia parcialmente lida perdeu prioridade para aula zerada');
 assert(data.lessons.find(l=>l.id==='engenharia').inProgress===true,'Aula iniciada não foi identificada');
 assert(data.picks.find(p=>p.href.includes('banco-dados.html'))?.href !== data.picks[0].href,'Banco de Dados zerado não deve substituir Engenharia em curso');
 await page.goto(base+'/aulas.html',{waitUntil:'domcontentloaded'});
 await loaded();
 assert((await page.locator('#lessonCatalog .catalog-card').first().getAttribute('data-lesson-id'))==='engenharia','Catálogo não preservou Engenharia como aula prioritária');
 assert((await page.locator('#catalogEngContinue').getAttribute('href')).includes('#etapa-1-4'),'Link de retomada perdeu etapa 1.4');
 // Aula integralmente lida sai da fila, sem alterar ou apagar o histórico de avaliações.
 await page.evaluate(()=>{
   const counts=[5,6,4,5,3,3,2,3,3,3],full=[];
   counts.forEach((n,m)=>{for(let step=1;step<=n;step++)full.push((m+1)+'.'+step);});
   localStorage.setItem('concurso_eng_qualidade_steps_v1',JSON.stringify(full));
   dispatchEvent(new CustomEvent('concurso:progress-change'));
 });
 await page.waitForFunction(()=>window.ConcursoAdaptive.model()?.lessons.find(l=>l.id==='engenharia')?.first===null,{timeout:15000});
 data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(!data.picks.some(p=>p.type==='lesson'&&p.href.includes('engenharia-qualidade.html')),'Aula 100% Lido deve sair da fila de leitura');
 await page.evaluate(()=>{
   localStorage.setItem('concurso_eng_qualidade_steps_v1',JSON.stringify(['1.1','1.2','1.3']));
   dispatchEvent(new CustomEvent('concurso:progress-change'));
 });
 await page.waitForFunction(()=>window.ConcursoAdaptive.model()?.lessons.find(l=>l.id==='engenharia')?.read===3,{timeout:15000});
 assert((await page.locator('#catalogEngContinue').getAttribute('href')).includes('#etapa-1-4'),'Retomada perdeu marcações existentes');
 console.log('OK: Engenharia 3/37 continua recomendada; 37/37 sai da fila; retomada preservada no catálogo e plano.');

 // O conteúdo da aula não apresenta o painel de sugestões: ele pertence ao painel e ao plano.
 await page.goto(base+'/aulas/rlm.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!document.querySelector('#ferramentas-da-aula'),{timeout:15000});
 assert(await page.locator('#adaptiveRecommendations').count()===0,'Painel local indevido dentro da aula RLM');
 const mark=page.locator('[data-step-read="m8-s1"]');
 await mark.click({force:true});
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('concursos_rlm_sections_read_v3')||'{}').readSections?.includes('m8-s1'),{timeout:15000});
 await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await loaded();
 data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(data.lessons.find(l=>l.id==='rlm').first.id==='m8-s2','Painel não atualizou próxima seção RLM para 8.2 após o Lido');
 console.log('OK: RLM mantém foco só na aula; painel recalcula para 8.2.');

 // Revisão vencida para CASAN deve prevalecer sem atribuir pontuação ao IMA.
 await page.evaluate(()=>{
  localStorage.setItem('ce_question_logs_v1',JSON.stringify([{id:'session-123456-abc123',exam:'casan',subject:'ti',topic:'Revisar autenticação de APIs',date:'2026-11-18',valid:5,correct:3,annulled:0,kind:'nao-classificado',source:'autoral'}]));
  dispatchEvent(new CustomEvent('concurso:progress-change'));
 });
 await page.waitForFunction(()=>window.ConcursoAdaptive.model().picks[0].type==='review',{timeout:15000});
 data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(data.picks[0].title.includes('autenticação de APIs'),'Revisão por erro não priorizada');
 assert(data.due.length===1,'A revisão +1 gerada deveria estar vencida em 20/11, não +3 e +7');
 console.log('OK: revisão vencida baseada em erro registrado.');

 for(const lesson of ['engenharia-qualidade.html','portugues-casan-19-11.html']){
  await page.goto(base+'/aulas/'+lesson,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!document.querySelector('#ferramentas-da-aula'),{timeout:15000});
  assert(await page.locator('#adaptiveRecommendations').count()===0,lesson+' não deve exibir sugestões locais');
 }
 await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await loaded();
 data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(data.lessons.find(l=>l.id==='engenharia').first.module===1,'Painel perdeu próxima seção de Engenharia');
 assert(data.lessons.find(l=>l.id==='portugues').first.module===1,'Painel perdeu próxima seção de Português');
 // A aba Progresso foi removida sem apagar evidências: URLs antigas redirecionam.
 await page.goto(base+'/progresso.html',{waitUntil:'domcontentloaded'});
 await page.waitForURL('**/aulas.html',{timeout:15000});
 assert((await page.url()).endsWith('/aulas.html'),'O endereço antigo de Progresso não redirecionou para Aulas');
 for(const name of ['index.html','aulas.html','planejamento.html','revisoes.html','conta.html']){
   await page.goto(base+'/'+name,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.readyState==='complete',{timeout:15000});
   assert(await page.locator('.primary-nav a[href="progresso.html"]').count()===0,name+': menu ainda mostra Progresso');
   assert(await page.locator('#adaptiveRecommendations').count()===0,name+': caixa de Sugestões locais ainda está presente');
 }
 await page.goto(base+'/conta.html',{waitUntil:'domcontentloaded'});
 await page.locator('#backup summary').click();
 assert(await page.locator('#exportButton').count()===1,'Backup geral não foi preservado na Sincronização');
 assert(await page.locator('#importButton').count()===1,'Restauração geral não foi preservada na Sincronização');
 console.log('OK: páginas sem Sugestões locais/Progresso, URL antiga redirecionada, backups preservados.');
 assert(errors.length===0,'Erros JS: '+errors.join('; '));
 console.log('SUCESSO: recomendações apenas no painel e plano, aulas sem banner, revisão e mobile, sem dados privados.');
}catch(e){failed=true;console.error(e);}
finally{await context.close();await browser.close();await new Promise(done=>server.close(done));}
if(failed)process.exitCode=1;
