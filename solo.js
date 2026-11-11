
(() => {
"use strict";
const URL="https://wwumjtorusjblitkzyjt.supabase.co";
const KEY="sb_publishable_5DS37kwbBFfhOir50K0QyA_54lvldUM";
let db=null,session=null,campaignId=null,busy=false;
const $=id=>document.getElementById(id);
const msg=(id,t,bad)=>{const e=$(id);if(e){e.textContent=t;e.style.color=bad?"#ff9c8e":""}};

function styles(){
 if($("eterSoloStyles"))return;
 const s=document.createElement("style");s.id="eterSoloStyles";
 s.textContent='body.eter-locked .shell{visibility:hidden!important;pointer-events:none!important}'+
 '#eterAuthLayer{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:radial-gradient(ellipse at top,#29364b,#10141e 65%,#080a10);color:#eee8dc;font-family:Inter,system-ui}'+
 '#eterAuthLayer[hidden],#eterSettings[hidden]{display:none!important}.eter-box{width:min(100%,440px);max-height:94vh;overflow:auto;background:#151a25;border:1px solid #80683f;border-radius:16px;padding:23px;box-shadow:0 25px 90px #000b}'+
 '.eter-box h2{font-family:Cinzel,Georgia,serif;color:#f0d39a}.eter-box p{color:#aeb7c7;font-size:13px;line-height:1.6}.eter-label{display:block;color:#d8c39d;font-size:12px;margin:13px 0 5px}'+
 '.eter-input{display:block;width:100%;box-sizing:border-box;background:#0c111b;border:1px solid #465064;color:white;border-radius:8px;padding:13px;font:inherit}.eter-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}'+
 '.eter-btn{flex:1;min-width:120px;padding:11px;border-radius:8px;border:1px solid #d2ae70;background:linear-gradient(135deg,#b58b4c,#80602e);color:#160f08;font-weight:800;cursor:pointer}.eter-btn.alt{background:#222a38;color:#eee4d1;border-color:#59647a}'+
 '#eterAuthNotice,#eterSettingsNotice{min-height:24px;margin-top:12px;font-size:12px;overflow-wrap:anywhere}#eterSettings{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:18px;background:#05070bdd}'+
 '#eterSettingsButton{border:1px solid #b58b4c;border-radius:8px;padding:8px 11px;background:#1b2230;color:#f0d39a;font-weight:800;cursor:pointer}#solo .solo-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}'+
 '#solo .solo-tools button{flex:1;min-width:120px}#solo .story-turn{white-space:pre-wrap;line-height:1.75;padding:15px 0;border-bottom:1px solid #303747;color:#e8e1d4}#solo .story-turn small{display:block;color:#d3ad70;font-size:10px;letter-spacing:1px;margin-bottom:7px}'+
 '#solo .suggested-choices{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}#solo .suggested-choices button{white-space:normal;text-align:left}#solo .solo-setup input,#solo .solo-setup textarea,#solo .solo-setup select{width:100%;margin:5px 0 12px}@media(max-width:600px){#solo .composer{flex-direction:column}}';
 document.head.appendChild(s);
}

function authUI(){
 if(!$("eterAuthLayer")){
  const e=document.createElement("div");e.id="eterAuthLayer";
  e.innerHTML='<section class="eter-box"><div style="font-size:11px;letter-spacing:3px;color:#e6c68d">CRÔNICAS DE ÉTER</div><h2>Entre para iniciar sua jornada</h2><p>Faça login ou crie sua conta. A aventura só será liberada após a autenticação.</p><label class="eter-label">E-mail</label><input class="eter-input" id="eterEmail" type="email" autocomplete="username"><label class="eter-label">Senha</label><input class="eter-input" id="eterPassword" type="password" autocomplete="current-password"><div class="eter-actions"><button class="eter-btn" id="eterLogin">ENTRAR</button><button class="eter-btn alt" id="eterRegister">CRIAR CONTA</button></div><div id="eterAuthNotice"></div></section>';
  document.body.appendChild(e);
 }
 if(!$("eterSettings")){
  const e=document.createElement("div");e.id="eterSettings";e.hidden=true;
  e.innerHTML='<section class="eter-box"><h2>Configurações da conta</h2><div id="eterUserLabel" style="font-size:12px;color:#a9c99e;overflow-wrap:anywhere"></div><div id="eterSettingsOut"><label class="eter-label">E-mail</label><input class="eter-input" id="eterEmail2" type="email"><label class="eter-label">Senha</label><input class="eter-input" id="eterPassword2" type="password"><div class="eter-actions"><button class="eter-btn" id="eterLogin2">ENTRAR</button><button class="eter-btn alt" id="eterRegister2">CRIAR CONTA</button></div></div><div id="eterSettingsIn" hidden><div class="eter-actions"><button class="eter-btn alt" id="eterLogout">SAIR DA CONTA</button></div></div><div id="eterSettingsNotice"></div><div class="eter-actions"><button class="eter-btn alt" id="eterCloseSettings">FECHAR</button></div></section>';
  document.body.appendChild(e);
 }
 if(!$("eterSettingsButton")){
  const b=document.createElement("button");b.id="eterSettingsButton";b.textContent="⚙ Conta";
  document.querySelector(".topright")?.appendChild(b);
 }
 $("eterLogin").onclick=()=>auth("login","eterEmail","eterPassword","eterAuthNotice");
 $("eterRegister").onclick=()=>auth("register","eterEmail","eterPassword","eterAuthNotice");
 $("eterLogin2").onclick=()=>auth("login","eterEmail2","eterPassword2","eterSettingsNotice");
 $("eterRegister2").onclick=()=>auth("register","eterEmail2","eterPassword2","eterSettingsNotice");
 $("eterLogout").onclick=async()=>{
  const r=await db.auth.signOut();
  if(r.error)return msg("eterSettingsNotice",r.error.message,true);
  session=null;campaignId=null;lockUI();$("eterSettings").hidden=true;
 };
 $("eterSettingsButton").onclick=()=>$("eterSettings").hidden=false;
 $("eterCloseSettings").onclick=()=>$("eterSettings").hidden=true;
 $("eterSettings").onclick=e=>{if(e.target.id==="eterSettings")e.currentTarget.hidden=true};
}

function lockUI(){
 const yes=!!session?.user;
 document.body.classList.toggle("eter-locked",!yes);
 $("eterAuthLayer").hidden=yes;
 $("eterSettingsOut").hidden=yes;
 $("eterSettingsIn").hidden=!yes;
 $("eterUserLabel").textContent=yes?"Conectado: "+session.user.email:"Nenhuma conta conectada";
 $("eterSettingsButton").textContent=yes?"⚙ Configurações":"⚙ Entrar";
 if(!yes){
  $("playerAction")?.setAttribute("disabled","");
  $("sendAction")?.setAttribute("disabled","");
 }
}

async function auth(kind,emailId,passId,nid){
 const email=$(emailId).value.trim(),password=$(passId).value;
 if(!email||!password)return msg(nid,"Preencha e-mail e senha.",true);
 if(kind==="register"&&password.length<6)return msg(nid,"A senha precisa ter pelo menos 6 caracteres.",true);
 msg(nid,kind==="login"?"Entrando...":"Criando conta...");
 try{
  const r=kind==="login"
   ?await db.auth.signInWithPassword({email,password})
   :await db.auth.signUp({email,password});
  if(r.error)throw r.error;
  if(r.data.session){
   session=r.data.session;lockUI();$("eterSettings").hidden=true;
   await listCampaigns();msg(nid,"Login realizado.");
  }else msg(nid,"Conta criada. Confirme o e-mail se solicitado e depois entre.");
 }catch(e){msg(nid,e.message,true)}
}

function addJourneyTab(){
 const nav=$("nav");
 if(nav&&!nav.querySelector('[data-tab="solo"]')){
  const b=document.createElement("button");
  b.dataset.tab="solo";
  b.innerHTML='<span class="ico">✧</span>Mestre IA · Jornada';
  nav.appendChild(b);
 }
}

function addTools(){
 const sel=$("campaignSelect");
 if(!sel||$("eterSoloTools"))return;
 const w=document.createElement("div");
 w.id="eterSoloTools";w.className="solo-tools";
 w.innerHTML='<button class="btn ghost" id="eterContinue">▶ Continuar jornada</button><button class="btn ghost" id="eterRestart">↻ Reiniciar em nova campanha</button>';
 sel.insertAdjacentElement("afterend",w);
 $("eterContinue").onclick=()=>sel.value?loadCampaign(sel.value):msg("turnFeedback","Selecione uma campanha salva.",true);
 $("eterRestart").onclick=()=>{
  if($("campaignTitle"))$("campaignTitle").value=($("campaignTitle").value||"Minha jornada")+" — Novo começo";
  createCampaign();
 };
}

function setPlay(on){
 $("playerAction")?.toggleAttribute("disabled",!on);
 $("sendAction")?.toggleAttribute("disabled",!on);
}

async function listCampaigns(){
 if(!session)return;
 const sel=$("campaignSelect");
 const r=await db.from("campaigns").select("id,title,updated_at").eq("user_id",session.user.id).order("updated_at",{ascending:false});
 if(r.error){msg("turnFeedback","Erro ao buscar campanhas: "+r.error.message,true);return}
 sel.innerHTML='<option value="">Selecione uma campanha salva</option>';
 (r.data||[]).forEach(c=>{
  const o=document.createElement("option");o.value=c.id;o.textContent=c.title;sel.appendChild(o);
 });
 if(r.data?.length){sel.value=r.data[0].id;await loadCampaign(r.data[0].id)}
 else{campaignId=null;setPlay(false)}
}

function renderTurn(t){
 const log=$("storyLog");if(!log||!t)return;
 log.querySelector(".story-empty")?.remove();
 const a=document.createElement("article");a.className="story-turn";
 const h=document.createElement("small");h.textContent="CENA "+t.turn_number;
 const p=document.createElement("div");p.textContent=t.scene_text||"";
 a.append(h,p);log.appendChild(a);
 const box=$("suggestedChoices");box.innerHTML="";
 (t.options||[]).forEach(o=>{
  const b=document.createElement("button");b.className="btn ghost";
  b.textContent=(o.key?o.key+" · ":"")+o.text;
  b.onclick=()=>send({input_mode:"choice",selected_option_key:o.key});
  box.appendChild(b);
 });
 log.scrollTop=log.scrollHeight;
}

async function loadCampaign(id){
 if(!session||!id)return;
 campaignId=id;setPlay(false);
 msg("turnFeedback","Carregando jornada salva...");
 const q=await Promise.all([
  db.from("campaigns").select("*").eq("id",id).eq("user_id",session.user.id).single(),
  db.from("narrative_turns").select("id,turn_number,scene_text,options,scene_state,image_url").eq("campaign_id",id).eq("user_id",session.user.id).order("turn_number",{ascending:true}),
  db.from("characters").select("name,class,level,experience,resources").eq("campaign_id",id).eq("user_id",session.user.id).limit(1).maybeSingle()
 ]);
 if(q[0].error||q[1].error){msg("turnFeedback",(q[0].error||q[1].error).message,true);return}
 const c=q[0].data,turns=q[1].data||[],ch=q[2].data;
 if($("campaignTitle"))$("campaignTitle").value=c.title||"";
 if($("campaignPremise"))$("campaignPremise").value=c.premise||"";
 if($("campaignStory"))$("campaignStory").value=c.world_canon||"";
 if($("campaignRules"))$("campaignRules").value=c.house_rules||"";
 $("storyLog").innerHTML="";
 if(turns.length)turns.forEach(renderTurn);
 else $("storyLog").innerHTML='<div class="story-empty">Campanha criada. Envie sua primeira ação para começar.</div>';
 setPlay(true);
 const r=ch?.resources||{};
 $("soloState").textContent=ch
  ?("Personagem: "+ch.name+" · "+ch.class+" · Nível "+ch.level+" · XP "+ch.experience+" · HP "+(r.hp??"—")+"/"+(r.hp_max??"—")+" · Mana "+(r.mana??"—")+"/"+(r.mana_max??"—"))
  :"Personagem não cadastrado";
 msg("turnFeedback","Jornada carregada: "+c.title+". "+turns.length+" cenas salvas.");
 $("soloStatus").textContent="● Jornada conectada";
 $("masterStatus").textContent="MAIAR · Gemini";
 $("adminStatus").textContent="OTA · Groq";
}

async function createCampaign(){
 if(!session){$("eterSettings").hidden=false;return}
 if(busy)return;
 busy=true;msg("turnFeedback","Criando campanha e personagem...");
 try{
  const title=$("campaignTitle").value.trim()||"Nova campanha";
  const premise=$("campaignPremise").value.trim()||"Uma aventura de fantasia medieval.";
  const world=$("campaignWorld").value.trim();
  const story=$("campaignStory").value.trim();
  const rules=$("campaignRules").value.trim()||"Testes com D20 + modificador contra dificuldade.";
  const c=await db.from("campaigns").insert({
   user_id:session.user.id,title,premise,
   world_canon:[world,story].filter(Boolean).join("\n\n"),
   house_rules:rules
  }).select("id").single();
  if(c.error)throw c.error;
  const ch=await db.from("characters").insert({
   campaign_id:c.data.id,user_id:session.user.id,
   name:"Aventureiro",class:"Viajante",level:1,experience:0,
   attributes:{for:10,des:10,con:10,int:10,sab:10,car:10},
   resources:{hp:30,hp_max:30,mana:20,mana_max:20,stamina:20,stamina_max:20,gold:25,inventory:[]}
  });
  if(ch.error)throw ch.error;
  const se=await db.from("game_sessions").insert({
   campaign_id:c.data.id,user_id:session.user.id,
   status:"active",current_region:"Local de partida",
   world_state:{chapter:1,day:1}
  });
  if(se.error)throw se.error;
  await listCampaigns();
  $("campaignSelect").value=c.data.id;
  await loadCampaign(c.data.id);
  await send({
   input_mode:"free_text",
   player_text:"Comece a jornada. Apresente o cenário inicial, meu personagem, uma situação urgente e escolhas para agir."
  });
 }catch(e){msg("turnFeedback","Erro ao criar jornada: "+e.message,true)}
 finally{busy=false}
}

async function saveRules(){
 if(!session||!campaignId)return msg("turnFeedback","Selecione uma campanha.",true);
 const r=await db.from("campaigns").update({
  title:$("campaignTitle").value.trim(),
  premise:$("campaignPremise").value.trim(),
  world_canon:[$("campaignWorld").value.trim(),$("campaignStory").value.trim()].filter(Boolean).join("\n\n"),
  house_rules:$("campaignRules").value.trim(),
  updated_at:new Date().toISOString()
 }).eq("id",campaignId).eq("user_id",session.user.id);
 msg("turnFeedback",r.error?"Erro ao salvar: "+r.error.message:"Regras e cânone salvos.",!!r.error);
}

async function send(payload){
 if(!session||!campaignId||busy)return;
 busy=true;setPlay(false);
 msg("turnFeedback","OTA está calculando a ação; MAIAR está narrando...");
 try{
  const r=await db.functions.invoke("submit-player-action",{
   body:Object.assign({campaign_id:campaignId},payload)
  });
  if(r.error)throw r.error;
  if(r.data?.error)throw new Error(r.data.detail||r.data.error);
  if(r.data.narrative)renderTurn(r.data.narrative);
  const a=r.data.administrator||{},e=a.effects_applied||{};
  const result=a.roll==null?"Ação sem teste":
   "D20 "+a.roll+" "+(a.modifier>=0?"+":"")+a.modifier+
   " = "+a.total+" / CD "+a.difficulty+" · "+(a.success?"SUCESSO":"FALHA");
  msg("turnFeedback",result+
   " · XP "+(e.xp>=0?"+":"")+(e.xp||0)+
   " · HP "+(e.hp>=0?"+":"")+(e.hp||0)+
   " · Mana "+(e.mana>=0?"+":"")+(e.mana||0)+
   " · Ouro "+(e.gold>=0?"+":"")+(e.gold||0));
  await loadCampaign(campaignId);
  $("playerAction").value="";
 }catch(e){msg("turnFeedback","Falha na interação: "+e.message,true)}
 finally{busy=false;setPlay(!!campaignId)}
}

function bind(){
 addJourneyTab();addTools();
 $("createCampaign")?.addEventListener("click",createCampaign);
 $("saveCampaignRules")?.addEventListener("click",saveRules);
 $("sendAction")?.addEventListener("click",()=>{
  const v=$("playerAction")?.value.trim();
  if(v)send({input_mode:"free_text",player_text:v});
  else msg("turnFeedback","Descreva o que deseja fazer.",true);
 });
 $("playerAction")?.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("sendAction").click()}
 });
 $("campaignSelect")?.addEventListener("change",e=>loadCampaign(e.target.value));
 $("rollD20")?.addEventListener("click",()=>{
  msg("turnFeedback","Rolagem livre D20: "+(1+Math.floor(Math.random()*20)));
 });
}

async function sdk(){
 if(window.supabase?.createClient)return;
 await new Promise((ok,no)=>{
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  s.onload=ok;s.onerror=()=>no(new Error("Falha ao carregar Supabase SDK"));
  document.head.appendChild(s);
 });
}

async function init(){
 styles();document.body.classList.add("eter-locked");authUI();
 try{
  await sdk();
  db=window.supabase.createClient(URL,KEY,{
   auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  const r=await db.auth.getSession();
  if(r.error)throw r.error;
  session=r.data.session;
  bind();lockUI();
  db.auth.onAuthStateChange((_e,s)=>{
   session=s;lockUI();
   if(s)Promise.resolve().then(listCampaigns);
  });
  if(session)await listCampaigns();
  else msg("eterAuthNotice","Entre para abrir sua jornada.");
 }catch(e){msg("eterAuthNotice","Erro de conexão: "+e.message,true)}
}

if(document.readyState==="loading")
 document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
