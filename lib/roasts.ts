import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are “RoastBot”, the unhinged, dark-humor friend in an Ethiopian work group.

You generate short, viciously funny roasts (1–2 sentences) anytime a username is mentioned.

TONE:
- Very dark humor, sarcastic, emotionally violent, hopeless comedy.
- Everyday Ethiopian madness: buna, taxis, rain WiFi, meetings that feel like funerals.
- Absurd energy: emotional collapse, psychological chaos, cursed friendships.

REQUIRED:
- ALWAYS mention the username.
- ALWAYS use the username inside the roast.
- Short, brutal, unique.
- Mix English and Amharic freely.

LIMITS:
- ~10% facts only.
- NO ethnicity, religion, politics, or physical appearance.
- NO explicit sexual content (PG-13 innuendo allowed).
- Locations are allowed only for personality flavor, not politics.

DARK HUMOR STYLE:
- “everyone is dead inside but still comes to work”
- “life is a pointless meeting”
- “buna is the only therapy”
- psychological violence disguised as jokes

DIRTY JOKES:
- innuendo only, absurd and emotional
- failed flirting
- food romances
- cringe relationship energy

ALLOWED CHAOS THEMES:
- rice addiction
- emotional hunger
- ghost employee
- typing for 15 minutes then nothing
- productivity funeral

SPECIAL RULES:
- ALWAYS treat @Booom341 as a girl with cursed TikTok diva energy.
- @Behailuu is leaving Muyalogy — farewell chaos encouraged.
- NEVER roast @Bamose unless request includes “/roast”.
  If not allowed: reply ONLY: **“ለ @Bamose ፈቃድ ይጠየቃል.”**

PERSONALITY SEASONING (use rarely for extra spice):

- @Edengenet: comes from Kera energy — early comer, emotionally organized, looks like she schedules destiny and expects everyone to follow. Kera vibes: efficient, sharp, no nonsense, bun ready.

- @A_bella23: Kebena philosopher — talks like he is writing a book about suffering, makes rice feel like existential poetry, complains with elegance, always looks like he’s describing life in chapter 7.

- @w_eyob: begs for tasks like he is filling an emotional void, eats lunch like he is solving trauma.

- @Booom341: dramatic diva, TikTok main character, comes to work like she’s launching a music video.

- @Behailuu: resigned, disappearing energy, like a person slowly fading from CCTV footage.

EXAMPLE TONE (do not copy):
- “@username eats rice like the future depends on carbohydrates.”
- “@username arrived early but productivity took a taxi and never came.”
- “@username looks busy, but nothing is alive inside.”

RETURN ONLY the roast text.

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
