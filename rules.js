import { randomUUID } from 'node:crypto';
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// O Administrador propõe operações; este motor determinístico valida e aplica cada alteração.
export function applyActions(inputState, proposed) {
  const state = structuredClone(inputState || {});
  state.character ||= { name: 'Aventureiro', level: 1, hp: 20, hpMax: 20, mana: 10, manaMax: 10, xp: 0 };
  state.inventory ||= [];
  state.log ||= [];
  state.flags ||= {};
  const applied = [];
  for (const action of (Array.isArray(proposed) ? proposed : []).slice(0, 12)) {
    if (!action || typeof action.type !== 'string') continue;
    const amount = Number(action.amount);
    switch (action.type) {
      case 'add_log':
        if (typeof action.text === 'string' && action.text.trim()) { state.log.unshift(action.text.slice(0, 500)); applied.push(action); }
        break;
      case 'award_xp':
        if (Number.isFinite(amount) && amount > 0 && amount <= 10000) { state.character.xp = Math.max(0, Number(state.character.xp || 0) + Math.floor(amount)); applied.push({ type: action.type, amount: Math.floor(amount) }); }
        break;
      case 'damage':
        if (Number.isFinite(amount) && amount > 0 && amount <= 10000) { state.character.hp = clamp(Number(state.character.hp || 0) - Math.floor(amount), 0, Number(state.character.hpMax || 20)); applied.push({ type: action.type, amount: Math.floor(amount) }); }
        break;
      case 'heal':
        if (Number.isFinite(amount) && amount > 0 && amount <= 10000) { state.character.hp = clamp(Number(state.character.hp || 0) + Math.floor(amount), 0, Number(state.character.hpMax || 20)); applied.push({ type: action.type, amount: Math.floor(amount) }); }
        break;
      case 'add_item':
        if (typeof action.name === 'string' && action.name.trim()) {
          const quantity = clamp(Math.floor(Number(action.quantity || 1)), 1, 99);
          const item = { id: randomUUID(), name: action.name.slice(0, 100), type: String(action.item_type || 'Item').slice(0, 40), rarity: String(action.rarity || 'Comum').slice(0, 40), description: String(action.description || '').slice(0, 500), quantity, element: String(action.element || '').slice(0, 40) };
          state.inventory.push(item); applied.push({ type: action.type, item });
        }
        break;
      case 'remove_item':
        if (typeof action.name === 'string') {
          const index = state.inventory.findIndex(i => i.name === action.name);
          if (index >= 0) { const [item] = state.inventory.splice(index, 1); applied.push({ type: action.type, item }); }
        }
        break;
      case 'set_flag':
        if (typeof action.key === 'string' && action.key.length <= 80) { state.flags[action.key] = action.value; applied.push(action); }
        break;
    }
  }
  return { state, applied };
}
