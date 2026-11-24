import {VISUAL_TYPES,renderVisual} from "./componentes-visuais.mjs";
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const fail=m=>{throw Error(m)};
 const str=(v,k)=>typeof v==="string"&&v.trim()?esc(v):fail("Campo obrigatório: "+k);
 const list=(v,k)=>Array.isArray(v)&&v.length?v:fail("Lista vazia: "+k);
 const paragraphs=v=>list(v,"parágrafos").map(x=>`<p>${str(x,"parágrafo")}</p>`).join("");
 const items=(v,ordered=false)=>`<${ordered?"ol":"ul"}>${list(v,"itens").map(x=>`<li>${str(x,"item")}</li>`).join("")}</${ordered?"ol":"ul"}>`;
export function renderBlock(b,n=""){
 if(VISUAL_TYPES.has(b.type))return renderVisual(b);
 switch(b.type){
 case "text":return paragraphs(b.paragraphs);
 case "list":return items(b.items);
 case "concept":return `<div class="nl-notice"><strong>${str(b.title,"conceito")}</strong>${paragraphs(b.paragraphs)}</div>`;
 case "example":return `<div class="nl-example"><h4>Exemplo resolvido · ${n}</h4><p><strong>Situação:</strong> ${str(b.situation,"situação")}</p>${items(b.steps,true)}<p><strong>Conclusão:</strong> ${str(b.conclusion,"conclusão")}</p></div>`;
 case "tip":case "warning":return `<div class="${b.type==="tip"?"nl-tip":"nl-trap"}"><strong>${b.type==="tip"?"Para lembrar":"Armadilha de prova"}:</strong> ${str(b.text,b.type)}</div>`;
 case "formula":return `<div class="nl-formula"><h4>${str(b.title,"fórmula")}</h4><span class="nl-equation">${str(b.expression,"expressão")}</span><dl class="nl-legend">${list(b.legend,"legenda").map(x=>`<div><dt>${str(x.symbol,"símbolo")}</dt><dd>${str(x.meaning,"significado")}</dd></div>`).join("")}</dl><p>${str(b.explanation,"justificativa")}</p></div>`;
 case "table":{const headers=list(b.headers,"cabeçalhos");return `<table class="nl-compare" aria-label="${str(b.title,"título tabela")}"><caption>${str(b.title,"título tabela")}</caption><thead><tr>${headers.map(h=>`<th scope="col">${str(h,"cabeçalho")}</th>`).join("")}</tr></thead><tbody>${list(b.rows,"linhas").map(row=>{if(!Array.isArray(row)||row.length!==headers.length)fail("Tabela irregular");return `<tr>${row.map(x=>`<td>${str(x,"célula")}</td>`).join("")}</tr>`}).join("")}</tbody></table>`;}
 case "code":return `<pre style="white-space:pre-wrap;overflow-wrap:anywhere;overflow:visible"><code>${str(b.code,"código")}</code></pre>`;

 default:fail("Tipo de bloco desconhecido: "+b.type);
 }
}
