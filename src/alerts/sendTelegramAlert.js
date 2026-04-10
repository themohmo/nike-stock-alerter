import { PRODUCT_NAME, TARGET_SIZE, TIMEZONE } from '../config/index.js';

const TELEGRAM_API = 'https://api.telegram.org';

/**
 * @param {{
 *   label: string,
 *   styleCode: string,
 *   price: string|null,
 *   url: string,
 * }} product
 * @param {{ telegramBotToken: string, telegramChatId: string }} env
 */
export async function sendTelegramAlert(product, env) {
  const { telegramBotToken, telegramChatId } = env;

  const now = new Date().toLocaleString('en-AE', {
    timeZone:    TIMEZONE,
    dateStyle:   'medium',
    timeStyle:   'short',
  });

  const priceStr = product.price ? `AED ${product.price}` : 'Check site';

  const text =
    `🟢 *Nike UAE Restock Detected*\n\n` +
    `*Product:* ${PRODUCT_NAME}\n` +
    `*Colour:* ${product.label}\n` +
    `*Style:* \`${product.styleCode}\`\n` +
    `*Size:* EU ${TARGET_SIZE}\n` +
    `*Price:* ${priceStr}\n` +
    `*Time:* ${now} (GST)\n\n` +
    `[Buy Now](${product.url})`;

  const payload = {
    chat_id:    telegramChatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
  };

  const res = await fetch(
    `${TELEGRAM_API}/bot${telegramBotToken}/sendMessage`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram ${res.status}: ${body}`);
  }
}
