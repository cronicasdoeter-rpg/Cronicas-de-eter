(() => {
  const $ = id => document.getElementById(id);
  const activeKey = 'cronicas-eter-active-campaign';
  let activeId = localStorage.getItem(activeKey) || '';
  let busy = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(url, options = {}) {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Erro HTTP ${response.status}`);
    return data;
  }
  function feedback(message) { $('turnFeedback').textContent = message; }
  function addEntry(kind, label, text) {
    const empty = $('storyLog').querySelector('.story-empty'); if (empty) empty.remove();
    const node = document.createElement('div'); node.className = `story-entry ${kind}`;
    node.innerHTML = `<small>${esc(label)}</small>${esc(text)}`;
    $('storyLog').appendChild(node); $('storyLog').scrollTop = $('storyLog').scrollHeight;
  }
  function renderState(state) {
    const c = state?.character || {};
    $('soloState').innerHTML = `<b>${esc(c.name || 'Aventureiro')}</b> · Nível ${Number(c.level || 1)}<br>❤️ ${Number(c.hp || 0)}/${Number(c.hpMax || 20)} · ✧ ${Number(c.mana || 0)}/${Number(c.manaMax || 10)} · XP ${Number(c.xp || 0)}<br>Itens: ${(state.inventory || []).length} · Registros: ${(state.log || []).length}`;
  }
  function renderTurn(turn) {
    addEntry('player', 'VOCÊ', turn.player_input);
    addEntry('master', 'MESTRE DE MESA', turn.narration);
    $('suggestedChoices').innerHTML = '';
    (turn.options || []).slice(0,4).forEach(option => {
      const b = document.createElement('button'); b.textContent = option; b.addEventListener('click', () => { $('playerAction').value = option; $('playerAction').focus(); }); $('suggestedChoices').appendChild(b);
    });
    if (turn.image_url) { $('sceneImage').style.backgroundImage = `url("${turn.image_url}")`; $('sceneImage').classList.add('has-image'); }
  }
  async function refreshCampaigns() {
    const rows = await api('/api/campaigns');
    $('campaignSelect').innerHTML = '<option value="">Selecione uma campanha</option>' + rows.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
    if (activeId && rows.some(c => c.id === activeId)) $('campaignSelect').value = activeId;
    else if (rows[0]) { activeId = rows[0].id; localStorage.setItem(activeKey, activeId); $('campaignSelect').value = activeId; }
    if (activeId) await loadCampaign(activeId);
  }
  async function loadCampaign(id) {
    const c = await api(`/api/campaigns/${id}`); activeId = id; localStorage.setItem(activeKey,id);
    $('campaignTitle').value = c.title; $('campaignPremise').value = c.premise; $('campaignStory').value = c.story_outline; $('campaignRules').value = c.house_rules; $('campaignWorld').value = c.world_rules;
    $('playerAction').disabled = false; $('sendAction').disabled = false;
    $('storyLog').innerHTML = '';
    if (!c.turns.length) $('storyLog').innerHTML = '<div class="story-empty">Campanha pronta. Descreva sua primeira ação para começar.</div>';
    c.turns.forEach(renderTurn); renderState(c.state);
  }
  async function health() {
    try {
      const h = await api('/api/health');
      const textReady = h.masterAIConfigured && h.adminAIConfigured;
      $('soloStatus').textContent = textReady ? '● Servidor conectado · IAs de texto configuradas' : '● Servidor conectado · configure Mestre/Administrador';
      $('masterStatus').textContent = h.masterAIConfigured ? 'Modelo configurado' : 'Aguardando configuração';
      $('adminStatus').textContent = h.adminAIConfigured ? 'Modelo + motor de regras' : 'Motor pronto · modelo aguardando';
      $('imageStatus').textContent = h.imageAIConfigured ? 'API configurada' : 'Imagem opcional não configurada';
    } catch { $('soloStatus').textContent = '● Servidor não iniciado'; feedback('Inicie o servidor conforme o LEIA-ME.'); }
  }
  $('createCampaign').addEventListener('click', async () => {
    try {
      const c = await api('/api/campaigns', { method:'POST', body:JSON.stringify({ title:$('campaignTitle').value, premise:$('campaignPremise').value, story_outline:$('campaignStory').value, house_rules:$('campaignRules').value, world_rules:$('campaignWorld').value }) });
      await refreshCampaigns(); await loadCampaign(c.id); feedback('Campanha criada e salva no banco de dados.');
    } catch(e) { feedback(e.message); }
  });
  $('campaignSelect').addEventListener('change', async e => { if (!e.target.value) return; try { await loadCampaign(e.target.value); } catch(err) { feedback(err.message); } });
  $('saveCampaignRules').addEventListener('click', async () => {
    if (!activeId) return feedback('Crie ou selecione uma campanha primeiro.');
    try { await api(`/api/campaigns/${activeId}`, { method:'PATCH', body:JSON.stringify({ title:$('campaignTitle').value, premise:$('campaignPremise').value, story_outline:$('campaignStory').value, house_rules:$('campaignRules').value, world_rules:$('campaignWorld').value }) }); feedback('História e regras salvas.'); await refreshCampaigns(); }
    catch(e) { feedback(e.message); }
  });
  async function sendAction(text) {
    if (!activeId || busy || !text.trim()) return;
    busy = true; $('sendAction').disabled = true; $('playerAction').disabled = true; addEntry('player','VOCÊ',text); feedback('As três funções estão trabalhando na cena...');
    try {
      const result = await api(`/api/campaigns/${activeId}/turn`, { method:'POST', body:JSON.stringify({ message:text }) });
      // A entrada do jogador já foi exibida; exibe apenas a narração para evitar duplicação.
      const last = $('storyLog').lastElementChild; if (last?.classList.contains('player')) last.remove();
      addEntry('master','MESTRE DE MESA',result.narration || 'A cena continua.');
      $('suggestedChoices').innerHTML = '';
      (result.options || []).slice(0,4).forEach(option => { const b=document.createElement('button'); b.textContent=option; b.addEventListener('click',()=>{ $('playerAction').value=option; $('playerAction').focus(); }); $('suggestedChoices').appendChild(b); });
      if (result.image_url) { $('sceneImage').style.backgroundImage=`url("${result.image_url}")`; $('sceneImage').classList.add('has-image'); }
      renderState(result.state); feedback(`Turno salvo. Mestre: OK · Administrador: OK · Ilustrador: ${result.agents.illustrator === 'ok' ? 'imagem criada' : 'aguardando API de imagem'}.`);
    } catch(e) { feedback(`Não foi possível concluir o turno: ${e.message}`); }
    finally { busy=false; $('sendAction').disabled=false; $('playerAction').disabled=false; $('playerAction').value=''; $('playerAction').focus(); }
  }
  $('sendAction').addEventListener('click',()=>sendAction($('playerAction').value));
  $('playerAction').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAction($('playerAction').value);} });
  $('rollD20').addEventListener('click', async () => {
    if (!activeId) return feedback('Selecione uma campanha primeiro.');
    try { const r=await api(`/api/campaigns/${activeId}/roll`,{method:'POST',body:JSON.stringify({sides:20})}); addEntry('master','MESA DE DADOS',`D20: ${r.die} · Total: ${r.total}${r.critical?' · CRÍTICO!':''}${r.fumble?' · FALHA CRÍTICA!':''}`); }
    catch(e){feedback(e.message);}
  });
  health(); refreshCampaigns().catch(e=>feedback(e.message));
})();
