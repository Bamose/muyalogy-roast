import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `You are "RoastBot", the chaotic friend in a close group of buddies made up of devs, designers, editors, and random overachievers.
You generate short (1–2 sentences) witty roasts when people are inactive or when they request it.
Tone: sarcastic, slightly dark, friends-only barbs with a bit of dirty humor without being explicit.
Never mention ethnicity, religion, politics, or physical appearance.
Allowed jokes: coffee, procrastination, commuting, silence, deadlines, editing, coding, tasks, burnout, useless meetings, TikTok, philosophical quotes, corporate nonsense, being down bad, bad decisions, chaotic weekends.
Use profile details sparingly; default to generic friend-group jabs unless a profile detail makes the line sharper. @Booom341: she/her vibe, video editor treat it as a girl,
Do NOT roast @Bamose unless explicitly and clearly requested to roast them; otherwise politely refuse with a single sentence.
If the request includes "/roast", treat that as explicit permission (including for @Bamose).

Return ONLY the roast text.`;

export type RoastTarget = { username?: string; firstName?: string } & { roleHint?: string };

// Uses OpenRouter format: 'provider/model'
// Examples: 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-flash-1.5'
// Full list: https://openrouter.ai/models
const modelId = process.env.AI_MODEL ?? "openai/gpt-4o-mini";

function formatHandle(target: RoastTarget) {
  if (target.username) return `@${target.username.replace(/^@/, "")}`;
  if (target.firstName) return target.firstName;
  return "this teammate";
}

function fallbackRoast(
  target: RoastTarget,
  reason: string,
  triggeredBy?: string
) {
  const handle = formatHandle(target);
  const triggered = triggeredBy ? ` (called out by ${triggeredBy})` : "";

  const profileLines: Record<string, string> = {
    edengenet: `${handle} vanished; maybe the third taxi broke down or the buna IV ran dry${triggered}.`,
    behailuuuu: `${handle} ghosted the chat again—must be editing an exit video${triggered}.`,
    a_bella23: `${handle} is composing a 2am manifesto about fonts and fate instead of replying${triggered}.`,
    w_eyob: `${handle} went silent; probably waiting to be assigned another "learning opportunity"${triggered}.`,
    booom341: `${handle} disappeared—probably filming a TikTok about disappearing${triggered}.`,
  };

  const key = target.username?.replace(/^@/, "").toLowerCase();
  if (key && profileLines[key]) return profileLines[key];

  const templates = [
    `${handle} has been on mute forever; even the coffee machine thinks they're vaporware${triggered}.`,
    `${handle} is so quiet the sprint board moved them to "mythical creature"${triggered}.`,
    `${handle} must be debugging silence while deadlines sip the last of the office coffee${triggered}.`,
    `Someone ping ${handle}; the standup turned into a séance${triggered}.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function buildUserPrompt(
  target: RoastTarget,
  reason: string,
  triggeredBy?: string
) {
  const lines = [
    `Target: ${formatHandle(target)} (first name: ${
      target.firstName ?? "unknown"
    }).`,
    `Reason: ${reason}.`,
  ];

  if (triggeredBy) {
    lines.push(`Requested by: ${triggeredBy}.`);
  }

  if (target.roleHint) {
    lines.push(`Role hint: ${target.roleHint}.`);
  }

  return lines.join("\n");
}

export async function getRoastForUser(params: {
  target: RoastTarget;
  reason: string;
  triggeredBy?: string;
}): Promise<string> {
  const { target, reason, triggeredBy } = params;
  const handle = target.username?.replace(/^@/, "").toLowerCase();
  if (
    handle === "bamose" &&
    !/explicit|direct|asked to roast|\/roast/i.test(reason)
  ) {
    return "Skipping @Bamose—no roast served unless it's explicitly requested.";
  }

  // OpenRouter requires OPENROUTER_API_KEY
  if (!process.env.OPENROUTER_API_KEY) {
    return fallbackRoast(target, reason, triggeredBy);
  }

  try {
    const { text } = await generateText({
      model: openrouter.chat(modelId),
      system: systemPrompt,
      prompt: buildUserPrompt(target, reason, triggeredBy),
    });

    return text.trim();
  } catch (error) {
    console.error("AI roast failed, using fallback", error);
    return fallbackRoast(target, reason, triggeredBy);
  }
}
