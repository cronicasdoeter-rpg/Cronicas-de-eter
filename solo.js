(() => {
"use strict";

const URL="https://wwumjtorusjblitkzyjt.supabase.co";
const KEY="sb_publishable_5DS37kwbBFfhOir50K0QyA_54lvldUM";

let db=null,session=null,campaignId=null,busy=false;
let characterDead=false;

window.eterCharacterDead=false;

const $=id=>document.getElementById(id);

const msg=(id,t,bad)=>{
 const e=$(id);
 if(e){
  e.textContent=t;
  e.style.color=bad?"#ff9c8e":"";
 }
};

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

function styles(){
 if($("eterSoloStyles"))return;
 const s=document.createElement("style");
 s.id="eterSoloStyles";
 s.textContent=
 'body.eter-locked .shell{visibility:hidden!important;pointer-events:none!important}'+
 '#eterAuthLayer{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:radial-gradient(ellipse at top,#29364b,#10141e 65%,#080a10);color:#eee8dc;font-family:Inter,system-ui}'+
 '#eterAuthLayer[hidden],#eterSettings[hidden]{display:none!important}'+
 '.eter-box{width:min(100%,440px);max-height:94vh;overflow:auto;background:#151a25;border:1px solid #80683f;border-radius:16px;padding:23px;box-shadow:0 25px 90px #000b}'+
 '.eter-box h2{font-family:Cinzel,Georgia,serif;color:#f0d39a}'+
 '.eter-box p{color:#aeb7c7;font-size:13px;line-height:1.6}'+
 '.eter-label{display:block;color:#d8c39d;font-size:12px;margin:13px 0 5px}'+
 '.eter-input{display:block;width:100%;box-sizing:border-box;background:#0c111b;border:1px solid #465064;color:white;border-radius:8px;padding:13px;font:inherit}'+
 '.eter-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}'+
 '.eter-btn{flex:1;min-width:120px;padding:11px;border-radius:8px;border:1px solid #d2ae70;background:linear-gradient(135deg,#b58b4c,#80602e);color:#160f08;font-weight:800;cursor:pointer}'+
 '.eter-btn.alt{background:#222a38;color:#eee4d1;border-color:#59647a}'+
 '#eterAuthNotice,#eterSettingsNotice{min-height:24px;margin-top:12px;font-size:12px;overflow-wrap:anywhere}'+
 '#eterSettings{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:18px;background:#05070bdd}'+
 '#eterSettingsButton{border:1px solid #b58b4c;border-radius:8px;padding:8px 11px;background:#1b2230;color:#f0d39a;font-weight:800;cursor:pointer}'+
 '#solo .solo-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}'+
 '#solo .solo-tools button{flex:1;min-width:120px}'+
 '#solo .story-turn{white-space:normal;line-height:1.7;padding:15px;margin:14px 0;border:1px solid #4b4050;border-radius:14px;background:linear-gradient(145deg,#171d29,#10151f);color:#e8e1d4;box-shadow:0 8px 22px #0003}'+
 '#solo .story-turn small{display:block;color:#d3ad70;font-size:10px;letter-spacing:1px;margin-bottom:10px}'+
 '#solo .story-narrator{white-space:pre-wrap;padding:12px 14px;margin:9px 0;border-left:3px solid #b58b4c;border-radius:8px;background:#242332;color:#eee6d8}'+
 '#solo .story-dialogue{white-space:pre-wrap;padding:12px 14px;margin:9px 0 9px 12px;border:1px solid #53647c;border-radius:12px;background:linear-gradient(135deg,#202c3d,#17202d);color:#e9f0fa}'+
 '#solo .story-dialogue strong{display:block;color:#eacb91;font-size:12px;margin-bottom:5px}'+
 '#solo .story-player{white-space:pre-wrap;padding:12px 14px;margin:9px 0 9px 24px;border:1px solid #80683f;border-radius:12px;background:#302719;color:#ffe8bd}'+
 '#solo .story-live{border-color:#c6a15f;box-shadow:0 0 0 1px #c6a15f33,0 8px 22px #0004}'+
 '#solo .story-live-label{color:#e7c47e;font-size:11px;margin-bottom:8px}'+
 '#solo .suggested-choices{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}'+
 '#solo .suggested-choices button{white-space:normal;text-align:left}'+
 '#solo .journey-character{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0;padding:12px;border:1px solid #66543b;border-radius:12px;background:linear-gradient(135deg,#1b2431,#151923);color:#eee5d5}'+
 '#solo .jc-head{grid-column:1/-1;display:flex;justify-content:space-between;gap:8px;align-items:center;border-bottom:1px solid #ffffff20;padding-bottom:8px}'+
 '#solo .jc-name{font-weight:800;color:#f0d39a}'+
 '#solo .jc-level{font-size:11px;color:#aeb7c7}'+
 '#solo .jc-stat{padding:8px;border-radius:8px;background:#0c121d;border:1px solid #ffffff12;font-size:12px}'+
 '#solo .jc-stat b{display:block;margin-bottom:5px}'+
 '#solo .jc-bar{height:6px;background:#303847;border-radius:8px;overflow:hidden;margin-top:6px}'+
 '#solo .jc-bar i{display:block;height:100%;background:#9d4f4f}'+
 '#solo .jc-bar.mana i{background:#4c83bb}'+
 '#solo .jc-attrs{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}'+
 '#solo .jc-attrs span{background:#ffffff0b;padding:6px;border-radius:6px;text-align:center;font-size:11px}'+
 '#solo .jc-meta{grid-column:1/-1;color:#c5bda9;font-size:11px}'+
 '#solo .composer{gap:8px}'+
 '#solo .eter-death{padding:16px;margin:12px 0;border:1px solid #a33;border-radius:12px;background:#321719;color:#ffd9d9;font-weight:800;text-align:center}'+
 '@media(max-width:600px){#solo .composer{flex-direction:column}#solo .journey-character{grid-template-columns:1fr 1fr}}';
 document.head.appendChild(s);
}

function authUI(){
 if(!$("eterAuthLayer")){
  const e=document.createElement("div");
  e.id="eterAuthLayer";
  e.innerHTML=
   '<section class="eter-box">'+
   '<div style="font-size:11px;letter-spacing:3px;color:#e6c68d">CRÔNICAS DE ÉTER</div>'+
   '<h2>Entre para iniciar sua jornada</h2>'+
   '<p>Faça login ou crie sua conta. A aventura só será liberada após a autenticação.</p>'+
   '<label class="eter-label">E-mail</label>'+
   '<input class="eter-input" id="eterEmail" type="email" autocomplete="username">'+
   '<label class="eter-label">Senha</label>'+
   '<input class="eter-input" id="eterPassword" type="password" autocomplete="current-password">'+
   '<div class="eter-actions">'+
   '<button class="eter-btn" id="eterLogin">ENTRAR</button>'+
   '<button class="eter-btn alt" id="eterRegister">CRIAR CONTA</button>'+
   '</div>'+
   '<div id="eterAuthNotice"></div>'+
   '</section>';
  document.body.appendChild(e);
 }

 if(!$("eterSettings")){
  const e=document.createElement("div");
  e.id="eterSettings";
  e.hidden=true;
  e.innerHTML=
   '<section class="eter-box">'+
   '<h2>Configurações da conta</h2>'+
   '<div id="eterUserLabel" style="font-size:12px;color:#a9c99e;overflow-wrap:anywhere"></div>'+
   '<div id="eterSettingsOut">'+
   '<label class="eter-label">E-mail</label>'+
   '<input class="eter-input" id="eterEmail2" type="email">'+
   '<label class="eter-label">Senha</label>'+
   '<input class="eter-input" id="eterPassword2" type="password">'+
   '<div class="eter-actions">'+
   '<button class="eter-btn" id="eterLogin2">ENTRAR</button>'+
   '<button class="eter-btn alt" id="eterRegister2">CRIAR CONTA</button>'+
   '</div>'+
   '</div>'+
   '<div id="eterSettingsIn" hidden>'+
   '<div class="eter-actions">'+
   '<button class="eter-btn alt" id="eterLogout">SAIR DA CONTA</button>'+
   '</div>'+
   '</div>'+
   '<div id="eterSettingsNotice"></div>'+
   '<div class="eter-actions">'+
   '<button class="eter-btn alt" id="eterCloseSettings">FECHAR</button>'+
   '</div>'+
   '</section>';
  document.body.appendChild(e);
 }

 if(!$("eterSettingsButton")){
  const b=document.createElement("button");
  b.id="eterSettingsButton";
  b.textContent="⚙ Conta";
  document.querySelector(".topright")?.appendChild(b);
 }

 $("eterLogin").onclick=()=>auth("login","eterEmail","eterPassword","eterAuthNotice");
 $("eterRegister").onclick=()=>auth("register","eterEmail","eterPassword","eterAuthNotice");
 $("eterLogin2").onclick=()=>auth("login","eterEmail2","eterPassword2","eterSettingsNotice");
 $("eterRegister2").onclick=()=>auth("register","eterEmail2","eterPassword2","eterSettingsNotice");

 $("eterLogout").onclick=async()=>{
  const r=await db.auth.signOut();
  if(r.error)return msg("eterSettingsNotice",r.error.message,true);
  session=null;
  campaignId=null;
  characterDead=false;
  window.eterCharacterDead=false;
  lockUI();
  $("eterSettings").hidden=true;
 };

 $("eterSettingsButton").onclick=()=>$("eterSettings").hidden=false;
 $("eterCloseSettings").onclick=()=>$("eterSettings").hidden=true;
 $("eterSettings").onclick=e=>{
  if(e.target.id==="eterSettings")e.currentTarget.hidden=true;
 };
}

function lockUI(){
 const yes=!!session?.user;
 document.body.classList.toggle("eter-locked",!yes);
 $("eterAuthLayer").hidden=yes;
 $("eterSettingsOut").hidden=yes;
 $("eterSettingsIn").hidden=!yes;
 $("eterUserLabel").textContent=yes
  ?"Conectado: "+session.user.email
  :"Nenhuma conta conectada";
 $("eterSettingsButton").textContent=yes
  ?"⚙ Configurações"
  :"⚙ Entrar";
 if(!yes)setPlay(false);
}

async function auth(kind,emailId,passId,nid){
 const email=$(emailId).value.trim();
 const password=$(passId).value;
 if(!email||!password)return msg(nid,"Preencha e-mail e senha.",true);
 if(kind==="register"&&password.length<6)
  return msg(nid,"A senha precisa ter pelo menos 6 caracteres.",true);
 msg(nid,kind==="login"?"Entrando...":"Criando conta...");
 try{
  const r=kind==="login"
   ?await db.auth.signInWithPassword({email,password})
   :await db.auth.signUp({email,password});
  if(r.error)throw r.error;
  if(r.data.session){
   session=r.data.session;
   lockUI();
   $("eterSettings").hidden=true;
   await listCampaigns();
   msg(nid,"Login realizado.");
  }else{
   msg(nid,"Conta criada. Confirme o e-mail se solicitado e depois entre.");
  }
 }catch(e){
  msg(nid,e.message,true);
 }
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
 w.id="eterSoloTools";
 w.className="solo-tools";
 w.innerHTML=
  '<button class="btn ghost" id="eterContinue">▶ Continuar jornada</button>'+
  '<button class="btn ghost" id="eterRestart">↻ Reiniciar em nova campanha</button>';
 sel.insertAdjacentElement("afterend",w);
 $("eterContinue").onclick=()=>{
  sel.value
   ?loadCampaign(sel.value)
   :msg("turnFeedback","Selecione uma campanha salva.",true);
 };
 $("eterRestart").onclick=()=>{
  if($("campaignTitle"))
   $("campaignTitle").value=($("campaignTitle").value||"Minha jornada")+" — Novo começo";
  createCampaign();
 };
}

function setPlay(on){
 const allowed=!!on&&!characterDead&&!window.eterCharacterDead;
 $("playerAction")?.toggleAttribute("disabled",!allowed);
 $("sendAction")?.toggleAttribute("disabled",!allowed);
 document.querySelectorAll("#suggestedChoices button").forEach(b=>{
  b.disabled=!allowed;
 });
}

async function listCampaigns(){
 if(!session)return;
 const sel=$("campaignSelect");
 const r=await db.from("campaigns")
  .select("id,title,updated_at")
  .eq("user_id",session.user.id)
  .order("updated_at",{ascending:false});
 if(r.error){
  msg("turnFeedback","Erro ao buscar campanhas: "+r.error.message,true);
  return;
 }
 sel.innerHTML='<option value="">Selecione uma campanha salva</option>';
 (r.data||[]).forEach(c=>{
  const o=document.createElement("option");
  o.value=c.id;
  o.textContent=c.title;
  sel.appendChild(o);
 });
 if(r.data?.length){
  sel.value=r.data[0].id;
  await loadCampaign(r.data[0].id);
 }else{
  campaignId=null;
  characterDead=false;
  window.eterCharacterDead=false;
  setPlay(false);
 }
}

function renderCharacter(ch){
 const host=$("soloState");
 if(!host)return;
 if(!ch){
  host.textContent="Personagem não cadastrado";
  return;
 }
 const r=ch.resources||{};
 const a=ch.attributes||{};
 const hp=Number(r.hp??0);
 const hpMax=Math.max(1,Number(r.hp_max??r.max_hp??30));
 const mana=Number(r.mana??0);
 const manaMax=Math.max(1,Number(r.mana_max??r.max_mana??20));
 const stamina=Number(r.stamina??0);
 const staminaMax=Math.max(1,Number(r.stamina_max??r.max_stamina??20));
 const attrs=[
  ["FOR",a.for??a.str??10],["DES",a.des??a.dex??10],
  ["CON",a.con??10],["INT",a.int??10],
  ["SAB",a.sab??a.wis??10],["CAR",a.car??a.cha??10]
 ];
 host.innerHTML=
 '<section class="journey-character">'+
 '<div class="jc-head"><div>'+
 '<div class="jc-name">🧙 '+esc(ch.name||"Aventureiro")+'</div>'+
 '<div class="jc-level">'+esc(ch.class||"Viajante")+' · Nível '+esc(ch.level??1)+'</div>'+
 '</div><div class="jc-level">✨ '+esc(ch.experience??0)+' XP</div></div>'+
 '<div class="jc-stat"><b>❤️ HP '+hp+' / '+hpMax+'</b>'+
 '<div class="jc-bar"><i style="width:'+Math.max(0,Math.min(100,hp/hpMax*100))+'%"></i></div></div>'+
 '<div class="jc-stat"><b>🔷 Mana '+mana+' / '+manaMax+'</b>'+
 '<div class="jc-bar mana"><i style="width:'+Math.max(0,Math.min(100,mana/manaMax*100))+'%"></i></div></div>'+
 '<div class="jc-stat"><b>⚡ Energia '+stamina+' / '+staminaMax+'</b>'+
 '<div class="jc-bar mana"><i style="width:'+Math.max(0,Math.min(100,stamina/staminaMax*100))+'%"></i></div></div>'+
 '<div class="jc-stat"><b>🪙 Ouro</b>'+esc(r.gold??0)+'</div>'+
 '<div class="jc-attrs">'+attrs.map(x=>'<span>'+x[0]+' · '+esc(x[1])+'</span>').join("")+'</div>'+
 '<div class="jc-meta">🛡️ Condição: '+
 esc(Array.isArray(r.status_effects)&&r.status_effects.length
  ?r.status_effects.join(", "):"Sem efeitos negativos registrados")+
 '<br>🎒 Itens: '+
 (Array.isArray(r.inventory)?r.inventory.reduce((n,x)=>n+Number(x.quantity||1),0):0)+
 ' · Abra o inventário para ver os detalhes.</div></section>';

 if(characterDead){
  host.insertAdjacentHTML("beforeend",
   '<div class="eter-death">☠️ PERSONAGEM MORTO — MORTE PERMANENTE<br>Esta jornada não pode continuar.</div>');
 }
}

/* RENDERIZA A CENA E AS ESCOLHAS */
function renderTurn(t,playerAction){
 const log=$("storyLog");
 if(!log||!t)return;
 log.querySelector(".story-empty")?.remove();

 const a=document.createElement("article");
 a.className="story-turn";
 const h=document.createElement("small");
 h.textContent="📜 CENA "+(t.turn_number??"");
 a.appendChild(h);

 if(playerAction){
  const p=document.createElement("div");
  p.className="story-player";
  p.textContent="🧑 Você: "+playerAction;
  a.appendChild(p);
 }

 const body=document.createElement("div");
 const raw=String(t.scene_text||"");
 raw.split(/\n+/).filter(Boolean).forEach(line=>{
  const m=line.match(/^\s*([A-ZÀ-Ú][^:\n]{1,35}):\s*(.+)$/u);
  const d=document.createElement("div");
  if(m){
   d.className="story-dialogue";
   const who=document.createElement("strong");
   who.textContent="💬 "+m[1];
   const speech=document.createElement("div");
   speech.textContent=m[2];
   d.append(who,speech);
  }else if(/^\s*[—–]/.test(line)){
   d.className="story-dialogue";
   d.textContent="💬 "+line.replace(/^\s*[—–]\s*/,"");
  }else{
   d.className="story-narrator";
   d.textContent="📖 "+line;
  }
  body.appendChild(d);
 });
 a.appendChild(body);
 log.appendChild(a);

 const box=$("suggestedChoices");
 if(box){
  box.innerHTML="";
  let options=Array.isArray(t.options)?t.options:[];
  if(typeof t.options==="string"){
   try{options=JSON.parse(t.options)}catch{options=[]}
  }
  options.forEach((o,i)=>{
   const key=String(o?.key||String.fromCharCode(65+i));
   const choiceText=String(o?.text||o?.label||o||"").trim();
   if(!choiceText)return;
   const b=document.createElement("button");
   b.className="btn ghost";
   b.textContent=key+" · "+choiceText;
   b.disabled=characterDead;
   b.onclick=()=>send({
    input_mode:"choice",
    selected_option_key:key,
    display_text:choiceText
   });
   box.appendChild(b);
  });
 }
 log.scrollTop=log.scrollHeight;
}

/* CARREGA CAMPANHA E VERIFICA MORTE PERMANENTE */
async function loadCampaign(id,optimisticTurn=null,optimisticAction=''){
 if(!session||!id)return;
 campaignId=id;
 setPlay(false);
 msg("turnFeedback","Carregando jornada salva...");

 const q=await Promise.all([
  db.from("campaigns").select("*")
   .eq("id",id).eq("user_id",session.user.id).single(),
  db.from("narrative_turns")
   .select("id,turn_number,scene_text,options,scene_state,image_url")
   .eq("campaign_id",id).eq("user_id",session.user.id)
   .order("turn_number",{ascending:true}),
  db.from("characters")
   .select("name,class,level,experience,attributes,resources")
   .eq("campaign_id",id).eq("user_id",session.user.id)
   .limit(1).maybeSingle()
 ]);

 if(q[0].error||q[1].error||q[2].error){
  msg("turnFeedback",(q[0].error||q[1].error||q[2].error).message,true);
  return;
 }

 const c=q[0].data;
 const turns=q[1].data||[];
 if(optimisticTurn&&optimisticTurn.id&&!turns.some(t=>t.id===optimisticTurn.id))
  turns.push(optimisticTurn);
 const ch=q[2].data;

 const hp=Number(ch?.resources?.hp??0);
 characterDead=!!(
  ch?.resources?.dead===true||
  ch?.resources?.permanent_death===true||
  (ch&&hp<=0)
 );
 window.eterCharacterDead=characterDead;

 if($("campaignTitle"))$("campaignTitle").value=c.title||"";
 if($("campaignPremise"))$("campaignPremise").value=c.premise||"";
 if($("campaignStory"))$("campaignStory").value=c.world_canon||"";
 if($("campaignRules"))$("campaignRules").value=c.house_rules||"";

 $("storyLog").innerHTML="";
 if(turns.length){
  turns.forEach(t=>renderTurn(
   t,
   optimisticTurn&&t.id===optimisticTurn.id?optimisticAction:""
  ));
 }else{
  $("storyLog").innerHTML=
   '<div class="story-empty">Campanha criada. Envie sua primeira ação para começar.</div>';
  if($("suggestedChoices"))$("suggestedChoices").innerHTML="";
 }

 renderCharacter(ch);
 setPlay(true);

 if(characterDead){
  msg("turnFeedback","☠️ MORTE PERMANENTE: este personagem morreu. As ações desta jornada estão bloqueadas.",true);
  $("soloStatus").textContent="☠️ Personagem morto";
 }else{
  msg("turnFeedback","Jornada carregada: "+c.title+". "+turns.length+" cenas salvas.");
  $("soloStatus").textContent="● Jornada conectada";
 }

 $("masterStatus").textContent="MAIAR · Groq principal / Gemini reserva";
 $("adminStatus").textContent="OTA · Groq";
}

async function createCampaign(){
 if(!session){
  $("eterSettings").hidden=false;
  return;
 }
 if(busy)return;
 busy=true;
 setPlay(false);
 msg("turnFeedback","Criando campanha e personagem...");

 try{
  const title=$("campaignTitle").value.trim()||"Nova campanha";
  const premise=$("campaignPremise").value.trim()||"Uma aventura de fantasia medieval.";
  const world=$("campaignWorld").value.trim();
  const story=$("campaignStory").value.trim();
  const rules=$("campaignRules").value.trim()||
   "Testes com D20 + modificador contra dificuldade.";

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
   resources:{
    hp:30,hp_max:30,mana:20,mana_max:20,
    stamina:20,stamina_max:20,gold:25,inventory:[]
   }
  });
  if(ch.error)throw ch.error;

  const se=await db.from("game_sessions").insert({
   campaign_id:c.data.id,user_id:session.user.id,
   status:"active",current_region:"Local de partida",
   world_state:{chapter:1,day:1}
  });
  if(se.error)throw se.error;

  const sel=$("campaignSelect");
  const option=document.createElement("option");
  option.value=c.data.id;
  option.textContent=title;
  sel.appendChild(option);
  sel.value=c.data.id;
  campaignId=c.data.id;
  characterDead=false;
  window.eterCharacterDead=false;

  await loadCampaign(c.data.id);
  busy=false;

  await send({
   input_mode:"free_text",
   player_text:"Comece a jornada. Apresente o cenário inicial, meu personagem, uma situação urgente e escolhas para agir."
  });
 }catch(e){
  msg("turnFeedback","Erro ao criar jornada: "+e.message,true);
 }finally{
  busy=false;
  setPlay(!!campaignId);
 }
}

async function saveRules(){
 if(!session||!campaignId)
  return msg("turnFeedback","Selecione uma campanha.",true);
 const r=await db.from("campaigns").update({
  title:$("campaignTitle").value.trim(),
  premise:$("campaignPremise").value.trim(),
  world_canon:[
   $("campaignWorld").value.trim(),
   $("campaignStory").value.trim()
  ].filter(Boolean).join("\n\n"),
  house_rules:$("campaignRules").value.trim(),
  updated_at:new Date().toISOString()
 }).eq("id",campaignId).eq("user_id",session.user.id);
 msg("turnFeedback",
  r.error?"Erro ao salvar: "+r.error.message:"Regras e cânone salvos.",
  !!r.error
 );
}

/* ENVIA AÇÃO E SINCRONIZA A RESPOSTA */
async function send(payload){
 if(!session||!campaignId||busy)return;
 if(characterDead||window.eterCharacterDead){
  msg("turnFeedback","☠️ Este personagem morreu permanentemente. Não é possível realizar novas ações.",true);
  setPlay(false);
  return;
 }
 busy=true;
 setPlay(false);

 const log=$("storyLog");
 let live=null;
 let liveText="";
 let completed=null;

 msg("turnFeedback","📖 MAIAR vai narrar sua ação; ⚙ OTA só será chamado se houver teste de regra.");

 try{
  const {data:authData,error:authError}=await db.auth.getSession();
  if(authError)throw authError;
  const token=authData.session?.access_token;
  if(!token)throw new Error("Sessão expirada. Entre novamente.");

  const response=await fetch(
   URL+"/functions/v1/submit-player-action",
   {
    method:"POST",
    headers:{
     "Content-Type":"application/json",
     "apikey":KEY,
     "Authorization":"Bearer "+token
    },
    body:JSON.stringify(Object.assign({campaign_id:campaignId},payload))
   }
  );

  if(!response.ok){
   const detail=await response.text();
   throw new Error("HTTP "+response.status+" "+detail.slice(0,350));
  }
  if(!response.body)throw new Error("O navegador não recebeu o fluxo de narração.");

  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let buffer="";

  const showLive=()=>{
   if(!live){
    live=document.createElement("article");
    live.className="story-turn story-live";
    const label=document.createElement("div");
    label.className="story-live-label";
    label.textContent="📖 MAIAR · narrando agora";
    live.appendChild(label);
    const content=document.createElement("div");
    content.className="story-narrator";
    content.id="eterLiveText";
    live.appendChild(content);
    log.querySelector(".story-empty")?.remove();
    log.appendChild(live);
   }
   $("eterLiveText").textContent=liveText;
   log.scrollTop=log.scrollHeight;
  };

  const process=line=>{
   if(!line.trim())return;
   let ev;
   try{ev=JSON.parse(line)}catch{return;}
   if(ev.type==="stage"){
    msg("turnFeedback",ev.message||"Processando...");
    if(ev.stage==="narrative"||ev.stage==="fallback")showLive();
   }else if(ev.type==="text"){
    liveText+=ev.text||"";
    showLive();
   }else if(ev.type==="complete"){
    completed=ev.data;
   }else if(ev.type==="error"){
    throw new Error(ev.error||"Falha no processamento");
   }
  };

  while(true){
   const part=await reader.read();
   if(part.done)break;
   buffer+=decoder.decode(part.value,{stream:true});
   const lines=buffer.split(/\r?\n/);
   buffer=lines.pop()||"";
   for(const line of lines)process(line);
  }
  buffer+=decoder.decode();
  if(buffer.trim())process(buffer);

  if(!completed){
   throw new Error(
    "A transmissão terminou sem evento final. "+
    (liveText?"A narração começou, mas não foi salva.":"")
   );
  }

  const admin=completed.administrator||{};
  const e=admin.effects_applied||{};
  const result=admin.roll==null
   ?"Ação narrativa · sem teste"
   :"🎲 D20 "+admin.roll+
    " "+(admin.modifier>=0?"+":"")+admin.modifier+
    " = "+admin.total+
    " / CD "+admin.difficulty+
    " · "+(admin.success?"SUCESSO":"FALHA");

  msg("turnFeedback",
   result+
   " · XP "+(e.xp>=0?"+":"")+(e.xp||0)+
   " · HP "+(e.hp>=0?"+":"")+(e.hp||0)+
   " · Mana "+(e.mana>=0?"+":"")+(e.mana||0)+
   " · Ouro "+(e.gold>=0?"+":"")+(e.gold||0)
  );

  const actionLabel=payload.player_text||payload.display_text||payload.selected_option_key||"";
  if(completed.narrative)renderTurn(completed.narrative,actionLabel);
  await loadCampaign(campaignId,completed.narrative||null,actionLabel);

  const narrator=completed.providers?.narrator;
  if(narrator&&$("masterStatus")){
   $("masterStatus").textContent=
    "MAIAR · "+narrator.provider+" · "+(narrator.model||"");
  }

  if($("playerAction"))$("playerAction").value="";

 }catch(e){
  msg("turnFeedback","Falha na interação: "+e.message,true);
  if(live)live.classList.remove("story-live");
 }finally{
  busy=false;
  setPlay(!!campaignId);
 }
}

function bind(){
 addJourneyTab();
 addTools();

 $("createCampaign")?.addEventListener("click",createCampaign);
 $("saveCampaignRules")?.addEventListener("click",saveRules);

 $("sendAction")?.addEventListener("click",()=>{
  const v=$("playerAction")?.value.trim();
  if(v){
   send({input_mode:"free_text",player_text:v});
  }else{
   msg("turnFeedback","Descreva o que deseja fazer.",true);
  }
 });

 $("playerAction")?.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){
   e.preventDefault();
   $("sendAction").click();
  }
 });

 $("campaignSelect")?.addEventListener("change",e=>
  loadCampaign(e.target.value)
 );

 $("rollD20")?.addEventListener("click",()=>{
  msg("turnFeedback","🎲 Rolagem livre D20: "+(1+Math.floor(Math.random()*20)));
 });
}

async function sdk(){
 if(window.supabase?.createClient)return;
 await new Promise((ok,no)=>{
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  s.onload=ok;
  s.onerror=()=>no(new Error("Falha ao carregar Supabase SDK"));
  document.head.appendChild(s);
 });
}

async function init(){
 styles();
 document.body.classList.add("eter-locked");
 authUI();

 try{
  await sdk();
  db=window.supabase.createClient(URL,KEY,{
   auth:{
    persistSession:true,
    autoRefreshToken:true,
    detectSessionInUrl:true
   }
  });

  window.eterSupabaseClient=db;
  window.dispatchEvent(new CustomEvent("eter:supabase-ready"));

  const r=await db.auth.getSession();
  if(r.error)throw r.error;
  session=r.data.session;

  bind();
  lockUI();

  db.auth.onAuthStateChange((_e,s)=>{
   session=s;
   lockUI();
   if(s)Promise.resolve().then(listCampaigns);
  });

  if(session)await listCampaigns();
  else msg("eterAuthNotice","Entre para abrir sua jornada.");

 }catch(e){
  msg("eterAuthNotice","Erro de conexão: "+e.message,true);
 }
}

if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",init,{once:true});
}else{
 init();
}

})();
