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
async function loaded(){
 await page.locator('#adaptiveRecommendations').waitFor({timeout:16000});
 await page.waitForFunction(()=>window.ConcursoAdaptive?.model()?.lessons?.length===3,{timeout:15000});
}
try{
 await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await loaded();
 let data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(data.exam==='casan','A prioridade de CASAN 20/11 não foi aplicada');
 assert(data.lessons.find(l=>l.id==='rlm').read===41,'Progresso 41/71 incorreto');
 assert(data.lessons.find(l=>l.id==='rlm').first.id==='m8-s1','Próxima seção de RLM deveria ser 8.1');
 assert(data.picks[0].title.startsWith('Engenharia'),'Edital TI 25/50 deveria priorizar Engenharia');
 assert(data.picks[0].description.includes('25/50'),'Justificativa deve usar peso oficial do edital');
 assert(!JSON.stringify(data).includes('"studied":true'),'Não inferir Estudado de Lido');
 const text=await page.locator('#adaptiveRecommendations').innerText();
 assert(text.includes('41/71 Lido'),'Painel não apresenta leitura declarada');
 assert(await page.evaluate(()=>window.__adaptiveIntervals.includes(3600000)),'Atualização horária não agendada');
 const width=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert(width<=390+2,'Painel adaptativo não é responsivo');
 console.log('OK: painel, pesos do edital, atualização horária e 41/71 RLM.');
 
 await page.goto(base+'/planejamento.html',{waitUntil:'domcontentloaded'});
 await loaded();
 await page.waitForFunction(()=>document.getElementById('nextLessonLink')?.href.includes('engenharia-qualidade'),{timeout:15000});
 assert((await page.locator('#nextLessonLink').getAttribute('href')).includes('engenharia-qualidade.html'),'Plano não mudou link para sugestão adaptativa');
 const planned=await page.evaluate(()=>localStorage.getItem('ce_plan_done_v1'));
 assert(planned===null,'Recomendação marcou atividade como executada');
 console.log('OK: planejamento adaptado, sem marcar atividades realizadas.');

 await page.goto(base+'/aulas/rlm.html',{waitUntil:'domcontentloaded'});
 await loaded();
 const before=await page.locator('#adaptiveRecommendations').innerText();
 assert(before.includes('Nesta aula: continue na etapa 8.1'),'Aula não recomenda próxima seção RLM 8.1');
 const mark=page.locator('[data-step-read="m8-s1"]');
 await mark.click({force:true});
 await page.waitForFunction(()=>window.ConcursoAdaptive.model().lessons.find(l=>l.id==='rlm').first.id==='m8-s2',{timeout:15000});
 assert((await page.locator('#adaptiveRecommendations').innerText()).includes('Nesta aula: continue na etapa 8.2'),'Aula não reagiu ao Lido imediatamente');
 assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('concursos_rlm_sections_read_v3')).readSections.includes('m8-s1'))),'Marcação local se perdeu');
 console.log('OK: aula reage a novo Lido e recomenda 8.2.');

 // Revisão vencida para a CASAN deve prevalecer sem atribuir pontuação ao IMA.
 await page.evaluate(()=>{
  localStorage.setItem('ce_question_logs_v1',JSON.stringify([{id:'session-123456-abc123',exam:'casan',subject:'ti',topic:'Revisar autenticação de APIs',date:'2026-11-18',valid:5,correct:3,annulled:0,kind:'nao-classificado',source:'autoral'}]));
  dispatchEvent(new CustomEvent('concurso:progress-change'));
 });
 await page.waitForFunction(()=>window.ConcursoAdaptive.model().picks[0].type==='review',{timeout:15000});
 data=await page.evaluate(()=>window.ConcursoAdaptive.model());
 assert(data.picks[0].title.includes('autenticação de APIs'),'Revisão por erro não priorizada');
 assert(data.due.length===1,'A revisão +1 gerada deveria estar vencida em 20/11, não +3 e +7');
 console.log('OK: revisão vencida baseada em erro registrado.');

 await page.goto(base+'/aulas/engenharia-qualidade.html',{waitUntil:'domcontentloaded'});
 await loaded();
 assert((await page.locator('#adaptiveRecommendations').innerText()).includes('Nesta aula: continue na etapa 1.1'),'Engenharia não recomenda próxima seção');
 await page.goto(base+'/aulas/portugues-casan-19-11.html',{waitUntil:'domcontentloaded'});
 await loaded();
 assert((await page.locator('#adaptiveRecommendations').innerText()).includes('Nesta aula: continue na etapa 1.1'),'Português não recomenda próxima seção');
 assert(errors.length===0,'Erros JS: '+errors.join('; '));
 console.log('SUCESSO: motor de recomendações, três aulas, revisão, plano, hora e mobile, sem dados privados.');
}catch(e){failed=true;console.error(e);}
finally{await context.close();await browser.close();await new Promise(done=>server.close(done));}
if(failed)process.exitCode=1;
