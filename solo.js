
(() => {
  "use strict";

  const SUPABASE_URL = "https://wwumjtorusjblitkzyjt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5DS37kwbBFfhOir50K0QyA_54lvldUM";

  let supabaseClient = null;
  let currentSession = null;
  let activeCampaignId = null;
  let busy = false;

  const $ = (id) => document.getElementById(id);

  function addStyles() {
    if ($("eterAuthStyles")) return;

    const style = document.createElement("style");
    style.id = "eterAuthStyles";
    style.textContent = `
      body.eter-locked .shell,
      body.eter-locked #app,
      body.eter-locked main,
      body.eter-locked .app,
      body.eter-locked .container {
        visibility: hidden !important;
        pointer-events: none !important;
      }

      #eterAuthLayer {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: radial-gradient(ellipse at top,#29364b,#10141e 60%,#080a10);
        color: #eee8dc;
        font-family: Inter,system-ui,sans-serif;
      }

      #eterAuthLayer[hidden],
      #eterSettings[hidden] {
        display: none !important;
      }

      .eter-auth-box,
      .eter-settings-box {
        width: min(100%,440px);
        max-height: 94vh;
        overflow: auto;
        background: #151a25;
        border: 1px solid #80683f;
        border-radius: 16px;
        padding: 23px;
        box-shadow: 0 25px 90px #000b;
      }

      .eter-auth-logo {
        color: #e6c68d;
        letter-spacing: .16em;
        font-size: 11px;
        font-weight: 800;
      }

      .eter-auth-box h1,
      .eter-settings-box h2 {
        font-family: Georgia,serif;
        color: #f0d39a;
      }

      .eter-auth-box h1 {
        font-size: 26px;
        margin: 12px 0;
      }

      .eter-auth-box p {
        color: #aeb7c7;
        font-size: 13px;
        line-height: 1.65;
      }

      .eter-auth-label {
        display: block;
        color: #d8c39d;
        font-size: 12px;
        margin: 13px 0 5px;
      }

      .eter-auth-input {
        display: block;
        width: 100%;
        box-sizing: border-box;
        background: #0c111b;
        border: 1px solid #465064;
        color: white;
        border-radius: 8px;
        padding: 13px;
        font: inherit;
      }

      .eter-auth-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 15px;
      }

      .eter-auth-btn {
        flex: 1;
        min-width: 120px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #d2ae70;
        background: linear-gradient(135deg,#b58b4c,#80602e);
        color: #160f08;
        font-weight: 800;
        cursor: pointer;
      }

      .eter-auth-btn.alt {
        background: #222a38;
        color: #eee4d1;
        border-color: #59647a;
      }

      .eter-auth-btn:disabled {
        opacity: .5;
        cursor: wait;
      }

      #eterAuthNotice,
      #eterSettingsNotice {
        min-height: 24px;
        margin-top: 12px;
        color: #b8d8a8;
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .eter-auth-error {
        color: #ffaaa0 !important;
      }

      #eterSettingsButton {
        position: relative;
        z-index: 1000;
        border: 1px solid #b58b4c;
        border-radius: 8px;
        padding: 9px 12px;
        background: #1b2230;
        color: #f0d39a;
        font-weight: 800;
        cursor: pointer;
        margin: 5px;
      }

      #eterSettings {
        position: fixed;
        inset: 0;
        z-index: 2147482000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: #05070bdd;
      }

      .eter-settings-user {
        color: #a9c99e;
        font-size: 12px;
        overflow-wrap: anywhere;
        margin: 10px 0;
      }

      @media(max-width:560px) {
        .eter-auth-box { padding: 19px; }
        .eter-auth-box h1 { font-size: 23px; }
      }
    `;

    document.head.appendChild(style);
  }

  function buildAuthUI() {
    if (!$("eterAuthLayer")) {
      const layer = document.createElement("div");
      layer.id = "eterAuthLayer";

      layer.innerHTML = `
        <section class="eter-auth-box" role="dialog" aria-modal="true">
          <div class="eter-auth-logo">CRÔNICAS DE ÉTER · ACESSO</div>
          <h1>Entre para iniciar sua jornada</h1>
          <p>
            O jogo ficará bloqueado até você entrar na sua conta.
            Crie uma conta gratuita ou entre com seus dados.
          </p>

          <label class="eter-auth-label" for="eterAuthEmail">E-mail</label>
          <input class="eter-auth-input" id="eterAuthEmail"
            type="email" autocomplete="username"
            placeholder="voce@email.com">

          <label class="eter-auth-label" for="eterAuthPassword">Senha</label>
          <input class="eter-auth-input" id="eterAuthPassword"
            type="password" autocomplete="current-password"
            placeholder="Sua senha">

          <div class="eter-auth-actions">
            <button class="eter-auth-btn" id="eterDoLogin">ENTRAR</button>
            <button class="eter-auth-btn alt" id="eterDoRegister">CRIAR CONTA</button>
          </div>

          <div id="eterAuthNotice" role="status"></div>
        </section>
      `;

      document.body.appendChild(layer);
    }

    if (!$("eterSettings")) {
      const settings = document.createElement("div");
      settings.id = "eterSettings";
      settings.hidden = true;

      settings.innerHTML = `
        <section class="eter-settings-box" role="dialog" aria-modal="true">
          <h2>Configurações da conta</h2>

          <div id="eterSettingsUser" class="eter-settings-user">
            Verificando conta...
          </div>

          <div id="eterSettingsLoggedOut">
            <label class="eter-auth-label">E-mail</label>
            <input class="eter-auth-input" id="eterSettingsEmail"
              type="email" autocomplete="username">

            <label class="eter-auth-label">Senha</label>
            <input class="eter-auth-input" id="eterSettingsPassword"
              type="password" autocomplete="current-password">

            <div class="eter-auth-actions">
              <button class="eter-auth-btn" id="eterSettingsLogin">ENTRAR</button>
              <button class="eter-auth-btn alt" id="eterSettingsRegister">CRIAR CONTA</button>
            </div>
          </div>

          <div id="eterSettingsLoggedIn" hidden>
            <div class="eter-auth-actions">
              <button class="eter-auth-btn alt" id="eterDoLogout">SAIR DA CONTA</button>
            </div>
          </div>

          <div id="eterSettingsNotice" role="status"></div>

          <div class="eter-auth-actions">
            <button class="eter-auth-btn alt" id="eterSettingsClose">FECHAR</button>
          </div>
        </section>
      `;

      document.body.appendChild(settings);
    }

    if (!$("eterSettingsButton")) {
      const button = document.createElement("button");
      button.id = "eterSettingsButton";
      button.type = "button";
      button.textContent = "⚙ Configurações";

      const top = document.querySelector(".topright")
        || document.querySelector("header")
        || document.body;

      top.appendChild(button);
    }

    $("eterDoLogin").onclick = () =>
      authenticate("login", "eterAuthEmail", "eterAuthPassword", "eterAuthNotice");

    $("eterDoRegister").onclick = () =>
      authenticate("register", "eterAuthEmail", "eterAuthPassword", "eterAuthNotice");

    $("eterSettingsLogin").onclick = () =>
      authenticate("login", "eterSettingsEmail", "eterSettingsPassword", "eterSettingsNotice");

    $("eterSettingsRegister").onclick = () =>
      authenticate("register", "eterSettingsEmail", "eterSettingsPassword", "eterSettingsNotice");

    $("eterDoLogout").onclick = logout;

    $("eterSettingsButton").onclick = () => {
      $("eterSettings").hidden = false;
    };

    $("eterSettingsClose").onclick = () => {
      $("eterSettings").hidden = true;
    };

    $("eterSettings").onclick = (event) => {
      if (event.target.id === "eterSettings") {
        $("eterSettings").hidden = true;
      }
    };
  }

  function notice(id, text, error = false) {
    const node = $(id);
    if (!node) return;

    node.textContent = text || "";
    node.classList.toggle("eter-auth-error", error);
  }

  function updateAuthUI() {
    const logged = !!currentSession?.user;

    document.body.classList.toggle("eter-locked", !logged);

    $("eterAuthLayer").hidden = logged;
    $("eterSettingsLoggedOut").hidden = logged;
    $("eterSettingsLoggedIn").hidden = !logged;

    $("eterSettingsUser").textContent = logged
      ? "Conectado como: " + (currentSession.user.email || currentSession.user.id)
      : "Nenhuma conta conectada.";

    $("eterSettingsButton").textContent = logged
      ? "⚙ Configurações · conectado"
      : "⚙ Entrar";

    if (!logged) {
      activeCampaignId = null;
    }
  }

  async function authenticate(mode, emailId, passwordId, noticeId) {
    const email = $(emailId).value.trim();
    const password = $(passwordId).value;

    if (!email || !password) {
      notice(noticeId, "Informe seu e-mail e senha.", true);
      return;
    }

    if (mode === "register" && password.length < 6) {
      notice(noticeId, "A senha precisa ter pelo menos 6 caracteres.", true);
      return;
    }

    notice(noticeId, mode === "login" ? "Entrando..." : "Criando conta...");

    try {
      const result = mode === "login"
        ? await supabaseClient.auth.signInWithPassword({ email, password })
        : await supabaseClient.auth.signUp({ email, password });

      if (result.error) throw result.error;

      if (result.data.session) {
        currentSession = result.data.session;
        updateAuthUI();
        notice(noticeId, "Acesso realizado com sucesso.");
        await refreshCampaigns();
      } else {
        notice(
          noticeId,
          "Conta criada. Se a confirmação de e-mail estiver ativada, confirme seu endereço e depois entre."
        );
      }
    } catch (error) {
      notice(noticeId, error.message || "Erro de autenticação.", true);
    }
  }

  async function logout() {
    notice("eterSettingsNotice", "Encerrando sessão...");

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      notice("eterSettingsNotice", error.message, true);
      return;
    }

    currentSession = null;
    updateAuthUI();

    $("eterSettings").hidden = true;
    notice("eterAuthNotice", "Você saiu da conta. Entre novamente para acessar o jogo.");
  }

  function loadSDK() {
    if (window.supabase?.createClient) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

      script.onload = resolve;
      script.onerror = () => reject(
        new Error("Não foi possível carregar o Supabase.")
      );

      document.head.appendChild(script);
    });
  }

  async function refreshCampaigns() {
    if (!currentSession) return;

    const select = $("campaignSelect");
    if (!select) return;

    const { data, error } = await supabaseClient
      .from("campaigns")
      .select("id,title")
      .eq("user_id", currentSession.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      notice("eterSettingsNotice", error.message, true);
      return;
    }

    select.innerHTML = '<option value="">Selecione uma campanha</option>';

    (data || []).forEach((campaign) => {
      const option = document.createElement("option");
      option.value = campaign.id;
      option.textContent = campaign.title;
      select.appendChild(option);
    });
  }

  async function loadCampaign(id) {
    if (!currentSession) return;

    const { data: campaign, error } = await supabaseClient
      .from("campaigns")
      .select("id,title")
      .eq("id", id)
      .eq("user_id", currentSession.user.id)
      .single();

    if (error) {
      setFeedback(error.message, true);
      return;
    }

    activeCampaignId = campaign.id;

    const { data: turns, error: turnError } = await supabaseClient
      .from("narrative_turns")
      .select("turn_number,scene_text,options")
      .eq("campaign_id", id)
      .eq("user_id", currentSession.user.id)
      .order("turn_number", { ascending: true });

    if (turnError) {
      setFeedback(turnError.message, true);
      return;
    }

    $("storyLog").innerHTML = "";

    (turns || []).forEach(renderNarrative);

    setFeedback("Campanha carregada: " + campaign.title);
  }

  function setFeedback(text, error = false) {
    const node = $("turnFeedback");
    if (!node) return;

    node.textContent = text;
    node.style.color = error ? "#ff9c8e" : "";
  }

  function renderNarrative(turn) {
    const log = $("storyLog");
    if (!log || !turn) return;

    const entry = document.createElement("div");
    entry.style.cssText =
      "padding:12px 0;border-bottom:1px solid #303747;white-space:pre-wrap;line-height:1.7";

    entry.textContent = turn.scene_text || "";
    log.appendChild(entry);

    const choices = $("suggestedChoices");
    if (!choices) return;

    choices.innerHTML = "";

    (turn.options || []).forEach((option) => {
      const button = document.createElement("button");

      button.className = "btn ghost";
      button.textContent = `${option.key || ""} · ${option.text || ""}`;

      button.onclick = () => submitAction({
        input_mode: "choice",
        selected_option_key: option.key
      });

      choices.appendChild(button);
    });
  }

  async function createCampaign() {
    if (!currentSession) {
      $("eterSettings").hidden = false;
      notice("eterSettingsNotice", "Entre na sua conta para criar uma campanha.", true);
      return;
    }

    if (busy) return;

    const title = $("campaignTitle")?.value.trim() || "Uma nova lenda";
    const premise = $("campaignPremise")?.value.trim() || "Uma aventura medieval de fantasia.";
    const story = $("campaignStory")?.value.trim() || "";
    const world = $("campaignWorld")?.value.trim() || "";
    const rules = $("campaignRules")?.value.trim() || "";

    busy = true;
    setFeedback("Criando campanha...");

    try {
      const { data: campaign, error } = await supabaseClient
        .from("campaigns")
        .insert({
          user_id: currentSession.user.id,
          title,
          premise,
          world_canon: [world, story].filter(Boolean).join("\n\n"),
          house_rules: rules || "OTA administra regras e resultados. MAIAR narra o mundo."
        })
        .select("id,title")
        .single();

      if (error) throw error;

      const { error: sessionError } = await supabaseClient
        .from("game_sessions")
        .insert({
          campaign_id: campaign.id,
          user_id: currentSession.user.id,
          status: "active",
          current_region: "Ponto de partida",
          world_state: { chapter: 1, day: 1 }
        });

      if (sessionError) throw sessionError;

      activeCampaignId = campaign.id;

      await refreshCampaigns();

      if ($("campaignSelect")) {
        $("campaignSelect").value = campaign.id;
      }

      $("storyLog").innerHTML = "";

      await submitAction({
        input_mode: "free_text",
        player_text: "Comece a aventura. Apresente o mundo, o local inicial e uma situação envolvente."
      });

    } catch (error) {
      setFeedback("Erro ao criar campanha: " + error.message, true);
    } finally {
      busy = false;
    }
  }

  async function submitAction(payload) {
    if (!currentSession || !activeCampaignId || busy) return;

    busy = true;
    setFeedback("OTA está validando sua ação. Maiar está narrando...");

    try {
      const { data, error } = await supabaseClient.functions.invoke(
        "submit-player-action",
        {
          body: {
            campaign_id: activeCampaignId,
            ...payload
          }
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.detail || data.error);

      if (data?.narrative) {
        renderNarrative(data.narrative);
      }

      const admin = data?.administrator;

      if (admin?.roll != null) {
        setFeedback(
          `D20: ${admin.roll} · Modificador: ${admin.modifier} · Total: ${admin.total} · ${admin.success ? "SUCESSO" : "FALHA"}`
        );
      } else {
        setFeedback("Turno concluído.");
      }

      if ($("playerAction")) $("playerAction").value = "";

    } catch (error) {
      setFeedback("Erro ao enviar ação: " + error.message, true);
    } finally {
      busy = false;
    }
  }

  function bindGame() {
    $("createCampaign")?.addEventListener("click", createCampaign);

    $("sendAction")?.addEventListener("click", () => {
      const text = $("playerAction")?.value.trim();

      if (!text) {
        setFeedback("Escreva sua ação primeiro.", true);
        return;
      }

      submitAction({
        input_mode: "free_text",
        player_text: text
      });
    });

    $("campaignSelect")?.addEventListener("change", (event) => {
      if (event.target.value) loadCampaign(event.target.value);
    });
  }

  async function initialize() {
    addStyles();

    // Bloqueia imediatamente, antes de verificar a sessão.
    document.body.classList.add("eter-locked");

    buildAuthUI();

    try {
      await loadSDK();

      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

      const { data, error } = await supabaseClient.auth.getSession();

      if (error) throw error;

      currentSession = data.session;

      updateAuthUI();
      bindGame();

      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentSession = session;
        updateAuthUI();

        if (session) {
          Promise.resolve().then(refreshCampaigns);
        }
      });

      if (currentSession) {
        await refreshCampaigns();
      } else {
        notice("eterAuthNotice", "Faça login para desbloquear o site.");
      }

    } catch (error) {
      notice("eterAuthNotice", "Erro de conexão: " + error.message, true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

})();
