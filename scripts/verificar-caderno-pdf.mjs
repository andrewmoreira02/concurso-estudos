/* Confere o PDF público do caderno CASAN sem dados individuais ou acesso à rede. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pdfPath='cadernos/casan-404-13-questoes-selecionadas-aocp-2025.pdf';
const raw=readFileSync(pdfPath);
assert(raw.subarray(0,8).toString('latin1').startsWith('%PDF-1.4'),'Assinatura PDF inválida');
const txt=raw.toString('latin1');
assert(txt.endsWith('%%EOF\n'),'PDF sem finalização');
const start=txt.match(/startxref\n(\d+)\n%%EOF\n$/);
assert(start,'PDF sem startxref');
assert.equal(txt.slice(Number(start[1]),Number(start[1])+4),'xref','Posição do índice PDF inválida');
const pages=[...txt.matchAll(/\/Type \/Page \/Parent/g)].length;
assert(pages>=3&&pages<=15,'PDF com paginação inesperada');
assert(txt.includes('/Count '+pages+' '),'Contagem de páginas divergente');
const headings=[...txt.matchAll(/\(QUESTAO (\d+)\s+\\?\|/g)].map(m=>Number(m[1]));
assert.deepEqual(headings,Array.from({length:13},(_,i)=>i+1),'Deve haver exatamente 13 questões selecionadas na ordem');
assert(txt.includes('GABARITO DAS ADAPTACOES'),'Gabarito não está incluído');
assert(!txt.includes('leg-integridade-01'),'Questão autoral do simulado não pode entrar neste caderno histórico');
const html=readFileSync('aulas/questoes-casan-21-11.html','utf8');
assert(html.includes('../'+pdfPath),'Falta link de download no simulado');
const base=JSON.parse(readFileSync('dados/questoes-casan-aocp.json','utf8'));
assert.equal(base.questions.length,13,'Banco AOCP original alterado: atualizar caderno');
console.log('OK: PDF CASAN, '+pages+' páginas, 13 questões AOCP selecionadas e link de download no simulado.');

const furbPath='cadernos/engenharia-furb-2023-4-questoes-selecionadas.pdf';
const furb=readFileSync(furbPath);
const furbText=furb.toString('latin1');
assert(furbText.startsWith('%PDF-1.4'),'PDF FURB inválido');
assert(furbText.endsWith('%%EOF\n'),'PDF FURB sem terminação');
assert(furbText.includes('GABARITO E JUSTIFICATIVAS'),'Gabarito FURB incompleto');
for(const n of [11,16,20,31])assert(furbText.includes('FURB Q'+n),'Falta referência FURB Q'+n);
for(const n of [14,32])assert(!furbText.includes('FURB Q'+n),'Questão anulada FURB no caderno');
const engHtml=readFileSync('aulas/engenharia-qualidade.html','utf8');
assert(engHtml.includes('../'+furbPath),'Aula de Engenharia sem PDF FURB filtrado');
assert(engHtml.includes('CASAN 2026 - Instituto AOCP (prioridade atual)'),'Aula de Engenharia sem prioridade AOCP CASAN');
const cobranca=readFileSync('assets/cobranca-na-pratica.js','utf8');
assert(cobranca.includes('PDF filtrado FURB'),'Caderno histórico da FURB sem acesso filtrado');
console.log('OK: PDF FURB, quatro itens selecionados, sem itens anulados, na Engenharia.');

