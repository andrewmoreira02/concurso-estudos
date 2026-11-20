// Regressão editorial e documental: só materiais públicos e dados estruturais.
// Não consulta Supabase, não acessa nem gera registros de leitura pessoais.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const load=async path=>readFile(path,'utf8');
const db=JSON.parse(await load('dados/fontes-aocp-joinville-2025.json'));
assert.equal(db.questions.length,50,'O caderno AOCP deve manter 50 itens identificados');
assert.deepEqual(db.stats.annulled,[1,5,7,22]);
const files=new Map();
for(const [i,q] of db.questions.entries()){
 assert.equal(q.question_number,i+1,'Ordem ou número de questão divergente');
 assert.equal(typeof q.topic,'string');
 assert(q.topic.length>16,'Assunto sem curadoria: '+q.question_number);
 assert(Number.isInteger(q.book_page)&&q.book_page>=2&&q.book_page<=13,'Página fora do caderno: '+q.question_number);
 assert(q.topic_alignment!=='pendente_conferencia_no_caderno','Assunto ainda sem classificação: '+q.question_number);
 assert.equal(q.publicar_texto_original,false,'Reprodução original não autorizada: '+q.question_number);
 if(db.stats.annulled.includes(q.question_number)){
   assert.equal(q.status,'anulada');
   assert.equal(q.final_answer,null);
 }else{
   assert.equal(q.status,'valida');
   assert(/^[A-E]$/.test(q.final_answer),'Gabarito final ausente: '+q.question_number);
 }
 if(q.related_lesson){
   const [path,id]=q.related_lesson.split('#');
   assert(path.startsWith('aulas/')&&id,'Vínculo inválido em '+q.question_number);
   if(!files.has(path))files.set(path,await load(path));
   assert(files.get(path).includes('id="'+id+'"'),'ID inexistente: '+q.related_lesson);
 }
}
const eng=await load('aulas/engenharia-qualidade.html');
const engIds=['etapa-1-3','etapa-2-1','etapa-2-2','etapa-2-4','etapa-2-5','etapa-3-1','etapa-4-3','etapa-5-2','etapa-6-2','etapa-8-1','etapa-9-2','etapa-10-3'];
assert.equal([...eng.matchAll(/class="step-marker"[^>]*id="etapa-\d+-\d+"/g)].length,37);
assert.equal([...eng.matchAll(/class="ce-end-reading"/g)].length,37);
for(const id of engIds){
 const p=eng.indexOf('id="'+id+'"'),f=eng.indexOf('<div class="ce-end-reading"',p),next=eng.indexOf('<div class="step-marker"',p+10);
 assert(p>0&&f>p&&(next<0||f<next),'Controle do fim da subseção '+id+' não encontrado');
 assert(f-p>600,'Subseção de Engenharia ainda superficial: '+id);
}
const rlm=await load('aulas/rlm.html');
assert.equal([...rlm.matchAll(/<h[34][^>]*data-lesson-step="\d+\.\d+"/g)].length,71);
assert.equal(rlm.split('lesson-depth-extra-20261120').length-1,13,'13 subseções RLM precisam dos novos exemplos');
console.log('SUCESSO: 50 questões AOCP com gabarito e tópicos, 4 anuladas, '+db.questions.filter(q=>q.related_lesson).length+' vínculos válidos; 12 etapas Engenharia e 13 RLM aprofundadas. Nenhum progresso pessoal acessado.');
