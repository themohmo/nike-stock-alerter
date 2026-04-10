import { TARGET_SIZE } from '../config/index.js';

// ─── Strategy 1: Nike AE / SFCC data-layer JSON (primary, fastest) ───────────
// The page embeds a GTM data-layer object containing:
//   "availableSizesEU":["44","45",...]
//   "unavailableSizesEU":["40","41","46",...]
//   "productPrice":549
// This is present in a plain <script> tag — no rendering needed.

function trySfccDataLayer(html) {
  if (!html.includes('availableSizesEU')) return null;

  const availMatch  = html.match(/"availableSizesEU"\s*:\s*\[([^\]]*)\]/);
  const unavailMatch = html.match(/"unavailableSizesEU"\s*:\s*\[([^\]]*)\]/);
  const priceMatch  = html.match(/"productPrice"\s*:\s*(\d+(?:\.\d+)?)/);

  if (!availMatch && !unavailMatch) return null;

  const parseSizes = str => (str ?? '').match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) ?? [];

  const availableSizes   = parseSizes(availMatch?.[1]);
  const unavailableSizes = parseSizes(unavailMatch?.[1]);

  const inAvailable   = availableSizes.includes(TARGET_SIZE);
  const inUnavailable = unavailableSizes.includes(TARGET_SIZE);

  if (!inAvailable && !inUnavailable) return null; // size not listed at all

  return {
    available: inAvailable,
    price:     priceMatch ? priceMatch[1] : null,
  };
}

// ─── Strategy 2: JSON-LD schema.org availability ─────────────────────────────
// Catches overall product availability as a coarse fallback
// (only useful if the product has a single size or is a pure in/out signal).

function tryJsonLdAvailability(html) {
  const ldMatch = html.match(/"availability"\s*:\s*"([^"]+)"/);
  if (!ldMatch) return null;

  const val = ldMatch[1].toLowerCase();
  if (val.includes('instock'))  return { available: true,  price: null };
  if (val.includes('outofstock')) return { available: false, price: null };
  return null;
}

// ─── Strategy 3: __NEXT_DATA__ recursive search ───────────────────────────────

function sliceJsonBlock(html, openTag) {
  const start = html.indexOf(openTag);
  if (start === -1) return null;
  const jsonStart = html.indexOf('>', start) + 1;
  const jsonEnd   = html.indexOf('</script>', jsonStart);
  if (jsonStart <= 0 || jsonEnd === -1) return null;
  return html.slice(jsonStart, jsonEnd).trim();
}

function findSizeEntry(node, depth = 0) {
  if (depth > 20 || node === null || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findSizeEntry(item, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  const sizeValue =
    node.localizedSize ?? node.displaySize ?? node.size ?? node.sizeEu ?? null;
  if (sizeValue !== null) {
    const normalized = String(sizeValue).replace(/[^0-9.]/g, '');
    if (normalized === TARGET_SIZE || normalized === `${TARGET_SIZE}.0`) {
      const available = resolveAvailability(node);
      if (available !== null) return { available, price: extractPrice(node) };
    }
  }
  for (const key of Object.keys(node)) {
    const hit = findSizeEntry(node[key], depth + 1);
    if (hit) return hit;
  }
  return null;
}

function resolveAvailability(sku) {
  if (sku.stockLevelStatus !== undefined) {
    const s = String(sku.stockLevelStatus).toUpperCase();
    return s === 'IS' || s === 'INSTOCK' || s === 'IN_STOCK';
  }
  if (sku.available    !== undefined) return sku.available === true;
  if (sku.inStock      !== undefined) return sku.inStock   === true;
  if (sku.availability !== undefined) {
    const a = String(sku.availability).toUpperCase();
    return a === 'AVAILABLE' || a === 'IN_STOCK' || a === 'IS';
  }
  return null;
}

function extractPrice(sku) {
  return sku.currentPrice ?? sku.salePrice ?? sku.fullPrice ?? sku.price ?? null;
}

function tryNextData(html) {
  const raw = sliceJsonBlock(html, '<script id="__NEXT_DATA__"');
  if (!raw) return null;
  let data; try { data = JSON.parse(raw); } catch { return null; }
  return findSizeEntry(data);
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * @param {string} html
 * @param {boolean} [debug]
 * @returns {{ available: boolean, price: string|null, strategy: string } | null}
 */
export function extractStockSignals(html, debug = false) {
  const strategies = [
    ['sfcc_data_layer', trySfccDataLayer],
    ['next_data',       tryNextData],
    ['json_ld',         tryJsonLdAvailability],
  ];

  for (const [name, fn] of strategies) {
    const result = fn(html);
    if (result !== null) {
      if (debug) console.log(JSON.stringify({ event: 'parser_hit', strategy: name, result }));
      return { ...result, strategy: name };
    }
  }

  if (debug) {
    console.log(JSON.stringify({ event: 'parser_miss', htmlSize: html.length }));
  }
  return null;
}
