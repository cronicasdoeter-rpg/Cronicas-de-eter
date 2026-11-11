import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { runGameMaster, runAdministrator, generateSceneImage } from './ai.js';
import { applyActions } from './rules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../public')));
const now = () => new Date().toISOString();
const campaignRow = id => db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
const parseState = row => row ? JSON.parse(row.state_json || '{}') : null;

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'Crônicas de Éter Solo', masterAIConfigured: !!((process.env.MASTER_AI_BASE_URL || process.env.TEXT_AI_BASE_URL) && (process.env.MASTER_AI_MODEL || process.env.TEXT_AI_MODEL)), adminAIConfigured: !!((process.env.ADMIN_AI_BASE_URL || process.env.TEXT_AI_BASE_URL) && (process.env.ADMIN_AI_MODEL || process.env.TEXT_AI_MODEL)), imageAIConfigured: !!(process.env.IMAGE_AI_BASE_URL && process.env.IMAGE_AI_MODEL) }));
app.get('/api/campaigns', (_req, res) => {
  const rows = db.prepare('SELECT id,title,premise,created_at,updated_at FROM campaigns ORDER BY updated_at DESC').all();
  res.json(rows);
});
app.post('/api/campaigns', (req, res) => {
  const { title, premise = '', world_rules = '', story_outline = '', house_rules = '' } = req.body || {};
  if (!String(title || '').trim()) return res.status(400).json({ error: 'Informe o título da campanha.' });
  const id = crypto.randomUUID(); const stamp = now();
  const initialState = { character: { name: 'Aventureiro', race: '', class: '', level: 1, hp: 20, hpMax: 20, mana: 10, manaMax: 10, xp: 0, attributes: {} }, inventory: [], monsters: [], log: [], flags: {} };
  db.prepare(`INSERT INTO campaigns (id,title,premise,world_rules,story_outline,house_rules,state_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, String(title).slice(0,100), String(premise).slice(0,5000), String(world_rules).slice(0,10000), String(story_outline).slice(0,10000), String(house_rules).slice(0,10000), JSON.stringify(initialState), stamp, stamp);
  res.status(201).json({ id, title, state: initialState });
});
app.get('/api/campaigns/:id', (req, res) => {
  const row = campaignRow(req.params.id); if (!row) return res.status(404).json({ error: 'Campanha não encontrada.' });
  const turns = db.prepare('SELECT id,player_input,narration,options_json,actions_json,image_prompt,image_url,created_at FROM turns WHERE campaign_id=? ORDER BY id').all(row.id).map(t => ({ ...t, options: JSON.parse(t.options_json), actions: JSON.parse(t.actions_json) }));
  res.json({ ...row, state: parseState(row), turns });
});
app.patch('/api/campaigns/:id', (req, res) => {
  const row = campaignRow(req.params.id); if (!row) return res.status(404).json({ error: 'Campanha não encontrada.' });
  const allowed = ['title','premise','world_rules','story_outline','house_rules'];
  const values = allowed.map(k => req.body?.[k] === undefined ? row[k] : String(req.body[k]).slice(0,10000));
  db.prepare('UPDATE campaigns SET title=?,premise=?,world_rules=?,story_outline=?,house_rules=?,updated_at=? WHERE id=?').run(...values, now(), row.id);
  res.json({ ok: true });
});
app.post('/api/campaigns/:id/turn', async (req, res) => {
  const row = campaignRow(req.params.id); if (!row) return res.status(404).json({ error: 'Campanha não encontrada.' });
  const playerInput = String(req.body?.message || '').trim(); if (!playerInput) return res.status(400).json({ error: 'Escreva sua ação ou fala.' });
  if (playerInput.length > 4000) return res.status(400).json({ error: 'A ação excede 4.000 caracteres.' });
  try {
    const state = parseState(row);
    const history = db.prepare('SELECT player_input,narration FROM turns WHERE campaign_id=? ORDER BY id DESC LIMIT 12').all(row.id).reverse();
    // IA 1: Mestre narra e propõe possíveis efeitos.
    const master = await runGameMaster(row, state, history, playerInput);
    // IA 2: Administrador converte propostas em ações estruturadas.
    const admin = await runAdministrator(row, state, master);
    // Motor determinístico valida/aplica; IA não grava diretamente nos dados.
    const result = applyActions(state, admin);
    // IA 3: Ilustrador cria a imagem da cena, quando configurado.
    let imageUrl = '';
    if (process.env.AUTO_GENERATE_IMAGES === 'true' && master.image_prompt) {
      try { imageUrl = await generateSceneImage(master.image_prompt); } catch (imageError) { console.warn('Imagem não gerada:', imageError.message); }
    }
    const stamp = now();
    const save = db.transaction(() => {
      db.prepare('UPDATE campaigns SET state_json=?,updated_at=? WHERE id=?').run(JSON.stringify(result.state), stamp, row.id);
      db.prepare(`INSERT INTO turns (campaign_id,player_input,narration,options_json,actions_json,image_prompt,image_url,created_at) VALUES (?,?,?,?,?,?,?,?)`)
        .run(row.id, playerInput, String(master.narration || 'A cena continua...'), JSON.stringify(master.options || []), JSON.stringify(result.applied), String(master.image_prompt || ''), imageUrl, stamp);
    });
    save();
    res.json({ narration: master.narration, options: master.options || [], image_prompt: master.image_prompt || '', image_url: imageUrl, applied_actions: result.applied, state: result.state, agents: { master: 'ok', administrator: 'ok', illustrator: imageUrl ? 'ok' : (process.env.IMAGE_AI_BASE_URL ? 'ready' : 'not_configured') } });
  } catch (error) {
    console.error(error); res.status(502).json({ error: error.message || 'Não foi possível concluir o turno.' });
  }
});
app.post('/api/campaigns/:id/roll', (req, res) => {
  const row = campaignRow(req.params.id); if (!row) return res.status(404).json({ error: 'Campanha não encontrada.' });
  const sides = Math.max(2, Math.min(100, Math.floor(Number(req.body?.sides || 20))));
  const modifier = Math.max(-50, Math.min(50, Math.floor(Number(req.body?.modifier || 0))));
  const die = 1 + crypto.randomInt(sides); const total = die + modifier;
  res.json({ sides, die, modifier, total, critical: sides === 20 && die === 20, fumble: sides === 20 && die === 1 });
});
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Crônicas de Éter Solo em http://localhost:${port}`));
