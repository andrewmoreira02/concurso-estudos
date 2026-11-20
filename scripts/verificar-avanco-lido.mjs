// Teste de navegação: Próxima marca Lido por padrão em todas as 8 aulas.
// Reversão manual continua disponível. Dados sintéticos locais; sem Supabase real.
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {resolve,sep,extname} from 'node:path';
const root=resolve('.');
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium indisponível');
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1'),file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':extname(file)==='.json'?'application/json':'text/html','Cache-Control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
let failed=false;
async function one(path,kind){
 const ctx=await browser.newContext({viewport:{width:390,height:780},isMobile:true,hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'/'+path,{waitUntil:'domcontentloaded'});
 const check=(value,message)=>{if(!value)throw Error(path+': '+message);};
 try{
  if(kind==='eng'){
   await page.locator('#markOnNext').waitFor({state:'attached'});
   check(await page.locator('#markOnNext').isChecked(),'A opção Próxima → Lido deve começar ligada');
   const forward=page.locator('a[data-next-step="etapa-1-1"]');
   await forward.click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('concurso_eng_qualidade_steps_v1')||'[]').includes('1.1'));
   check((await page.locator('[data-read="etapa-1-1"]').getAttribute('aria-pressed'))==='true','etapa de origem não ficou Lido');
   check((await page.locator('[data-read="etapa-1-2"]').getAttribute('aria-pressed'))==='false','destino foi marcado indevidamente');
   await page.locator('[data-read="etapa-1-1"]').click();
   check(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('concurso_eng_qualidade_steps_v1')||'[]').includes('1.1'))),'desmarcar não reverteu');
  }else if(kind==='rlm'){
   await page.locator('#markOnNext').waitFor({state:'attached'});
   check(await page.locator('#markOnNext').isChecked(),'Preferência de avanço deve iniciar ligada');
   await page.locator('[data-next-of="m1-s1"]').click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('concursos_rlm_sections_read_v3')||'{}').readSections?.includes('m1-s1'));
   check((await page.locator('[data-step-read="m1-s1"]').getAttribute('aria-pressed'))==='true','RLM não marcou origem');
   check((await page.locator('[data-step-read="m1-s2"]').getAttribute('aria-pressed'))==='false','RLM marcou destino');
   await page.locator('[data-step-read="m1-s1"]').click();
   check(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('concursos_rlm_sections_read_v3')||'{}').readSections.includes('m1-s1'))),'RLM não desmarcou');
  }else if(kind==='pt'){
   await page.locator('#auto-mark').waitFor({state:'attached'});
   check(await page.locator('#auto-mark').isChecked(),'Português deve iniciar com marcação por Próxima');
   await page.locator('#next-section').click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('concursos:casan2026:portugues:2026-11-19:subsections:v1')||'{}').read?.['pt19-1-1']===true);
   check((await page.locator('#pt19-1-1 input.mark-sub').isChecked()),'Português não marcou origem');
   check(!(await page.locator('#pt19-1-2 input.mark-sub').isChecked()),'Português marcou destino');
   await page.locator('#pt19-1-1 input.mark-sub').uncheck();
   check((await page.evaluate(()=>JSON.parse(localStorage.getItem('concursos:casan2026:portugues:2026-11-19:subsections:v1')).read['pt19-1-1']))===false,'Português não desmarcou');
  }else{
   await page.locator('.ce-step-next').first().waitFor({timeout:15000});
   const section=page.locator('article.nl-section').first();
   const first=await section.getAttribute('id');
   const second=await page.locator('article.nl-section').nth(1).getAttribute('id');
   const pref=page.locator('#ce-next-reading-preference input');
   check(await pref.count()===1,'Preferência de avanço deve estar nas ferramentas finais');
   check(await pref.isChecked(),'Avanço deve começar ligado');
   check(await page.locator('.ce-step-next').count()===9,'Cada uma das 9 subseções deve ter navegação');
   await section.locator('a.ce-step-next').click();
   await page.waitForFunction(slug=>{
     const key='ce_lesson_read_v1:'+slug,doc=JSON.parse(localStorage.getItem(key)||'{}');
     return doc.read?.includes(document.body.querySelector('article.nl-section').id);
   },kind,{timeout:15000});
   check(await page.locator('#'+first+' input[data-ce-read]').isChecked(),'A seção de origem não foi marcada');
   check(!(await page.locator('#'+second+' input[data-ce-read]').isChecked()),'A seção de destino foi marcada');
   await page.locator('#'+first+' input[data-ce-read]').uncheck();
   const remained=await page.evaluate(slug=>JSON.parse(localStorage.getItem('ce_lesson_read_v1:'+slug)||'{}').read||[],kind);
   check(!remained.includes(first),'Desmarcar não reverteu na nova aula');
   await page.locator('#ferramentas-da-aula > summary').click();
   await pref.uncheck();
   const countBefore=await page.evaluate(slug=>JSON.parse(localStorage.getItem('ce_lesson_read_v1:'+slug)||'{}').read?.length||0,kind);
   await page.locator('#'+second+' a.ce-step-next').click();
   const countAfter=await page.evaluate(slug=>JSON.parse(localStorage.getItem('ce_lesson_read_v1:'+slug)||'{}').read?.length||0,kind);
   check(countAfter===countBefore,'Opção manual de desligar avanço foi ignorada');
  }
  check(errors.length===0,'Erros JavaScript: '+errors.join(' | '));
  console.log('OK '+path+' · avança, marca origem e permite reversão.');
 }finally{await ctx.close();}
}
try{
 await one('aulas/engenharia-qualidade.html','eng');
 await one('aulas/rlm.html','rlm');
 await one('aulas/portugues-casan-19-11.html','pt');
 for(const slug of ['banco-dados','seguranca','algoritmos-oo','administracao-publica-ima','legislacao-ambiental-ima'])await one('aulas/'+slug+'.html',slug);
 console.log('SUCESSO: oito aulas com Próxima => Lido e sem progresso presumido ao abrir.');
}catch(e){failed=true;console.error(e);}
finally{await browser.close();server.closeAllConnections?.();await new Promise(done=>server.close(done));}
if(failed)process.exitCode=1;
