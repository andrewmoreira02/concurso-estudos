// Teste de regressão visual/funcional mínima em viewport móvel.
// Não acessa dados pessoais: navega apenas em arquivos HTML do checkout.
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const chrome = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!chrome || !existsSync(chrome)) throw new Error('Chromium/Chrome não encontrado no runner');
const browser = await chromium.launch({
  executablePath: chrome, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
});
// Enumeração automática: não deixar páginas recém-publicadas fora da auditoria.
const htmls = [...readdirSync('.', {withFileTypes:true}).filter(v=>v.isFile()&&v.name.endsWith('.html')).map(v=>v.name),
 ...readdirSync('aulas', {withFileTypes:true}).filter(v=>v.isFile()&&v.name.endsWith('.html')).map(v=>'aulas/'+v.name)];
const micros = JSON.parse(readFileSync('dados/microaulas-ima.json','utf8')).units || [];
const pages = [...new Set([
 ...htmls,
 ...micros.flatMap(unit=>[
  'aulas/microaula-ima.html?u='+encodeURIComponent(unit.id),
  'aulas/questoes-micro-ima.html?u='+encodeURIComponent(unit.id)
 ])
])].sort();
const widths=[320,360,390,430,768];
const errors=[];
const results=[];
mkdirSync('artifacts/mobile',{recursive:true});
function blobSha(filename){
 const data=readFileSync(filename);
 return createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
}
function dependencies(filename){
 const src=readFileSync(filename,'utf8');
 const refs=[...src.matchAll(/<(?:link|script)\b[^>]*(?:href|src)=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]);
 const dir=filename.includes('/')?filename.slice(0,filename.lastIndexOf('/')+1):'';
 return [...new Set(refs)].filter(v=>!v.startsWith('http')&&!v.startsWith('//')).map(v=>{
  const resolved=resolve(dir,v);
  return existsSync(resolved)?{file:v,sha:blobSha(resolved)}:{file:v,missing:true};
 });
}
async function inspectOverflow(page){
 return page.evaluate(()=>{
  const max=window.innerWidth;
  const interesting='pre,table,svg,main,article,figure,section,nav,.diagram,.table-scroll,.table-wrap,.tablewrap,.nl-table-wrap,.ce-visual-example,.formula,.code,.flowline,.primary-nav,.catalog-filters';
  const failures=[];
  for(const el of document.querySelectorAll('body *')){
   if(!(el instanceof HTMLElement || el instanceof SVGElement))continue;
   const st=getComputedStyle(el);
   if(st.display==='none'||st.visibility==='hidden'||st.position==='fixed'&&st.opacity==='0')continue;
   const rect=el.getBoundingClientRect();
   if(rect.width<4 || rect.height<4)continue;
   const delta=el.scrollWidth-el.clientWidth;
   const scrollable=/auto|scroll|hidden|clip/.test(st.overflowX);
   if(delta<=3 || (!scrollable && !el.matches(interesting)))continue;
   const clip=el.getAttribute('class')||'';
   if(el.closest('[hidden],[aria-hidden="true"]'))continue;
   // Contêineres sem conteúdo didático e cortes decorativos não são bloqueadores.
   if(!el.matches(interesting) && !el.querySelector('table,svg,pre,code,p,li,button,a,input'))continue;
   const ident=el.id?'#'+el.id:(clip?'.'+String(clip).trim().split(/\s+/).slice(0,2).join('.'):'');
   failures.push({element:el.tagName.toLowerCase()+ident,scrollWidth:el.scrollWidth,
    clientWidth:el.clientWidth,overflowX:st.overflowX,
    excerpt:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,110)});
  }
  return {viewport:max,htmlWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,internals:failures.slice(0,80)};
 });
}
let assertions = 0;
function check(ok, message) { assertions++; if (!ok) errors.push(message); }
try {
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: 780 }, isMobile: true, hasTouch: true,
      deviceScaleFactor: 1,
    });
    for (const file of pages) {
      const [filename,query] = file.split('?');
      const uri = pathToFileURL(resolve(filename));
      if(query)uri.search='?'+query;
      await page.goto(uri.href, {waitUntil: 'domcontentloaded'});
      await page.waitForTimeout(220);
      const dims = await inspectOverflow(page);
      results.push({file,width,htmlSha:blobSha(filename),dependencies:dependencies(filename),...dims});
      for(const bad of dims.internals)errors.push(file+' '+width+'px: overflow interno '+JSON.stringify(bad));
      if(filename==='aulas/legislacao-casan-20-11.html' && (width===320||width===390)){
        await page.locator('#leg-1-1 .ce-visual-example').screenshot({
          path:'artifacts/mobile/legislacao-1-1-'+width+'.png',animations:'disabled'
        });
      }
      check(dims.viewport === width, file + ' viewport inesperado: ' + JSON.stringify(dims));
      check(dims.htmlWidth <= width + 2, file + ' possui rolagem horizontal geral em ' + width + 'px: ' + JSON.stringify(dims));
      check(dims.bodyWidth <= width + 2, file + ' body ultrapassa ' + width + 'px: ' + JSON.stringify(dims));
      if (file === 'aulas/rlm.html') {
        check(await page.locator('[data-lesson-step]').count() === 71, 'RLM perdeu 71 subseções');
        const menu = page.locator('#mobileMenu');
        check(await menu.isVisible(), 'RLM menu não visível em '+width);
        await menu.click();
        check(await menu.getAttribute('aria-expanded') === 'true', 'RLM índice não abriu');
        await page.evaluate(() => document.dispatchEvent(new MouseEvent('click', {bubbles:true})));
        check(await menu.getAttribute('aria-expanded') === 'false', 'RLM índice não fechou ao tocar fora');
      } else if (file === 'aulas/engenharia-qualidade.html') {
        check(await page.locator('.step-marker').count() === 37, 'Engenharia perdeu 37 subseções');
        const select = page.locator('#mobileStepSelect');
        check(await select.isVisible(), 'Índice móvel por etapa não visível');
        check(await select.locator('option').count() === 38, 'Índice móvel por etapa incompleto');
        await select.selectOption('#etapa-1-1');
        check((await page.evaluate(()=>location.hash)) === '#etapa-1-1', 'Índice móvel não navegou');
      } else if (file === 'aulas/portugues-casan-19-11.html') {
        check(await page.locator('.subsection').count() === 21, 'Português perdeu 21 subseções');
        const menu = page.locator('#menu-toggle');
        check(await menu.isVisible(), 'Português índice não visível');
        await menu.click();
        check(await menu.getAttribute('aria-expanded') === 'true', 'Português índice não abriu');
        await page.evaluate(() => document.dispatchEvent(new MouseEvent('click', {bubbles:true})));
        check(await menu.getAttribute('aria-expanded') === 'false', 'Português índice não fechou ao tocar fora');
      } else if (['aulas/banco-dados.html','aulas/seguranca.html','aulas/algoritmos-oo.html','aulas/administracao-publica-ima.html','aulas/legislacao-ambiental-ima.html','aulas/legislacao-casan-20-11.html'].includes(file)) {
        const expected = file.includes('legislacao-casan') ? 15 : 9;
        check(await page.locator('article.nl-section').count() === expected, file+' perdeu subseções');
        check(await page.locator('input[data-ce-read]').count() === expected, file+' perdeu controles Lido');
        check(await page.locator('article.nl-section .nl-end-read input[data-ce-read]').count() === expected, file+' Lido saiu do final');
        check(await page.locator('[data-ce-module-count]').count() === expected/3, file+' contadores por módulo ausentes');
        check(await page.locator('form[data-ce-quiz]').count() === 0,file+' a teoria deve ficar sem quizzes');
        const first=page.locator('input[data-ce-read]').first();
        await first.check();
        check(await first.isChecked(), file+' Lido não marcou');
        await first.uncheck();
        check(!(await first.isChecked()), file+' Lido não desmarcou');
      } else if (file === 'index.html' || file === 'aulas.html') {
        const first = page.locator('.primary-nav a').first();
        const height = await first.evaluate(el => el.getBoundingClientRect().height);
        check(height >= 43, 'Navegação principal com alvo de toque insuficiente');
      }
      console.log((dims.internals.length?'FALHA ':'AUDITADO ')+width+'px '+file+' · internos='+dims.internals.length);
    }
    await page.close();
  }
  writeFileSync('artifacts/auditoria-mobile.json',JSON.stringify({generatedAt:new Date().toISOString(),widths,pages:pages.length,assertions,errors,results},null,2));
  if(errors.length)throw new Error(errors.length+' problemas de responsividade/funcionais; veja artifacts/auditoria-mobile.json. Primeiros: '+errors.slice(0,10).join(' | '));
  console.log('SUCESSO: '+assertions+' verificações e '+results.length+' análises internas em '+pages.length+' páginas/variantes.');
} finally { await browser.close(); }
