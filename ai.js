const trimSlash = value => (value || '').replace(/\/+$/, '');

async function chat(agent, system, user, { json = false } = {}) {
  const prefix = agent === 'MASTER' ? 'MASTER_AI' : 'ADMIN_AI';
  const base = trimSlash(process.env[`${prefix}_BASE_URL`] || process.env.TEXT_AI_BASE_URL);
  const model = process.env[`${prefix}_MODEL`] || process.env.TEXT_AI_MODEL;
  const key = process.env[`${prefix}_API_KEY`] ?? process.env.TEXT_AI_API_KEY;
  if (!base || !model) throw new Error(`Configure ${prefix}_BASE_URL/${prefix}_MODEL ou os valores padrão TEXT_AI no arquivo .env.`);
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model, temperature: 0.7, messages: [
      { role: 'system', content: system }, { role: 'user', content: user }
    ], ...(json ? { response_format: { type: 'json_object' } } : {}) })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Falha na IA de texto (${response.status}).`);
  return payload.choices?.[0]?.message?.content || '';
}

export async function runGameMaster(campaign, state, history, playerInput) {
  const system = `Você é o MESTRE DE MESA de Crônicas de Éter. Conduza um RPG SOLO em português brasileiro. Respeite rigorosamente as regras, o cânone e as decisões do jogador fornecidas no contexto. Não controle o personagem do jogador. Não invente resultados de dados: solicite ou aguarde o motor de regras. Não declare mudanças de inventário, vida, XP ou atributos por conta própria; proponha-as em proposed_actions para validação do Administrador. Narre com atmosfera e clareza, termine com uma pergunta ou escolhas relevantes. Responda SOMENTE JSON válido com: narration (string), options (array de até 4 strings), image_prompt (string em inglês ou português, descrevendo apenas a cena visual sem texto), proposed_actions (array de objetos com type e dados). Tipos permitidos: add_log, award_xp, damage, heal, add_item, remove_item, set_flag. Seja conservador: proponha apenas efeitos diretamente justificados pela cena.`;
  const context = {
    campaign: { title: campaign.title, premise: campaign.premise, world_rules: campaign.world_rules, story_outline: campaign.story_outline, house_rules: campaign.house_rules },
    current_state: state,
    recent_history: history.slice(-12),
    player_action: playerInput
  };
  const raw = await chat('MASTER', system, JSON.stringify(context), { json: true });
  return parseJson(raw);
}

export async function runAdministrator(campaign, state, masterOutput) {
  const system = `Você é o ADMINISTRADOR DE REGRAS de Crônicas de Éter. Sua função é transformar propostas do Mestre em operações estruturadas, sem narrar. Siga as regras da campanha. Nunca invente recompensas. Responda JSON válido com {"actions": []}. Tipos aceitos: add_log, award_xp, damage, heal, add_item, remove_item, set_flag. Preserve valores e nomes propostos pelo Mestre; rejeite operações sem justificativa. Para add_item use {type:"add_item",name,item_type,rarity,description,quantity,element}. Para damage/heal use {amount}. Para award_xp use {amount}. Para add_log use {text}. Para set_flag use {key,value}.`;
  const raw = await chat('ADMIN', system, JSON.stringify({ rules: campaign.house_rules, world_rules: campaign.world_rules, state, master_proposals: masterOutput.proposed_actions || [] }), { json: true });
  const parsed = parseJson(raw);
  return Array.isArray(parsed.actions) ? parsed.actions : [];
}

export async function generateSceneImage(prompt) {
  const base = trimSlash(process.env.IMAGE_AI_BASE_URL);
  const model = process.env.IMAGE_AI_MODEL;
  if (!base || !model || !prompt) return '';
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.IMAGE_AI_API_KEY) headers.Authorization = `Bearer ${process.env.IMAGE_AI_API_KEY}`;
  const response = await fetch(`${base}/images/generations`, { method: 'POST', headers,
    body: JSON.stringify({ model, prompt, size: '1024x1024', n: 1, response_format: 'url' }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Falha na IA de imagem (${response.status}).`);
  return payload.data?.[0]?.url || (payload.data?.[0]?.b64_json ? `data:image/png;base64,${payload.data[0].b64_json}` : '');
}

function parseJson(raw) {
  const clean = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); } catch { throw new Error('A IA retornou uma resposta fora do formato JSON esperado. Tente novamente ou use outro modelo.'); }
}
