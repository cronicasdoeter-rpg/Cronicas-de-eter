
(() => {
  'use strict';

  // CRÔNICAS DE ÉTER — JORNADA SOLO
  // MAIAR = Mestre Narrador (Gemini)
  // OTA = Administrador de Regras (Groq)

  const SUPABASE_URL = 'https://wwumjtorusjblitkzyjt.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_5DS37kwbBFfhOir50K0QyA_54lvldUM';

  const $ = id => document.getElementById(id);

  let db = null;
  let session = null;
  let campaignId = null;
  let character = null;
  let busy = false;
  let initializing = false;
  let points = 12;

  const ATTRIBUTES = [
    ['for', 'Força'],
    ['des', 'Destreza'],
    ['con', 'Constituição'],
    ['int', 'Inteligência'],
    ['sab', 'Sabedoria'],
    ['car', 'Carisma']
  ];

  function installStyle() {
    if ($('eterEngineStyle')) return;

    const style = document.createElement('style');
    style.id = 'eterEngineStyle';
    style.textContent = `
      #eterEngine{color:#eee8dc;font-family:Inter,system-ui,sans-serif}
      #eterEngine *{box-sizing:border-box}
      .eter-card{background:#151a25;border:1px solid #394153;border-radius:12px;padding:17px;margin-bottom:14px}
      .eter-title{font-family:Georgia,serif;color:#e7c88d;font-size:25px;margin:5px 0 12px}
      .eter-muted{color:#a8afbd;font-size:13px;line-height:1.6}
      .eter-btn{background:linear-gradient(135deg,#b58b4c,#80602e);color:#160f08;border:1px solid #e0bd7c;border-radius:7px;padding:12px 16px;font-weight:800;cursor:pointer}
      .eter-btn.secondary{background:#222a38;border:1px solid #59647a;color:#e9dfcc}
      .eter-btn:disabled{opacity:.45;cursor:not-allowed}
      .eter-input{width:100%;background:#0d111a;border:1px solid #465064;color:#fff;padding:12px;border-radius:7px;margin:6px 0 13px;font:inherit}
      .eter-label{display:block;font-size:12px;color:#d8c39d;margin-top:10px}
      .eter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .eter-attribute{background:#202635;border:1px solid #3c465a;border-radius:8px;padding:10px}
      .eter-attribute button{background:#30394b;color:white;border:0;border-radius:5px;padding:5px 12px}
      .eter-attribute strong{color:#e9c987;font-size:20px}
      .eter-story{min-height:180px;max-height:55vh;overflow:auto;background:#0e121b;border:1px solid #343e51;border-radius:9px;padding:13px}
      .eter-scene{white-space:pre-wrap;line-height:1.8;font-size:14px}
      .eter-entry{border-bottom:1px solid #30394a;padding:12px 0}
      .eter-entry.player{color:#e4c68e}
      .eter-entry.maiar{color:#d9d5f4}
      .eter-entry small{display:block;color:#9ca7ba;font-weight:800;margin-bottom:6px}
      .eter-options{display:grid;gap:8px;margin-top:12px}
      .eter-option{text-align:left;background:#202839;border:1px solid #6c624c;color:#f0e5d0;border-radius:8px;padding:12px;cursor:pointer}
      .eter-option:disabled{opacity:.4}
      .eter-composer{display:flex;flex-direction:column;gap:9px;margin-top:13px}
      .eter-composer textarea{min-height:90px;resize:vertical}
      .eter-agent{display:flex;justify-content:space-between;gap:10px;padding:10px;background:#202635;border-radius:8px;margin-bottom:7px}
      .eter-status{color:#a9c99e;font-size:12px;line-height:1.6}
      .eter-screen{display:none}
      .eter-screen.active{display:block}
      .eter-auth-actions{display:flex;gap:8px;flex-wrap:wrap}
      .eter-auth-actions button{flex:1;min-width:125px}
      .eter-auth-user{color:#a9c99e;font-size:12px;overflow-wrap:anywhere}
      @media(max-width:600px){.eter-grid{grid-template-columns:1fr}.eter-title{font-size:22px}}
    `;
    document.head.appendChild(style);
  }

  function installInterface() {
    const nav = $('nav');

    if (nav && !nav.querySelector('[data-tab="solo"]')) {
      const button = document.createElement('button');
      button.dataset.tab = 'solo';
      button.innerHTML = '<span class="ico">✧</span>Jornada · Maiar';
      nav.appendChild(button);
    }

    const section = $('solo');
    if (!section) throw new Error('Seção Jornada não encontrada no HTML.');

    section.innerHTML = `
      <div id="eterEngine">

        <div class="eter-card">
          <div class="eter-muted">CRÔNICAS DE ÉTER · RPG DE MESA SOLO</div>
          <h2 class="eter-title">A sua lenda começa aqui</h2>

          <div class="eter-agent">
            <b>📖 MAIAR — Mestre Narrador</b>
            <span id="maiStatus">Aguardando</span>
          </div>

          <div class="eter-agent">
            <b>⚙ OTA — Administrador</b>
            <span id="otaStatus">Aguardando</span>
          </div>

          <div id="eterMessage" class="eter-status">Conectando...</div>
        </div>

        <div class="eter-card" id="eterAuthCard">
          <h3 class="eter-title">Acesso à sua conta</h3>
          <p class="eter-muted">
            Entre ou crie uma conta gratuita para salvar suas campanhas e personagens.
          </p>

          <div id="eterAuthLoggedOut">
            <label class="eter-label" for="eterEmail">E-mail</label>
            <input id="eterEmail" class="eter-input" type="email"
              autocomplete="email" placeholder="voce@email.com">

            <label class="eter-label" for="eterPassword">Senha</label>
            <input id="eterPassword" class="eter-input" type="password"
              autocomplete="current-password" placeholder="Sua senha">

            <div class="eter-auth-actions">
              <button class="eter-btn" id="eterLogin" type="button">ENTRAR</button>
              <button class="eter-btn secondary" id="eterRegister" type="button">CRIAR CONTA</button>
            </div>
          </div>

          <div id="eterAuthLoggedIn" hidden>
            <div class="eter-auth-user" id="eterAuthUser"></div>
            <div class="eter-auth-actions" style="margin-top:10px">
              <button class="eter-btn secondary" id="eterLogout" type="button">SAIR DA CONTA</button>
            </div>
          </div>

          <div id="eterAuthFeedback" class="eter-status"
            style="margin-top:10px" aria-live="polite"></div>
        </div>

        <div id="eterHome" class="eter-screen active">
          <div class="eter-card">
            <h3 class="eter-title">Sua jornada</h3>
            <p class="eter-muted">
              Continue uma campanha existente ou comece uma aventura do zero.
            </p>

            <button class="eter-btn" id="eterContinue" style="width:100%">
              CONTINUAR JORNADA
            </button>

            <button class="eter-btn secondary" id="eterNew"
              style="width:100%;margin-top:9px">
              COMEÇAR DO ZERO
            </button>
          </div>

          <div class="eter-card">
            <label class="eter-label" for="eterCampaignList">Campanhas existentes</label>
            <select id="eterCampaignList" class="eter-input">
              <option value="">Entre para carregar campanhas</option>
            </select>
          </div>
        </div>

        <div id="eterCreation" class="eter-screen">
          <div class="eter-card">
            <h3 class="eter-title">Criação do aventureiro</h3>
            <p class="eter-muted">
              Crie seu personagem. Seus atributos determinarão suas possibilidades durante a aventura.
            </p>

            <label class="eter-label" for="eterName">Nome do personagem</label>
            <input id="eterName" class="eter-input" maxlength="60"
              placeholder="Nome do seu herói">

            <label class="eter-label" for="eterCampaignName">Nome da campanha</label>
            <input id="eterCampaignName" class="eter-input" value="Uma nova lenda">

            <label class="eter-label" for="eterRace">Raça</label>
            <select id="eterRace" class="eter-input">
              <option>Humano</option>
              <option>Elfo</option>
              <option>Anão</option>
              <option>Orc</option>
              <option>Draconato</option>
              <option>Meio-elfo</option>
              <option>Fada</option>
              <option>Demônio</option>
              <option>Celestial</option>
              <option>Outra</option>
            </select>

            <label class="eter-label" for="eterClass">Classe</label>
            <select id="eterClass" class="eter-input">
              <option>Guerreiro</option>
              <option>Mago</option>
              <option>Arcanista</option>
              <option>Paladino</option>
              <option>Clérigo</option>
              <option>Ladino</option>
              <option>Arqueiro</option>
              <option>Druida</option>
              <option>Necromante</option>
              <option>Bárbaro</option>
              <option>Monge</option>
              <option>Bardo</option>
            </select>

            <label class="eter-label" for="eterPremise">Origem da aventura</label>
            <textarea id="eterPremise" class="eter-input" rows="3"
              placeholder="Descreva o mundo ou a ideia da sua aventura..."></textarea>

            <h3>Distribua seus atributos</h3>
            <p class="eter-muted">Cada atributo começa em 5. Você possui 12 pontos adicionais.</p>

            <div id="eterPoints" style="color:#e9c987;font-weight:bold;margin:12px 0">
              Pontos disponíveis: 12
            </div>

            <div class="eter-grid" id="eterAttributes"></div>

            <button class="eter-btn" id="eterStart"
              style="width:100%;margin-top:16px">
              CRIAR PERSONAGEM E INICIAR
            </button>

            <button class="eter-btn secondary" id="eterBack"
              style="width:100%;margin-top:8px">
              VOLTAR
            </button>
          </div>
        </div>

        <div id="eterJourney" class="eter-screen">
          <div class="eter-card">
            <div class="eter-muted">CAMPANHA ATIVA</div>
            <h3 class="eter-title" id="eterJourneyTitle">A Jornada</h3>
            <div id="eterCharacter" class="eter-muted"></div>
            <button class="eter-btn secondary" id="eterHomeButton">
              VOLTAR AO INÍCIO
            </button>
          </div>

          <div class="eter-card">
            <h3>📖 MAIAR — O MESTRE</h3>
            <p class="eter-muted">
              O mundo reage às suas decisões. Escolha uma opção ou escreva qualquer ação.
            </p>

            <div id="eterStory" class="eter-story">
              Aguardando a primeira cena...
            </div>

            <div id="eterOptions" class="eter-options"></div>

            <div class="eter-composer">
              <textarea id="eterAction" class="eter-input"
                placeholder="Descreva o que seu personagem deseja fazer..."></textarea>
              <button id="eterSend" class="eter-btn">REALIZAR AÇÃO</button>
            </div>

            <div id="eterFeedback" class="eter-status" style="margin-top:12px"></div>
          </div>
        </div>

      </div>
    `;

    $('eterLogin').onclick = signIn;
    $('eterRegister').onclick = signUp;
    $('eterLogout').onclick = signOut;

    $('eterNew').onclick = () => {
      if (!session) {
        authFeedback('Entre na sua conta antes de criar uma campanha.');
        return;
      }
      resetAttributes();
      showScreen('eterCreation');
    };

    $('eterBack').onclick = () => showScreen('eterHome');
    $('eterHomeButton').onclick = () => showScreen('eterHome');
    $('eterStart').onclick = startNewCampaign;
    $('eterContinue').onclick = continueCampaign;
    $('eterSend').onclick = sendFreeAction;

    $('eterAction').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendFreeAction();
      }
    });

    $('eterCampaignList').onchange = e => {
      if (e.target.value) openCampaign(e.target.value);
    };

    renderAttributes();
    updateAuthUI();
  }

  function showScreen(id) {
    document.querySelectorAll('#eterEngine .eter-screen')
      .forEach(el => el.classList.remove('active'));
    $(id)?.classList.add('active');
  }

  function message(text) {
    if ($('eterMessage')) $('eterMessage').textContent = text || '';
  }

  function feedback(text) {
    if ($('eterFeedback')) $('eterFeedback').textContent = text || '';
  }

  function authFeedback(text) {
    if ($('eterAuthFeedback')) $('eterAuthFeedback').textContent = text || '';
  }

  function updateAuthUI() {
    const logged = !!session;

    if ($('eterAuthLoggedOut')) $('eterAuthLoggedOut').hidden = logged;
    if ($('eterAuthLoggedIn')) $('eterAuthLoggedIn').hidden = !logged;

    if ($('eterAuthUser')) {
      $('eterAuthUser').textContent = logged
        ? 'Conectado como: ' + (session.user.email || session.user.id)
        : '';
    }

    if ($('eterNew')) $('eterNew').disabled = !logged;
    if ($('eterContinue')) $('eterContinue').disabled = !logged;
    if ($('eterStart')) $('eterStart').disabled = !logged;
    if ($('eterSend')) $('eterSend').disabled = !logged;
    if ($('eterLogin')) $('eterLogin').disabled = logged;
    if ($('eterRegister')) $('eterRegister').disabled = logged;
    if ($('eterLogout')) $('eterLogout').disabled = !logged;
  }

  async function signIn() {
    const email = $('eterEmail').value.trim();
    const password = $('eterPassword').value;

    if (!email || !password) {
      authFeedback('Informe seu e-mail e sua senha.');
      return;
    }

    $('eterLogin').disabled = true;
    authFeedback('Entrando na sua conta...');

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      session = data.session;
      updateAuthUI();
      await refreshCampaigns();

      authFeedback('Login realizado com sucesso!');
      message('Conta conectada. Sua jornada está pronta.');

    } catch (e) {
      authFeedback('Falha no login: ' + e.message);
    } finally {
      if ($('eterLogin')) $('eterLogin').disabled = !!session;
    }
  }

  async function signUp() {
    const email = $('eterEmail').value.trim();
    const password = $('eterPassword').value;

    if (!email || !password) {
      authFeedback('Informe e-mail e senha para criar a conta.');
      return;
    }

    if (password.length < 6) {
      authFeedback('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    $('eterRegister').disabled = true;
    authFeedback('Criando sua conta...');

    try {
      const { data, error } = await db.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        session = data.session;
        updateAuthUI();
        await refreshCampaigns();
        authFeedback('Conta criada e conectada. Pode começar!');
      } else {
        authFeedback(
          'Conta criada. Confirme seu e-mail, se solicitado, e depois entre.'
        );
      }

    } catch (e) {
      authFeedback('Falha ao criar conta: ' + e.message);
    } finally {
      if ($('eterRegister')) $('eterRegister').disabled = !!session;
    }
  }

  async function signOut() {
    try {
      const { error } = await db.auth.signOut();
      if (error) throw error;

      session = null;
      campaignId = null;
      character = null;

      updateAuthUI();
      showScreen('eterHome');

      $('eterCampaignList').innerHTML =
        '<option value="">Entre para carregar campanhas</option>';

      message('Você saiu da sua conta.');
      authFeedback('Sessão encerrada.');

    } catch (e) {
      authFeedback('Erro ao sair: ' + e.message);
    }
  }

  function renderAttributes() {
    const box = $('eterAttributes');
    if (!box) return;

    box.innerHTML = '';

    ATTRIBUTES.forEach(([key, label]) => {
      const div = document.createElement('div');
      div.className = 'eter-attribute';

      div.innerHTML = `
        <div>${label}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
          <button type="button" data-minus="${key}">−</button>
          <strong id="attr-${key}">5</strong>
          <button type="button" data-plus="${key}">+</button>
        </div>
      `;

      box.appendChild(div);
    });

    box.onclick = e => {
      const plus = e.target.dataset.plus;
      const minus = e.target.dataset.minus;

      if (plus && points > 0) {
        const el = $('attr-' + plus);
        const value = Number(el.textContent);

        if (value < 18) {
          el.textContent = value + 1;
          points--;
        }
      }

      if (minus) {
        const el = $('attr-' + minus);
        const value = Number(el.textContent);

        if (value > 5) {
          el.textContent = value - 1;
          points++;
        }
      }

      $('eterPoints').textContent = 'Pontos disponíveis: ' + points;
    };
  }

  function resetAttributes() {
    points = 12;

    ATTRIBUTES.forEach(([key]) => {
      if ($('attr-' + key)) $('attr-' + key).textContent = '5';
    });

    $('eterPoints').textContent = 'Pontos disponíveis: 12';
  }

  function getAttributes() {
    const result = {};

    ATTRIBUTES.forEach(([key]) => {
      result[key] = Number($('attr-' + key).textContent);
    });

    return result;
  }

  function loadSDK() {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

      script.onload = resolve;
      script.onerror = () => reject(
        new Error('Não foi possível carregar o Supabase. Verifique sua internet.')
      );

      document.head.appendChild(script);
    });
  }

  async function initialize() {
    if (initializing) return;
    initializing = true;

    try {
      installStyle();
      installInterface();
      await loadSDK();

      db = window.supabase.createClient(
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

      const { data, error } = await db.auth.getSession();
      if (error) throw error;

      session = data.session;
      updateAuthUI();

      db.auth.onAuthStateChange((_event, newSession) => {
        session = newSession;
        updateAuthUI();

        if (session) {
          Promise.resolve().then(() => {
            refreshCampaigns().catch(e => message(e.message));
          });
        } else {
          campaignId = null;
          character = null;
          showScreen('eterHome');

          if ($('eterCampaignList')) {
            $('eterCampaignList').innerHTML =
              '<option value="">Entre para carregar campanhas</option>';
          }

          message('Entre para acessar sua jornada.');
        }
      });

      if (!session) {
        $('maiStatus').textContent = 'Aguardando login';
        $('otaStatus').textContent = 'Aguardando login';
        message('Entre ou crie uma conta para começar sua aventura.');
        return;
      }

      $('maiStatus').textContent = 'Gemini via backend';
      $('otaStatus').textContent = 'Groq via backend';

      message('Conta conectada. Carregando campanhas...');
      await refreshCampaigns();

    } catch (e) {
      console.error(e);
      message('Erro ao iniciar: ' + e.message);
      authFeedback('Erro ao conectar: ' + e.message);
    } finally {
      initializing = false;
    }
  }

  async function refreshCampaigns() {
    if (!session) return;

    const { data, error } = await db
      .from('campaigns')
      .select('id,title,updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const select = $('eterCampaignList');
    select.innerHTML = '<option value="">Escolha uma campanha</option>';

    (data || []).forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.title;
      select.appendChild(option);
    });

    message((data || []).length + ' campanha(s) encontrada(s).');
  }

  async function startNewCampaign() {
    if (busy) return;

    try {
      if (!session) {
        throw new Error('Entre na sua conta antes de criar a aventura.');
      }

      const name = $('eterName').value.trim();
      const title = $('eterCampaignName').value.trim();
      const race = $('eterRace').value;
      const playerClass = $('eterClass').value;
      const premise = $('eterPremise').value.trim();

      if (!name) throw new Error('Digite o nome do personagem.');
      if (!title) throw new Error('Digite o nome da campanha.');

      if (points !== 0) {
        throw new Error('Distribua todos os 12 pontos de atributos.');
      }

      busy = true;
      $('eterStart').disabled = true;
      message('Criando seu mundo e personagem...');

      const { data: campaign, error: campaignError } = await db
        .from('campaigns')
        .insert({
          user_id: session.user.id,
          title,
          premise: premise || 'Uma aventura medieval de fantasia.',
          world_canon: 'Mundo de fantasia medieval de Crônicas de Éter.',
          house_rules:
            'OTA administra regras, testes, dados e consequências. Maiar narra a aventura e interpreta o mundo.'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      campaignId = campaign.id;

      const attributes = {
        ...getAttributes(),
        race
      };

      const { data: createdCharacter, error: charError } = await db
        .from('characters')
        .insert({
          campaign_id: campaignId,
          user_id: session.user.id,
          name,
          class: playerClass,
          level: 1,
          experience: 0,
          attributes,
          resources: {
            hp: 20 + attributes.con,
            hp_max: 20 + attributes.con,
            mana: 10 + attributes.int,
            mana_max: 10 + attributes.int,
            stamina: 10 + attributes.for
          }
        })
        .select()
        .single();

      if (charError) throw charError;

      character = createdCharacter;

      const { error: sessionError } = await db
        .from('game_sessions')
        .insert({
          campaign_id: campaignId,
          user_id: session.user.id,
          status: 'active',
          current_region: 'Ponto de partida',
          world_state: {
            chapter: 1,
            day: 1,
            started: true
          }
        });

      if (sessionError) throw sessionError;

      await refreshCampaigns();
      await openCampaign(campaignId);

      feedback('Personagem criado. Maiar está preparando sua primeira cena...');

      await submitAction({
        campaign_id: campaignId,
        input_mode: 'free_text',
        player_text:
          'Inicie a aventura do zero. Apresente o mundo, a situação inicial, onde meu personagem começa e um acontecimento que permita escolher como agir. Respeite minha raça, classe e atributos.'
      }, false);

    } catch (e) {
      console.error(e);
      message('Erro ao criar aventura: ' + e.message);
      feedback(e.message);

    } finally {
      busy = false;
      if ($('eterStart')) $('eterStart').disabled = !session;
    }
  }

  async function continueCampaign() {
    if (!session) {
      authFeedback('Entre na sua conta primeiro.');
      return;
    }

    const selected = $('eterCampaignList').value;

    if (selected) {
      await openCampaign(selected);
      return;
    }

    const { data, error } = await db
      .from('campaigns')
      .select('id')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      message(error.message);
      return;
    }

    if (!data?.length) {
      message('Você ainda não possui campanha. Comece do zero!');
      showScreen('eterCreation');
      return;
    }

    await openCampaign(data[0].id);
  }

  async function openCampaign(id) {
    try {
      if (!session) throw new Error('Entre na sua conta primeiro.');

      const { data: campaign, error: campError } = await db
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (campError) throw campError;

      const { data: chars, error: charError } = await db
        .from('characters')
        .select('*')
        .eq('campaign_id', id)
        .eq('user_id', session.user.id)
        .order('created_at')
        .limit(1);

      if (charError) throw charError;

      character = chars?.[0] || null;

      if (!character) {
        throw new Error('Esta campanha não possui personagem.');
      }

      campaignId = id;

      $('eterJourneyTitle').textContent = campaign.title;
      renderCharacter();
      showScreen('eterJourney');

      await loadNarrative();
      message('Jornada carregada. Maiar está à sua espera.');

    } catch (e) {
      message('Erro ao abrir campanha: ' + e.message);
    }
  }

  function renderCharacter() {
    if (!character) return;

    $('eterCharacter').textContent =
      `${character.name} · ${character.attributes?.race || 'Raça não definida'} · ${character.class} · Nível ${character.level} · XP ${character.experience}`;
  }

  async function loadNarrative() {
    const { data, error } = await db
      .from('narrative_turns')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', session.user.id)
      .order('turn_number');

    if (error) throw error;

    const box = $('eterStory');
    box.innerHTML = '';

    if (!data?.length) {
      box.textContent = 'Esta aventura ainda não possui cenas.';
      return;
    }

    data.forEach(turn => {
      addStory('MAIAR · MESTRE NARRADOR', turn.scene_text, 'maiar');
    });

    renderChoices(data[data.length - 1].options || []);
  }

  function addStory(label, content, type) {
    const box = $('eterStory');
    const entry = document.createElement('div');
    entry.className = 'eter-entry ' + (type || '');

    const title = document.createElement('small');
    title.textContent = label;

    const text = document.createElement('div');
    text.className = 'eter-scene';
    text.textContent = content || '';

    entry.append(title, text);
    box.appendChild(entry);
    box.scrollTop = box.scrollHeight;
  }

  function renderChoices(options) {
    const box = $('eterOptions');
    box.innerHTML = '';

    (options || []).forEach(option => {
      const button = document.createElement('button');
      button.className = 'eter-option';

      const key = option.key || option.id || '';
      button.textContent =
        (key ? key + ' — ' : '') + (option.text || option.label || '');

      button.onclick = () => sendChoice(key);
      box.appendChild(button);
    });

    const free = document.createElement('div');
    free.className = 'eter-muted';
    free.textContent = 'Ou escreva sua própria ação abaixo.';
    box.appendChild(free);
  }

  async function callGameAI(payload) {
    const { data, error } = await db.functions.invoke(
      'submit-player-action',
      { body: payload }
    );

    if (error) {
      let detail = error.message;

      try {
        const response = await error.context.json();
        detail = response.detail || response.error || detail;
      } catch (_) {}

      throw new Error(detail);
    }

    if (data?.error) {
      throw new Error(data.detail || data.error);
    }

    return data;
  }

  async function sendFreeAction() {
    if (!session) {
      authFeedback('Entre na sua conta antes de jogar.');
      return;
    }

    if (!campaignId) {
      feedback('Comece ou abra uma campanha primeiro.');
      return;
    }

    const text = $('eterAction').value.trim();

    if (!text) {
      feedback('Escreva sua ação antes de enviar.');
      return;
    }

    await submitAction({
      campaign_id: campaignId,
      input_mode: 'free_text',
      player_text: text
    }, true);
  }

  async function sendChoice(key) {
    if (!session) {
      authFeedback('Entre na sua conta antes de jogar.');
      return;
    }

    if (!campaignId || !key) return;

    await submitAction({
      campaign_id: campaignId,
      input_mode: 'choice',
      selected_option_key: key
    }, true);
  }

  async function submitAction(payload, showPlayerText) {
    if (busy || !campaignId || !session) return;

    busy = true;
    $('eterSend').disabled = true;

    $('eterOptions').querySelectorAll('button').forEach(button => {
      button.disabled = true;
    });

    if (showPlayerText) {
      addStory(
        'SUA AÇÃO',
        payload.player_text || 'Escolha: ' + payload.selected_option_key,
        'player'
      );
    }

    $('maiStatus').textContent = 'Narrando...';
    $('otaStatus').textContent = 'Validando regras...';

    feedback('OTA está analisando sua ação. Maiar está preparando a resposta...');

    try {
      const result = await callGameAI(payload);
      const admin = result.administrator || {};

      $('otaStatus').textContent =
        result.providers?.administrator?.provider
          ? 'Ativo · ' + result.providers.administrator.provider
          : 'Ação validada';

      if (admin.roll !== null && admin.roll !== undefined) {
        addStory(
          'OTA · RESULTADO DOS DADOS',
          `D20: ${admin.roll} | Modificador: ${admin.modifier} | Total: ${admin.total} | Dificuldade: ${admin.difficulty} | ${admin.success ? 'SUCESSO' : 'FALHA'}`,
          ''
        );
      }

      const narrative = result.narrative;

      if (!narrative?.scene_text) {
        throw new Error('Maiar não retornou uma cena.');
      }

      addStory(
        'MAIAR · MESTRE NARRADOR',
        narrative.scene_text,
        'maiar'
      );

      renderChoices(narrative.options || []);

      $('maiStatus').textContent =
        result.providers?.master?.provider
          ? 'Ativo · ' + result.providers.master.provider
          : 'Cena criada';

      $('eterAction').value = '';

      feedback('Turno concluído. Sua jornada continua.');

      await refreshCharacter();

    } catch (e) {
      console.error(e);

      addStory('SISTEMA', e.message, '');

      feedback('Não foi possível concluir o turno: ' + e.message);

      $('maiStatus').textContent = 'Erro';
      $('otaStatus').textContent = 'Verificar conexão';

    } finally {
      busy = false;
      $('eterSend').disabled = !session;

      $('eterOptions').querySelectorAll('button').forEach(button => {
        button.disabled = false;
      });
    }
  }

  async function refreshCharacter() {
    if (!campaignId) return;

    const { data, error } = await db
      .from('characters')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', session.user.id)
      .order('created_at')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      character = data;
      renderCharacter();
    }
  }

  function start() {
    if ($('solo')) initialize();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

})();
