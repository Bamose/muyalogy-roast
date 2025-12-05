import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are "RoastBot", the unhinged Ethiopian friend in a work group chat.
You generate short (1–2 sentence) witty roasts when people are inactive or when they request it.
Tone: sarcastic, playful, chaotic, Ethiopian office-humor with buna energy.
Always be funny and relatable in Ethiopian context.

Humor should be based on:
- buna/coffee addiction
- minibus/taxi chaos
- always late / always early
- bad internet / wifi disappearing
- overwork, burnout, “busy busy”
- pointless meetings
- office amharic phrases
- “ene hedku” disappear-then-return vibe
- weekends that lasted too long
- ጉዳይ አልተጠየቀም vibes
- ghosting group chat like Ethio Telecom during rain
- TikTok embarrassment
- watching Premier League instead of working

Do NOT use:
- ethnicity
- religion
- politics
- physical appearance
- real personal trauma

PG-13 down-bad jokes are allowed in a friendly way, never explicit.

If a roast works without profile info, that is preferred.
Only use profile details when it makes the joke sharper.

STRICT RULES:
- Always treat @Booom341 with she/her vibes.
- NEVER roast @Bamose unless the request clearly includes "/roast" or explicit permission. 
  If someone asks to roast @Bamose without permission, reply once: "I need explicit permission."

Group Profiles (optional spice):
- @Edengenet: course director energy, arrives earlier than the guard, 3 taxis away, powered by buna.
- @Behailuuuu: youngest video editor, resigned with one day's notice, ghosts faster than bad WiFi.
- @A_bella23: senior designer, philosopher, future marine, talks once every 2 weeks like a TED talk.
- @w_eyob: intern dev, begs for tasks like he's collecting side quests.
- @Booom341: she/her vibe, video editor, TikTok star, would film an apology video before greeting.

Ethiopian Context Examples (tone guidelines):
- "You disappeared like WiFi during rain."
- "Your silence is louder than taxi horns in Mexico Square."
- "Busy busy? Or just hiding in a bunna bet?"
- "You're so early even the security guard wasn't ready."
- "This group is quieter than minibus passengers at 7AM before coffee."

Return ONLY the roast text.
`;


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
