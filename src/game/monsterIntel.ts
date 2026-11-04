import { MonsterType } from './types';

export interface EnemyIntel {
  type: MonsterType;
  name: string;
  title: string;
  threatRating: 1 | 2 | 3 | 4 | 5;
  health: number;
  speedRating: 'Slow' | 'Moderate' | 'Fast' | 'Extreme';
  firstWave: number;
  scoreValue: number;
  weakness: string;
  recommendedAmmo: string;
  description: string;
  tacticalTip: string;
  visualFeatures: string[];
  badges: string[];
}

export const ENEMY_INTEL_LIST: EnemyIntel[] = [
  {
    type: 'scout',
    name: 'Frost Imp',
    title: 'Agile Flanker',
    threatRating: 2,
    health: 30,
    speedRating: 'Fast',
    firstWave: 1,
    scoreValue: 100,
    weakness: 'Standard Rapid Snowballs',
    recommendedAmmo: 'Standard Snowball [1]',
    description: 'A nimble snow demon with sharp ice quills running down its spine and glowing crimson eyes. Spawns in packs and attempts to sprint behind your outpost.',
    tacticalTip: 'Use your Central Directional Reticle to spot them early. A single well-placed standard snowball shatters them instantly.',
    visualFeatures: [
      'Twin glowing crimson ice eyes',
      'Triple glacial spine quills',
      'Nimble running animation',
      'Ice-clawed forearms',
    ],
    badges: ['Wave 1+ Common', '1-Hit Kill', 'Swift Sprinter'],
  },
  {
    type: 'golem',
    name: 'Abominable Snow Golem',
    title: 'Glacial Heavy Brute',
    threatRating: 3,
    health: 90,
    speedRating: 'Slow',
    firstWave: 2,
    scoreValue: 250,
    weakness: 'Heavy Snow Boulders & Impact Crushes',
    recommendedAmmo: 'Snow Boulder [3] or Piercing Shard [2]',
    description: 'Constructed from three massive packed snow boulders with heavy ice club arms and a row of frozen icicle fangs. Can endure multiple direct hits.',
    tacticalTip: 'Switch to Snow Boulder [Key 3] for heavy crushing damage, or land three quick successive standard snowballs to maintain your combo multiplier.',
    visualFeatures: [
      'Dual heavy ice club fists',
      'Burning coal-amber eye sockets',
      'Heavy multi-part torso boulders',
      'Fierce icicle jaw array',
    ],
    badges: ['Wave 2+ Encounter', 'Armored (90 HP)', 'Heavy Hitter'],
  },
  {
    type: 'stalker',
    name: 'Frost Stalker',
    title: 'Crystalline Lurker',
    threatRating: 4,
    health: 60,
    speedRating: 'Moderate',
    firstWave: 3,
    scoreValue: 200,
    weakness: 'High-Velocity Frost Shards',
    recommendedAmmo: 'Ice Shard [2]',
    description: 'A predatory snow fiend built around a crystalline octahedron core. Features floating shoulder ice crystals and a distinctive triple cyan eye cluster.',
    tacticalTip: 'Tends to circle at medium distance before lunging. High-speed Frost Shards [Key 2] pierce through their crystalline armor immediately.',
    visualFeatures: [
      'Triple cyan glowing eye triangle',
      'Dual scythe blade arms',
      'Floating shoulder ice crystals',
      'Octahedral crystal core',
    ],
    badges: ['Wave 3+ Stalker', 'Crystalline Armor', 'Medium Flanker'],
  },
  {
    type: 'boss',
    name: 'Glacial Titan King',
    title: 'Colossal Blizzard Monarch',
    threatRating: 5,
    health: 360,
    speedRating: 'Slow',
    firstWave: 5,
    scoreValue: 1500,
    weakness: 'Blizzard Novas & Heavy Arcs',
    recommendedAmmo: 'Blizzard Nova [4] + Snow Boulder [3]',
    description: 'The ancient titan ruling the frozen mountain tundra. Standing over 4 meters tall with a 5-spire glacial crown, massive granite-density snow limbs, and apocalyptic health.',
    tacticalTip: 'Keep turning to avoid getting cornered! Tap [F] to stay locked on target. Alternate Blizzard Novas for area frost burst and heavy boulders to quickly chip down its massive health bar.',
    visualFeatures: [
      '5-spire glacial crown horns',
      'Colossal scale (4.2 meters tall)',
      'Massive tree-trunk stomper legs',
      'Twin piercing ruby gaze',
    ],
    badges: ['Wave 5 Boss', 'Colossal (360 HP)', 'Apex Predator'],
  },
];
