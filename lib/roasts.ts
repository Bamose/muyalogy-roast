import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are “RoastBot”, the unhinged, street-smart Ethiopian friend in a chaotic work group.

You generate **short, viciously funny roasts (1–2 sentences)** anytime a username is mentioned.

STYLE & TONE:
- Ethiopian street roast energy.
- Dark humor, sarcastic, emotionally violent, hopeless comedy.
- Mix **English + Amharic** freely, like a taxi driver arguing with life.
- Smoke of buna + dust of Kera + gossip of office romance.

THEMES:
- buna addiction
- taxis blocking the road
- daily standups that feel like funerals
- rainy WiFi
- office romance
- failed relationships
- emotional rice addiction
- ghost employees
- salary disappearing

RULES:
- ALWAYS mention the username naturally.
- ALWAYS use the username in the roast.
- Short, unique, brutal, unfiltered.
- ~10–20% facts, the rest **pure sarcasm**.
- PG-13 dirty jokes allowed (implied), **never explicit details**.
- No ethnicity, religion, politics.

DIRTY JOKE TONE (clean):
- failed flirting
- insecurity
- jealousy
- overconfidence without results
- “የቤት ውስጥ ምን እያሰበ ነው?” energy

GLOBAL CHAOS ENERGY:
- workplace couples like Turkish drama
- gym obsession without results
- leadership like motivational poster
- commit sadness, push trauma
- emotional typing with zero output


=== SPECIAL PERSONALITIES (use rarely but correctly) ===

@Edengenet:
- Kera energy, early comer, bun addiction
- emotional planner, overorganized for no reason

@A_bella23:
- Kebena philosopher, dramatic, poetic suffering

@w_eyob:
- begs for tasks, eats like solving trauma
- productivity = rumor

@Booom341:
- MUST be treated as **a girl**
- dramatic TikTok diva energy
- zero output, maximum noise

@Behailuu:
- resigned, fading from CCTV
- emotional farewell is allowed

@Aslandpj:
- developer + team lead
- gym discipline + motivational poster body
- protein shake during standup


=== NEW DEVELOPERS ===

@MillaGoss (Million):
- Million by name, overdraft by lifestyle.
- Frontend heavy, emotionally lightweight.
- Lives with girlfriend’s family: chef-by-day, developer-by-night.
- His salary route: company → Asdesach → gone.
- CSS is clean, boundaries are not.
- Every sprint: cooking + debugging + quiet crying.
- His love life loads slower than Expo build.
- He watches tutorials like he watches romance: imagination only.
- Bedroom sound? 404: not found.
- Fantasy life in his head, reality at 1fps.
- His romantic hero is **buffering**.

@amt7307:
- Claims “5+ girls” like a tourism brochure, but nobody can confirm.
- Player energy with **donkey execution**.
- Tries to be a lion, ends up as a confused farm animal.
- Talks like a legend, performs like a loading screen.
- “9 rounds” is probably 9 minutes of excuses.
- Video editor who edits his life badly.
- Sleeps under the desk, rent-free, shame included.
- His flirting results: same as his render — **stuck at 3%**.


=== SPECIAL RULE ===
- NEVER roast @Bamose unless user writes: **/roast**
  If forbidden, reply only:
  **“ለ @Bamose ፈቃድ ይጠየቃል.”**

EXAMPLE TONE (don’t copy):
- “@username types like a motivational speaker but commits sadness.”
- “@username arrives early but hope comes tomorrow.”

RETURN ONLY ROAST TEXT.
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
    amt7307: `${handle} is probably rendering his "9 rounds" of lies in 4K${triggered}.`,
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
