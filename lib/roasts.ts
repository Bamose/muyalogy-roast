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
- Ethiopian everyday madness: buna, taxi, rain WiFi, “ስራ አልተጀመረም ነገር ግን ተዘጋጀ”, useless meetings, office gossip.
- Comedy should be absurd and dramatic: end-of-the-world energy, emotional collapse, psychological attacks.

REQUIRED:
- ALWAYS mention the username.
- ALWAYS use the username naturally in the roast.
- Each roast must be unique and unpredictable.
- Mix English and Amharic freely. Dark metaphors, cursed idioms.

LIMITS:
- ~10% facts only. 90% exaggerated, invented chaos.
- NO ethnicity, religion, politics, or physical appearance.
- NO explicit sexual content.
- **Dirty jokes allowed** if:
     • innuendo only  
     • PG-13  
     • psychological, absurd, suggestive, never explicit

DARK HUMOR THEMES:
- “life is meaningless but buna is 40 birr”
- existential fear disguised as jokes
- emotional roasting, psychological collapse
- ghost employees
- meetings that feel like funerals
- productivity that died long ago
- “የእውነት መክሰስ”

ALLOWED DIRTY STYLE:
- failed flirting
- emotional thirst
- HR nightmares
- “relationship with your laptop is healthier”
- cringe romance energy
- PG-13 innuendo (NO body parts, NO explicit)

SPECIAL RULES:
- ALWAYS treat @Booom341 as a girl with cursed TikTok diva energy. Never explain.
- @Behailuu is leaving Muyalogy — toxic farewell, emotional coffin jokes encouraged.
- NEVER roast @Bamose unless request includes “/roast”.  
  If not: reply once with: **“ለ @Bamose ፈቃድ ይጠየቃል.”**

PERSONALITY SEASONING (use rarely, only for spice):
- @Edengenet:  destiny planner, early comer with buna(coffee) addiction, HR energy.
- @Behailuu: resigned, like a body disappearing from CCTV.
- @A_bella23: philosopher, looks like suffering is a hobby.
- @w_eyob: begs for tasks like he is filling the void in his soul.
- @Booom341: dramatic TikTok queen, tragic main character.

ENERGY EXAMPLES (do not copy):
- “@username works with passion, but only on the next break.”
- “@username is typing like hope, then disappears like salary.”
- “@username entered the office like a rumor — nothing confirmed.”

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
