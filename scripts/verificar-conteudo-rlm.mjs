// Auditoria automatizada de subseções: impedir etapas apenas com botão Lido.
// Rodar na raiz do repositório: node scripts/verificar-conteudo-rlm.mjs
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'aulas/rlm.html'),'utf8');
const headers=[...html.matchAll(/<h[34]\b[^>]*data-lesson-step="(\d+\.\d+)"[^>]*>/g)];
const ids=[...html.matchAll(/\bid="(m\d+-s\d+)"/g)].map(x=>x[1]);
const buttons=[...html.matchAll(/data-step-read="m\d+-s\d+"/g)];
const modules=[...html.matchAll(/data-done="m\d+"/g)];
const issues=[];
if(headers.length!==71||new Set(headers.map(x=>x[1])).size!==71) issues.push('Aula deve manter 71 subseções únicas');
if(ids.length!==71||new Set(ids).size!==71)issues.push('IDs de subseções ausentes ou duplicados');
if(buttons.length!==71)issues.push('Botões Lido faltando');
if(modules.length!==11)issues.push('Controles dos 11 módulos faltando');
let shortest={step:'',characters:Infinity};
for(let i=0;i<headers.length;i++){
  const current=headers[i],end=i+1<headers.length?headers[i+1].index:html.length;
  const id='m'+current[1].replace('.','-s');
  let body=html.slice(current.index+current[0].length,end);
  body=body.replace(/^[\s\S]*?<\/h[34]>/i,'')
    .replace(/<div\s+class="step-toolbar"[\s\S]*?<\/nav><\/div>/g,'')
    .replace(/<div\s+class="chapterend"[\s\S]*$/g,'')
    .replace(/<[^>]*>/g,' ')
    .replace(/&nbsp;|&#160;/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/\s+/g,' ').trim();
  if(body.length<shortest.characters)shortest={step:current[1],characters:body.length};
  if(body.length<110)issues.push(current[1]+': conteúdo insuficiente ('+body.length+' caracteres)');
  if(!html.includes('data-step-read="'+id+'"'))issues.push(current[1]+': falta Lido');
}
if(issues.length){
  console.error('AUDITORIA RLM REPROVADA\n'+issues.map(x=>' - '+x).join('\n'));
  process.exitCode=1;
}else console.log('AUDITORIA RLM APROVADA: 71 subseções e botões Lido; menor texto em '+shortest.step+' ('+shortest.characters+' caracteres)');
