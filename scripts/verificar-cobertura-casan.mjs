/* Matriz documental, não avalia leitura ou desempenho pessoal. */
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const m=JSON.parse(await readFile('dados/cobertura-casan.json','utf8'));
assert.equal(m.exam.includes('CASAN'),true);
assert.equal(m.areas.length,5);
assert.deepEqual(m.areas.map(x=>x.questions),[25,10,7,5,3]);
const all=m.areas.flatMap(x=>x.topics);
assert.equal(all.length,30,'Matriz precisa cobrir 26 pontos de TI e 4 disciplinas comuns');
const ti=m.areas[0].topics;
assert.equal(ti.length,26);
const ids=ti.map(x=>x.id);
assert.equal(new Set(ids).size,26);
for(const id of ['1.1','1.2','1.3','1.4','1.5','2.1','2.2','2.3','2.4','2.5','2.6','2.7','3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','4.1','4.2','4.3','5.1','5.2','5.3'])
 assert(ids.includes(id),'Falta item edital CASAN '+id);
for(const x of all){
 assert(['lacuna','parcial','desenvolvido'].includes(x.depth),'Classificação inválida em '+x.id);
 assert(x.title?.length>12&&x.note?.length>20,'Texto insuficiente '+x.id);
 if(x.depth==='lacuna')assert.equal(x.lessons.length,0,'Lacuna marcada com aula completa sem revisão '+x.id);
 for(const l of x.lessons){
  const [path,hash]=l.href.split('#');
  const html=await readFile(path,'utf8');
  assert(html.includes('id="'+hash+'"'),'Vínculo quebrado '+l.href);
 }
}
const casesText=await readFile('assets/cobranca-dados.js','utf8');
const cases=JSON.parse(casesText.split('window.ConcursoCobrancaData=')[1].trim().replace(/;$/,''));
assert.equal(cases.sources.FLORAM.key.includes('concursos/350/'),true,'Gabarito FLORAM não é o oficial do cargo');
assert(cases.cases['administracao-publica-ima'].some(x=>x.src==='FURB25'&&x.n===79&&x.origKey==='B'));
assert(cases.cases['legislacao-ambiental-ima'].some(x=>x.src==='BRUSQUE'&&x.n===36&&x.origKey==='B'));
console.log('SUCESSO: 26 itens TI, 4 disciplinas gerais, 30 tópicos com links válidos, lacunas transparentes e três fontes históricas corrigidas.');
