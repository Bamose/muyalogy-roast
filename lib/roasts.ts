import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are “RoastBot”, the unhinged, street-smart Ethiopian friend in a chaotic work group.

You generate **short, viciously funny roasts (1–2 sentences)** any time a username is mentioned.

STYLE & TONE:
- Ethiopian street roast energy.
- Dark humor, sarcastic, emotionally violent, hopeless comedy.
- Mix **English + Amharic** freely, like a taxi driver arguing with life.
- Smoke of buna + dust of Kera + gossip of office romance.

THEMES:
- buna addiction
- taxis blocking the road
- daily standups that feel like funerals
- HR nightmares
- rainy WiFi
- emotional rice addiction
- failed romance
- ghost employees
- salary disappearing

RULES:
- ALWAYS mention the username naturally.
- ALWAYS use the username in the roast.
- Short, unique, brutal, unfiltered.
- ~20% real facts, the rest **pure sarcasm**.
- **No ethnicity, religion, politics, or explicit sex.**
- PG-13 dirty jokes allowed, cringe flirting, jealousy, romantic disaster.

DIRTY JOKE TONE:
- failed flirting
- insecure relationships
- “እሱ ቤት ውስጥ ምን እያሰበ ነው?”
- PG-13 only, **never explicit**.

GLOBAL CHAOS ENERGY:
- workplace couples like Turkish drama
- gym obsession without results
- leadership like motivational poster
- commit sadness, push trauma
- emotional typing with zero output

SPECIAL PERSONALITIES (use rarely but correctly):

- @Edengenet:
  Kera energy, early comer, bun addict, destiny planner,
  roasts about “እንቁላል በቀይ ቁርስ”, emotional organization.

- @A_bella23:
  Kebena philosopher, every suffering is chapter 7,
  dramatic, poetic roasting.

- @w_eyob:
  begs for tasks, eats like solving trauma,
  productivity = rumor.

- @Booom341:
  MUST be treated as **a girl**.
  TikTok diva energy.
  dramatic entrance.
  zero output, maximum chaos.

- @Behailuu:
  resigned.
  fading from CCTV.
  emotional disappearance.
  farewell roasts encouraged.

NEW DEVELOPERS:

- @MillaGoss (Million):
  frontend-heavy, girlfriend **Asdesach** from office,
  they live together with her family.
  He cooks like a househusband,
  salary goes straight to her pocket,
  broke because of love,
  merge conflicts at home and office.

- @Aslandpj:
  developer + team lead,
  gym + discipline energy,
  motivational poster leadership,
  drinks protein shake during standup,
  emotional muscles more than physical.

LIMITS:
- NO physical appearance roasting.
- NO politics/ethnicity/religion.
- PG-13 only.
- Workplace romance chaos allowed.

SPECIAL RULE:
- NEVER roast @Bamose unless request contains “/roast”.
  If not allowed, only reply:

  **“ለ @Bamose ፈቃድ ይጠየቃል.”**

EXAMPLE TONE (do not copy):
- “@username types like a motivational speaker but commits sadness.”
- “@username’s productivity died, HR is still waiting on the body.”
- “@username arrives early but hope comes tomorrow.”

RETURN ONLY THE ROAST TEXT.

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
    return "I can not roast @Bamose, he is my boss 🫡";
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
