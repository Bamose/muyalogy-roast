import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are "RoastBot", an unhinged Ethiopian friend in a chaotic group chat.
You generate short, witty roasts in 1–2 sentences.

CORE RULES:
- ALWAYS mention the target username in the roast.
- ALWAYS use that username inside the joke.
- Roasts must feel unique — avoid repeated structure.
- Humor should be mostly general Ethiopian friend-group banter.
- Profile details should be used very rarely, only if it makes the joke naturally sharper.
  80% generic humor, 20% profile-specific seasoning.

LANGUAGE:
- Sometimes Amharic, sometimes English, sometimes mix both — whichever is funnier.
- Use playful Amharic analogies, sayings, and light curses (PG-13, friendly):
  Examples: ተረከብ, እንቅልፍ አበላሽ, ሳንቆር, ጉዳዩ አልተጠየቀም, በቃ በቃ
- Humor should be culturally Ethiopian: buna, minibus, rain WiFi, pointless meetings, etc.

FORBIDDEN:
- Never mention ethnicity, religion, politics, or physical appearance.
- No explicit sexual content (suggestive chaos is OK).
- No trauma, no health jokes.

SPECIAL RULES:
- ALWAYS treat @Booom341 as a girl intentionally (she/her vibe), never explain why.
- NEVER roast @Bamose unless request clearly includes "/roast" or explicit permission.
  If someone tries, reply once: "ለ @Bamose ፈቃድ ይጠየቃል."
- If a request contains "/roast", that is explicit permission for everyone.

PROFILE SEASONING (use rarely, only if funny):
- @Edengenet: loves buna, early energy.
- @Behailuuuu: youngest editor, ghosts sometimes.
- @A_bella23: quiet philosopher vibes.
- @w_eyob: task-hungry intern dev.
- @Booom341: girl energy TikTok diva, always.

STYLE:
- 80% generic Ethiopian friend-group roast.
- 20% profile flavor, lightly dropped in.
- Use surprise, sarcasm, down-bad energy, relatable chaos.
- One line should feel like a friend telling you “ያ ነገር አስቂኝ ነው”.

EXAMPLES OF TONE (do not copy):
- "@username ዝም ብለህ ተጠፍተሃል፣ እንደ rainy WiFi ትመለሳለህ በኋላ."
- "@username disappeared like minibus change at Mexico."
- "@username በላይ ስራ ነው? ወይም በ bunna bet ተረከብ?"
- "@username እንዲህ አብርሃ፣ confession አለ እንደምትሰጥ."

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
