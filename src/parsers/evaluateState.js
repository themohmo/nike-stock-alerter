/**
 * Possible stock states.
 * @typedef {'available' | 'unavailable' | 'unknown'} StockState
 */

/**
 * Convert raw parsed signals into a definitive StockState.
 * Treats null / inconclusive results as 'unknown' — never positive.
 *
 * @param {{ available: boolean, price: string|null, strategy: string } | null} signals
 * @returns {{ state: StockState, price: string|null }}
 */
export function evaluateState(signals) {
  if (signals === null) return { state: 'unknown', price: null };

  return {
    state: signals.available ? 'available' : 'unavailable',
    price: signals.price ?? null,
  };
}

/**
 * Returns true only when a genuine restock has occurred.
 * unknown → available is NOT treated as a transition to suppress noise
 * from first-run or parse-failure scenarios.
 *
 * @param {StockState} previous
 * @param {StockState} current
 * @returns {boolean}
 */
export function isPositiveTransition(previous, current) {
  return current === 'available' && previous === 'unavailable';
}
