/* Aviso de inscrição (IMA) até confirmação EXPLÍCITA; sem coletar dados pessoais.
   Estado sincronizado pelo pareamento privado; nenhuma inscrição é presumida. */
(()=>{'use strict';
const KEY='ce_registration_v1',prefix=location.pathname.includes('/aulas/')?'../':'';
const root=document.querySelector('main');if(!root)return;
const inSaoPaulo=()=>{
 const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=k=>p.find(x=>x.type===k)?.value;
 return get('year')+'-'+get('month')+'-'+get('day');
};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {};}};
const done=()=>read()?.ima===true;
const section=document.createElement('section');
section.id='ce-registration-ima';section.className='ce-registration';
section.setAttribute('aria-label','Inscrição IMA-SC');
section.innerHTML='<h2>Inscrição IMA-SC — situação não confirmada</h2><p>Não há confirmação registrada de inscrição. Consulte o período e inscreva-se no portal oficial antes do prazo. Este aviso só desaparece quando você confirmar manualmente.</p><div class="ce-reg-actions"><a href="https://concursos.furb.br/informacoes/584" target="_blank" rel="noopener noreferrer">Portal oficial de inscrições FURB</a><button type="button" id="ce-reg-toggle">Já me inscrevi · confirmar</button></div>';
root.prepend(section);
const h=section.querySelector('h2'),p=section.querySelector('p'),button=section.querySelector('button');
function render(){
 const today=inSaoPaulo(),confirmed=done();
 section.classList.toggle('ce-registered',confirmed);
 if(confirmed){h.textContent='IMA-SC · inscrição informada como concluída';p.textContent='Você confirmou a inscrição neste site. Isso é seu registro manual, não validação no portal FURB. Se marcou por engano, desfaça abaixo.';button.textContent='Desfazer confirmação';}
 else if(today>'2026-12-14'){h.textContent='IMA-SC · prazo registrado encerrado, inscrição não confirmada';p.textContent='O prazo informado no edital terminou em 14/12/2026 e não há confirmação sua neste painel. Consulte o portal oficial para verificar inscrições ou eventuais retificações.';button.textContent='Confirmar inscrição que já realizei';}
 else if(today<'2026-11-13'){h.textContent='IMA-SC · inscrição ainda não confirmada';p.textContent='Início previsto em 13/11/2026; acompanhe o edital e confirme somente após inscrição efetiva.';button.textContent='Já me inscrevi · confirmar';}
 else{h.textContent='IMA-SC · inscrição ainda não confirmada';p.textContent='Prazo registrado: 13/11 a 14/12/2026. Sem confirmação de inscrição no site; verifique e realize a inscrição no portal oficial FURB, se ainda não fez.';button.textContent='Já me inscrevi · confirmar';}
}
button.addEventListener('click',()=>{
 const current=read(),next=!done();
 if(next&&!confirm('Você realmente concluiu a inscrição no concurso IMA-SC? Esta marcação é apenas seu autorrelato, não verifica o pagamento ou homologação.'))return;
 try{localStorage.setItem(KEY,JSON.stringify({...current,ima:next}));dispatchEvent(new CustomEvent('concurso:progress-change'));render();}
 catch{p.textContent='Não foi possível salvar sua confirmação no navegador. Verifique o armazenamento local.';}
});
addEventListener('storage',e=>{if(e.key===KEY)render();});
addEventListener('concurso:sync-status',e=>{if(e.detail?.message?.startsWith('Sincronizado'))render();});
render();
})();
