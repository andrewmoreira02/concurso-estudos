// Teste de regressão visual/funcional mínima em viewport móvel.
// Não acessa dados pessoais: navega apenas em arquivos HTML do checkout.
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const chrome = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!chrome || !existsSync(chrome)) throw new Error('Chromium/Chrome não encontrado no runner');
const browser = await chromium.launch({
  executablePath: chrome, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
});
const pages = [
  'aulas/rlm.html', 'aulas/engenharia-qualidade.html',
  'aulas/portugues-casan-19-11.html',
  'index.html', 'aulas.html', 'planejamento.html', 'progresso.html', 'revisoes.html', 'conta.html',
];
let assertions = 0;
function check(ok, message) { assertions++; if (!ok) throw new Error(message); }
try {
  for (const width of [320, 390, 430]) {
    const page = await browser.newPage({
      viewport: { width, height: 780 }, isMobile: true, hasTouch: true,
      deviceScaleFactor: 1,
    });
    for (const file of pages) {
      await page.goto(pathToFileURL(resolve(file)).href, {waitUntil: 'domcontentloaded'});
      await page.waitForTimeout(180);
      const dims = await page.evaluate(() => ({
        viewport: window.innerWidth,
        htmlWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
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
      } else if (file === 'index.html' || file === 'aulas.html') {
        const first = page.locator('.primary-nav a').first();
        const height = await first.evaluate(el => el.getBoundingClientRect().height);
        check(height >= 43, 'Navegação principal com alvo de toque insuficiente');
      }
      console.log('OK '+width+'px '+file);
    }
    await page.close();
  }
  console.log('SUCESSO: '+assertions+' verificações em telas de 320, 390 e 430 px');
} finally { await browser.close(); }
