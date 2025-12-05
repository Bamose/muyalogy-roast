const TELEGRAM_BASE = 'https://api.telegram.org';

export async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  const url = `${TELEGRAM_BASE}/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to send Telegram message: ${res.status} ${res.statusText} - ${body}`);
  }
}

export type TelegramUpdate = {
  message?: any;
  edited_message?: any;
};

export type BotCommand = {
  command: string;
  description: string;
};

export async function setTelegramBotCommands(commands: BotCommand[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  const url = `${TELEGRAM_BASE}/bot${token}/setMyCommands`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to set bot commands: ${res.status} ${res.statusText} - ${body}`);
  }

  return res.json();
}
