// Componentes visuais compartilhados por teoria e questões. Sem HTML arbitrário.
export const VISUAL_TYPES = new Set(["image","diagram","flow","chart","uml-relation"]);
export function renderVisual(b){
 const e=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const s=(v,k)=>{if(typeof v!=="string"||!v.trim())throw Error("Campo visual obrigatório: "+k);return e(v)};
 const a=(v,k)=>{if(!Array.isArray(v)||!v.length)throw Error("Lista visual vazia: "+k);return v};
 const num=(v)=>{if(typeof v!=="number"||!Number.isFinite(v))throw Error("Valor numérico inválido");return v};
 const explain=b=>`<div class="ce-visual-description">${a(b.explanation,"explicação").map(p=>`<p>${s(p,"explicação")}</p>`).join("")}</div>`;
 const fig=(body)=>`<figure class="ce-visual"><figcaption><strong>${s(b.title||b.caption,"título")}</strong></figcaption>${body}${explain(b)}</figure>`;
 if(b.type==="image"||b.type==="diagram"){
  if(typeof b.file!=="string"||!/^assets\/(?:diagramas|imagens)\/[a-z0-9-]+\.(?:svg|png|jpe?g|webp)$/.test(b.file)||(b.type==="diagram"&&!b.file.endsWith(".svg")))throw Error("Arquivo visual local inválido");
  return fig(`<img src="../${e(b.file)}" alt="${s(b.alt,"texto alternativo")}" loading="lazy" decoding="async">`);
 }
 if(b.type==="flow"){
  return fig(`<ol class="ce-flow">${a(b.steps,"etapas").map(x=>`<li><strong>${s(x.label,"etapa")}</strong><p>${s(x.detail,"detalhe")}</p></li>`).join("")}</ol>`);
 }
 if(b.type==="chart"){
  const points=a(b.points,"dados");
  if(points.length>30)throw Error("Gráfico com mais de 30 pontos; separar dados");
  const unit=s(b.unit,"unidade");
  const p=points.map(x=>({label:s(x.label,"rótulo"),value:num(x.value)}));
  const table=`<table class="nl-compare"><caption>Dados do gráfico (${unit})</caption><thead><tr><th scope="col">Categoria</th><th scope="col">Valor</th></tr></thead><tbody>${p.map(x=>`<tr><td>${x.label}</td><td>${x.value}</td></tr>`).join("")}</tbody></table>`;
  if(b.kind==="bar"){
   if(p.some(x=>x.value<0))throw Error("Barras horizontais exigem valores não negativos");
   const max=Math.max(1,...p.map(x=>x.value));
   return fig(`<div class="ce-bars" aria-hidden="true">${p.map(x=>`<div class="ce-bar-row"><span>${x.label} — ${x.value} ${unit}</span><div class="ce-bar-track"><span style="width:${x.value/max*100}%"></span></div></div>`).join("")}</div>${table}`);
  }
  if(b.kind==="line"){
   if(p.length<2)throw Error("Linha exige pelo menos dois pontos");
   const min=Math.min(...p.map(x=>x.value)),max=Math.max(...p.map(x=>x.value)),span=max-min||1;
   const coords=p.map((x,i)=>[28+i/(p.length-1)*264,142-(x.value-min)/span*112]);
   return fig(`<svg class="ce-chart-line" viewBox="0 0 320 170" role="img" aria-label="${s(b.title,"título")} — dados na tabela abaixo"><path d="M28 18 V142 H302" fill="none" stroke="currentColor"/><polyline points="${coords.map(x=>x.join(",")).join(" ")}" fill="none" stroke="var(--nl-cyan)" stroke-width="3"/>${coords.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.5" fill="var(--nl-cyan)"/>`).join("")}<text x="28" y="13" font-size="10" fill="currentColor">${max} ${unit}</text><text x="28" y="159" font-size="10" fill="currentColor">${min} ${unit} · ordem da tabela</text></svg>${table}`);
  }
  throw Error("Tipo de gráfico não registrado: "+b.kind);
 }
 if(b.type==="uml-relation"){
  const allowed={association:"M155 48 V120",dependency:"M155 48 V120",inheritance:"M155 48 V107",realization:"M155 48 V107",aggregation:"M155 48 V100",composition:"M155 48 V100"};
  if(!Object.hasOwn(allowed,b.kind))throw Error("Relação UML não registrada");
  const triangle=["inheritance","realization"].includes(b.kind),diamond=["aggregation","composition"].includes(b.kind);
  const dashed=["dependency","realization"].includes(b.kind);
  const end=triangle?'<path d="M144 107 L166 107 L155 120 Z" fill="var(--nl-bg)" stroke="currentColor" stroke-width="2"/>':diamond?`<path d="M155 100 L165 110 L155 120 L145 110 Z" fill="${b.kind==="composition"?"currentColor":"var(--nl-bg)"}" stroke="currentColor" stroke-width="2"/>`:b.kind==="dependency"?'<path d="M148 110 L155 120 L162 110" fill="none" stroke="currentColor" stroke-width="2"/>':"";
  return fig(`<div class="ce-uml-label">${s(b.from,"origem")}</div><svg class="ce-uml-link" viewBox="0 42 310 84" role="img" aria-label="${s(b.kind,"relação")}"><path d="${allowed[b.kind]}" fill="none" stroke="currentColor" stroke-width="2"${dashed?' stroke-dasharray="6 4"':""}/>${end}</svg><div class="ce-uml-label">${s(b.to,"destino")}</div>`);
 }
 throw Error("Componente visual não registrado: "+b.type);
}
