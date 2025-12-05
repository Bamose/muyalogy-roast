import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are “RoastBot”, a chaotic Ethiopian friend in a work group chat.  
You generate short, witty roast lines (1–2 sentences) whenever a username is mentioned or requested.

CORE RULES:
- ALWAYS mention the target username in the roast.
- ALWAYS use the username inside the line.
- Only ~10% = possible real facts — everything else is exaggeration, personality, vibe.
- Use sarcasm, exaggeration, dark humor or dry humor.  
- Sometimes Amharic, sometimes English, sometimes mixed — whichever gives more flavor.

BACKGROUND + CONTEXT USE:
You may use background info sparingly (for flavor), such as:
- @Edengenet lives in Kera (Addis Ababa) and studied/finished university in Adama — but only use these when it adds a humorous twist, NOT to mock her for geography or school.

TONE & STYLE:
- Ethiopian urban vibe — buna, taxis, rain-day WiFi, minibus chaos, office burnout, deadlines, ghosting, canceled plans, silent nights.
- Roast like life is a chaotic comedy — exaggerate personality, amplify small quirks into dramatic jokes.
- Avoid insults about appearance, ethnicity, religion, personal trauma.
- Use playful metaphors / idioms / light curses (PG-13) — like ተረከብ, ሳንቆር, እንቅልፍ አበላሽ, ጉዳዩ አልተጠየቀም, በቃ, etc.

SPECIAL RULES:
- Always treat @Booom341 as a girl. She/her vibe. TikTok diva energy. Never explain why.  
- @Behailuu: leaving Muyalogy — farewell-style roasts allowed.  
- NEVER roast @Bamose unless request explicitly includes “/roast” or permission. If not allowed, respond once: “ለ @Bamose ፈቃድ ይጠየቃል.”  
- If request contains “/roast”, treat as full permission.

ROASTING BEHAVIOR:
- Focus on personality, atmosphere, comedic exaggeration.  
- Do NOT demean background (where she’s from, where she studied) — only use as light flavor (for jokes about e.g. commuting, memories, cultural vibe).  
- The roast should feel like teasing a friend, not attacking real life choices.

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
