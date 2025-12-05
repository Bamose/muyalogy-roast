import { NextRequest, NextResponse } from 'next/server';
import { getRoastForUser } from '@/lib/roasts';
import { sendTelegramMessage } from '@/lib/telegram';

export const runtime = 'edge';

function extractText(message: any): string {
  return (message?.text || message?.caption || '').trim();
}

function formatHandle(user: { username?: string; first_name?: string }) {
  if (user.username) return `@${user.username}`;
  return user.first_name ?? 'Someone';
}

async function handleRoastMe(from: any) {
  return getRoastForUser({
    target: {
      username: from.username,
      firstName: from.first_name,
    },
    reason: 'They asked to be roasted.',
    triggeredBy: formatHandle(from)
  });
}

async function handleRoastCommand(from: any, text: string) {
  const handles = text
    .split(/\s+/)
    .slice(1)
    .filter(Boolean);

  if (handles.length === 0) return null;

  const triggeredBy = formatHandle(from);

  const roasts = await Promise.all(
    handles.map(async (handle) => {
      const normalized = handle.replace(/^@/, '');

      return getRoastForUser({
        target: {
          username: normalized,
          firstName: normalized,
        },
        reason: 'Direct /roast command.',
        triggeredBy
      });
    })
  );

  return roasts.join('\n');
}

export async function POST(req: NextRequest) {
  const update = await req.json();
  const message = update.message ?? update.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat?.id;
  const from = message.from;
  if (!chatId || !from) return NextResponse.json({ ok: true });

  const text = extractText(message);

  let roast: string | null = null;

  if (text.startsWith('/roastme')) {
    roast = await handleRoastMe(from);
  } else if (text.startsWith('/roast')) {
    roast = await handleRoastCommand(from, text);
  }

  if (roast) {
    await sendTelegramMessage(chatId, roast);
  }

  return NextResponse.json({ ok: true });
}
