import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderVisual} from "./componentes-visuais.mjs";
import {renderBlock} from "./componentes-conteudo.mjs";
import {renderQuiz} from "./gerar-questoes.mjs";
const examples=[{"type":"chart","kind":"bar","title":"Exemplo de barras","unit":"itens","points":[{"label":"A","value":4},{"label":"B","value":8}],"explanation":["B tem o dobro de A."]},{"type":"chart","kind":"line","title":"Série de exemplo","unit":"itens","points":[{"label":"1","value":5},{"label":"2","value":3}],"explanation":["A série caiu dois itens."]},{"type":"flow","title":"Sequência","steps":[{"label":"Entrada","detail":"Receber dados"},{"label":"Saída","detail":"Exibir resultado"}],"explanation":["A ordem é de cima para baixo."]},{"type":"uml-relation","kind":"composition","title":"Composição","from":"Parte","to":"Todo","explanation":["O losango preenchido fica no lado do todo."]},{"type":"image","title":"Figura","file":"assets/imagens/exemplo.png","alt":"Descrição","explanation":["Interpretação da imagem."]}];
for(const b of examples){assert.match(renderVisual(b),/ce-visual/);assert.equal(renderBlock(b),renderVisual(b));}
assert.throws(()=>renderVisual({...examples[0],points:[{label:"A",value:-1}]}));
assert.throws(()=>renderVisual({...examples[0],kind:"pizza"}));
assert.throws(()=>renderVisual({...examples[4],file:"../../x.png"}));
const q=JSON.parse(readFileSync(new URL("../modelos/questionario.exemplo.json",import.meta.url),"utf8"));
const h=renderQuiz(q);assert.match(h,/data-ce-quiz/);assert.match(h,/data-ce-question="modelo-grafico-1"/);assert.equal((h.match(/type="radio"/g)||[]).length,4);assert.match(h,/data-ce-explanation hidden/);assert.match(h,/ce-bars/);
assert.throws(()=>renderQuiz({...q,questions:[{...q.questions[0],correct:"z"}]}));
console.log("Componentes compartilhados e contrato de quiz verificados estruturalmente.");
