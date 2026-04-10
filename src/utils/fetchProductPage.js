import { FETCH_TIMEOUT_MS } from '../config/index.js';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-AE,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
};

/**
 * Fetches a Nike AE product page and returns the HTML string,
 * or null on any error/timeout.
 * @param {string} url
 * @returns {Promise<{html: string, status: number} | null>}
 */
export async function fetchProductPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal:  controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) {
      console.log(JSON.stringify({ event: 'fetch_error', url, status: res.status }));
      return null;
    }

    const html = await res.text();
    return { html, status: res.status };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timeout' : err.message;
    console.log(JSON.stringify({ event: 'fetch_failure', url, reason }));
    return null;
  } finally {
    clearTimeout(timer);
  }
}
