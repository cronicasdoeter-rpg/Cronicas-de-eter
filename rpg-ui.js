
/* ==========================================================
   CRÔNICAS DE ÉTER — INTERFACE VISUAL RPG
   Arquivo: rpg-ui.js
   Complemento independente de solo.js e dados.js
   ========================================================== */

(() => {
  "use strict";

  const SUPABASE_URL = "https://wwumjtorusjblitkzyjt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5DS37kwbBFfhOir50K0QyA_54lvldUM";

  const $ = id => document.getElementById(id);

  let db = null;
  let userId = null;
  let campaignId = null;
  let busy = false;
  let timer = null;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  const n = (value, fallback = 0) => {
    const result = Number(value);
    return Number.isFinite(result) ? result : fallback;
  };

  const percent = (value, max) =>
    Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0));

  /* =========================
     ESTILOS
  ========================= */

  function styles() {
    if ($("eterRpgStyles")) return;

    const style = document.createElement("style");
    style.id = "eterRpgStyles";

    style.textContent = `
      #eterRpgDashboard {
        display:grid;
        gap:14px;
        margin:16px 0;
        color:#eee8dc;
        font-family:inherit;
      }

      #eterRpgDashboard * {
        box-sizing:border-box;
      }

      .eru-panel {
        background:linear-gradient(145deg,#202634,#111620);
        border:1px solid #424b5d;
        border-radius:13px;
        padding:15px;
        min-width:0;
      }

      .eru-heading {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        margin-bottom:13px;
      }

      .eru-heading h3 {
        color:#edca87;
        font-family:Georgia,serif;
        font-size:16px;
        margin:0;
      }

      .eru-heading small {
        font-size:10px;
        color:#929bad;
      }

      .eru-name {
        color:#f2d49c;
        font-size:20px;
        font-weight:bold;
      }

      .eru-meta {
        color:#aeb8c8;
        font-size:11px;
        margin-top:5px;
      }

      .eru-character {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
      }

      .eru-gold {
        background:#302719;
        border:1px solid #806338;
        border-radius:8px;
        padding:9px;
        color:#f0d18e;
        font-weight:bold;
        white-space:nowrap;
      }

      .eru-bars {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:9px;
        margin-top:14px;
      }

      .eru-resource {
        background:#10151e;
        border:1px solid #343d4e;
        border-radius:9px;
        padding:10px;
        min-width:0;
      }

      .eru-resource-top {
        display:flex;
        justify-content:space-between;
        gap:5px;
        font-size:11px;
      }

      .eru-track {
        height:8px;
        background:#303746;
        border-radius:10px;
        overflow:hidden;
        margin-top:8px;
      }

      .eru-fill {
        height:100%;
        border-radius:10px;
        transition:width .3s;
      }

      .eru-hp {
        background:linear-gradient(90deg,#923c45,#ed7777);
      }

      .eru-mana {
        background:linear-gradient(90deg,#315b9b,#68b8ec);
      }

      .eru-stamina {
        background:linear-gradient(90deg,#36734e,#8bd09b);
      }

      .eru-xp {
        background:linear-gradient(90deg,#98723a,#eac77e);
      }

      .eru-attributes {
        display:grid;
        grid-template-columns:repeat(6,minmax(0,1fr));
        gap:7px;
        margin-top:12px;
      }

      .eru-attribute {
        background:#111722;
        border:1px solid #343d4e;
        border-radius:8px;
        padding:8px 4px;
        text-align:center;
      }

      .eru-attribute b {
        display:block;
        color:#f0d39a;
        font-size:17px;
      }

      .eru-attribute small {
        color:#aab3c1;
        font-size:9px;
      }

      .eru-grid {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:14px;
      }

      .eru-entity {
        display:grid;
        grid-template-columns:85px minmax(0,1fr);
        gap:12px;
      }

      .eru-portrait {
        min-height:100px;
        display:grid;
        place-items:center;
        font-size:48px;
        border:1px solid #81643e;
        border-radius:10px;
        background:radial-gradient(circle,#4a4051,#171b25);
      }

      .eru-entity h4 {
        color:#f0d39a;
        font-family:Georgia,serif;
        font-size:16px;
        margin:0 0 6px;
      }

      .eru-description {
        color:#c5cbd5;
        font-size:11px;
        line-height:1.65;
        white-space:pre-wrap;
      }

      .eru-tags {
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        margin:7px 0;
      }

      .eru-tag {
        border:1px solid #465064;
        background:#242c39;
        color:#e5d4ad;
        border-radius:20px;
        padding:5px 8px;
        font-size:9px;
      }

      .eru-entity-stats {
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:6px;
        margin-top:11px;
      }

      .eru-entity-stat {
        background:#111722;
        border:1px solid #343d4e;
        border-radius:8px;
        padding:8px 4px;
        text-align:center;
      }

      .eru-entity-stat b {
        display:block;
        color:#f0d39a;
        font-size:13px;
      }

      .eru-entity-stat small {
        color:#929bad;
        font-size:9px;
      }

      .eru-empty {
        padding:18px;
        text-align:center;
        border:1px dashed #465064;
        border-radius:9px;
        color:#aab3c1;
        font-size:11px;
        line-height:1.6;
      }

      .eru-items {
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
        gap:9px;
      }

      .eru-item {
        border:1px solid #424b5d;
        border-left:3px solid var(--rarity,#929bad);
        border-radius:9px;
        background:#111722;
        padding:10px;
        min-width:0;
      }

      .eru-item-top {
        display:flex;
        justify-content:space-between;
        align-items:center;
      }

      .eru-item-icon {
        font-size:25px;
      }

      .eru-item b {
        display:block;
        color:#eee1c6;
        font-size:12px;
        margin:7px 0 4px;
        overflow-wrap:anywhere;
      }

      .eru-item p {
        color:#aab3c1;
        font-size:10px;
        line-height:1.5;
        margin:0;
      }

      .eru-item small {
        display:block;
        color:var(--rarity,#aab3c1);
        font-size:9px;
        margin-top:7px;
        text-transform:uppercase;
      }

      .eru-equipment {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }

      .eru-slot {
        background:#111722;
        border:1px solid #424b5d;
        border-radius:8px;
        padding:10px;
      }

      .eru-slot b {
        display:block;
        color:#e5d3ae;
        font-size:10px;
        margin-bottom:5px;
      }

      .eru-slot span {
        color:#aeb6c4;
        font-size:10px;
        overflow-wrap:anywhere;
      }

      @media(max-width:650px) {
        .eru-bars {
          grid-template-columns:1fr;
        }

        .eru-grid {
          grid-template-columns:1fr;
        }

        .eru-attributes {
          grid-template-columns:repeat(3,minmax(0,1fr));
        }

        .eru-entity {
          grid-template-columns:70px minmax(0,1fr);
        }

        .eru-portrait {
          min-height:85px;
          font-size:38px;
        }

        .eru-entity-stats {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .eru-items {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================
     CRIAÇÃO DOS PAINÉIS
  ========================= */

  function createDashboard() {
    if ($("eterRpgDashboard")) return;

    const root = document.createElement("section");
    root.id = "eterRpgDashboard";

    root.innerHTML = `
      <section class="eru-panel">
        <div class="eru-heading">
          <h3>🧙 Ficha do aventureiro</h3>
          <small id="eruSyncStatus">Aguardando...</small>
        </div>
        <div id="eruCharacterContent" class="eru-empty">
          Entre na sua conta e selecione uma campanha.
        </div>
      </section>

      <div class="eru-grid">
        <section class="eru-panel">
          <div class="eru-heading">
            <h3>⚔️ Encontro atual</h3>
            <small id="eruEncounterStatus">Exploração</small>
          </div>
          <div id="eruEntityContent" class="eru-empty">
            Nenhum monstro ou NPC ativo nesta cena.
          </div>
        </section>

        <section class="eru-panel">
          <div class="eru-heading">
            <h3>🛡️ Equipamentos</h3>
            <small>Itens equipados</small>
          </div>
          <div id="eruEquipmentContent" class="eru-equipment">
            <div class="eru-empty">Equipamentos aparecerão aqui.</div>
          </div>
        </section>
      </div>

      <section class="eru-panel">
        <div class="eru-heading">
          <h3>🎒 Inventário</h3>
          <small id="eruInventoryCount">0 itens</small>
        </div>
        <div id="eruInventoryContent" class="eru-empty">
          Seu inventário aparecerá aqui.
        </div>
      </section>
    `;

    const state = $("soloState");
    const story = $("storyLog");

    if (state) {
      state.insertAdjacentElement("afterend", root);
    } else if (story) {
      story.insertAdjacentElement("beforebegin", root);
    } else {
      document.body.appendChild(root);
    }
  }

  /* =========================
     RARIDADES
  ========================= */

  function rarityColor(value) {
    const key = String(value || "").toLowerCase();

    if (/divin|deus/.test(key)) return "#f3dca1";
    if (/lend|legend/.test(key)) return "#d9a548";
    if (/mitic|abiss|caos/.test(key)) return "#b17be0";
    if (/super/.test(key)) return "#a17be0";
    if (/rar/.test(key)) return "#5ca5e5";
    if (/incom/.test(key)) return "#67b67a";

    return "#a7adb7";
  }

  /* =========================
     FICHA DO PERSONAGEM
  ========================= */

  function resourceBar(label, value, max, color) {
    return `
      <div class="eru-resource">
        <div class="eru-resource-top">
          <span>${label}</span>
          <b>${value} / ${max}</b>
        </div>
        <div class="eru-track">
          <div class="eru-fill ${color}"
            style="width:${percent(value,max)}%">
          </div>
        </div>
      </div>
    `;
  }

  function renderCharacter(character) {
    if (!character) {
      $("eruCharacterContent").className = "eru-empty";
      $("eruCharacterContent").textContent =
        "Nenhum personagem encontrado nesta campanha.";
      return;
    }

    const resources = character.resources || {};
    const attributes = character.attributes || {};

    const hp = n(resources.hp);
    const hpMax = Math.max(1,n(resources.hp_max ?? resources.max_hp,30));

    const mana = n(resources.mana);
    const manaMax = Math.max(1,n(resources.mana_max ?? resources.max_mana,20));

    const stamina = n(resources.stamina);
    const staminaMax = Math.max(1,n(resources.stamina_max ?? resources.max_stamina,20));

    const xp = n(character.experience);
    const level = Math.max(1,n(character.level,1));
    const nextLevel = level * 500;

    const attrs = [
      ["FOR",attributes.for ?? attributes.str ?? 10],
      ["DES",attributes.des ?? attributes.dex ?? 10],
      ["CON",attributes.con ?? 10],
      ["INT",attributes.int ?? 10],
      ["SAB",attributes.sab ?? attributes.wis ?? 10],
      ["CAR",attributes.car ?? attributes.cha ?? 10]
    ];

    $("eruCharacterContent").className = "";

    $("eruCharacterContent").innerHTML = `
      <div class="eru-character">
        <div>
          <div class="eru-name">🧙 ${esc(character.name || "Aventureiro")}</div>
          <div class="eru-meta">
            ${esc(character.class || "Viajante")}
            · Nível ${level}
            · ${xp} XP
          </div>
        </div>
        <div class="eru-gold">🪙 ${n(resources.gold)} ouro</div>
      </div>

      <div class="eru-bars">
        ${resourceBar("❤️ HP",hp,hpMax,"eru-hp")}
        ${resourceBar("🔷 Mana",mana,manaMax,"eru-mana")}
        ${resourceBar("⚡ Energia",stamina,staminaMax,"eru-stamina")}
      </div>

      <div class="eru-resource" style="margin-top:10px">
        <div class="eru-resource-top">
          <span>✨ Próximo nível</span>
          <b>${xp} / ${nextLevel} XP</b>
        </div>
        <div class="eru-track">
          <div class="eru-fill eru-xp"
            style="width:${percent(xp,nextLevel)}%">
          </div>
        </div>
      </div>

      <div class="eru-attributes">
        ${attrs.map(([label,value]) => `
          <div class="eru-attribute">
            <b>${esc(value)}</b>
            <small>${label}</small>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* =========================
     MONSTROS E NPCS
  ========================= */

  function renderEntity(encounter, combatants, monsters) {
    const host = $("eruEntityContent");

    const alive = (combatants || []).filter(c =>
      c.is_alive !== false && n(c.hp_current,1) > 0
    );

    if (!encounter || !alive.length) {
      host.className = "eru-empty";
      host.textContent =
        "Nenhum monstro ou NPC ativo foi registrado nesta cena.";
      $("eruEncounterStatus").textContent = "Exploração";
      return;
    }

    const entity =
      alive.find(c => c.entity_type === "monster") || alive[0];

    const monster = (monsters || []).find(m =>
      m.id === entity.entity_id
    );

    const isNpc =
      entity.entity_type === "npc" ||
      encounter.encounter_type === "social";

    const stats = entity.stats || {};
    const rarity = entity.rarity_key || monster?.rarity_key || "";

    const description =
      monster?.description ||
      stats.description ||
      encounter.narrative_context ||
      "Uma presença foi registrada neste encontro.";

    const hp = n(entity.hp_current);
    const hpMax = Math.max(1,n(entity.hp_max,1));
    const mana = n(entity.mana_current);
    const manaMax = n(entity.mana_max);

    const attack = n(stats.attack ?? monster?.attack);
    const defense = n(stats.defense ?? entity.armor ?? monster?.defense);
    const xp = n(monster?.experience_reward ?? stats.experience_reward);

    const level = n(entity.level);
    const role = stats.role || stats.profession ||
      (isNpc ? "Personagem não jogável" : monster?.monster_type || "Criatura");

    const personality = stats.personality || stats.temperament || "";

    host.className = "";

    host.innerHTML = `
      <div class="eru-entity">
        <div class="eru-portrait">${isNpc ? "🧝" : "👹"}</div>

        <div>
          <h4>
            ${esc(entity.display_name || monster?.name ||
              (isNpc ? "NPC desconhecido" : "Criatura desconhecida"))}
          </h4>

          <div class="eru-tags">
            <span class="eru-tag">${isNpc ? "NPC" : "MONSTRO"}</span>

            ${rarity ? `
              <span class="eru-tag"
                style="color:${rarityColor(rarity)};border-color:${rarityColor(rarity)}">
                ${esc(rarity.replaceAll("_"," "))}
              </span>
            ` : ""}

            ${level ? `<span class="eru-tag">Nível ${level}</span>` : ""}
          </div>

          <div class="eru-description">${esc(description)}</div>

          ${isNpc ? `
            <div class="eru-meta">
              🎭 ${esc(role)}
              ${personality ? " · " + esc(personality) : ""}
            </div>
          ` : ""}
        </div>
      </div>

      <div class="eru-entity-stats">
        <div class="eru-entity-stat">
          <b>❤️ ${hp}/${hpMax}</b>
          <small>VIDA</small>
        </div>

        <div class="eru-entity-stat">
          <b>🔷 ${mana}/${manaMax}</b>
          <small>MANA</small>
        </div>

        <div class="eru-entity-stat">
          <b>⚔️ ${attack}</b>
          <small>ATAQUE</small>
        </div>

        <div class="eru-entity-stat">
          <b>🛡️ ${defense}</b>
          <small>DEFESA</small>
        </div>
      </div>

      ${!isNpc && xp ? `
        <div class="eru-meta">
          ✨ Recompensa de experiência: ${xp} XP
        </div>
      ` : ""}
    `;

    $("eruEncounterStatus").textContent =
      isNpc ? "Interação social" : "Combate / ameaça";
  }

  /* =========================
     INVENTÁRIO
  ========================= */

  function itemIcon(item) {
    const data = item.item_data || {};
    const type = String(data.item_type || data.type || "").toLowerCase();
    const slot = String(data.equipment_slot || "").toLowerCase();

    if (/weapon|arma/.test(type)) return "⚔️";
    if (/armor|armadura/.test(type)) return "🛡️";
    if (/potion|consum|pocao|poção/.test(type)) return "🧪";
    if (/helmet|helm|elmo/.test(slot)) return "⛑️";
    if (/ring|anel/.test(slot)) return "💍";
    if (/book|livro/.test(type)) return "📖";
    if (/material|resource/.test(type)) return "💎";

    return data.icon || "🎁";
  }

  function renderInventory(items) {
    const host = $("eruInventoryContent");
    const list = items || [];

    const count = list.reduce((sum,item) =>
      sum + Math.max(1,n(item.quantity,1)),0
    );

    $("eruInventoryCount").textContent =
      `${count} unidades · ${list.length} tipos`;

    if (!list.length) {
      host.className = "eru-empty";
      host.textContent = "Inventário vazio.";
      return;
    }

    host.className = "eru-items";

    host.innerHTML = list.map(item => {
      const data = item.item_data || {};
      const rarity = item.rarity || data.rarity_key || "Comum";
      const description = item.description ||
        data.description || "Item da sua jornada.";

      return `
        <article class="eru-item"
          style="--rarity:${rarityColor(rarity)}">

          <div class="eru-item-top">
            <span class="eru-item-icon">${esc(itemIcon(item))}</span>
            <span>×${Math.max(1,n(item.quantity,1))}</span>
          </div>

          <b>${esc(item.name || "Item sem nome")}</b>
          <p>${esc(description)}</p>

          <small>
            ${esc(rarity.replaceAll("_"," "))}
            ${item.element ? " · " + esc(item.element) : ""}
          </small>
        </article>
      `;
    }).join("");
  }

  /* =========================
     EQUIPAMENTOS
  ========================= */

  function renderEquipment(items, character) {
    const host = $("eruEquipmentContent");

    const resources = character?.resources || {};
    const equipped = resources.equipped || resources.equipment || {};

    const slots = [
      ["weapon","⚔️ Arma"],
      ["armor","🛡️ Armadura"],
      ["helmet","⛑️ Elmo"],
      ["accessory","💍 Acessório"],
      ["shield","🛡️ Escudo"],
      ["boots","🥾 Botas"]
    ];

    host.innerHTML = slots.map(([key,label]) => {
      const selected = equipped[key] || equipped[key+"_id"] || "";

      const found = (items || []).find(item =>
        item.id === selected ||
        item.name === selected ||
        item.id === selected?.id ||
        item.name === selected?.name
      );

      const name = found?.name ||
        (typeof selected === "string" ? selected : selected?.name) ||
        "Vazio";

      return `
        <div class="eru-slot">
          <b>${label}</b>
          <span>${esc(name)}</span>
        </div>
      `;
    }).join("");
  }

  /* =========================
     ATUALIZAÇÃO DO BANCO
  ========================= */

  async function loadDashboard() {
    if (!db || !userId || !campaignId || busy) return;

    busy = true;
    $("eruSyncStatus").textContent = "Sincronizando…";

    try {
      const characterResult = await db
        .from("characters")
        .select("id,campaign_id,user_id,name,class,level,experience,attributes,resources")
        .eq("campaign_id",campaignId)
        .eq("user_id",userId)
        .limit(1)
        .maybeSingle();

      if (characterResult.error) throw characterResult.error;

      const character = characterResult.data;
      renderCharacter(character);

      if (!character) {
        renderInventory([]);
        renderEquipment([],null);
        renderEntity(null,[],[]);
        $("eruSyncStatus").textContent = "Ficha não encontrada";
        return;
      }

      const [inventoryResult,encounterResult] = await Promise.all([
        db.from("inventory_items")
          .select("id,character_id,name,description,rarity,element,quantity,item_data,created_at")
          .eq("character_id",character.id)
          .eq("user_id",userId)
          .order("created_at",{ascending:false}),

        db.from("encounters")
          .select("id,campaign_id,user_id,encounter_type,narrative_context,status,created_at")
          .eq("campaign_id",campaignId)
          .eq("user_id",userId)
          .eq("status","active")
          .order("created_at",{ascending:false})
          .limit(1)
          .maybeSingle()
      ]);

      if (inventoryResult.error) throw inventoryResult.error;
      if (encounterResult.error) throw encounterResult.error;

      const items = inventoryResult.data || [];

      renderInventory(items);
      renderEquipment(items,character);

      const encounter = encounterResult.data;

      if (!encounter) {
        renderEntity(null,[],[]);
      } else {
        const combatantResult = await db
          .from("combatants")
          .select("id,encounter_id,entity_type,entity_id,display_name,rarity_key,level,hp_current,hp_max,mana_current,mana_max,armor,stats,is_alive")
          .eq("encounter_id",encounter.id)
          .eq("user_id",userId);

        if (combatantResult.error) throw combatantResult.error;

        const combatants = combatantResult.data || [];

        const monsterIds = combatants
          .filter(c => c.entity_type === "monster" && c.entity_id)
          .map(c => c.entity_id);

        let monsters = [];

        if (monsterIds.length) {
          const monsterResult = await db
            .from("monster_catalog")
            .select("id,name,description,rarity_key,monster_type,health,attack,defense,experience_reward,habitat,abilities,elements")
            .in("id",monsterIds);

          if (monsterResult.error) throw monsterResult.error;

          monsters = monsterResult.data || [];
        }

        renderEntity(encounter,combatants,monsters);
      }

      $("eruSyncStatus").textContent = "Atualizado";
    } catch (error) {
      console.error("[Crônicas de Éter]",error);

      $("eruSyncStatus").textContent = "Falha ao atualizar";
      $("eruSyncStatus").title = error?.message || String(error);
    } finally {
      busy = false;
    }
  }

  /* =========================
     INICIALIZAÇÃO SUPABASE
  ========================= */

  async function loadSupabaseSdk() {
    if (window.supabase?.createClient) return;

    await new Promise((resolve,reject) => {
      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Não foi possível carregar o cliente Supabase."));

      document.head.appendChild(script);
    });
  }

  async function init() {
    styles();
    createDashboard();

    try {
      await loadSupabaseSdk();

      db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
          auth: {
            persistSession:true,
            autoRefreshToken:true,
            detectSessionInUrl:true
          }
        }
      );

      const sessionResult = await db.auth.getSession();

      if (sessionResult.error) throw sessionResult.error;

      userId = sessionResult.data.session?.user?.id || null;

      const campaignSelect = $("campaignSelect");

      function syncCampaign() {
        campaignId = campaignSelect?.value || null;

        if (campaignId && userId) {
          loadDashboard();
        } else {
          renderCharacter(null);
          renderInventory([]);
          renderEquipment([],null);
          renderEntity(null,[],[]);
          $("eruSyncStatus").textContent =
            userId ? "Selecione uma campanha" : "Faça login";
        }
      }

      campaignSelect?.addEventListener("change",syncCampaign);

      db.auth.onAuthStateChange((_event,session) => {
        userId = session?.user?.id || null;
        campaignId = campaignSelect?.value || null;

        if (userId && campaignId) loadDashboard();
      });

      if (campaignSelect?.value) {
        syncCampaign();
      } else {
        $("eruSyncStatus").textContent =
          userId ? "Selecione uma campanha" : "Faça login";
      }

      if (timer) clearInterval(timer);

      timer = setInterval(() => {
        if (document.visibilityState !== "visible") return;

        const selected = $("campaignSelect")?.value || null;

        if (selected !== campaignId) campaignId = selected;

        if (campaignId && userId) loadDashboard();
      },7000);

      document.addEventListener("visibilitychange",() => {
        if (document.visibilityState === "visible") {
          loadDashboard();
        }
      });

    } catch (error) {
      console.error("[Crônicas de Éter]",error);
      $("eruSyncStatus").textContent = "Erro de conexão";
      $("eruSyncStatus").title = error?.message || String(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded",init,{once:true});
  } else {
    init();
  }

})();
