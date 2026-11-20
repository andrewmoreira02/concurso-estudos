/* Regressão editorial: sem cadernos históricos inteiros dentro das aulas.
 * Lê somente arquivos públicos do repositório, sem dados pessoais. */
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(p,'utf8');
const paths=['rlm.html','engenharia-qualidade.html','portugues-casan-19-11.html',
'banco-dados.html','seguranca.html','algoritmos-oo.html',
'administracao-publica-ima.html','legislacao-ambiental-ima.html',
'legislacao-casan-20-11.html','questoes-casan-21-11.html',
'questoes-ima.html','questoes-ima-especificas.html'].map(x=>'aulas/'+x);
for(const path of paths){
 const html=read(path);
 assert(!/href=["'][^"']*(?:cadernos\/[^"']+\.pdf|arquivos\.qconcursos\.com\/prova\/arquivo_prova\/[^"']+\.pdf)/i.test(html),
  path+': não apresentar caderno da prova ou PDF inteiro dentro de uma aula');
}
const eng=read('aulas/engenharia-qualidade.html');
for(const [id,step] of [['eng-1','etapa-1-1'],['eng-2','etapa-4-4'],['eng-3','etapa-7-2']]){
 assert(eng.split('data-ce-question="'+id+'"').length===2,'Questão autoral duplicada ou ausente '+id);
 const marker=eng.indexOf('id="'+step+'"');
 const next=eng.indexOf('<div class="step-marker"',marker+12);
 const practice=eng.indexOf('data-topic-question="'+id+'"',marker);
 const readBtn=eng.indexOf('data-read="'+step+'"',marker);
 assert(marker>=0&&practice>marker&&readBtn>practice&&(next<0||practice<next),
  'Questão '+id+' deve estar no tópico '+step+' antes de Lido');
}
const end=eng.slice(eng.indexOf('<section class="section" id="questoes-engenharia"'));
assert(!/data-ce-question="eng-[123]"/.test(end),
 'Não concentrar os três exercícios autorais no fim da aula de Engenharia');
const dataJS=read('assets/cobranca-dados.js');
const prefix='window.ConcursoCobrancaData=';
const data=JSON.parse(dataJS.slice(dataJS.indexOf(prefix)+prefix.length).trim().replace(/;$/,''));
const engineering=data.cases.engenharia;
assert(engineering.length>=7,'Pelo menos 7 questões pontuais de Engenharia devem existir');
for(const n of [16,20,31])assert(engineering.some(q=>q.src==='FURB23'&&q.n===n),
  'Falta exercício pontual FURB '+n);
for(const n of [32,33,36,46])assert(engineering.some(q=>q.src==='AOCP'&&q.n===n),
  'Falta exercício pontual AOCP '+n);
assert(engineering.filter(q=>q.section==='etapa-3-3').length===2,
 'Questões de mensageria e eventos devem estar na subseção Arquitetura 3.3');
const engine=read('assets/cobranca-na-pratica.js');
assert(engine.includes('question.dataset.ceQuestion')&&engine.includes('card.append(form,solution,feedback)'),
 'Questões de cada tópico devem ter formulário e correção dentro da aula');
assert(!engine.includes('source.pdf')&&!engine.includes('Caderno histórico (opcional)'),
 'Não remeter o estudante para a prova completa no cartão do tópico');
const practice=read('assets/practice-auto.js');
assert(!practice.includes('Consultar caderno de origem (opcional)')&&practice.includes('questionElement'),
 'Treinos e revisões também precisam ter questões completas no site');
const casan=read('aulas/questoes-casan-21-11.html');
assert(casan.includes('data-ce-practice="saturday"')&&!casan.includes('cadernos/'),
 'O simulado específico deve continuar no site, sem PDF obrigatório');
for(const path of [
 'cadernos/casan-404-13-questoes-selecionadas-aocp-2025.pdf',
 'cadernos/engenharia-furb-2023-4-questoes-selecionadas.pdf'
])assert(!existsSync(path),'PDF de questões antigo permanece publicado: '+path);
console.log('OK: exercícios pontuais no site, 3 autorais nos tópicos, 7 referências de Engenharia, sem cadernos PDF publicados.');
