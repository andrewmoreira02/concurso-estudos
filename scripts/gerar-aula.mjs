import {readFileSync,writeFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
export function renderLesson(d) {
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const fail=m=>{throw Error(m)};
 const str=(v,k)=>typeof v==="string"&&v.trim()?esc(v):fail("Campo obrigatório: "+k);
 const list=(v,k)=>Array.isArray(v)&&v.length?v:fail("Lista vazia: "+k);
 const id=v=>typeof v==="string"&&/^[a-z][a-z0-9-]{2,40}$/.test(v)?v:fail("ID inválido: "+v);
 const ids=new Set(["questoes","fontes","ferramentas-da-aula","nl-count","nl-meter","nl-status","nl-global-status","nl-export","nl-import"]);
 const unique=v=>{v=id(v);if(ids.has(v))fail("ID repetido: "+v);ids.add(v);return v};
 const sourceUrl=v=>typeof v==="string"&&/^https:\/\/[^\s"'<>]+$/.test(v)?esc(v):fail("Fonte deve usar HTTPS");
 const quizUrl=v=>typeof v==="string"&&/^questoes-[a-z0-9-]+\.html(?:\?[a-z0-9=&_%.-]+)?$/.test(v)?esc(v):fail("Link de questões inválido");
 const paragraphs=v=>list(v,"parágrafos").map(x=>`<p>${str(x,"parágrafo")}</p>`).join("");
 const items=(v,ordered=false)=>`<${ordered?"ol":"ul"}>${list(v,"itens").map(x=>`<li>${str(x,"item")}</li>`).join("")}</${ordered?"ol":"ul"}>`;
 if(d.schema_version!==1)fail("schema_version deve ser 1");
 const slug=id(d.id),title=str(d.title,"title"),context=str(d.contest,"contest"),subject=str(d.subject,"subject"),desc=str(d.description,"description");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||Number.isNaN(Date.parse(d.date))||new Date(d.date).toISOString().slice(0,10)!==d.date)fail("Data inválida");
 const blocks=(b,n)=>{
 switch(b.type){
 case "text":return paragraphs(b.paragraphs);
 case "list":return items(b.items);
 case "concept":return `<div class="nl-notice"><strong>${str(b.title,"conceito")}</strong>${paragraphs(b.paragraphs)}</div>`;
 case "example":return `<div class="nl-example"><h4>Exemplo resolvido · ${n}</h4><p><strong>Situação:</strong> ${str(b.situation,"situação")}</p>${items(b.steps,true)}<p><strong>Conclusão:</strong> ${str(b.conclusion,"conclusão")}</p></div>`;
 case "tip":case "warning":return `<div class="${b.type==="tip"?"nl-tip":"nl-trap"}"><strong>${b.type==="tip"?"Para lembrar":"Armadilha de prova"}:</strong> ${str(b.text,b.type)}</div>`;
 case "formula":return `<div class="nl-formula"><h4>${str(b.title,"fórmula")}</h4><span class="nl-equation">${str(b.expression,"expressão")}</span><dl class="nl-legend">${list(b.legend,"legenda").map(x=>`<div><dt>${str(x.symbol,"símbolo")}</dt><dd>${str(x.meaning,"significado")}</dd></div>`).join("")}</dl><p>${str(b.explanation,"justificativa")}</p></div>`;
 case "table":{const headers=list(b.headers,"cabeçalhos");return `<table class="nl-compare" aria-label="${str(b.title,"título tabela")}"><caption>${str(b.title,"título tabela")}</caption><thead><tr>${headers.map(h=>`<th scope="col">${str(h,"cabeçalho")}</th>`).join("")}</tr></thead><tbody>${list(b.rows,"linhas").map(row=>{if(!Array.isArray(row)||row.length!==headers.length)fail("Tabela irregular");return `<tr>${row.map(x=>`<td>${str(x,"célula")}</td>`).join("")}</tr>`}).join("")}</tbody></table>`;}
 case "code":return `<pre style="white-space:pre-wrap;overflow-wrap:anywhere;overflow:visible"><code>${str(b.code,"código")}</code></pre>`;
 case "diagram":{if(typeof b.file!=="string"||!/^assets\/diagramas\/[a-z0-9-]+\.svg$/.test(b.file))fail("Diagrama SVG local inválido");return `<figure style="margin:1rem 0"><img src="../${esc(b.file)}" alt="${str(b.alt,"descrição visual")}" style="display:block;max-width:100%;height:auto;margin:auto"><figcaption>${str(b.caption,"legenda")}</figcaption>${paragraphs(b.explanation)}</figure>`;}
 default:fail("Tipo de bloco desconhecido: "+b.type);
 }
 };
 let total=0,nav="";
 const modules=list(d.modules,"modules");
 const body=modules.map((m,i)=>{
 const mid=unique(m.id),mt=str(m.title,"título módulo");nav+=`<a href="#${mid}"><strong>${i+1}. ${mt}</strong></a>`;
 const subsections=list(m.sections,"sections").map((s,j)=>{
 const sid=unique(s.id),n=`${i+1}.${j+1}`,st=str(s.title,"título subseção");total++;
 nav+=`<a data-ce-nav="${sid}" href="#${sid}">${n} · ${st}</a>`;
 const content=list(s.blocks,"blocks");
 if(!content.some(b=>b.type==="text"||b.type==="concept"))fail("Subseção sem teoria: "+sid);
 return `<article class="nl-section" id="${sid}" data-ce-topic><h3>${n} · ${st}</h3>${content.map(b=>blocks(b,n)).join("")}<div class="nl-end-read"><label><input type="checkbox" data-ce-read="${sid}" aria-label="Marcar ${n} como Lido"> Marcar ${n} como Lido</label></div></article>`;
 }).join("\n");
 return `<section class="nl-chapter" id="${mid}"><header><span class="nl-eyebrow">Módulo ${i+1} de ${modules.length}</span><h2>${mt}</h2></header>${subsections}</section>`;
 }).join("\n");
 const sources=list(d.sources,"sources").map(x=>`<li><a href="${sourceUrl(x.url)}">${str(x.label,"fonte")}</a></li>`).join("");
 const questions=d.questions?.length?`<section class="nl-chapter" id="questoes"><h2>Questões sugeridas</h2><p>Pratique em uma página separada, quando for oportuno.</p><ul>${d.questions.map(q=>`<li><a href="${quizUrl(q.href)}">${str(q.label,"questões")}</a></li>`).join("")}</ul></section>`:"";
 return `<!doctype html>
<!-- GERADO POR scripts/gerar-aula.mjs. Edite apenas o JSON de origem. -->
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#09121d"><meta name="description" content="${desc}"><title>${title} | Concurso Estudos</title>
<link rel="stylesheet" href="../assets/new-lesson.css"><link rel="stylesheet" href="../assets/lesson-unified.css">
<script src="../assets/new-lesson.js" defer></script><script src="../assets/lesson-unified.js" defer></script><script src="../assets/sync-config.js" defer></script><script src="../assets/sync.js" defer></script><script src="../assets/reader-focus.js" defer></script></head>
<body class="ce-lesson-page ce-new" data-ce-lesson="${slug}"><header class="nl-header"><a class="nl-brand" href="../index.html">CE · Concurso Estudos</a><nav aria-label="Navegação do site"><a href="../index.html">Painel</a><a href="../aulas.html">Aulas</a><a href="../planejamento.html">Plano</a><a href="../revisoes.html">Revisões</a><a href="../conta.html">Sincronização</a></nav></header>
<div class="nl-layout"><aside class="nl-sidebar" aria-label="Índice da aula"><div class="nl-sticky"><span class="nl-side-head">Índice clicável</span><div class="nl-progress"><strong id="nl-count">0 de ${total} subseções</strong><meter id="nl-meter" min="0" max="${total}" value="0" aria-label="Subseções marcadas como Lido"></meter><small id="nl-global-status">Leitura não é avaliação.</small></div><nav>${nav}</nav></div></aside>
<main class="nl-main"><section class="nl-hero"><span class="nl-eyebrow">${context} · ${subject} · ${esc(d.date.split("-").reverse().join("/"))}</span><h1>${title}</h1><p>${desc}</p></section>
${body}
${questions}
<section class="nl-chapter" id="fontes"><h2>Fontes e referências</h2><ul>${sources}</ul></section>
<details id="ferramentas-da-aula" class="ce-lesson-tools"><summary>Configurações e backup da aula</summary><div class="ce-lesson-tools-content"><div class="nl-tools"><button id="nl-export" type="button">Exportar leitura JSON</button><label for="nl-import">Importar leitura JSON <input type="file" id="nl-import" accept=".json,application/json"></label></div><p id="nl-status" role="status" aria-live="polite"></p></div></details><p><a href="../aulas.html">Voltar ao catálogo</a></p></main></div></body></html>\n`;
}
export function generate(file,{check=false}={}){
 const data=JSON.parse(readFileSync(file,"utf8"));
 const html=renderLesson(data);
 const output=resolve(root,"aulas",data.id+".html");
 if(check){if(!existsSync(output)||readFileSync(output,"utf8")!==html)throw Error("HTML ausente ou desatualizado: "+output);return output;}
 for(const m of data.modules)for(const s of m.sections)for(const b of s.blocks)if(b.type==="diagram"&&!existsSync(resolve(root,b.file)))throw Error("SVG inexistente: "+b.file);
 for(const q of data.questions||[])if(!existsSync(resolve(root,"aulas",q.href.split("?")[0])))throw Error("Página de questões inexistente: "+q.href);
 if(existsSync(output)){
  const old=readFileSync(output,"utf8");
  if(!old.includes("GERADO POR scripts/gerar-aula.mjs"))throw Error("Aula legada: não sobrescrever");
  const oldIds=[...old.matchAll(/data-ce-read="([^"]+)"/g)].map(m=>m[1]);
  const newIds=new Set([...html.matchAll(/data-ce-read="([^"]+)"/g)].map(m=>m[1]));
  for(const id of oldIds)if(!newIds.has(id))throw Error("ID de leitura removido: "+id+"; preserve ou planeje migração explícita");
 }
 mkdirSync(dirname(output),{recursive:true});writeFileSync(output,html);return output;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),file=args.find(x=>!x.startsWith("--"));
 if(!file)throw Error("Uso: node scripts/gerar-aula.mjs dados/aulas-diarias/<id>.json [--check]");
 console.log(generate(resolve(file),{check:args.includes("--check")}));
}
