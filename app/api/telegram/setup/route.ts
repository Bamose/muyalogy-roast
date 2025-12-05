import { NextResponse } from 'next/server';
import { setTelegramBotCommands, BotCommand } from '@/lib/telegram';

export const runtime = 'edge';

// Define your bot commands here
const BOT_COMMANDS: BotCommand[] = [
  {
    command: 'roastme',
    description: '🔥 Get roasted by the bot'
  },
  {
    command: 'roast',
    description: '🎯 Roast someone (@username)'
  }
];

export async function GET() {
  try {
    const result = await setTelegramBotCommands(BOT_COMMANDS);
    return NextResponse.json({
      ok: true,
      message: 'Bot commands menu has been set up successfully!',
      commands: BOT_COMMANDS,
      result
    });
  } catch (error) {
    console.error('Failed to set up bot commands:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
