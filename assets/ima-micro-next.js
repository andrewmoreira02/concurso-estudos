/* Avanço da trilha: depois de enviar o quiz IMA, sugerir próximo texto.
   Abrir a próxima microaula não comprova resposta nem marca Lido. */
(()=>{'use strict';
const node=document.getElementById('imaNextLesson');
if(!node)return;
const link=document.getElementById('imaNextLink'),status=document.getElementById('imaNextStatus');
const unitId=new URLSearchParams(location.search).get('u');
async function init(){
 try{
  const r=await fetch('../dados/microaulas-ima.json',{cache:'no-store'});
  if(!r.ok)throw Error('catálogo indisponível');
  const d=await r.json();const list=d.units||[];
  const at=list.findIndex(x=>x.id===unitId);if(at<0)throw Error('unidade inválida');
  const next=list[at+1];
  if(next){link.href='microaula-ima.html?u='+next.id;link.textContent='Próxima microaula: '+next.title;}
  else{link.href='../aulas.html#ima-microtrilha';link.textContent='Ver trilha e lacunas do edital';}
  node.hidden=false;
 }catch{status.textContent='Consulte o catálogo para selecionar a próxima microaula.';}
}
addEventListener('ce:practice-recorded',e=>{
 if(e.detail?.exam!=='ima')return;
 status.textContent='Respostas enviadas e registradas para o IMA. Confira a correção acima e prossiga para a microaula seguinte; erros geram revisões.';
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();