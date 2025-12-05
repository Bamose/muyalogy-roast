import { NextRequest, NextResponse } from 'next/server';
import { getRoastForUser } from '@/lib/roasts';
import { sendTelegramMessage } from '@/lib/telegram';
import { storage } from '@/lib/storage';

export const runtime = 'edge';

const INACTIVITY_MINUTES = 30;
const INACTIVITY_MS = INACTIVITY_MINUTES * 60 * 1000;

function extractText(message: any): string {
  return (message?.text || message?.caption || '').trim();
}

function formatHandle(user: { username?: string; first_name?: string }) {
  if (user.username) return `@${user.username}`;
  return user.first_name ?? 'Someone';
}

async function handleRoastMe(chatId: number, from: any) {
  return getRoastForUser({
    target: {
      userId: from.id,
      username: from.username,
      firstName: from.first_name,
      lastActive: Date.now()
    },
    reason: 'They asked to be roasted.',
    triggeredBy: formatHandle(from)
  });
}

async function handleRoastCommand(chatId: number, from: any, text: string) {
  const handles = text
    .split(/\s+/)
    .slice(1)
    .filter(Boolean);

  if (handles.length === 0) return null;

  const triggeredBy = formatHandle(from);

  const roasts = await Promise.all(
    handles.map(async (handle) => {
      const normalized = handle.replace(/^@/, '');
      const target =
        (await storage.findByUsername(chatId, normalized)) ||
        ({ userId: -1, username: normalized, firstName: normalized, lastActive: Date.now() } as const);

      return getRoastForUser({
        target,
        reason: 'Direct /roast command.',
        triggeredBy
      });
    })
  );

  return roasts.join('\n');
}

async function handleInactivity(chatId: number, from: any) {
  const inactiveUser = await storage.findInactiveUser(chatId, from.id, INACTIVITY_MS);
  if (!inactiveUser) return null;

  const minutes = Math.floor((Date.now() - inactiveUser.lastActive) / (60 * 1000));
  return getRoastForUser({
    target: inactiveUser,
    reason: `Inactive for ${minutes} minutes`,
    triggeredBy: formatHandle(from)
  });
}

export async function POST(req: NextRequest) {
  const update = await req.json();
  const message = update.message ?? update.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat?.id;
  const from = message.from;
  if (!chatId || !from) return NextResponse.json({ ok: true });

  const text = extractText(message);
  const now = Date.now();

  await storage.markActive({
    chatId,
    userId: from.id,
    username: from.username,
    firstName: from.first_name,
    lastActive: now
  });

  let roast: string | null = null;

  if (text.startsWith('/roastme')) {
    roast = await handleRoastMe(chatId, from);
  } else if (text.startsWith('/roast')) {
    roast = await handleRoastCommand(chatId, from, text);
  } else {
    roast = await handleInactivity(chatId, from);
  }

  if (roast) {
    await sendTelegramMessage(chatId, roast);
  }

  return NextResponse.json({ ok: true });
}
