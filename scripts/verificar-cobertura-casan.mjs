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

const realFurb=JSON.parse(await readFile('dados/questoes-reais.json','utf8'));
const realAocp=JSON.parse(await readFile('dados/fontes-aocp-joinville-2025.json','utf8'));
const bankKeys={FURB25:{74:'A',75:'D',76:'D',77:'B',79:'B'},FLORAM:{64:'A',65:'C'},BRUSQUE:{36:'B'}};
let examples=0;
for(const [slug,items] of Object.entries(cases.cases)){
 assert(items.length>=1&&items.length<=(slug==='engenharia'?7:5),slug+' precisa de 1 a 7 questões pontuais, sem prova integral');
 for(const item of items){
   examples++;
   let real=null;
   if(item.src==='AOCP')real=realAocp.questions.find(x=>x.question_number===item.n)?.final_answer;
   else if(item.src==='FURB23')real=realFurb.questions.find(x=>x.source.question_number===item.n)?.correct;
   else real=bankKeys[item.src]?.[item.n];
   assert(real&&real.toUpperCase()===item.origKey.toUpperCase(),slug+' referência/gabarito divergente '+item.src+' questão '+item.n);
   assert(item.mode==='adaptada'&&item.prompt?.length>45&&item.options?.length===5,'Adaptação incompleta: '+slug+' '+item.n);
   assert(item.answer>=0&&item.answer<5&&item.explain?.length>=75,'Gabarito e correção próprios inválidos '+slug+' '+item.n);
   const html=await readFile('aulas/'+(slug==='engenharia'?'engenharia-qualidade':slug==='portugues'?'portugues-casan-19-11':slug)+'.html','utf8');
   assert(html.includes('id="'+item.section+'"'),'Exemplo sem âncora curricular: '+slug+' '+item.section);
 }
}
assert.equal(examples,39);

console.log('SUCESSO: 26 itens TI, 4 disciplinas gerais, 30 tópicos com links válidos, lacunas transparentes e três fontes históricas corrigidas.');
