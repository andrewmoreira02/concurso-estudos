/* Teste renderizado: exemplos completos de provas anteriores nas oito aulas.
 * Só usa dados públicos e perfil descartável; não acessa Supabase nem perfil pessoal.
 */
import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
if(!chrome||!existsSync(chrome))throw Error('Chromium não encontrado');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--allow-file-access-from-files','--disable-dev-shm-usage']});
const lessons=[
 ['rlm.html',5],['portugues-casan-19-11.html',5],['engenharia-qualidade.html',5],
 ['banco-dados.html',5],['seguranca.html',4],['algoritmos-oo.html',5],
 ['administracao-publica-ima.html',5],['legislacao-ambiental-ima.html',3]
];
const publicData=await import('node:fs/promises').then(async fs=>fs.readFile('assets/cobranca-dados.js','utf8'));
assert(publicData.includes('ConcursoCobrancaData'),'Fonte pública de exemplos indisponível');
let total=0,assertions=0;
try{
 for(const width of [320,390,430,1280]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<700,hasTouch:width<700});
  const page=await context.newPage();
  for(const [lesson,expected] of lessons){
    const errors=[];const fn=e=>errors.push(e.message);page.on('pageerror',fn);
    await page.goto(pathToFileURL(resolve('aulas/'+lesson)).href,{waitUntil:'domcontentloaded'});
    await page.locator('#cobrado-assim-na-prova .ce-cobranca-card').first().waitFor({timeout:14000});
    const dom=await page.evaluate(()=>{
       const panel=document.getElementById('cobrado-assim-na-prova');
       const main=document.querySelector('main');
       const cards=[...panel.querySelectorAll('.ce-cobranca-card')];
       const tools=main.querySelector('#ferramentas-da-aula');
       const readKeys=()=>Object.keys(localStorage).filter(k=>/read|lido|_steps_/.test(k)).sort().map(k=>k+'='+localStorage.getItem(k));
       return {
        cards:cards.map(c=>({
          origin:c.querySelector('.ce-cobranca-origin')?.textContent??'',
          kind:c.querySelector('.ce-cobranca-kind')?.textContent??'',
          prompt:c.querySelector('.ce-cobranca-prompt')?.textContent??'',
          options:[...c.querySelectorAll('.ce-cobranca-options li')].map(x=>x.textContent),
          links:[...c.querySelectorAll('.ce-cobranca-links a')].map(a=>({href:a.getAttribute('href'),label:a.textContent})),
          correct:c.querySelector('.ce-cobranca-correct')?.textContent??'',
          explanation:c.querySelector('.ce-cobranca-answer > p:not(.ce-cobranca-correct):not(.ce-cobranca-comparison)')?.textContent??'',
          comparison:c.querySelector('.ce-cobranca-comparison')?.textContent??'',
          closed:!c.querySelector('.ce-cobranca-answer')?.open
        })),
        toolAfter:!!tools&&Boolean(panel.compareDocumentPosition(tools)&Node.DOCUMENT_POSITION_FOLLOWING),
        width:document.documentElement.scrollWidth,
        title:panel.querySelector('h2')?.textContent,
        countPanel:document.querySelectorAll('#cobrado-assim-na-prova').length,
        reads:readKeys()
       };
    });
    assert.equal(dom.cards.length,expected,lesson+' não mostra 1–5 exemplos corretamente');
    assertions++;total+=expected;
    assert.equal(dom.countPanel,1,lesson+' exibe painel duplicado');
    assert.equal(dom.title,'Cobrado assim na prova',lesson+' título ausente');
    assert(dom.toolAfter,lesson+' exemplos devem aparecer antes das preferências');
    assert(dom.width<=width+3,lesson+' possui overflow horizontal a '+width+'px: '+dom.width);
    for(const card of dom.cards){
      assert(card.kind.includes('ADAPTADA'),lesson+' não sinaliza a origem adaptada');
      assert(card.origin.includes('questão'),lesson+' não informa número da prova');
      assert(card.prompt.length>=45,lesson+' enunciado curto');
      assert.equal(card.options.length,5,lesson+' alternativas incompletas');
      assert(card.options.every(x=>x&&x.trim().length>2),lesson+' alternativa vazia');
      assert(card.links.length>=3,lesson+' sem links de origem, gabarito e aula');
      assert(card.links.some(x=>x.label.includes('original')&&x.href.startsWith('https://')),lesson+' falta referência real');
      assert(card.links.some(x=>x.label.includes('final')&&x.href.startsWith('https://')),lesson+' falta gabarito externo');
      assert(card.links.some(x=>x.href.startsWith('#')&&documentSafeHash(x.href)),lesson+' falta âncora de tópico');
      assert(/^Resposta da adaptação: [A-E]$/.test(card.correct),lesson+' chave própria ausente');
      assert(card.explanation.length>=75,lesson+' explicação insuficiente');
      assert(card.comparison.includes('Gabarito FINAL')&&card.comparison.includes('não substitui'),lesson+' confusão com gabarito original');
      assert(card.closed,lesson+' solução deve iniciar recolhida');
      assertions+=12;
    }
    const snapshot=dom.reads.join('\n');
    await page.locator('.ce-cobranca-answer summary').first().click();
    const readAfter=await page.evaluate(()=>Object.keys(localStorage).filter(k=>/read|lido|_steps_/.test(k)).sort().map(k=>k+'='+localStorage.getItem(k)).join('\n'));
    assert.equal(snapshot,readAfter,lesson+' abrir a resolução modificou registros de Lido');
    assert.equal(errors.length,0,lesson+' erros JavaScript: '+errors.join(' | '));
    page.off('pageerror',fn);
    console.log('OK '+width+'px '+lesson+' '+expected+' questões adaptadas, gabaritos e explicações');
  }
  await context.close();
 }
 console.log('SUCESSO: '+lessons.length+' aulas, 37 exemplos independentes, '+total+' cards auditados em quatro tamanhos; '+assertions+' verificações. Sem progresso alterado.');
}finally{await browser.close();}
function documentSafeHash(link){return /^#[a-z][\w-]+$/.test(link);}
