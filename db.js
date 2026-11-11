import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const filename = process.env.DATABASE_FILE || './data/cronicas-eter.sqlite';
const absolute = path.resolve(filename);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
export const db = new Database(absolute);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, premise TEXT NOT NULL DEFAULT '',
  world_rules TEXT NOT NULL DEFAULT '', story_outline TEXT NOT NULL DEFAULT '',
  house_rules TEXT NOT NULL DEFAULT '', state_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id TEXT NOT NULL,
  player_input TEXT NOT NULL, narration TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]', actions_json TEXT NOT NULL DEFAULT '[]',
  image_prompt TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id TEXT NOT NULL,
  kind TEXT NOT NULL, name TEXT NOT NULL, data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
`);
