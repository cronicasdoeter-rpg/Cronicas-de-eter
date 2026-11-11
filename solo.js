
(() => {
  'use strict';

  // ==========================================
  // CONFIGURAÇÃO DO SUPABASE
  // ==========================================

  const SUPABASE_URL = 'https://wwumjtorusjblitkzyjt.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_5DS37kwbBFfhOir50K0QyA_54lvldUM';

  const SITE_URL =
    'https://cronicasdoeter-rpg.github.io/Cronicas-de-eter/';

  const $ = id => document.getElementById(id);

  const ACTIVE_KEY = 'cronicas-eter-active-campaign';

  let db = null;
  let session = null;
  let activeId = localStorage.getItem(ACTIVE_KEY) || '';
  let busy = false;

  // ==========================================
  // UTILITÁRIOS
  // ==========================================

  function feedback(message) {
    if ($('turnFeedback')) {
      $('turnFeedback').textContent = message;
    }
  }

  function addEntry(kind, label, message) {
    const log = $('storyLog');
    if (!log) return;

    const empty = log.querySelector('.story-empty');
    if (empty) empty.remove();

    const entry = document.createElement('div');
    entry.className = 'story-entry ' + kind;

    const heading = document.createElement('small');
    heading.textContent = label;

    const content = document.createElement('div');
    content.textContent = String(message || '');

    entry.append(heading, content);
    log.appendChild(entry);

    log.scrollTop = log.scrollHeight;
  }

  function errorMessage(error) {
    return error?.message || 'Ocorreu um erro inesperado.';
  }

  function setStatus(message) {
    if ($('soloStatus')) {
      $('soloStatus').textContent = message;
    }
  }

  // ==========================================
  // LOGIN E CADASTRO
  // ==========================================

  function createAuthScreen() {
    if ($('eterAuth')) return;

    const panel = document.createElement('div');

    panel.id = 'eterAuth';

    panel.style.cssText = `
      position:fixed;
      inset:0;
      z-index:999999;
      background:#080a12ee;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
      font-family:system-ui;
      color:#eee;
    `;

    panel.innerHTML = `
      <div style="
        width:min(430px,100%);
        background:#171a26;
        border:1px solid #92774d;
        border-radius:15px;
        padding:24px;
        box-shadow:0 20px 70px #000;
      ">

        <h2 style="color:#e4c78b">
          CRÔNICAS DE ÉTER
        </h2>

        <p>
          Entre na sua conta ou crie um novo aventureiro.
        </p>

        <label>E-mail</label>

        <input
          id="eterEmail"
          type="email"
          autocomplete="email"
          placeholder="Seu e-mail"
          style="
            width:100%;
            padding:12px;
            margin:8px 0 15px;
            background:#0d1019;
            color:white;
            border:1px solid #555;
            border-radius:7px;
          "
        >

        <label>Senha</label>

        <input
          id="eterPassword"
          type="password"
          autocomplete="current-password"
          placeholder="Sua senha"
          style="
            width:100%;
            padding:12px;
            margin:8px 0 15px;
            background:#0d1019;
            color:white;
            border:1px solid #555;
            border-radius:7px;
          "
        >

        <div style="display:flex;gap:10px;flex-wrap:wrap">

          <button id="eterLogin">
            ENTRAR
          </button>

          <button id="eterRegister">
            CRIAR CONTA
          </button>

        </div>

        <p
          id="eterAuthMessage"
          style="font-size:13px;color:#e4c78b;margin-top:15px"
        ></p>

      </div>
    `;

    document.body.appendChild(panel);

    $('eterLogin').onclick = login;
    $('eterRegister').onclick = register;
  }

  function authMessage(message) {
    if ($('eterAuthMessage')) {
      $('eterAuthMessage').textContent = message;
    }
  }

  async function login() {
    try {
      const email = $('eterEmail').value.trim();
      const password = $('eterPassword').value;

      if (!email || !password) {
        throw new Error('Preencha e-mail e senha.');
      }

      authMessage('Entrando...');

      const { error } =
        await db.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      authMessage('Login realizado.');

    } catch (error) {
      authMessage(errorMessage(error));
    }
  }

  async function register() {
    try {
      const email = $('eterEmail').value.trim();
      const password = $('eterPassword').value;

      if (!email || !password) {
        throw new Error('Preencha e-mail e senha.');
      }

      if (password.length < 6) {
        throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      }

      authMessage('Criando conta...');

      const { data, error } =
        await db.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: SITE_URL
          }
        });

      if (error) throw error;

      if (data.session) {
        authMessage('Conta criada com sucesso!');
      } else {
        authMessage(
          'Conta criada! Confirme seu e-mail antes de entrar.'
        );
      }

    } catch (error) {
      authMessage(errorMessage(error));
    }
  }

  function showAuth(visible) {
    const panel = $('eterAuth');

    if (panel) {
      panel.style.display = visible ? 'flex' : 'none';
    }
  }

  // ==========================================
  // PERSONAGEM
  // ==========================================

  function renderCharacter(character) {
    const c = character || {};
    const resources = c.resources || {};

    if (!$('soloState')) return;

    $('soloState').innerHTML = `
      <b>${c.name || 'Aventureiro'}</b>

      · Nível ${Number(c.level || 1)}

      <br>

      ❤️ HP: ${Number(resources.hp ?? 20)}

      <br>

      ✧ Mana: ${Number(resources.mana ?? 10)}

      <br>

      XP: ${Number(c.experience || 0)}
    `;
  }

  async function createCharacter(campaignId) {
    const { error } = await db
      .from('characters')
      .insert({
        campaign_id: campaignId,
        user_id: session.user.id,
        name: 'Aventureiro',
        class: 'A definir',
        level: 1,
        experience: 0,
        attributes: {
          strength: 5,
          dexterity: 5,
          constitution: 5,
          intelligence: 5,
          wisdom: 5,
          charisma: 5
        },
        resources: {
          hp: 20,
          hp_max: 20,
          mana: 10,
          mana_max: 10
        }
      });

    if (error) throw error;
  }

  // ==========================================
  // OPÇÕES DE NARRATIVA
  // ==========================================

  function renderOptions(options) {
    const container = $('suggestedChoices');

    if (!container) return;

    container.innerHTML = '';

    (options || []).forEach((option, index) => {
      const key = option.key || String.fromCharCode(65 + index);
      const description =
        typeof option === 'string'
          ? option
          : option.text || option.label || '';

      if (!description) return;

      const button = document.createElement('button');

      button.type = 'button';

      button.textContent = key + ' — ' + description;

      button.addEventListener('click', () => {
        sendChoice(key);
      });

      container.appendChild(button);
    });
  }

  // ==========================================
  // CARREGAR CAMPANHAS
  // ==========================================

  async function refreshCampaigns() {
    const { data, error } = await db
      .from('campaigns')
      .select('id,title')
      .order('updated_at', {
        ascending: false
      });

    if (error) throw error;

    const select = $('campaignSelect');

    if (!select) return;

    select.innerHTML =
      '<option value="">Selecione uma campanha</option>';

    (data || []).forEach(campaign => {
      const option = document.createElement('option');

      option.value = campaign.id;
      option.textContent = campaign.title;

      select.appendChild(option);
    });

    if (
      activeId &&
      data.some(c => c.id === activeId)
    ) {
      select.value = activeId;
    } else if (data.length) {
      activeId = data[0].id;

      select.value = activeId;

      localStorage.setItem(ACTIVE_KEY, activeId);
    }

    if (activeId) {
      await loadCampaign(activeId);
    }
  }

  async function loadCampaign(id) {
    const results = await Promise.all([
      db
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single(),

      db
        .from('characters')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at')
        .limit(1),

      db
        .from('narrative_turns')
        .select('*')
        .eq('campaign_id', id)
        .order('turn_number')
    ]);

    const campaign = results[0].data;
    const character = results[1].data?.[0];
    const turns = results[2].data;

    if (results[0].error) throw results[0].error;
    if (results[1].error) throw results[1].error;
    if (results[2].error) throw results[2].error;

    activeId = id;

    localStorage.setItem(ACTIVE_KEY, id);

    $('campaignTitle').value =
      campaign.title || '';

    $('campaignPremise').value =
      campaign.premise || '';

    $('campaignStory').value =
      campaign.world_canon || '';

    $('campaignRules').value =
      campaign.house_rules || '';

    $('playerAction').disabled = false;
    $('sendAction').disabled = false;

    if ($('storyLog')) {
      $('storyLog').innerHTML = '';
    }

    if (!turns.length) {
      $('storyLog').innerHTML = `
        <div class="story-empty">
          Sua aventura começa agora.
          Descreva sua primeira ação!
        </div>
      `;
    }

    turns.forEach(turn => {
      addEntry(
        'master',
        'MESTRE DE MESA',
        turn.scene_text
      );

      renderOptions(turn.options);

      if (turn.image_url && $('sceneImage')) {
        $('sceneImage').style.backgroundImage =
          `url("${turn.image_url}")`;

        $('sceneImage').classList.add('has-image');
      }
    });

    renderCharacter(character);

    feedback('Campanha carregada.');
  }

  // ==========================================
  // CRIAR CAMPANHA
  // ==========================================

  async function createCampaign() {
    if (!session?.user) {
      throw new Error('Entre na sua conta primeiro.');
    }

    const title =
      $('campaignTitle').value.trim() ||
      'Nova campanha';

    const premise =
      $('campaignPremise').value.trim();

    const world =
      $('campaignStory').value.trim();

    const rules =
      $('campaignRules').value.trim();

    const { data: campaign, error } = await db
      .from('campaigns')
      .insert({
        user_id: session.user.id,
        title,
        premise,
        world_canon: world,
        house_rules: rules
      })
      .select()
      .single();

    if (error) throw error;

    try {
      await db
        .from('game_sessions')
        .insert({
          campaign_id: campaign.id,
          user_id: session.user.id,
          current_region: 'Região inicial',
          world_state: {}
        });

      await createCharacter(campaign.id);

    } catch (error) {
      feedback(
        'Campanha criada, mas houve um problema ao criar personagem ou sessão: ' +
        errorMessage(error)
      );
    }

    activeId = campaign.id;

    localStorage.setItem(ACTIVE_KEY, activeId);

    await refreshCampaigns();

    await loadCampaign(activeId);

    feedback('Nova campanha criada!');
  }

  // ==========================================
  // SALVAR CAMPANHA
  // ==========================================

  async function saveCampaign() {
    if (!activeId) {
      throw new Error('Selecione uma campanha.');
    }

    const { error } = await db
      .from('campaigns')
      .update({
        title: $('campaignTitle').value.trim(),
        premise: $('campaignPremise').value.trim(),
        world_canon: $('campaignStory').value.trim(),
        house_rules: $('campaignRules').value.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', activeId);

    if (error) throw error;

    feedback('Campanha salva com sucesso!');
  }

  // ==========================================
  // CONEXÃO COM AS IAs
  // ==========================================

  async function processAction(payload) {
    const { data, error } =
      await db.functions.invoke(
        'submit-player-action',
        {
          body: payload
        }
      );

    if (error) {
      let message = error.message;

      try {
        const body = await error.context.json();

        if (body.detail) {
          message = body.detail;
        } else if (body.error) {
          message = body.error;
        }
      } catch (_) {}

      throw new Error(message);
    }

    if (data?.error) {
      throw new Error(
        data.detail || data.error
      );
    }

    return data;
  }

  async function sendAction(message) {
    if (!activeId) {
      return feedback('Crie ou selecione uma campanha.');
    }

    if (busy || !message.trim()) return;

    await submitPlayerAction({
      campaign_id: activeId,
      input_mode: 'free_text',
      player_text: message.trim()
    }, message);
  }

  async function sendChoice(key) {
    if (!activeId || busy) return;

    await submitPlayerAction({
      campaign_id: activeId,
      input_mode: 'choice',
      selected_option_key: key
    }, 'Escolha: ' + key);
  }

  async function submitPlayerAction(payload, displayText) {
    busy = true;

    $('sendAction').disabled = true;
    $('playerAction').disabled = true;

    addEntry('player', 'VOCÊ', displayText);

    feedback(
      'Administrador de regras e Mestre Narrador trabalhando...'
    );

    try {
      const result = await processAction(payload);

      if (result.administrator) {
        const a = result.administrator;

        if (a.roll !== null && a.roll !== undefined) {
          addEntry(
            'master',
            'RESULTADO DO TESTE',
            'D20: ' + a.roll +
            ' | Modificador: ' + a.modifier +
            ' | Total: ' + a.total +
            ' | Dificuldade: ' + a.difficulty +
            ' | ' + (a.success ? 'SUCESSO' : 'FALHA')
          );
        }
      }

      if (result.narrative?.scene_text) {
        addEntry(
          'master',
          'MESTRE DE MESA',
          result.narrative.scene_text
        );

        renderOptions(result.narrative.options);
      }

      const providers = result.providers || {};

      feedback(
        'Turno concluído! Administrador: ' +
        (providers.administrator?.provider || 'OK') +
        ' | Mestre: ' +
        (providers.master?.provider || 'OK')
      );

      await loadCampaign(activeId);

    } catch (error) {
      addEntry(
        'master',
        'SISTEMA',
        errorMessage(error)
      );

      feedback(
        'Erro ao processar ação: ' +
        errorMessage(error)
      );

    } finally {
      busy = false;

      $('sendAction').disabled = false;
      $('playerAction').disabled = false;
      $('playerAction').value = '';
    }
  }

  // ==========================================
  // DADOS
  // ==========================================

  function rollD20() {
    const result =
      Math.floor(Math.random() * 20) + 1;

    let message = 'Resultado: ' + result;

    if (result === 20) {
      message += ' — CRÍTICO!';
    }

    if (result === 1) {
      message += ' — FALHA CRÍTICA!';
    }

    addEntry(
      'master',
      'MESA DE DADOS',
      message
    );
  }

  // ==========================================
  // EVENTOS DA INTERFACE
  // ==========================================

  function bindEvents() {
    $('createCampaign')?.addEventListener(
      'click',
      () => createCampaign().catch(e => feedback(errorMessage(e)))
    );

    $('campaignSelect')?.addEventListener(
      'change',
      event => {
        if (event.target.value) {
          loadCampaign(event.target.value)
            .catch(e => feedback(errorMessage(e)));
        }
      }
    );

    $('saveCampaignRules')?.addEventListener(
      'click',
      () => saveCampaign().catch(e => feedback(errorMessage(e)))
    );

    $('sendAction')?.addEventListener(
      'click',
      () => sendAction($('playerAction').value)
    );

    $('playerAction')?.addEventListener(
      'keydown',
      event => {
        if (
          event.key === 'Enter' &&
          !event.shiftKey
        ) {
          event.preventDefault();

          sendAction($('playerAction').value);
        }
      }
    );

    $('rollD20')?.addEventListener(
      'click',
      rollD20
    );
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  function loadSupabaseSDK() {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) {
        resolve();
        return;
      }

      const script = document.createElement('script');

      script.src =
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

      script.onload = resolve;

      script.onerror = () => {
        reject(
          new Error('Não foi possível carregar o Supabase.')
        );
      };

      document.head.appendChild(script);
    });
  }

  async function initialize() {
    try {
      await loadSupabaseSDK();

      db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

      bindEvents();

      createAuthScreen();

      const { data } = await db.auth.getSession();

      session = data.session;

      db.auth.onAuthStateChange(
        async (_event, newSession) => {
          session = newSession;

          showAuth(!newSession);

          if (newSession) {
            setStatus('● Conta conectada ao Supabase');

            try {
              await refreshCampaigns();
            } catch (error) {
              feedback(errorMessage(error));
            }
          } else {
            activeId = '';
            localStorage.removeItem(ACTIVE_KEY);

            setStatus('● Faça login para jogar');
          }
        }
      );

      if (!session) {
        showAuth(true);

        setStatus(
          '● Supabase conectado · aguardando login'
        );

        return;
      }

      showAuth(false);

      setStatus(
        '● Supabase conectado · conta autenticada'
      );

      if ($('masterStatus')) {
        $('masterStatus').textContent =
          'Gemini · Mestre Narrador';
      }

      if ($('adminStatus')) {
        $('adminStatus').textContent =
          'Groq · Administrador de Regras';
      }

      if ($('imageStatus')) {
        $('imageStatus').textContent =
          'Geração de imagens ainda não conectada';
      }

      await refreshCampaigns();

    } catch (error) {
      console.error(error);

      setStatus(
        '● Erro de conexão com o sistema'
      );

      feedback(errorMessage(error));
    }
  }

  initialize();

})();
