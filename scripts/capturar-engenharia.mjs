// Capturas de verificação editorial, exclusivamente com perfil de navegador vazio.
// Nunca carregar dados pessoais ou chave de pareamento na CI.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium não encontrado');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files']});
const dir='artifacts/engenharia';
await mkdir(dir,{recursive:true});
const url=pathToFileURL(resolve('aulas/engenharia-qualidade.html')).href;
try{
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:820},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('.step-marker').length===37);
  for(const [label,index] of [['top',null],['inicio',0],['meio',18],['final',36]]){
   if(index!==null)await page.locator('.step-marker').nth(index).scrollIntoViewIfNeeded();
   await page.screenshot({path:`${dir}/engenharia-${width}-${label}.png`});
  }
  console.log('Capturas geradas: Engenharia '+width+' px · topo/início/meio/final');
  await ctx.close();
 }
}finally{await browser.close();}
