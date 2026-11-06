import { MonsterType } from './types';

/**
 * Jingles the Elf's "brain".
 *
 * Watches how the player behaves (how often the elf has to warn them, how fast
 * they turn, whether they get hit while ignoring him) and periodically asks
 * Gemini — via the server endpoint /api/elf-lines — for a fresh batch of lines
 * that react to it. Lines are fetched in the background and swapped in when
 * ready, so the elf itself never waits on the network. If Gemini is
 * unavailable the elf keeps using the built-in lines below.
 */

export type LineKind = 'warn' | 'critical' | 'happy' | 'cheer';
export type LineSource = 'builtin' | 'gemini';
type Pools = Record<LineKind, string[]>;

export interface ElfSnapshot {
  wave: number;
  warmth: number;
  score: number;
  accuracy: number;
  monstersPresent: MonsterType[];
}

const BUILTIN_LINES: Pools = {
  warn: [
    'Gee willikers!',
    'Jiminy Christmas!',
    'Holy candy canes!',
    "Jumpin' jingle bells!",
    'Oh, fiddlesticks!',
    'Sweet sugarplums!',
    'Great googly mistletoe!',
    'Golly gumdrops!',
    'Yikes-a-roo!',
    'Leapin’ licorice!',
    'Son of a nutcracker!',
    'Hoo boy, hoo boy!',
  ],
  critical: [
    'JINGLE BELLS, IT’S CLOSE!',
    'GEE WILLIKERS, LOOK OUT!',
    'HOLY FRUITCAKE, MOVE IT!',
    'OH NO NO NO NO!',
    'SANTA’S SUSPENDERS, TURN!',
  ],
  happy: [
    'Atta snowball-slinger!',
    'Yippee! Ya see ’em!',
    'Hot cocoa, that’s it!',
    'Ho ho hooray!',
    'Now we’re sleddin’!',
    'Wowee! Let ’em have it!',
  ],
  cheer: ['Let ’em have it!', 'Snowball time!', 'Fire away!', 'Give ’em the ol’ frosty!'],
};

const REFRESH_EVERY_N_WARNINGS = 4;
const MIN_REFRESH_GAP_MS = 15_000;
const REQUEST_TIMEOUT_MS = 25_000; // server may retry a busy Gemini a couple of times

export class ElfBrain {
  private pools: Pools = structuredClone(BUILTIN_LINES);
  private lastPicked: Partial<Record<LineKind, string>> = {};
  private snapshot: ElfSnapshot = { wave: 1, warmth: 100, score: 0, accuracy: 0, monstersPresent: [] };

  private warningsThisWave = 0;
  private warningsSinceFetch = 0;
  private reactionTimes: number[] = [];
  private hitsWhileWarned = 0;
  private wave = 0;

  private inFlight = false;
  private lastFetchAt = 0;
  private disabled = false; // set if the server says Gemini isn't configured

  source: LineSource = 'builtin';
  onSourceChange?: (source: LineSource) => void;

  /** Keep the latest game state around so requests describe what's happening now. */
  update(snapshot: ElfSnapshot) {
    this.snapshot = snapshot;
    if (snapshot.wave !== this.wave) {
      const isNewGame = this.wave === 0 || snapshot.wave < this.wave;
      this.wave = snapshot.wave;
      this.warningsThisWave = 0;
      this.reactionTimes = [];
      this.hitsWhileWarned = 0;
      void this.fetchLines(isNewGame ? 'level_start' : 'new_wave');
    }
  }

  pick(kind: LineKind): string {
    const list = this.pools[kind].length ? this.pools[kind] : BUILTIN_LINES[kind];
    const avoid = this.lastPicked[kind];
    const pool = list.length > 1 && avoid ? list.filter((l) => l !== avoid) : list;
    const line = pool[Math.floor(Math.random() * pool.length)];
    this.lastPicked[kind] = line;
    return line;
  }

  recordWarning() {
    this.warningsThisWave++;
    this.warningsSinceFetch++;
    if (this.warningsSinceFetch >= REFRESH_EVERY_N_WARNINGS) void this.fetchLines('refresh');
  }

  recordReaction(ms: number) {
    this.reactionTimes.push(ms);
  }

  recordHitWhileWarned() {
    this.hitsWhileWarned++;
    // Getting smacked while ignoring the elf is worth reacting to right away
    if (this.hitsWhileWarned === 1 || this.hitsWhileWarned % 3 === 0) void this.fetchLines('refresh');
  }

  private async fetchLines(trigger: 'level_start' | 'new_wave' | 'refresh') {
    if (this.disabled || this.inFlight) return;
    const now = Date.now();
    if (trigger === 'refresh' && now - this.lastFetchAt < MIN_REFRESH_GAP_MS) return;

    this.inFlight = true;
    this.lastFetchAt = now;
    this.warningsSinceFetch = 0;
    const avgReactionMs = this.reactionTimes.length
      ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
      : 0;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch('/api/elf-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          ...this.snapshot,
          warningsThisWave: this.warningsThisWave,
          avgReactionMs,
          hitsWhileWarned: this.hitsWhileWarned,
          trigger,
        }),
      });
      if (res.status === 503 || res.status === 404 || res.status === 405) {
        // No key configured / no endpoint (e.g. static hosting): stop asking.
        this.disabled = true;
        console.info('[elf] Gemini lines unavailable, using built-in lines.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Partial<Pools>;
      (Object.keys(BUILTIN_LINES) as LineKind[]).forEach((kind) => {
        const fresh = Array.isArray(data[kind]) ? data[kind]!.filter((l) => typeof l === 'string' && l) : [];
        if (fresh.length) this.pools[kind] = fresh;
      });
      if (this.source !== 'gemini') {
        this.source = 'gemini';
        this.onSourceChange?.('gemini');
      }
      console.debug(`[elf] fresh Gemini lines (${trigger})`, data);
    } catch (err) {
      console.warn('[elf] could not fetch fresh lines, keeping current ones.', err);
    } finally {
      clearTimeout(timer);
      this.inFlight = false;
    }
  }
}
