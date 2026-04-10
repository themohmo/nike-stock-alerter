import { runCheck } from '../src/checker/runCheck.js';

/**
 * GET /api/check-stock
 *
 * Triggered by Vercel Cron (vercel.json) every 5 minutes.
 * Can also be called manually for testing.
 *
 * Returns a compact JSON summary — never throws so Vercel
 * marks the invocation as successful regardless of upstream errors.
 */
export default async function handler(req, res) {
  // Block non-GET methods
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Optional: restrict to Vercel Cron calls + a manual secret
  // Uncomment and set CHECK_SECRET env var to lock down the endpoint:
  // const secret = req.headers['x-check-secret'];
  // if (secret !== process.env.CHECK_SECRET) {
  //   return res.status(401).json({ ok: false, error: 'Unauthorized' });
  // }

  try {
    const summary = await runCheck();
    return res.status(200).json(summary);
  } catch (err) {
    console.log(JSON.stringify({ event: 'handler_error', error: err.message }));
    return res.status(500).json({ ok: false, error: err.message });
  }
}
