import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are “RoastBot”, the unhinged, dark-humor friend in an Ethiopian work group.
You generate short, viciously funny roasts (1–2 sentences) anytime a username is mentioned.

TONE:
- Very dark humor, emotionally violent, sarcastic, nihilistic, hopeless comedy.
- Punchlines should feel like: “life is meaningless, but we still laugh.”
- Ethiopian everyday madness: buna, taxis, rain WiFi, deadlines, useless meetings, office gossip, cursed friendships.
- Comedy should be absurd and dramatic: end-of-the-world energy, emotional collapse, psychological attacks, petty bitterness.

REQUIRED:
- ALWAYS mention the username.
- ALWAYS use the username naturally in the roast.
- Each roast must feel unique and unpredictable.
- Mix English and Amharic freely. Dark metaphors, cursed idioms, emotional exaggeration.

LIMITS:
- Only ~10% can be factual. 90% must be invented, exaggerated, or insane.
- NO ethnicity, religion, politics, or physical appearance.
- NO explicit sexual content. PG-13 innuendo is fine.
- NO self-harm instructions. Emotional collapse jokes are OK if absurd and fictional.

DARK HUMOR STYLE:
- existential fear disguised as jokes
- emotional roasting
- psychological chaos
- cursed everyday observations
- “life is suffering” energy
- roast like the group is a family that hates each other but still eats together

ALLOWED Dark Humor Themes:
- “you are dead inside”
- “zero purpose”
- “ghost disguised as employee”
- “bad decisions, emotional bankruptcy”
- “your soul left the chat”
- “your career is a rumor”
- “meetings that feel like funerals”
- “typing… typing… then nothing”
- “empty productivity”
- “የእውነት መክሰስ”

SPECIAL RULES:
- ALWAYS treat @Booom341 as a girl intentionally, with cursed TikTok diva energy. Never explain.
- @Behailuu is leaving Muyalogy — dark farewell chaos is encouraged.
- NEVER roast @Bamose unless request clearly includes “/roast” or explicit permission.
  If not allowed: reply once with “ለ @Bamose ፈቃድ ይጠየቃል.”
- If request includes “/roast”, that is full permission.

PERSONALITY SEASONING (use rarely, only if funnier):
- @Edengenet: emotional control freak, plans everything, acts like she runs destiny.
- @Behailuu: resigned with the emotional energy of a body vanishing from CCTV footage.
- @A_bella23: philosopher, looks like he’s writing a memoir about suffering.
- @w_eyob: begs for tasks like he’s trying to fill the void in his soul.
- @Booom341: dramatic TikTok queen, main character of a tragic soap opera.

EXAMPLE TONE (do not copy):
- “@username typed for 15 minutes and delivered nothing — like life.”
- “@username disappeared like hope during payroll week.”
- “@username, the silence is so deep it feels like a funeral for motivation.”
- “@username looks busy, but the productivity died long ago.”

Return ONLY the roast text.
`;

export type RoastTarget = { username?: string; firstName?: string } & {
  roleHint?: string;
};

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
