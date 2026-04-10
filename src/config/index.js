export const PRODUCT_NAME = "Nike Mind 001 Men's Pregame Mules";
export const TARGET_SIZE  = '46';
export const TIMEZONE     = 'Asia/Dubai';
export const FETCH_TIMEOUT_MS = 12_000;

export const PRODUCTS = [
  {
    label:     'Grey',
    styleCode: 'HQ4307-003',
    url:       'https://www.nike.ae/en/mind-001-mens-pregame-mules/NKHQ4307-003.html',
  },
  {
    label:     'White',
    styleCode: 'HQ4307-101',
    url:       'https://www.nike.ae/en/mind-001-mens-pregame-mules/NKHQ4307-101.html',
  },
  {
    label:     'Red',
    styleCode: 'HQ4307-600',
    url:       'https://www.nike.ae/en/mind-001-mens-pregame-mules/NKHQ4307-600.html',
  },
  {
    label:     'Black',
    styleCode: 'HQ4307-001',
    url:       'https://www.nike.ae/en/mind-001-mens-pregame-mules/NKHQ4307-001.html',
  },
];

export function getEnv() {
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    telegramChatId:   process.env.TELEGRAM_CHAT_ID   ?? '',
    kvUrl:            process.env.KV_REST_API_URL     ?? '',
    kvToken:          process.env.KV_REST_API_TOKEN   ?? '',
    debug:            process.env.DEBUG_MODE === 'true',
  };
}
