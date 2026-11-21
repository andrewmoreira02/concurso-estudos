/* Auditoria: teoria sem quizzes, banco de no mínimo cinco páginas CASAN,
 * cada faixa de questões isolada e sem acesso a dados pessoais. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const casanLessons=['rlm.html','engenharia-qualidade.html','portugues-casan-19-11.html',
 'banco-dados.html','seguranca.html','algoritmos-oo.html','legislacao-casan-20-11.html'];
const imaLessons=['administracao-publica-ima.html','legislacao-ambiental-ima.html'];
for(const name of [...casanLessons,...imaLessons]){
 const html=read('aulas/'+name);
 assert(!html.includes('data-ce-quiz'),'Questão avaliativa dentro da aula: '+name);
 assert(!html.includes('cobranca-na-pratica.js'),'Injeção de questões dentro da teoria: '+name);
 assert(!/href=["'][^"']*(?:cadernos\/|arquivo_prova\/)[^"']*\.pdf/i.test(html),
  'Prova histórica completa na aula: '+name);
 if(casanLessons.includes(name)){
  assert(!/\b(?:FURB|IMA(?:-SC)?)\b/i.test(html),'Material IMA/FURB aparece na aula CASAN: '+name);
  assert(!/value=["']ima["']/.test(html),'Alternância de concurso indevida: '+name);
 }
}
const data=JSON.parse(read('dados/blocos-questoes-casan.json'));
const ao=JSON.parse(read('dados/questoes-casan-aocp.json'));
const au=JSON.parse(read('dados/questoes.json'));
const extra=JSON.parse(read('dados/questoes-casan-extra.json'));
const bank=new Map([...ao.questions,...au.questions,...extra.questions].map(q=>[q.id,q]));
assert.equal(data.exam,'casan');
assert(data.min_ready_pages>=5&&data.sets.length>=data.min_ready_pages,'Reserva mínima de cinco páginas indisponível');
const used=new Set();
for(const s of data.sets){
 assert(s.question_ids.length>=3&&s.href.startsWith('aulas/questoes-')&&s.href.endsWith('-casan.html'),'Conjunto de questões não íntegro: '+s.id);
 if(s.id.startsWith('extra-')){
  assert(Object.keys(s.module_by_question||{}).length===0,
   'Baterias pós-conteúdo CASAN não devem ser liberadas por módulo isolado: '+s.id);
  assert(/após|depois|pós/i.test(s.selection_policy||s.description||''),
   'Bateria extra deve declarar política pós-conteúdo: '+s.id);
 }else{
  assert(Object.keys(s.module_by_question||{}).length===s.question_ids.length,
   'Cada questão temática precisa indicar o módulo teórico correspondente: '+s.id);
  const modules=s.question_ids.map(id=>s.module_by_question[id]);
  assert(modules.every(n=>Number.isInteger(n)&&n>=1&&n<=11),'Módulo curricular inválido: '+s.id);
  assert(modules.every((n,i)=>i===0||n>=modules[i-1]),
   'As questões devem respeitar a sequência do conteúdo em '+s.id);
 }
 assert(existsSync(s.href),'Página ainda não publicada no repositório: '+s.href);
 const html=read(s.href);
 assert(html.includes('data-ce-practice="topic"')&&html.includes('data-ce-topic-set="'+s.id+'"'),
  'Página deve carregar somente o conjunto nomeado: '+s.id);
 assert(html.includes('assets/practice-auto.js')&&html.includes('assets/quiz.js'),
  'Correção e registro ausentes no bloco: '+s.id);
 assert(!html.includes('data-ce-lesson=')&&!html.includes('data-ce-read'),
  'Página de questões não pode declarar leitura como aula: '+s.id);
 for(const id of s.question_ids){
  const q=bank.get(id);
  assert(q&&q.exams.includes('casan'),'Questão não elegível para CASAN: '+id);
  assert(q.kind!=='adaptada'||q.source.bank==='Instituto AOCP',
   'Adaptação de banca diferente da AOCP no bloco CASAN: '+id);
  assert(!used.has(id),'Questão duplicada em mais de um conjunto de assuntos: '+id);
  used.add(id);
 }
}
const script=read('assets/practice-auto.js');
assert(script.includes("type==='topic'")&&script.includes("items=items.slice(from-1,to)"),
 'Conjunto não limita o formulário à faixa de questões solicitada');
assert(script.includes("if(!Number.isSafeInteger(from)")&&script.includes("to>items.length"),
 'Faixa inválida deve ser recusada, não expandida ao banco todo');
const adaptive=read('assets/adaptive.js');
assert(adaptive.includes('daysRemaining')&&adaptive.includes("set.href+'?de='"),
 'Recomendação precisa usar prazo da prova e links de intervalos exatos');
const catalog=read('aulas.html');
for(const set of data.sets)assert(catalog.includes('href="'+set.href+'"'),
 'Conjunto não catalogado: '+set.href);
for(const path of ['cadernos/casan-404-13-questoes-selecionadas-aocp-2025.pdf','cadernos/engenharia-furb-2023-4-questoes-selecionadas.pdf'])
 assert(!existsSync(path),'PDF de questões antigo ainda presente');
console.log('SUCESSO: '+data.sets.length+' páginas separadas CASAN, '+used.size+' questões únicas, faixas exatas e teoria sem quizzes.');
