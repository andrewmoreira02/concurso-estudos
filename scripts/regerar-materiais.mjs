import {existsSync,readdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {generate} from "./gerar-aula.mjs";
import {generateQuiz} from "./gerar-questoes.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const check=process.argv.includes("--check");
let count=0;
for(const [folder,fn] of [["dados/aulas-diarias",generate],["dados/questionarios",generateQuiz]]){
 const dir=resolve(root,folder);
 if(!existsSync(dir))continue;
 for(const name of readdirSync(dir).filter(x=>x.endsWith(".json")).sort()){console.log(fn(resolve(dir,name),{check}));count++;}
}
console.log(count+" arquivos gerados/verificados; modelos demonstrativos não são publicados.");
