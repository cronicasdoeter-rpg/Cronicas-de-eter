
(() => {
  "use strict";

  const SUPABASE_URL = "https://wwumjtorusjblitkzyjt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5DS37kwbBFfhOir50K0QyA_54lvldUM";
  const TABLE = "campaign_dice_rolls";

  let lastSignature = "";
  let currentCampaign = "";
  let loading = false;

  const $ = id => document.getElementById(id);

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  function getToken() {
    try {
      const key = Object.keys(localStorage).find(k =>
        k === "sb-wwumjtorusjblitkzyjt-auth-token"
      );

      if (!key) return null;

      const data = JSON.parse(localStorage.getItem(key) || "{}");
      return data.access_token || data.currentSession?.access_token || null;
    } catch {
      return null;
    }
  }

  function styles() {
    if ($("eterDiceStyles")) return;

    const style = document.createElement("style");
    style.id = "eterDiceStyles";

    style.textContent = `
      #eterDicePanel {
        margin: 16px 0;
        padding: 15px;
        border: 1px solid #80683f;
        border-radius: 15px;
        background: linear-gradient(145deg,#1c2432,#10151e);
        color: #eee5d5;
        box-shadow: 0 8px 24px #0005;
      }

      #eterDicePanel h3 {
        margin: 0 0 5px;
        color: #f0d39a;
        font-family: Georgia,serif;
      }

      .eter-dice-subtitle {
        color: #aeb7c7;
        font-size: 11px;
        margin-bottom: 13px;
      }

      .eter-dice-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 10px;
      }

      .eter-die-card {
        min-width: 0;
        padding: 12px 8px;
        border: 1px solid #ffffff20;
        border-radius: 12px;
        text-align: center;
        background: #0d1420;
      }

      .eter-die-card.player {
        border-color: #b58b4c88;
      }

      .eter-die-card.master {
        border-color: #6486b588;
      }

      .eter-die-label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1px;
        margin-bottom: 10px;
      }

      .eter-die {
        width: 75px;
        height: 75px;
        margin: 0 auto 9px;
        display: grid;
        place-items: center;
        clip-path: polygon(
          50% 0%, 88% 22%, 100% 62%,
          72% 100%, 25% 100%, 0% 62%, 12% 22%
        );
        background: linear-gradient(145deg,#d8b36e,#765027);
        color: #17100a;
        font-size: 27px;
        font-weight: 900;
        text-shadow: 0 1px 1px #fff7;
        box-shadow: 0 5px 18px #0008;
      }

      .eter-die-card.master .eter-die {
        background: linear-gradient(145deg,#9fc5e8,#344e75);
        color: #07111e;
      }

      .eter-die.rolling {
        animation: eterRoll .65s ease-in-out infinite;
      }

      @keyframes eterRoll {
        0% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(12deg) scale(.88); }
        50% { transform: rotate(-14deg) scale(1.08); }
        75% { transform: rotate(8deg) scale(.94); }
        100% { transform: rotate(0deg) scale(1); }
      }

      .eter-die-total {
        font-size: 13px;
        font-weight: 800;
        color: #f0d39a;
      }

      .eter-die-detail {
        min-height: 35px;
        margin-top: 6px;
        color: #bac3d0;
        font-size: 11px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .eter-dice-status {
        margin-top: 12px;
        padding: 9px;
        border-radius: 8px;
        background: #ffffff0b;
        color: #d9c9a8;
        font-size: 11px;
        text-align: center;
      }

      .eter-dice-history {
        margin-top: 15px;
        border-top: 1px solid #ffffff20;
        padding-top: 12px;
      }

      .eter-dice-history h4 {
        margin: 0 0 9px;
        color: #e5c58d;
        font-size: 12px;
      }

      .eter-roll-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 8px;
        margin: 5px 0;
        border-radius: 8px;
        background: #ffffff09;
        font-size: 11px;
      }

      .eter-roll-row b {
        color: #f0d39a;
      }

      .eter-roll-success { color: #8fdaa1; }
      .eter-roll-failure { color: #ff9b91; }

      @media(max-width:420px) {
        .eter-die { width: 62px; height: 62px; }
        .eter-die-card { padding: 10px 5px; }
      }
    `;

    document.head.appendChild(style);
  }

  function createPanel() {
    if ($("eterDicePanel")) return;

    const panel = document.createElement("section");
    panel.id = "eterDicePanel";

    panel.innerHTML = `
      <h3>🎲 Câmara dos Dados</h3>
      <div class="eter-dice-subtitle">
        Resultados oficiais calculados pelo servidor da campanha.
      </div>

      <div class="eter-dice-grid">
        <div class="eter-die-card player">
          <div class="eter-die-label">⚔️ JOGADOR</div>
          <div class="eter-die" id="eterPlayerDie">—</div>
          <div class="eter-die-total" id="eterPlayerTotal">
            Aguardando rolagem
          </div>
          <div class="eter-die-detail" id="eterPlayerDetail">
            D20 + modificador
          </div>
        </div>

        <div class="eter-die-card master">
          <div class="eter-die-label">👑 MESTRE</div>
          <div class="eter-die" id="eterMasterDie">—</div>
          <div class="eter-die-total" id="eterMasterTotal">
            Aguardando rolagem
          </div>
          <div class="eter-die-detail" id="eterMasterDetail">
            Pressão do mundo
          </div>
        </div>
      </div>

      <div class="eter-dice-status" id="eterDiceStatus">
        🎲 Aguardando uma ação que exija teste.
      </div>

      <div class="eter-dice-history">
        <h4>📜 Histórico de rolagens</h4>
        <div id="eterDiceHistory">
          Nenhuma rolagem registrada nesta campanha.
        </div>
      </div>
    `;

    const log = $("storyLog");
    if (log) {
      log.insertAdjacentElement("beforebegin", panel);
    } else {
      const solo = $("solo");
      if (solo) solo.appendChild(panel);
    }
  }

  function animateDie(id, finalValue) {
    const die = $(id);
    if (!die) return;

    die.classList.remove("rolling");
    void die.offsetWidth;
    die.classList.add("rolling");

    let count = 0;
    const interval = setInterval(() => {
      die.textContent = String(1 + Math.floor(Math.random() * 20));
      count++;

      if (count >= 9) {
        clearInterval(interval);
        die.textContent = String(finalValue);
        die.classList.remove("rolling");
      }
    }, 75);
  }

  function showRolls(rows) {
    const player = rows.find(r => r.die_owner === "player");
    const master = rows.find(r => r.die_owner === "master");

    if (!player && !master) return;

    if (player) {
      $("eterPlayerTotal").textContent =
        `Total: ${player.total ?? player.result}`;

      $("eterPlayerDetail").textContent =
        `D20 ${player.result} ${Number(player.modifier) >= 0 ? "+" : ""}${player.modifier || 0} · CD ${player.difficulty ?? "—"}`;

      animateDie("eterPlayerDie", player.result);
    }

    if (master) {
      $("eterMasterTotal").textContent =
        `Pressão: ${Number(master.modifier) >= 0 ? "+" : ""}${master.modifier || 0}`;

      $("eterMasterDetail").textContent =
        `D20 ${master.result} · Total ${master.total ?? master.result}`;

      animateDie("eterMasterDie", master.result);
    }

    const success = player?.success;

    $("eterDiceStatus").innerHTML =
      success === true
        ? "✨ <span class='eter-roll-success'>TESTE SUPERADO</span> · O personagem conseguiu."
        : success === false
          ? "💀 <span class='eter-roll-failure'>TESTE FALHOU</span> · A dificuldade não foi alcançada."
          : "🎲 Resultado registrado pelo servidor.";
  }

  function renderHistory(rows) {
    const host = $("eterDiceHistory");
    if (!host) return;

    const grouped = new Map();

    rows.forEach(r => {
      const key = r.action_id || r.turn_id || r.created_at;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(r);
    });

    const groups = [...grouped.values()].slice(0, 10);

    if (!groups.length) {
      host.textContent = "Nenhuma rolagem registrada nesta campanha.";
      return;
    }

    host.innerHTML = groups.map(group => {
      const p = group.find(r => r.die_owner === "player");
      const m = group.find(r => r.die_owner === "master");
      const date = new Date(p?.created_at || m?.created_at).toLocaleString("pt-BR");

      return `
        <div class="eter-roll-row">
          <span>
            🎲 Jogador: <b>${esc(p?.result ?? "—")}</b>
            ${p ? `(${esc(p.total)} total)` : ""}
            <br>
            👑 Mestre: <b>${esc(m?.result ?? "—")}</b>
          </span>
          <span class="${p?.success === true ? "eter-roll-success" : p?.success === false ? "eter-roll-failure" : ""}">
            ${p?.success === true ? "Sucesso" : p?.success === false ? "Falha" : "—"}
            <br>
            ${esc(date)}
          </span>
        </div>
      `;
    }).join("");
  }

  async function refresh() {
    if (loading) return;

    const select = $("campaignSelect");
    const campaign = select?.value;

    if (!campaign) {
      currentCampaign = "";
      lastSignature = "";
      if ($("eterDiceStatus")) {
        $("eterDiceStatus").textContent =
          "Selecione uma campanha para consultar os dados.";
      }
      return;
    }

    const token = getToken();

    if (!token) {
      $("eterDiceStatus").textContent =
        "Entre na sua conta para consultar as rolagens.";
      return;
    }

    loading = true;

    try {
      const query =
        `${SUPABASE_URL}/rest/v1/${TABLE}` +
        `?campaign_id=eq.${encodeURIComponent(campaign)}` +
        `&select=id,action_id,turn_id,die_owner,die_type,result,modifier,total,difficulty,success,context,created_at` +
        `&order=created_at.desc&limit=40`;

      const response = await fetch(query, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + token
        }
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail.slice(0, 180));
      }

      const rows = await response.json();

      if (campaign !== currentCampaign) {
        currentCampaign = campaign;
        lastSignature = "";
      }

      renderHistory(rows);

      const newest = rows.length ? rows[0].id : "";
      const signature = campaign + ":" + newest;

      if (signature !== lastSignature) {
        lastSignature = signature;

        if (rows.length) {
          const newestTime = rows[0].created_at;
          const latestGroup = rows.filter(r =>
            r.created_at === newestTime
          );

          showRolls(latestGroup);
        } else {
          $("eterPlayerDie").textContent = "—";
          $("eterMasterDie").textContent = "—";
        }
      }
    } catch (error) {
      $("eterDiceStatus").textContent =
        "Não foi possível carregar as rolagens: " + error.message;
    } finally {
      loading = false;
    }
  }

  function init() {
    styles();
    createPanel();
    refresh();

    $("campaignSelect")?.addEventListener("change", () => {
      currentCampaign = "";
      lastSignature = "";
      refresh();
    });

    // Consulta o histórico periodicamente.
    // Os resultados continuam vindo exclusivamente do banco.
    setInterval(refresh, 4000);

    // Atualiza depois que a Jornada acrescenta uma nova cena.
    const log = $("storyLog");
    if (log) {
      new MutationObserver(() => {
        setTimeout(refresh, 700);
      }).observe(log, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
