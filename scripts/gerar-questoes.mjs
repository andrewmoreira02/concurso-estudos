import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {renderBlock} from "./componentes-conteudo.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const req=(v,k)=>{if(typeof v!=="string"||!v.trim())throw Error("Campo obrigatório: "+k);return esc(v)};
const subjectKeys=["ti","portugues","rlm","legislacao","adm","atualidades"];
export function renderQuiz(d){
 if(d.schema_version!==1||!/^questoes-[a-z0-9-]{3,50}$/.test(d.id||"")||!/^([a-z][a-z0-9_-]{1,39})$/.test(d.exam||"")||!Array.isArray(d.questions)||!d.questions.length||d.questions.length>100)throw Error("Metadados do quiz inválidos");
 if(!subjectKeys.includes(d.subject)&&d.subject!=="mixed")throw Error("Disciplina inválida");
 const title=req(d.title,"título"),topic=req(d.topic,"tópico");
 if(d.topic.trim().length<2||d.topic.length>100)throw Error("Tópico inválido");
 const ids=new Set();
 const qs=d.questions.map((q,i)=>{
  if(!/^[a-zA-Z0-9_-]{1,60}$/.test(q.id||"")||ids.has(q.id))throw Error("ID de questão inválido ou repetido");
  ids.add(q.id);
  const subject=d.subject==="mixed"?q.subject:d.subject;
  if(!subjectKeys.includes(subject))throw Error("Disciplina da questão inválida");
  const keys=Object.keys(q.options||{}),expected=keys.length===4?"abcd":"abcde";
  if(keys.sort().join("")!==expected||!keys.includes(q.correct)||new Set(Object.values(q.options)).size!==keys.length)throw Error("Alternativas/gabarito inválidos");
  if(!["autoral","adaptada","real"].includes(q.kind))throw Error("Procedência inválida");
  let origin=q.kind;
  if(q.kind!=="autoral"){
   const f=q.source;
   if(!f||!Number.isInteger(f.year)||!/^https:\/\/[^\s"'<>]+$/.test(f.url||""))throw Error("Fonte verificável obrigatória");
   origin+=" · "+req(f.bank,"banca")+" · "+req(f.organ,"órgão")+" · "+req(f.role,"cargo")+" · "+f.year+" · "+req(f.question,"identificador")+' · <a href="'+esc(f.url)+'">Fonte</a>';
   if(q.kind==="real"){if(!/^https:\/\/[^\s"'<>]+$/.test(f.answer_key_url||""))throw Error("Gabarito oficial obrigatório para questão real");origin+=' · <a href="'+esc(f.answer_key_url)+'">Gabarito oficial</a>';}
  }
  const wrong=keys.filter(k=>k!==q.correct).map(k=>k.toUpperCase()+": "+req(q.distractors?.[k],"distrator "+k)).join(" | ");
  return '<fieldset data-ce-question="'+q.id+'" data-ce-subject="'+subject+'" data-correct="'+q.correct+'"'+(q.annulled===true?' data-annulled="true"':'')+'><legend>Questão '+(i+1)+'</legend><p>'+origin+'</p><p>'+req(q.prompt,"enunciado")+'</p>'+(q.blocks||[]).map(b=>{if(!["image","diagram","flow","chart","uml-relation","table","formula","code","text","list"].includes(b.type))throw Error("Bloco impróprio para enunciado");return renderBlock(b,String(i+1))}).join("")+keys.map(k=>'<label><input type="radio" name="'+q.id+'" value="'+k+'"> <span>'+k.toUpperCase()+') '+req(q.options[k],"alternativa")+'</span></label>').join("")+'<p data-ce-explanation hidden>'+req(q.explanation,"explicação")+'</p><p data-ce-distractors hidden>'+wrong+'</p></fieldset>';
 }).join("\n");
 return '<!doctype html>\n<!-- GERADO POR scripts/gerar-questoes.mjs. Edite apenas o JSON. -->\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+' | Concurso Estudos</title><link rel="stylesheet" href="../assets/new-lesson.css"><link rel="stylesheet" href="../assets/lesson-unified.css"><link rel="stylesheet" href="../assets/componentes-didaticos.css"><script src="../assets/quiz.js" defer></script><script src="../assets/lesson-unified.js" defer></script><script src="../assets/sync-config.js" defer></script><script src="../assets/sync.js" defer></script></head><body class="ce-lesson-page ce-new"><header class="nl-header"><a class="nl-brand" href="../index.html">CE · Concurso Estudos</a><nav aria-label="Navegação"><a href="../aulas.html">Aulas</a><a href="../planejamento.html">Plano</a><a href="../revisoes.html">Revisões</a></nav></header><main class="nl-main" style="max-width:900px;margin:auto;padding:16px"><section class="nl-hero"><h1>'+title+'</h1><p>'+topic+' · '+d.questions.length+' questões. Registro somente após envio.</p></section><form class="nl-quiz ce-generated-quiz" data-ce-quiz data-exam="'+d.exam+'" data-subject="'+d.subject+'" data-topic="'+topic+'" data-source="Questões do site com procedência por item">'+qs+'<button type="submit">Enviar respostas</button><div data-ce-feedback role="status" aria-live="polite"></div></form><p><a href="../aulas.html">Voltar ao catálogo</a></p></main></body></html>\n';
}
export function generateQuiz(file,{check=false}={}){
 const d=JSON.parse(readFileSync(file,"utf8")),html=renderQuiz(d),out=resolve(root,"aulas",d.id+".html");
 for(const q of d.questions)for(const b of q.blocks||[])if(["image","diagram"].includes(b.type)&&!existsSync(resolve(root,b.file)))throw Error("Imagem ausente: "+b.file);
 if(check){if(!existsSync(out)||readFileSync(out,"utf8")!==html)throw Error("Quiz desatualizado: "+out);return out;}
 if(existsSync(out)){const old=readFileSync(out,"utf8");if(!old.includes("GERADO POR scripts/gerar-questoes.mjs"))throw Error("Não sobrescrever quiz legado");const ids=new Set(d.questions.map(q=>q.id));for(const m of old.matchAll(/data-ce-question="([^"]+)"/g))if(!ids.has(m[1]))throw Error("ID de questão removido: "+m[1]);}
 writeFileSync(out,html);return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const args=process.argv.slice(2),file=args.find(x=>!x.startsWith("--"));if(!file)throw Error("Informe o JSON do quiz");console.log(generateQuiz(resolve(file),{check:args.includes("--check")}));}
