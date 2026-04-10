/**
 * File-based state store. Reads/writes a single JSON file at STATE_FILE.
 * No external dependencies — uses Node's built-in fs/promises.
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(import.meta.url), '../../..');
const STATE_FILE = join(ROOT, 'state.json');

async function loadFile() {
  try {
    const raw = await readFile(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveFile(data) {
  await writeFile(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Read stored state records for all variants.
 *
 * @param {string[]} styleCodes
 * @returns {Promise<Map<string, object|null>>}
 */
export async function readAllStates(styleCodes) {
  const data = await loadFile();
  const map  = new Map();
  for (const sc of styleCodes) {
    map.set(sc, data[sc] ?? null);
  }
  return map;
}

/**
 * Write an updated state record for one variant.
 *
 * @param {string} styleCode
 * @param {object} record
 */
export async function writeState(styleCode, record) {
  const data    = await loadFile();
  data[styleCode] = record;
  await saveFile(data);
}

export function initialRecord(styleCode, label) {
  return {
    styleCode,
    label,
    lastState:     'unknown',
    lastCheckedAt: null,
    lastAlertedAt: null,
    lastPrice:     null,
  };
}
