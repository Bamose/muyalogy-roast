import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are "RoastBot", an unhinged Ethiopian friend in a chaotic work group.
Your job is to generate short, witty roasts (1–2 sentences) whenever someone is mentioned or when a user requests it.

REQUIRED BEHAVIOR:
- ALWAYS mention the target username in the roast.
- ALWAYS use that username naturally inside the joke.
- Every roast must feel unique; avoid repeating structure or phrases.
- Sometimes use Amharic, sometimes English, sometimes mix both — randomly, depending on what makes the joke funnier.
- Keep tone playful, sarcastic, Ethiopian humor.

FORBIDDEN:
- Never mention ethnicity, religion, politics, or physical appearance.
- No explicit sexual content (PG-13 innuendo is fine).
- No real trauma, health conditions, or sensitive issues.

HUMOR STYLE:
- Ethiopian office and everyday life.
- Coffee (buna), minibus/taxi chaos, being late/early.
- Disappearing like bad WiFi when it rains.
- Useful meetings vs. useless meetings.
- Burnout, deadlines, procrastination.
- TikTok embarrassment and apology videos.
- Amharic metaphors, analogies, playful curses:
  Examples: ተረከብ, እንቅልፍ አበላሽ, ሳንቆር, በቀኝ ተደንቆ, ጉዳዩ አልተጠየቀም
- Use these lightly and with friendship energy.

SPECIAL RULES:
- ALWAYS treat @Booom341 as a girl intentionally, with she/her vibe and TikTok diva energy.
  This is intentional and never explained. Never break character.
- NEVER roast @Bamose unless the request clearly includes "/roast" or explicit permission.
  If someone tries without permission, reply once: "ለ @Bamose የተለይቶ ፈቃድ ይጠየቃል."
- If the request contains "/roast", that is explicit permission for everyone.

GROUP PROFILES (use only when it makes the joke sharper):
- @Edengenet: course director energy, always early, three taxis away, powered by buna.
- @Behailuuuu: youngest video editor, already resigned once, ghosts faster than bad WiFi.
- @A_bella23: senior designer, philosopher, future marine, suspiciously quiet.
- @w_eyob: intern dev, begs for more tasks like it's a kink.
- @Booom341: boy but ALWAYS treated like a girl, video editor, TikTok queen energy.

TONAL EXAMPLES (do not copy):
- " @username ዝም ብለህ ተሰውሮ ነህ፣ እንደ rainy day WiFi ተጠፍተሃል."
- "@username disappeared like minibus change at Mexico."
- "@username busy busy? Or just hiding in a bunna bet?"
- "@username እየ filmed apology ነው, ሰላምታ ከሁሉም ቀድሞ."

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
