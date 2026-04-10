import { PRODUCTS, getEnv } from '../config/index.js';
import { fetchProductPage }  from '../utils/fetchProductPage.js';
import { extractStockSignals } from '../parsers/extractStockSignals.js';
import { evaluateState, isPositiveTransition } from '../parsers/evaluateState.js';
import { readAllStates, writeState, initialRecord } from '../state/stateStore.js';
import { sendTelegramAlert } from '../alerts/sendTelegramAlert.js';

/**
 * Run a full check of all four product URLs.
 * Returns a compact summary suitable for the API response body.
 */
export async function runCheck() {
  const env   = getEnv();
  const start = Date.now();

  // ── 1. Load all stored states in one KV round-trip ────────────────────────
  let stateMap;
  try {
    stateMap = await readAllStates(PRODUCTS.map(p => p.styleCode));
  } catch (err) {
    console.log(JSON.stringify({ event: 'kv_read_error', error: err.message }));
    // Proceed with blank state — will not send alerts (unknown → available blocked)
    stateMap = new Map();
  }

  const results = [];
  let positives = 0;

  // ── 2. Check each product sequentially (low memory, predictable duration) ──
  for (const product of PRODUCTS) {
    const result = await checkOne(product, stateMap, env);
    results.push(result);
    if (result.alerted) positives++;
  }

  return {
    ok:          true,
    checked:     PRODUCTS.length,
    positives,
    duration_ms: Date.now() - start,
    timestamp:   new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' }),
    results,
  };
}

async function checkOne(product, stateMap, env) {
  const { styleCode, label, url } = product;
  const stored = stateMap.get(styleCode) ?? initialRecord(styleCode, label);

  console.log(JSON.stringify({ event: 'check_start', styleCode, label }));

  // ── Fetch ────────────────────────────────────────────────────────────────
  const page = await fetchProductPage(url);
  if (!page) {
    console.log(JSON.stringify({ event: 'check_skip', styleCode, reason: 'fetch_failed' }));
    return { styleCode, label, state: 'unknown', alerted: false };
  }

  // ── Parse ────────────────────────────────────────────────────────────────
  const signals          = extractStockSignals(page.html, env.debug);
  const { state, price } = evaluateState(signals);

  console.log(JSON.stringify({
    event:     'check_result',
    styleCode,
    label,
    state,
    price,
    strategy: signals?.strategy ?? 'none',
    prev:     stored.lastState,
  }));

  // ── Persist new state ────────────────────────────────────────────────────
  const now    = new Date().toISOString();
  const record = {
    ...stored,
    lastState:     state,
    lastCheckedAt: now,
    lastPrice:     price ?? stored.lastPrice,
  };

  let alerted = false;

  // ── Alert on genuine positive transition ─────────────────────────────────
  if (isPositiveTransition(stored.lastState, state)) {
    try {
      await sendTelegramAlert({ label, styleCode, price, url }, env);
      alerted           = true;
      record.lastAlertedAt = now;
      console.log(JSON.stringify({ event: 'alert_sent', styleCode, label }));
    } catch (err) {
      console.log(JSON.stringify({ event: 'alert_error', styleCode, error: err.message }));
    }
  }

  // ── Write updated state ───────────────────────────────────────────────────
  try {
    await writeState(styleCode, record);
  } catch (err) {
    console.log(JSON.stringify({ event: 'kv_write_error', styleCode, error: err.message }));
  }

  return { styleCode, label, state, alerted };
}
