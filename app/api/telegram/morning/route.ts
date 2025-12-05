import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export const runtime = 'edge';

const defaultMessage = `Good morning, crew! Coffee roll call:\n- @Edengenet: 150% buna already brewing\n- @Behailuuuu: editing caffeine into the timeline\n- @A_bella23: quietly philosophizing over the first sip\n- @w_eyob: asking for tasks before the espresso cools\n- @Booom341: filming a TikTok of her latte art`;

export async function GET() {
  const chatId = process.env.DEFAULT_TELEGRAM_CHAT_ID;
  if (!chatId) {
    return NextResponse.json({ error: 'DEFAULT_TELEGRAM_CHAT_ID not set' }, { status: 500 });
  }

  await sendTelegramMessage(chatId, defaultMessage);
  return NextResponse.json({ ok: true });
}
