/* ==========================================================
   CRÔNICAS DE ÉTER — PAINEL RPG INTEGRADO
   ========================================================== */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  let db = null;
  let userId = null;
  let campaignId = null;
  let busy = false;
  let timer = null;
  let observer = null;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  const num = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const pct = (value, max) =>
    Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0));

  function rarityColor(value) {
    const key = String(value || "").toLowerCase();

    if (/deus|divin/.test(key)) return "#f3dca1";
    if (/lend|legend/.test(key)) return "#d9a548";
    if (/mist|abiss|caos/.test(key)) return "#bd78df";
    if (/super/.test(key)) return "#a17be0";
    if (/rar/.test(key)) return "#5ca5e5";
    if (/incom/.test(key)) return "#67b67a";

    return "#a7adb7";
  }

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
        line-height:1.6;
      }

      .eru-character {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        flex-wrap:wrap;
      }

      .eru-gold {
        background:#302719;
        border:1px solid #806338;
        border-radius:8px;
        padding:9px;
        color:#f0d18e;
        font-weight:bold;
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

      .eru-entities-grid {
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));
        gap:12px;
      }

      .eru-entity-card {
        min-width:0;
        padding:12px;
        border:1px solid #424b5d;
        border-radius:10px;
        background:#151c28;
      }

      .eru-entity {
        display:grid;
        grid-template-columns:75px minmax(0,1fr);
        gap:12px;
      }

      .eru-portrait {
        min-height:90px;
        display:grid;
        place-items:center;
        font-size:42px;
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
        min-width:0;
      }

      .eru-entity-stat b {
        display:block;
        color:#f0d39a;
        font-size:13px;
        overflow-wrap:anywhere;
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

      .eru-location {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:8px;
      }

      .eru-location-box {
        background:#111722;
        border:1px solid #424b5d;
        border-radius:8px;
        padding:11px;
        min-width:0;
      }

      .eru-location-box small {
        display:block;
        color:#929bad;
        font-size:9px;
        margin-bottom:5px;
      }

      .eru-location-box b {
        color:#edca87;
        font-size:12px;
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
          grid-template-columns:60px minmax(0,1fr);
        }

        .eru-portrait {
          min-height:75px;
          font-size:34px;
        }

        .eru-entity-stats {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .eru-items {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .eru-location {
          grid-template-columns:1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createDashboard() {
    if ($("eterRpgDashboard")) return;

    const root = document.createElement("section");
    root.id = "eterRpgDashboard";

    root.innerHTML = `
      <section class="eru-panel">
        <div class="eru-heading">
          <h3>🧙 Ficha do aventureiro</h3>
          <small id="eruSyncStatus">Aguardando conexão...</small>
        </div>
        <div id="eruCharacterContent" class="eru-empty">
          Entre na sua conta e selecione uma campanha.
        </div>
      </section>

      <section class="eru-panel">
        <div class="eru-heading">
          <h3>🗺️ Localização e mundo</h3>
          <small>Estado da jornada</small>
        </div>
        <div id="eruWorldContent" class="eru-location">
          <div class="eru-empty">Aguardando dados do mundo.</div>
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

  function renderBar(label,value,max,color) {
    return `
      <div class="eru-resource">
        <div class="eru-resource-top">
          <span>${label}</span>
          <b>${value} / ${max}</b>
        </div>
        <div class="eru-track">
          <div class="eru-fill ${color}"
            style="width:${pct(value,max)}%">
          </div>
        </div>
      </div>
    `;
  }

  function renderCharacter(character) {
    const host = $("eruCharacterContent");

    if (!character) {
      host.className = "eru-empty";
      host.textContent = "Nenhum personagem encontrado nesta campanha.";
      return;
    }

    const r = character.resources || {};
    const a = character.attributes || {};

    const hp = num(r.hp);
    const hpMax = Math.max(1,num(r.hp_max ?? r.max_hp,30));

    const mana = num(r.mana);
    const manaMax = Math.max(1,num(r.mana_max ?? r.max_mana,20));

    const stamina = num(r.stamina);
    const staminaMax = Math.max(1,num(r.stamina_max,20));

    const xp = num(character.experience);
    const level = Math.max(1,num(character.level,1));
    const nextLevel = level * 500;

    const attrs = [
      ["FOR",a.for ?? a.str ?? 10],
      ["DES",a.des ?? a.dex ?? 10],
      ["CON",a.con ?? 10],
      ["INT",a.int ?? 10],
      ["SAB",a.sab ?? a.wis ?? 10],
      ["CAR",a.car ?? a.cha ?? 10]
    ];

    host.className = "";

    host.innerHTML = `
      <div class="eru-character">
        <div>
          <div class="eru-name">🧙 ${esc(character.name || "Aventureiro")}</div>
          <div class="eru-meta">
            ${esc(character.class || "Viajante")}
            · Nível ${level}
            · ${xp} XP
          </div>
        </div>
        <div class="eru-gold">🪙 ${num(r.gold)} ouro</div>
      </div>

      <div class="eru-bars">
        ${renderBar("❤️ HP",hp,hpMax,"eru-hp")}
        ${renderBar("🔷 Mana",mana,manaMax,"eru-mana")}
        ${renderBar("⚡ Energia",stamina,staminaMax,"eru-stamina")}
      </div>

      <div class="eru-resource" style="margin-top:10px">
        <div class="eru-resource-top">
          <span>✨ Próximo nível</span>
          <b>${xp} / ${nextLevel} XP</b>
        </div>
        <div class="eru-track">
          <div class="eru-fill eru-xp"
            style="width:${pct(xp,nextLevel)}%">
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

  function renderWorld(session,encounter) {
    const host = $("eruWorldContent");
    const world = session?.world_state || {};

    const region =
      session?.current_region ||
      encounter?.region ||
      "Região desconhecida";

    const chapter = world.chapter ?? "—";
    const day = world.day ?? "—";
    const time = world.time || world.period || "Não definido";

    host.innerHTML = `
      <div class="eru-location-box">
        <small>📍 REGIÃO</small>
        <b>${esc(region)}</b>
      </div>
      <div class="eru-location-box">
        <small>📜 CAPÍTULO / DIA</small>
        <b>${esc(chapter)} / ${esc(day)}</b>
      </div>
      <div class="eru-location-box">
        <small>🕰️ HORÁRIO</small>
        <b>${esc(time)}</b>
      </div>
    `;
  }

  function renderEntity(encounter,combatants,monsters) {
    const host = $("eruEntityContent");

    const alive = (combatants || []).filter(c =>
      c.entity_type !== "player" &&
      c.is_alive !== false &&
      num(c.hp_current,1) > 0
    );

    if (!encounter || !alive.length) {
      host.className = "eru-empty";
      host.textContent = "Nenhum monstro ou NPC ativo foi registrado nesta cena.";
      $("eruEncounterStatus").textContent = "Exploração";
      return;
    }

    host.className = "eru-entities-grid";

    host.innerHTML = alive.map(entity => {
      const monster = (monsters || []).find(m =>
        m.id === entity.entity_id
      );

      const isNpc = entity.entity_type === "npc";
      const stats = entity.stats || {};
      const rarity = entity.rarity_key || monster?.rarity_key || "";

      const description =
        monster?.description ||
        stats.description ||
        encounter.narrative_context ||
        "Uma presença foi registrada neste encontro.";

      const hp = num(entity.hp_current);
      const hpMax = Math.max(1,num(entity.hp_max,1));
      const mana = num(entity.mana_current);
      const manaMax = num(entity.mana_max);

      const attack = num(stats.attack ?? monster?.attack);
      const defense = num(stats.defense ?? entity.armor ?? monster?.defense);
      const xp = num(monster?.experience_reward ?? stats.experience_reward);

      const role = stats.role || stats.profession ||
        (isNpc ? "Personagem não jogável" :
        monster?.monster_type || "Criatura");

      const personality = stats.personality || stats.temperament || "";

      const name = entity.display_name ||
        monster?.name ||
        (isNpc ? "NPC desconhecido" : "Criatura desconhecida");

      const rarityLabel = rarity
        ? rarity.replaceAll("_"," ")
        : "Não definida";

      return `
        <article class="eru-entity-card">
          <div class="eru-entity">
            <div class="eru-portrait">${isNpc ? "🧝" : "👹"}</div>
            <div>
              <h4>${esc(name)}</h4>

              <div class="eru-tags">
                <span class="eru-tag">${isNpc ? "NPC" : "MONSTRO"}</span>

                <span class="eru-tag"
                  style="color:${rarityColor(rarity)};border-color:${rarityColor(rarity)}">
                  ${esc(rarityLabel)}
                </span>

                ${entity.level ? `
                  <span class="eru-tag">Nível ${num(entity.level)}</span>
                ` : ""}
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
        </article>
      `;
    }).join("");

    const npcCount = alive.filter(c => c.entity_type === "npc").length;
    const monsterCount = alive.filter(c => c.entity_type === "monster").length;

    $("eruEncounterStatus").textContent =
      `${monsterCount} monstro(s) · ${npcCount} NPC(s)`;
  }

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
      sum + Math.max(1,num(item.quantity,1)),0
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
            <span>×${Math.max(1,num(item.quantity,1))}</span>
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

  function renderEquipment(items,character) {
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
        renderWorld(null,null);
        $("eruSyncStatus").textContent = "Ficha não encontrada";
        return;
      }

      const [inventoryResult,encounterResult,sessionResult] =
        await Promise.all([
          db.from("inventory_items")
            .select("id,character_id,name,description,rarity,element,quantity,item_data,created_at")
            .eq("character_id",character.id)
            .eq("user_id",userId)
            .order("created_at",{ascending:false}),

          db.from("encounters")
            .select("id,campaign_id,user_id,region,encounter_type,narrative_context,status,round_number,created_at")
            .eq("campaign_id",campaignId)
            .eq("user_id",userId)
            .eq("status","active")
            .order("created_at",{ascending:false})
            .limit(1)
            .maybeSingle(),

          db.from("game_sessions")
            .select("status,current_region,world_state")
            .eq("campaign_id",campaignId)
            .eq("user_id",userId)
            .maybeSingle()
        ]);

      if (inventoryResult.error) throw inventoryResult.error;
      if (encounterResult.error) throw encounterResult.error;
      if (sessionResult.error) throw sessionResult.error;

      const items = inventoryResult.data || [];
      const encounter = encounterResult.data;
      const gameSession = sessionResult.data;

      renderInventory(items);
      renderEquipment(items,character);
      renderWorld(gameSession,encounter);

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

      $("eruSyncStatus").textContent =
        "Atualizado · " + new Date().toLocaleTimeString("pt-BR");

    } catch (error) {
      console.error("[Crônicas de Éter]",error);
      $("eruSyncStatus").textContent = "Falha ao atualizar";
      $("eruSyncStatus").title = error?.message || String(error);
    } finally {
      busy = false;
    }
  }

  function connect(client,session) {
    if (!client) return;

    db = client;
    userId = session?.user?.id || null;
    campaignId = $("campaignSelect")?.value || null;

    if (userId && campaignId) {
      loadDashboard();
    } else {
      renderCharacter(null);
      renderInventory([]);
      renderEquipment([],null);
      renderEntity(null,[],[]);
      renderWorld(null,null);

      $("eruSyncStatus").textContent =
        userId ? "Selecione uma campanha" : "Faça login";
    }
  }

  function init() {
    styles();
    createDashboard();

    window.addEventListener("eter:supabase-ready",event => {
      connect(
        event.detail?.client || window.eterSupabaseClient,
        event.detail?.session || null
      );

      if (window.eterSupabaseClient) {
        window.eterSupabaseClient.auth.getSession().then(result => {
          connect(
            window.eterSupabaseClient,
            result.data?.session || null
          );
        });
      }
    });

    if (window.eterSupabaseClient) {
      window.eterSupabaseClient.auth.getSession().then(result => {
        connect(
          window.eterSupabaseClient,
          result.data?.session || null
        );
      });
    }

    $("campaignSelect")?.addEventListener("change",event => {
      campaignId = event.target.value || null;
      loadDashboard();
    });

    const log = $("storyLog");

    if (log && window.MutationObserver) {
      observer = new MutationObserver(() => {
        if (db && userId && campaignId) {
          clearTimeout(observer.refreshTimer);
          observer.refreshTimer = setTimeout(loadDashboard,900);
        }
      });

      observer.observe(log,{
        childList:true,
        subtree:true
      });
    }

    if (timer) clearInterval(timer);

    timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;

      const selected = $("campaignSelect")?.value || null;

      if (selected !== campaignId) {
        campaignId = selected;
      }

      if (db && userId && campaignId) {
        loadDashboard();
      }
    },7000);

    document.addEventListener("visibilitychange",() => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded",init,{once:true});
  } else {
    init();
  }

})();
