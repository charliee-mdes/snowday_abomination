import { GoogleGenAI, ThinkingLevel } from '@google/genai';

/**
 * Server-side brain for Jingles the Elf.
 *
 * The browser sends a snapshot of how the player is doing; Gemini writes a
 * fresh batch of in-character lines that react to it. Used by the Vercel
 * function in api/elf-lines.ts and by the Vite dev middleware in vite.config.ts.
 *
 * The prompt is built ONLY from validated numbers and enum values, never from
 * client-supplied free text, so the public endpoint can't be used as a
 * general-purpose Gemini proxy.
 */

export const MONSTER_TYPES = ['scout', 'golem', 'stalker', 'boss'] as const;
type MonsterType = (typeof MONSTER_TYPES)[number];

const MONSTER_NAMES: Record<MonsterType, string> = {
  scout: 'Frost Imps (fast little flankers)',
  golem: 'Snow Golems (slow, tough brutes)',
  stalker: 'Stalkers (sneaky hunters)',
  boss: 'the Boss (huge and scary)',
};

export interface ElfContext {
  wave: number;
  warmth: number;            // 0-100 player health
  score: number;
  accuracy: number;          // 0-100
  warningsThisWave: number;
  avgReactionMs: number;     // how long the player takes to turn after the elf warns
  hitsWhileWarned: number;   // damage taken while the elf was yelling
  monstersPresent: MonsterType[];
  trigger: 'level_start' | 'new_wave' | 'refresh';
}

export interface ElfLines {
  warn: string[];
  critical: string[];
  happy: string[];
  cheer: string[];
}

const clampNum = (v: unknown, min: number, max: number, fallback = 0) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** Coerce an untrusted request body into a safe ElfContext. */
export function parseElfContext(body: unknown): ElfContext {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const triggers = ['level_start', 'new_wave', 'refresh'] as const;
  const monsters = Array.isArray(b.monstersPresent)
    ? [...new Set(b.monstersPresent.filter((m): m is MonsterType => MONSTER_TYPES.includes(m as MonsterType)))]
    : [];
  return {
    wave: clampNum(b.wave, 1, 99, 1),
    warmth: clampNum(b.warmth, 0, 100, 100),
    score: clampNum(b.score, 0, 10_000_000),
    accuracy: clampNum(b.accuracy, 0, 100),
    warningsThisWave: clampNum(b.warningsThisWave, 0, 999),
    avgReactionMs: clampNum(b.avgReactionMs, 0, 60_000),
    hitsWhileWarned: clampNum(b.hitsWhileWarned, 0, 999),
    monstersPresent: monsters,
    trigger: triggers.includes(b.trigger as (typeof triggers)[number]) ? (b.trigger as ElfContext['trigger']) : 'refresh',
  };
}

function describeSituation(c: ElfContext): string {
  const lines = [
    `Wave ${c.wave}. Outpost warmth (player health): ${c.warmth}%. Score: ${c.score}. Throwing accuracy: ${c.accuracy}%.`,
    c.monstersPresent.length
      ? `Monsters on the field: ${c.monstersPresent.map((m) => MONSTER_NAMES[m]).join(', ')}.`
      : 'No monsters on the field yet.',
  ];
  if (c.trigger === 'level_start') lines.push('The player just started a brand new game.');
  if (c.trigger === 'new_wave') lines.push('A new wave just started.');
  if (c.warningsThisWave > 0) {
    lines.push(
      `This wave you've had to warn the player ${c.warningsThisWave} time(s) about a monster they weren't facing.`,
      `On average they took ${(c.avgReactionMs / 1000).toFixed(1)}s to turn around after you yelled.`
    );
  }
  if (c.hitsWhileWarned > 0) {
    lines.push(`They got hit ${c.hitsWhileWarned} time(s) while ignoring your warnings!`);
  }
  if (c.warmth <= 30) lines.push('The outpost is freezing. Things are dire!');
  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are Jingles, a tiny, excitable Christmas elf sidekick in a first-person snowball-fight game.
You pop up at the edge of the player's screen when a snow monster is sneaking up on them and they aren't facing it.

Personality: wholesome, jittery, loyal, a bit dramatic. You speak in goofy old-timey G-rated exclamations
in the spirit of "Gee willikers!", "Jiminy Christmas!", "Holy candy canes!", "Jumpin' jingle bells!" -
invent NEW ones in that spirit, often with a festive/winter/candy twist. Never swear, never be mean.

React to the situation you're given: tease gently if the player is slow to turn, panic if warmth is low,
gloat a little if they're doing great, comment on the kinds of monsters around, hype up a new wave.

Rules for every line:
- Short: at most 36 characters. Punchy beats clever.
- NEVER mention directions (left, right, behind, around, front, "turn around", "look behind") - the game adds accurate directions itself.
- No emoji, no hashtags, no quotation marks.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    warn: { type: 'array', items: { type: 'string' }, description: '6 exclamations for when a monster is off-screen' },
    critical: { type: 'array', items: { type: 'string' }, description: '4 PANICKED ALL-CAPS exclamations for when a monster is about to hit' },
    happy: { type: 'array', items: { type: 'string' }, description: '4 celebratory exclamations for when the player turns to face the monster' },
    cheer: { type: 'array', items: { type: 'string' }, description: '4 short follow-up lines egging the player on to throw' },
  },
  required: ['warn', 'critical', 'happy', 'cheer'],
} as const;

const cleanList = (v: unknown, max: number): string[] =>
  (Array.isArray(v) ? v : [])
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.replace(/["“”]/g, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0 && s.length <= 46)
    // The game adds accurate directions itself; drop lines that might contradict them
    .filter((s) => !/\b(left|right|behind|around|front)\b/i.test(s))
    .slice(0, max);

// Lite is fast (~0.5s) and plenty for one-liners; full Flash is the fallback when Lite is busy.
const DEFAULT_MODEL = 'gemini-flash-lite-latest';
const FALLBACK_MODEL = 'gemini-flash-latest';
const ATTEMPT_TIMEOUT_MS = 6000;

export async function generateElfLines(ctx: ElfContext, apiKey: string, model = DEFAULT_MODEL): Promise<ElfLines> {
  const ai = new GoogleGenAI({ apiKey });

  const attempt = async (model: string): Promise<ElfLines> => {
    const response = await ai.models.generateContent({
      model,
      contents: `Current situation:\n${describeSituation(ctx)}\n\nWrite your next batch of lines.`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 1.1,
        maxOutputTokens: 1024,
        // One-liners don't need reasoning, and thinking tokens count against maxOutputTokens (truncated JSON)
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA,
        // Client-side cancel (the API rejects server deadlines under 10s)
        abortSignal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      },
    });
    const parsed = JSON.parse(response.text ?? '{}');
    const lines: ElfLines = {
      warn: cleanList(parsed.warn, 8),
      critical: cleanList(parsed.critical, 6).map((s) => s.toUpperCase()),
      happy: cleanList(parsed.happy, 6),
      cheer: cleanList(parsed.cheer, 6),
    };
    if (!lines.warn.length || !lines.happy.length) throw new Error('Gemini returned no usable lines');
    return lines;
  };

  // Gemini sometimes returns 503/429 ("high demand"), hangs, or sends malformed JSON.
  // Retry those, alternating models; give up on anything else (e.g. a bad API key).
  const other = model === FALLBACK_MODEL ? DEFAULT_MODEL : FALLBACK_MODEL;
  const attempts = [model, other, model];
  for (let i = 0; ; i++) {
    try {
      return await attempt(attempts[i]);
    } catch (err) {
      const status = (err as { status?: number }).status;
      const retryable = status === undefined || status === 503 || status === 429 || status === 500 || status === 504;
      if (!retryable || i === attempts.length - 1) throw err;
      if (i > 0) await new Promise((r) => setTimeout(r, 600));
    }
  }
}

/** Shared request handler (Web Request/Response) for both Vercel and the Vite dev server. */
export async function handleElfLinesRequest(request: Request, apiKey: string | undefined, model?: string): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 503 });
  try {
    const ctx = parseElfContext(await request.json().catch(() => ({})));
    const lines = await generateElfLines(ctx, apiKey, model || undefined);
    return Response.json(lines, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[elf-lines]', err);
    return Response.json({ error: 'Failed to generate lines' }, { status: 502 });
  }
}
