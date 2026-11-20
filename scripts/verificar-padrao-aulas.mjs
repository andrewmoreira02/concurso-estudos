// Valida interface editorial única — oito aulas, sem dados privados.
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const binary=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!binary)throw Error('Chromium não encontrado');
const browser=await chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--allow-file-access-from-files','--disable-dev-shm-usage']});
const lessons=[
 {p:'aulas/rlm.html',n:71,type:'rlm',backup:'exportProgress',read:'[data-step-read="m8-s1"]'},
 {p:'aulas/engenharia-qualidade.html',n:37,type:'eng',backup:'exportBackup',read:'.read-btn[data-read="etapa-1-1"]'},
 {p:'aulas/portugues-casan-19-11.html',n:21,type:'pt',backup:'export-json',read:'.mark-sub'},
 {p:'aulas/banco-dados.html',n:9,type:'new',backup:'nl-export',read:'input[data-ce-read]'},
 {p:'aulas/seguranca.html',n:9,type:'new',backup:'nl-export',read:'input[data-ce-read]'},
 {p:'aulas/algoritmos-oo.html',n:9,type:'new',backup:'nl-export',read:'input[data-ce-read]'},
 {p:'aulas/administracao-publica-ima.html',n:9,type:'new',backup:'nl-export',read:'input[data-ce-read]'},
 {p:'aulas/legislacao-ambiental-ima.html',n:9,type:'new',backup:'nl-export',read:'input[data-ce-read]'}
];
let count=0;
function check(ok,desc){count++;if(!ok)throw Error(desc);}
try{
 for(const width of [320,390,430,1280]){
  const context=await browser.newContext({viewport:{width,height:820},isMobile:width<700,hasTouch:width<700});
  const page=await context.newPage();
  for(const lesson of lessons){
   const errors=[];
   const listener=e=>errors.push(e.message);
   page.on('pageerror',listener);
   await page.goto(pathToFileURL(resolve(lesson.p)).href,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!document.querySelector('#ferramentas-da-aula'),{timeout:10000});
   const info=await page.evaluate(type=>{
     const panel=document.querySelector('#adaptiveRecommendations');
     const admin=document.querySelector('#ferramentas-da-aula');
     const main=document.querySelector('main');
     const hero=main?.querySelector('.hero,.nl-hero');
     const header=document.querySelector('.topbar,.masthead,.nl-header,.ce-standard-header');
     const count=type==='rlm'?document.querySelectorAll('[data-lesson-step]').length:
       type==='eng'?document.querySelectorAll('.step-marker').length:
       type==='pt'?document.querySelectorAll('article.subsection').length:
       document.querySelectorAll('article.nl-section').length;
     const height=header?.getBoundingClientRect().height;
     const s=getComputedStyle(document.body);
     const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
     return {count,admin:!!admin,adminOpen:admin?.open,panel:!!panel,
        hasHeader:!!header,hasIndex:!!document.querySelector('#sidebar,.nl-sidebar,aside.sidebar'),
        hasHero:!!hero,heroImage:hero?getComputedStyle(hero).backgroundImage:'',
        dark:s.backgroundColor,overflow,height,
        visibleText:document.body.innerText.includes('Sugestões locais')||document.body.innerText.includes('Registro de leitura (não é avaliação)')
     };
   },lesson.type);
   check(info.count===lesson.n,lesson.p+': subseções perdidas: '+info.count);
   check(info.admin&&!info.adminOpen,lesson.p+': ferramentas não recolhidas');
   check(!info.panel&&!info.visibleText,lesson.p+': painel interno/administrativo ainda visível');
   check(info.hasHeader&&info.hasIndex&&info.hasHero,lesson.p+': falta topo, índice ou hero');
   check(info.heroImage.includes('gradient'),lesson.p+': hero não segue identidade comum');
   check(info.overflow<=width+3,lesson.p+': rolagem horizontal ('+width+'px), conteúdo tem '+info.overflow);
   const backup=page.locator('#'+lesson.backup);
   check(await backup.count()===1,lesson.p+': botão de backup foi perdido');
   check(!(await backup.isVisible()),lesson.p+': backup deve estar dentro da área recolhida');
   await page.locator('#ferramentas-da-aula summary').click();
   check(await backup.isVisible(),lesson.p+': backup não é acessível ao expandir ferramentas');
   await page.locator('#ferramentas-da-aula summary').click();
   check(!(await backup.isVisible()),lesson.p+': não foi possível recolher ferramentas');
   check(errors.length===0,lesson.p+': erro JavaScript '+errors.join(' | '));
   page.off('pageerror',listener);
   console.log('OK '+lesson.p+' · '+width+'px · padrão comum, índice, backup recolhido e sem banner local');
  }
  await context.close();
 }
 console.log('SUCESSO '+count+' verificações do padrão único nas oito aulas');
}finally{await browser.close();}
