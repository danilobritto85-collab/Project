import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { removeCheckerFragments, repairForegroundMask } from './spriteMask';
import { getRedToenailFrame, withRedToenails } from './toenailPolish';
import {
  EBONY_FRAMES, EBONY_WALK, EBONY_RUN, EBONY_ATTACKS, EBONY_BASE_CROPS,
  EBONY_STOMP, EBONY_VICTORY, EBONY_DUO_VICTORY, EBONY_STOMP_DURATION, EBONY_VICTORY_DURATION,
  prepareEbonySheet, drawEbonyFrame, ebonyVictoryPose, type EbonyFrame,
} from './ebonySprites';
import {
  KARATE_BLONDE, KARATE_BLONDE_ATTACKS, KARATE_BLONDE_WALK,
  KARATE_EBONY, KARATE_EBONY_ATTACKS, KARATE_EBONY_WALK,
  karateBlondeSequenceFrames, karateEbonySequenceFrames, karateDuoSequenceFrames,
  prepareKarateSheet, removeStoryboardHeadings,
} from './karateSprites';

import amazonSheetUrl from '@assets/amazon_1791470375689.png';
import backgroundUrl from '@assets/background_1791470375690.png';
import heroSheetUrl from '@assets/hero_1791470375690.png';
import ninjaSheetUrl from '@assets/ninja_1791475869252.png';
import pinAttackUrl from '@assets/pin_attack_1791470375691.png';
import pinExtendedUrl from '@assets/pin_extended_1791470375691.png';
import ninjaFootsmotherUrl from '@assets/ninja_footsmother.png';
import ninjaFootsmotherEndingUrl from '@assets/ninja_footsmother_ending.png';
import roxySheetUrl from '@assets/roxy_clean.png';
import { ROXY_FRAMES, prepareRoxySheet, drawRoxyFrame, type RoxyFrame } from './roxySprites';
import roxyHypnoUrl from '@assets/roxy_hypno_1791553456528.png';
import roxySmotherUrl from '@assets/roxy_smother_1791553456529.png';
import amazonKickAudioUrl from '@assets/generated_audio/amazon_kick.mp3';
import ninjaKickAudioUrl from '@assets/generated_audio/ninja_kick.mp3';
import heroineHurtAudioUrl from '@assets/generated_audio/heroine_hurt.mp3';
import heroineStruggleAudioUrl from '@assets/generated_audio/heroine_struggle_soft.mp3';
import heroineBreathingAudioUrl from '@assets/generated_audio/heroine_deep_breath.mp3';
import enemyLaughAudioUrl from '@assets/generated_audio/enemy_laugh.mp3';
import heroineFaintSighAudioUrl from '@assets/generated_audio/heroine_faint_sigh.mp3';
import roxyKickAudioUrl from '@assets/generated_audio/roxy_kick.mp3';
import roxyDialogueAudioUrl from '@assets/generated_audio/roxy_voluntary_dialogue.mp3';
import ebonySheetUrl from '@assets/amazon_ebony_clean.png';
import ebonyStompUrl from '@assets/amazon_ebony_stomp_clean.png';
import ebonyVictoryUrl from '@assets/amazon_ebony_victory_clean.png';
import ebonyDuoVictoryUrl from '@assets/amazon_ebony_duo_clean.png';
import karateBlondeSheetUrl from '@assets/karate_blonde_1791929279634.png';
import karateBlondeAttackOneUrl from '@assets/karate_blonde_atk_1_1791929279635.png';
import karateBlondeAttackTwoUrl from '@assets/karate_blonde_atk_2_1791929279636.png';
import karateEbonySheetUrl from '@assets/karate_ebony_1791929279637.png';
import karateEbonyAttackOneUrl from '@assets/karate_ebony_atk_1_1791929279637.png';
import karateEbonyAttackTwoUrl from '@assets/karate_ebony_atk_2_1791929279638.png';

const WIDTH = 1024;
const HEIGHT = 576;
const STARTING_ENEMY_KINDS: readonly EnemyKind[] = [
  'amazon', 'ninja', 'amazon', 'ninja', 'roxy', 'amazon', 'ninja', 'amazon', 'amazon',
];
const FLOOR_MIN = HEIGHT * 0.75;
const FLOOR_MAX = HEIGHT * 0.95;

export interface FightConfig {
  amazonas: number;
  ebony: number;
  ninjas: number;
  roxy: number;
  karateBlonde: number;
  karateEbony: number;
  ebonyVictory: boolean;
}

export const DEFAULT_FIGHT_CONFIG: FightConfig = {
  amazonas: 5,
  ebony: 0,
  ninjas: 3,
  roxy: 1,
  karateBlonde: 0,
  karateEbony: 0,
  ebonyVictory: false,
};

export const STATE_NINJA_FOOTSMOTHER = 'ninja-footsmother' as const;
export const STATE_ROXY_OFFER = 'roxy-offer' as const;
export const STATE_ROXY_CHALLENGE = 'roxy-challenge' as const;
export const STATE_ROXY_SMOTHER = 'roxy-smother' as const;
export const STATE_KARATE_OFFER = 'karate-offer' as const;
export const STATE_KARATE_CHALLENGE = 'karate-challenge' as const;

export type GamePhase =
  | 'title'
  | 'playing'
  | 'ebony-stomp'
  | 'ebony-victory'
  | 'grapple'
  | 'special-defeat'
  | typeof STATE_NINJA_FOOTSMOTHER
  | typeof STATE_ROXY_OFFER
  | typeof STATE_ROXY_CHALLENGE
  | typeof STATE_ROXY_SMOTHER
  | typeof STATE_KARATE_OFFER
  | typeof STATE_KARATE_CHALLENGE
  | 'group-defeat'
  | 'game-over';

export interface GameSnapshot {
  phase: GamePhase;
  heroHp: number;
  maxHeroHp: number;
  activeEnemies: number;
  totalEnemies: number;
  defeatedEnemies: number;
  score: number;
  grappleSecondsLeft: number;
  escapeProgress: number;
  defeatSecondsLeft: number;
  soundEnabled: boolean;
  roxyChallengeElapsed: number;
  ebonyVictoryActive: boolean;
  karateOfferOpponent: 'blonde' | 'ebony' | 'duo' | null;
  karateSceneActive: boolean;
}

interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SpriteAtlas {
  background: HTMLImageElement | null;
  hero: HTMLCanvasElement | null;
  amazon: HTMLCanvasElement | null;
  ebony: HTMLCanvasElement | null;
  ebonyStomp: HTMLCanvasElement | null;
  ebonyVictory: HTMLCanvasElement | null;
  ebonyDuoVictory: HTMLCanvasElement | null;
  karateBlonde: HTMLCanvasElement | null;
  karateBlondeAttackOne: HTMLCanvasElement | null;
  karateBlondeAttackTwo: HTMLCanvasElement | null;
  karateEbony: HTMLCanvasElement | null;
  karateEbonyAttackOne: HTMLCanvasElement | null;
  karateEbonyAttackTwo: HTMLCanvasElement | null;
  ninja: HTMLCanvasElement | null;
  ninjaFootsmother: HTMLCanvasElement | null;
  ninjaFootsmotherEnding: HTMLCanvasElement | null;
  roxy: HTMLCanvasElement | null;
  roxyHypno: HTMLCanvasElement | null;
  roxySmother: HTMLCanvasElement | null;
  pinAttack: HTMLCanvasElement | null;
  pinExtended: HTMLCanvasElement | null;
}

type EnemyKind = 'amazon' | 'ninja' | 'roxy' | 'karateBlonde' | 'karateEbony';
type EnemyState = 'idle' | 'walk' | 'run' | 'attack' | 'hurt' | 'down';

interface Enemy {
  id: number;
  kind: EnemyKind;
  ebony: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  active: boolean;
  direction: -1 | 1;
  state: EnemyState;
  stateTimer: number;
  attackPoseIndex: number;
  attackCooldown: number;
  respawnAt: number;
  hue: number;
  stride: number;
  pinElapsed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  kind: 'heart' | 'smoke';
  size: number;
}

type KarateSequenceKind = 'blonde' | 'ebony' | 'duo';

interface World {
  phase: GamePhase;
  defeatKind: 'special' | 'group' | 'ninja-footsmother' | 'roxy-smother' | 'ebony-victory' | 'karate-victory' | null;
  fightConfig: FightConfig;
  ebonyElapsed: number;
  ebonyHitFrame: number;
  ebonyPartnerId: number | null;
  isGrappleActive: boolean;
  heroX: number;
  heroY: number;
  heroHp: number;
  facing: -1 | 1;
  heroAction: 'idle' | 'walk' | 'run' | 'punch' | 'kick' | 'jump' | 'hurt';
  actionTimer: number;
  jumpOffset: number;
  jumpVelocity: number;
  heroVelocityX: number;
  heroVelocityY: number;
  heroHitCooldown: number;
  score: number;
  defeatedEnemies: number;
  enemyLineup: OpponentKind[];
  enemies: Enemy[];
  currentGrappler: number | null;
  grappleSecondsLeft: number;
  escapeProgress: number;
  defeatSecondsLeft: number;
  defeatStartHp: number;
  ninjaFootsmotherElapsed: number;
  roxyDefeatElapsed: number;
  roxyDialoguePlayed: boolean;
  karateSequence: KarateSequenceKind | null;
  karateDefeatElapsed: number;
  footstepTimer: number;
  soundEnabled: boolean;
  sound: SoundEngine;
  particles: Particle[];
  smokeTimer: number;
  heartTimer: number;
  struggleVoiceTimer: number;
  nextStruggleBreath: boolean;
  randomSeed: number;
}

type SoundCue =
  | 'amazonKick'
  | 'ninjaKick'
  | 'heroineHurt'
  | 'heroineStruggle'
  | 'heroineBreathing'
  | 'enemyLaugh'
  | 'heroineFaintSigh'
  | 'roxyKick'
  | 'roxyDialogue';

type SoundEngine = {
  context: AudioContext | null;
  enabled: boolean;
  clips: Partial<Record<SoundCue, HTMLAudioElement>>;
  active: Set<HTMLAudioElement>;
  lastPlayed: Partial<Record<SoundCue, number>>;
  lastNinjaKiai: number;
  lastKarateKiai: Record<'blonde' | 'ebony', number>;
};

const spriteBoundsCache = new WeakMap<HTMLCanvasElement, Map<string, SpriteRect>>();
const spriteFrameCache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();
const compositeBoundsCache = new WeakMap<HTMLCanvasElement, Map<string, SpriteRect>>();
const karateBoundsCache = new WeakMap<HTMLCanvasElement, Map<string, SpriteRect>>();

const HERO_FRAMES = {
  idle: { x: 28, y: 83, w: 105, h: 178 },
  walk: { x: 348, y: 83, w: 110, h: 178 },
  run: { x: 710, y: 84, w: 145, h: 177 },
  punch: { x: 113, y: 340, w: 142, h: 178 },
  kick: { x: 430, y: 340, w: 153, h: 179 },
  jump: { x: 820, y: 340, w: 108, h: 176 },
  hurt: { x: 25, y: 575, w: 159, h: 180 },
  down: { x: 318, y: 575, w: 172, h: 179 },
  defeated: { x: 780, y: 676, w: 234, h: 80 },
} satisfies Record<string, SpriteRect>;

const AMAZON_FRAMES = {
  idle: { x: 27, y: 82, w: 110, h: 179 },
  walk: { x: 367, y: 83, w: 112, h: 178 },
  run: { x: 704, y: 83, w: 150, h: 178 },
  kick: { x: 124, y: 340, w: 136, h: 179 },
  spin: { x: 343, y: 340, w: 153, h: 179 },
  highKick: { x: 562, y: 340, w: 153, h: 180 },
  pinPose: { x: 691, y: 340, w: 111, h: 179 },
  pinLift: { x: 800, y: 340, w: 111, h: 179 },
  hurt: { x: 24, y: 571, w: 164, h: 186 },
  down: { x: 385, y: 571, w: 172, h: 181 },
  defeated: { x: 817, y: 650, w: 191, h: 106 },
} satisfies Record<string, SpriteRect>;

const AMAZON_WALK_FRAMES: SpriteRect[] = [
  { x: 360, y: 82, w: 112, h: 179 },
  { x: 460, y: 82, w: 112, h: 179 },
  { x: 560, y: 82, w: 112, h: 179 },
];

const NINJA_KICK_FRAME: SpriteRect = { x: 136, y: 340, w: 132, h: 179 };
const NINJA_HIGH_KICK_FRAME: SpriteRect = { x: 548, y: 340, w: 151, h: 180 };
const NINJA_FRAMES = {
  idle: { x: 20, y: 82, w: 112, h: 179 },
  walk: { x: 363, y: 82, w: 111, h: 179 },
  run: { x: 704, y: 82, w: 120, h: 179 },
  kick: NINJA_KICK_FRAME,
  spin: { x: 347, y: 340, w: 155, h: 179 },
  highKick: NINJA_HIGH_KICK_FRAME,
  special: NINJA_KICK_FRAME,
  pinPose: NINJA_KICK_FRAME,
  pinLift: NINJA_HIGH_KICK_FRAME,
  hurt: { x: 24, y: 571, w: 150, h: 186 },
  down: { x: 550, y: 571, w: 174, h: 185 },
  defeated: { x: 762, y: 636, w: 254, h: 121 },
} satisfies Record<string, SpriteRect>;

const NINJA_WALK_FRAMES: SpriteRect[] = [
  { x: 358, y: 82, w: 112, h: 179 },
  { x: 458, y: 82, w: 112, h: 179 },
  { x: 558, y: 82, w: 112, h: 179 },
];
const NINJA_RUN_FRAMES: SpriteRect[] = [
  { x: 700, y: 82, w: 116, h: 179 },
  { x: 808, y: 82, w: 112, h: 179 },
  { x: 910, y: 82, w: 112, h: 179 },
];
const ROXY_HYPNO_FRAMES: SpriteRect[] = [
  { x: 0, y: 0, w: 688, h: 384 },
  { x: 688, y: 0, w: 688, h: 384 },
  { x: 0, y: 384, w: 688, h: 384 },
  { x: 688, y: 384, w: 688, h: 384 },
];
const ROXY_SMOTHER_FRAMES: SpriteRect[] = [
  { x: 0, y: 0, w: 1200, h: 896 },
  { x: 1200, y: 0, w: 1200, h: 896 },
  { x: 0, y: 896, w: 1200, h: 896 },
  { x: 1200, y: 896, w: 1200, h: 896 },
];
const NINJA_FOOTSMOTHER_FRAMES: SpriteRect[] = [
  { x: 0, y: 0, w: 341, h: 286 },
  { x: 341, y: 0, w: 341, h: 286 },
  { x: 682, y: 0, w: 342, h: 286 },
  { x: 0, y: 286, w: 341, h: 286 },
  { x: 341, y: 286, w: 341, h: 286 },
  { x: 682, y: 286, w: 342, h: 286 },
];
const NINJA_FOOTSMOTHER_ENDING_FRAMES: SpriteRect[] = [
  { x: 0, y: 0, w: 232, h: 200 },
  { x: 232, y: 0, w: 232, h: 200 },
  { x: 464, y: 0, w: 232, h: 200 },
];
const WALK_CYCLE = [0, 1, 2, 1] as const;
const ATTACK_FRAMES: Record<EnemyKind, SpriteRect[]> = {
  amazon: [AMAZON_FRAMES.kick, AMAZON_FRAMES.spin, AMAZON_FRAMES.highKick],
  ninja: [NINJA_FRAMES.kick, NINJA_FRAMES.spin, NINJA_FRAMES.highKick],
  // The Roxy sheet has two distinct kick panels. Cycling into empty sheet
  // space or repeating the high-kick panel made her attack pose blink.
  roxy: [ROXY_FRAMES.kick, ROXY_FRAMES.spin],
  karateBlonde: KARATE_BLONDE_ATTACKS,
  karateEbony: KARATE_EBONY_ATTACKS,
};
const ENEMY_FRAMES = {
  amazon: AMAZON_FRAMES,
  ninja: NINJA_FRAMES,
  roxy: ROXY_FRAMES,
  karateBlonde: KARATE_BLONDE,
  karateEbony: KARATE_EBONY,
};

const GROUP_AMAZON_OFFSETS = [
  { dx: -180, dy: -4, flipped: false },
  { dx: -90, dy: 4, flipped: false },
  { dx: 0, dy: -12, flipped: false },
  { dx: 90, dy: 4, flipped: true },
  { dx: 180, dy: -4, flipped: true },
] as const;
const GRAPPLE_FRAMES: SpriteRect[] = [
  { x: 8, y: 58, w: 322, h: 318 },
  { x: 351, y: 58, w: 322, h: 318 },
  { x: 692, y: 58, w: 324, h: 318 },
  { x: 8, y: 444, w: 322, h: 322 },
  { x: 351, y: 444, w: 322, h: 322 },
  { x: 692, y: 444, w: 324, h: 322 },
];

const STRUGGLE_FRAMES: SpriteRect[] = [
  { x: 8, y: 58, w: 322, h: 318 },
  { x: 351, y: 58, w: 322, h: 318 },
  { x: 692, y: 58, w: 324, h: 318 },
  { x: 8, y: 444, w: 322, h: 322 },
  { x: 351, y: 444, w: 322, h: 322 },
  { x: 692, y: 444, w: 324, h: 322 },
];

const GRAPPLE_DURATION = 5;
const SPECIAL_DEFEAT_DURATION = 10;
export const NINJA_FOOTSMOTHER_DURATION = 10;
const ROXY_DEFEAT_DURATION = 10;
const EBONY_FINISHER_KO_CHANCE = 0.25;
const EBONY_STOMP_CHANCE = 0.25;
const ROXY_HYPNOSIS_DURATION = 2.4;
const ROXY_HYPNOSIS_FRAME_DURATION = 1.2;
const NINJA_FOOTSMOTHER_ENDING_DURATION = 1.5;
const NINJA_FOOTSMOTHER_FRAME_RATE = 6;
const GROUP_DEFEAT_DURATION = 20;
const KARATE_DEFEAT_DURATION = 10;

function sequenceFrame(frames: SpriteRect[], elapsed: number, duration: number) {
  const index = Math.min(frames.length - 1, Math.floor((elapsed / duration) * frames.length));
  return frames[Math.max(0, index)];
}

const initialSnapshot: GameSnapshot = {
  phase: 'title',
  heroHp: 100,
  maxHeroHp: 100,
  activeEnemies: STARTING_ENEMY_KINDS.length,
  totalEnemies: STARTING_ENEMY_KINDS.length,
  defeatedEnemies: 0,
  score: 0,
  grappleSecondsLeft: 0,
  escapeProgress: 0,
  defeatSecondsLeft: 0,
  soundEnabled: true,
  roxyChallengeElapsed: 0,
  ebonyVictoryActive: false,
  karateOfferOpponent: null,
  karateSceneActive: false,
};

type OpponentKind = EnemyKind | 'ebony';

function createFightLineup(config: FightConfig): OpponentKind[] {
  const counts: Record<OpponentKind, number> = {
    amazon: config.amazonas,
    ebony: config.ebony,
    ninja: config.ninjas,
    roxy: config.roxy,
    karateBlonde: config.karateBlonde,
    karateEbony: config.karateEbony,
  };
  if (Object.values(counts).some((count) => !Number.isSafeInteger(count) || count < 0)) {
    throw new RangeError('As quantidades de adversárias devem ser números inteiros não negativos.');
  }
  if (counts.amazon === 5 && counts.ninja === 3 && counts.roxy === 1 && counts.ebony === 0 &&
      counts.karateBlonde === 0 && counts.karateEbony === 0) {
    return [...STARTING_ENEMY_KINDS];
  }

  const lineup: OpponentKind[] = [];
  const order: OpponentKind[] = [
    'amazon', 'ebony', 'ninja', 'roxy', 'karateBlonde', 'karateEbony',
  ];
  while (order.some((kind) => counts[kind] > 0)) {
    for (const kind of order) {
      if (counts[kind] > 0) {
        lineup.push(kind);
        counts[kind] -= 1;
      }
    }
  }
  return lineup;
}

function createEnemy(id: number, index: number, opponent: OpponentKind, lineupSize: number): Enemy {
  const kind = opponent === 'ebony' ? 'amazon' : opponent;
  return {
    id,
    kind,
    ebony: opponent === 'ebony',
    stride: index * 1.4,
    x: 92 + index * ((WIDTH - 184) / Math.max(1, lineupSize - 1)),
    y: 475 + ((index * 29) % 55),
    vx: 0,
    vy: 0,
    hp: 3,
    active: true,
    direction: -1,
    state: 'idle',
    stateTimer: 0,
    attackPoseIndex: index % 3,
    attackCooldown: 1.3 + (index % 9) * 0.32,
    respawnAt: 0,
    hue: kind === 'amazon' && index > 0 ? ((index * 19) % 41) - 20 : 0,
  };
}

function createWorld(
  enemyLineup: readonly OpponentKind[] = STARTING_ENEMY_KINDS,
  fightConfig: FightConfig = DEFAULT_FIGHT_CONFIG,
): World {
  return {
    phase: 'title',
    defeatKind: null,
    fightConfig: { ...fightConfig },
    ebonyElapsed: 0,
    ebonyHitFrame: -1,
    ebonyPartnerId: null,
    isGrappleActive: false,
    heroX: 175,
    heroY: 479,
    heroHp: 100,
    facing: 1,
    heroAction: 'idle',
    actionTimer: 0,
    jumpOffset: 0,
    jumpVelocity: 0,
  heroVelocityX: 0,
  heroVelocityY: 0,
    heroHitCooldown: 0,
    score: 0,
    defeatedEnemies: 0,
    enemyLineup: [...enemyLineup],
    enemies: enemyLineup.map((kind, index) => createEnemy(index + 1, index, kind, enemyLineup.length)),
    currentGrappler: null,
    grappleSecondsLeft: 0,
    escapeProgress: 0,
    defeatSecondsLeft: 0,
    defeatStartHp: 100,
    ninjaFootsmotherElapsed: 0,
    roxyDefeatElapsed: 0,
    roxyDialoguePlayed: false,
    karateSequence: null,
    karateDefeatElapsed: 0,
    footstepTimer: 0,
    soundEnabled: true,
    sound: {
      context: null,
      enabled: true,
      clips: {},
      active: new Set<HTMLAudioElement>(),
      lastPlayed: {},
      lastNinjaKiai: -Infinity,
      lastKarateKiai: { blonde: -Infinity, ebony: -Infinity },
    },
    particles: [],
    smokeTimer: 0,
    heartTimer: 0,
    struggleVoiceTimer: 0,
    nextStruggleBreath: false,
    randomSeed: 3917,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function random(world: World) {
  world.randomSeed = (world.randomSeed * 16807) % 2147483647;
  return (world.randomSeed - 1) / 2147483646;
}

function publishSnapshot(world: World): GameSnapshot {
  return {
    phase: world.phase,
    heroHp: Math.max(0, Math.ceil(world.heroHp)),
    maxHeroHp: 100,
    activeEnemies: world.enemies.filter((amazon) => amazon.hp > 0 && amazon.active)
      .length,
    totalEnemies: world.enemies.length,
    defeatedEnemies: world.defeatedEnemies,
    score: world.score,
    grappleSecondsLeft: Math.max(0, world.grappleSecondsLeft),
    escapeProgress: world.escapeProgress,
    defeatSecondsLeft: Math.max(0, world.defeatSecondsLeft),
    soundEnabled: world.soundEnabled,
    roxyChallengeElapsed: world.phase === STATE_ROXY_CHALLENGE ? world.roxyDefeatElapsed : 0,
    ebonyVictoryActive: world.defeatKind === 'ebony-victory',
    karateOfferOpponent: world.phase === STATE_KARATE_OFFER
      ? world.karateSequence ?? 'blonde'
      : null,
    karateSceneActive: world.phase === STATE_KARATE_CHALLENGE ||
      (world.phase === 'game-over' && world.defeatKind === 'karate-victory'),
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load game image: ${src}`));
    image.src = src;
  });
}

function removeCheckerboard(image: HTMLImageElement, combinedPose = false) {
  const canvas = document.createElement('canvas');
  // Frame coordinates use the reference sheet's 1024×768 logical grid.
  // Uploaded originals are higher-resolution JPEGs despite their .png names.
  canvas.width = 1024;
  canvas.height = 768;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = frame.data;
  const pixelCount = canvas.width * canvas.height;
  const checkerCandidate = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);

  for (let i = 0, pixel = 0; i < pixels.length; i += 4, pixel += 1) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const channelRange = Math.max(r, g, b) - Math.min(r, g, b);
    // Only consider neutral checker tones; flood-fill below protects gray
    // details inside sprites unless they connect to the sheet's outer edge.
    if (channelRange < (combinedPose ? 24 : 9) && Math.max(r, g, b) > 18) {
      if (combinedPose) pixels[i + 3] = 0;
      else checkerCandidate[pixel] = 1;
    }
  }
  // The combined illustrations enclose patches of checkerboard between the
  // two bodies, so their background cannot be reached from the sheet edge.
  if (combinedPose) {
    repairForegroundMask(pixels, canvas.width, canvas.height);
    context.putImageData(frame, 0, 0);
    return canvas;
  }

  let tail = 0;
  const addIfChecker = (pixel: number) => {
    if (checkerCandidate[pixel] && !visited[pixel]) {
      visited[pixel] = 1;
      queue[tail++] = pixel;
    }
  };
  for (let x = 0; x < canvas.width; x += 1) {
    addIfChecker(x);
    addIfChecker((canvas.height - 1) * canvas.width + x);
  }
  for (let y = 1; y < canvas.height - 1; y += 1) {
    addIfChecker(y * canvas.width);
    addIfChecker(y * canvas.width + canvas.width - 1);
  }
  for (let head = 0; head < tail; head += 1) {
    const pixel = queue[head];
    const x = pixel % canvas.width;
    if (x > 0) addIfChecker(pixel - 1);
    if (x + 1 < canvas.width) addIfChecker(pixel + 1);
    if (pixel >= canvas.width) addIfChecker(pixel - canvas.width);
    if (pixel + canvas.width < pixelCount) addIfChecker(pixel + canvas.width);
    pixels[pixel * 4 + 3] = 0;
  }
  context.putImageData(frame, 0, 0);
  return canvas;
}

function removeRoxyCheckerboard(image: HTMLImageElement, frames: SpriteRect[]) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const full = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = full.data;
  for (let index = 0; index < canvas.width * canvas.height; index += 1) {
    const pixel = index * 4;
    const red = pixels[pixel];
    const green = pixels[pixel + 1];
    const blue = pixels[pixel + 2];
    const range = Math.max(red, green, blue) - Math.min(red, green, blue);
    // Roxy's sheets use a teal-black and desaturated green-gray checker.
    // Keep purple hair, white clothing, skin and brown trousers outside this key.
    const darkTile = red < 42 && green > red + 3 && blue > red + 3 &&
      green < 52 && blue < 52;
    const lightTile = range < 25 &&
      (red + green + blue) / 3 > 45 && (red + green + blue) / 3 < 112;
    if (darkTile || lightTile) pixels[pixel + 3] = 0;
  }
  context.putImageData(full, 0, 0);
  for (const rect of frames) {
    const crop = context.getImageData(rect.x, rect.y, rect.w, rect.h);
    removeCheckerFragments(crop.data, rect.w, rect.h);
    repairForegroundMask(crop.data, rect.w, rect.h, 700);
    context.putImageData(crop, rect.x, rect.y);
  }
  return canvas;
}

function removeNinjaCheckerboard(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = frame.data;
  const colors = [[0, 0, 0, 0], [0, 0, 0, 0]];

  // This sheet's checker is warm-tinted; estimate its dark and light tones
  // from the clean top edge instead of treating every gray pixel as background.
  for (let y = 2; y < 8; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const pixel = (y * canvas.width + x) * 4;
      const brightness =
        (pixels[pixel] + pixels[pixel + 1] + pixels[pixel + 2]) / 3;
      const tone = colors[brightness < 52 ? 0 : 1];
      tone[0] += pixels[pixel];
      tone[1] += pixels[pixel + 1];
      tone[2] += pixels[pixel + 2];
      tone[3] += 1;
    }
  }
  for (const tone of colors) {
    const count = tone[3] || 1;
    tone[0] /= count;
    tone[1] /= count;
    tone[2] /= count;
  }
  const midpoint = colors[0].slice(0, 3).map((value, channel) =>
    (value + colors[1][channel]) / 2,
  );

  const pixelCount = canvas.width * canvas.height;
  const checkerMask = new Uint8Array(pixelCount);
  const foregroundSeed = new Uint8Array(pixelCount);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = y * canvas.width + x;
      const pixel = index * 4;
      const red = pixels[pixel];
      const green = pixels[pixel + 1];
      const blue = pixels[pixel + 2];
      const warmCheckerTone =
        red - green >= 2 &&
        blue - green <= 7 &&
        red - blue >= 0;
      const darkDifference = Math.max(
        Math.abs(red - colors[0][0]),
        Math.abs(green - colors[0][1]),
        Math.abs(blue - colors[0][2]),
      );
      const lightDifference = Math.max(
        Math.abs(red - colors[1][0]),
        Math.abs(green - colors[1][1]),
        Math.abs(blue - colors[1][2]),
      );
      const midpointDifference = Math.max(
        Math.abs(red - midpoint[0]),
        Math.abs(green - midpoint[1]),
        Math.abs(blue - midpoint[2]),
      );
      const matchesChecker =
        warmCheckerTone &&
        (darkDifference <= 14 ||
          lightDifference <= 14 ||
          midpointDifference <= 12);
      checkerMask[index] = matchesChecker ? 1 : 0;
      foregroundSeed[index] =
        !matchesChecker &&
        (Math.max(red, green, blue) - Math.min(red, green, blue) > 20 ||
          blue > red + 3 ||
          green > blue + 7 ||
          (Math.min(red, green, blue) > 150 &&
            Math.max(red, green, blue) - Math.min(red, green, blue) < 20))
          ? 1
          : 0;
    }
  }

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = y * canvas.width + x;
      if (!checkerMask[index]) continue;
      let protectsForeground = false;
      for (let dy = -2; dy <= 2 && !protectsForeground; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const neighborX = x + dx;
          const neighborY = y + dy;
          if (
            neighborX >= 0 &&
            neighborX < canvas.width &&
            neighborY >= 0 &&
            neighborY < canvas.height &&
            foregroundSeed[neighborY * canvas.width + neighborX]
          ) {
            protectsForeground = true;
            break;
          }
        }
      }
      if (!protectsForeground) pixels[index * 4 + 3] = 0;
    }
  }

  context.putImageData(frame, 0, 0);
  return canvas;
}

function removeFootsmotherCheckerboard(
  image: HTMLImageElement,
  includeBottomMargin = true,
) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = frame.data;
  const tones = [
    { red: 0, green: 0, blue: 0, count: 0 },
    { red: 0, green: 0, blue: 0, count: 0 },
  ];
  const sampleRows = Array.from({ length: 7 }, (_, index) => index + 2);
  if (includeBottomMargin) {
    sampleRows.push(...Array.from(
      { length: 7 },
      (_, index) => canvas.height - 9 + index,
    ));
  }
  for (const y of sampleRows) {
    for (let x = 0; x < canvas.width; x += 1) {
      const pixel = (y * canvas.width + x) * 4;
      const red = pixels[pixel];
      const green = pixels[pixel + 1];
      const blue = pixels[pixel + 2];
      if (Math.max(red, green, blue) - Math.min(red, green, blue) > 24) continue;
      const tone = tones[(red + green + blue) / 3 < 52 ? 0 : 1];
      tone.red += red;
      tone.green += green;
      tone.blue += blue;
      tone.count += 1;
    }
  }
  for (const tone of tones) {
    const count = Math.max(1, tone.count);
    tone.red /= count;
    tone.green /= count;
    tone.blue /= count;
  }
  const midpoint = tones[0] && tones[1]
    ? [
      (tones[0].red + tones[1].red) / 2,
      (tones[0].green + tones[1].green) / 2,
      (tones[0].blue + tones[1].blue) / 2,
    ]
    : [52, 47, 42];

  const pixelCount = canvas.width * canvas.height;
  const checkerMask = new Uint8Array(pixelCount);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = y * canvas.width + x;
      const pixel = index * 4;
      const red = pixels[pixel];
      const green = pixels[pixel + 1];
      const blue = pixels[pixel + 2];
      const warmCheckerTone =
        red - green >= 2 &&
        blue - green <= 7 &&
        red - blue >= 0;
      const distanceFromTone = (tone: typeof tones[number]) => Math.max(
        Math.abs(red - tone.red),
        Math.abs(green - tone.green),
        Math.abs(blue - tone.blue),
      );
      const midpointDifference = Math.max(
        Math.abs(red - midpoint[0]),
        Math.abs(green - midpoint[1]),
        Math.abs(blue - midpoint[2]),
      );
      const matchesChecker = warmCheckerTone && (
        distanceFromTone(tones[0]) <= 14 ||
        distanceFromTone(tones[1]) <= 14 ||
        midpointDifference <= 12
      );
      checkerMask[index] = matchesChecker ? 1 : 0;
    }
  }

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = y * canvas.width + x;
      if (!checkerMask[index]) continue;
      pixels[index * 4 + 3] = 0;
    }
  }

  context.putImageData(frame, 0, 0);
  // Color keying can also remove warm shadows from faces, boots and clothing.
  // Repair each paired pose independently, retaining both characters and effects.
  const poses = includeBottomMargin
    ? NINJA_FOOTSMOTHER_FRAMES : NINJA_FOOTSMOTHER_ENDING_FRAMES;
  for (const pose of poses) {
    const cropped = context.getImageData(pose.x, pose.y, pose.w, pose.h);
    removeCheckerFragments(cropped.data, pose.w, pose.h);
    repairForegroundMask(cropped.data, pose.w, pose.h, 700);
    context.putImageData(cropped, pose.x, pose.y);
  }
  if (!includeBottomMargin) {
    // The uploaded ending strip includes a non-artwork footer below the grid.
    context.clearRect(0, 200, canvas.width, canvas.height - 200);
  }
  return canvas;
}

function getVisibleBounds(image: HTMLCanvasElement, rect: SpriteRect): SpriteRect {
  let cache = spriteBoundsCache.get(image);
  if (!cache) {
    cache = new Map();
    spriteBoundsCache.set(image, cache);
  }
  const key = `${rect.x},${rect.y},${rect.w},${rect.h}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const fullFrameBounds = { x: 0, y: 0, w: rect.w, h: rect.h };
  // Bounds are local to the crop, never absolute atlas coordinates.
  // Combined grapple frames must retain both characters.
  if (rect.w * rect.h > 50000) {
    cache.set(key, fullFrameBounds);
    return fullFrameBounds;
  }

  const context = image.getContext('2d', { willReadFrequently: true });
  if (!context) return fullFrameBounds;
  const frame = context.getImageData(rect.x, rect.y, rect.w, rect.h);
  const pixels = frame.data;
  const length = rect.w * rect.h;
  const visited = new Uint8Array(length);
  const queue = new Uint32Array(length);
  let largest: SpriteRect = { x: 0, y: 0, w: rect.w, h: rect.h };
  let largestArea = 0;
  let largestPixels: Uint32Array | null = null;

  for (let start = 0; start < length; start += 1) {
    if (visited[start] || pixels[start * 4 + 3] < 32) continue;
    let head = 0;
    let tail = 0;
    let minX = rect.w;
    let minY = rect.h;
    let maxX = 0;
    let maxY = 0;
    visited[start] = 1;
    queue[tail++] = start;

    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % rect.w;
      const y = Math.floor(pixel / rect.w);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const visit = (next: number) => {
        if (!visited[next] && pixels[next * 4 + 3] >= 32) {
          visited[next] = 1;
          queue[tail++] = next;
        }
      };
      if (x > 0) visit(pixel - 1);
      if (x + 1 < rect.w) visit(pixel + 1);
      if (y > 0) visit(pixel - rect.w);
      if (y + 1 < rect.h) visit(pixel + rect.w);
    }

    if (tail > largestArea) {
      largestArea = tail;
      largest = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
      largestPixels = queue.slice(0, tail);
    }
  }

  if (largestArea === 0) {
    cache.set(key, fullFrameBounds);
    return fullFrameBounds;
  }
  // Irregular sheets contain neighboring limbs inside a pose's bounding box.
  // Keep the actual connected character, not every pixel in that rectangle.
  const isolated = document.createElement('canvas');
  isolated.width = rect.w;
  isolated.height = rect.h;
  const isolatedContext = isolated.getContext('2d');
  if (isolatedContext && largestPixels) {
    const keep = new Uint8Array(length);
    largestPixels.forEach((pixel) => { keep[pixel] = 1; });
    for (let pixel = 0; pixel < length; pixel += 1) {
      if (!keep[pixel]) pixels[pixel * 4 + 3] = 0;
    }
    isolatedContext.putImageData(frame, 0, 0);
    let frames = spriteFrameCache.get(image);
    if (!frames) {
      frames = new Map();
      spriteFrameCache.set(image, frames);
    }
    frames.set(key, isolated);
  }
  cache.set(key, largest);
  return largest;
}

function getCompositeVisibleBounds(image: HTMLCanvasElement, rect: SpriteRect): SpriteRect {
  let cache = compositeBoundsCache.get(image);
  if (!cache) {
    cache = new Map();
    compositeBoundsCache.set(image, cache);
  }
  const key = `${rect.x},${rect.y},${rect.w},${rect.h}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const context = image.getContext('2d', { willReadFrequently: true });
  if (!context) return { x: 0, y: 0, w: rect.w, h: rect.h };
  const pixels = context.getImageData(rect.x, rect.y, rect.w, rect.h).data;
  let minX = rect.w;
  let minY = rect.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rect.h; y += 1) {
    for (let x = 0; x < rect.w; x += 1) {
      if (pixels[(y * rect.w + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const visible = maxX < 0
    ? { x: 0, y: 0, w: rect.w, h: rect.h }
    : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  cache.set(key, visible);
  return visible;
}

function getKarateVisibleBounds(image: HTMLCanvasElement, rect: SpriteRect): SpriteRect {
  let cache = karateBoundsCache.get(image);
  if (!cache) {
    cache = new Map();
    karateBoundsCache.set(image, cache);
  }
  const key = `${rect.x},${rect.y},${rect.w},${rect.h}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const context = image.getContext('2d', { willReadFrequently: true });
  if (!context) return { x: 0, y: 0, w: rect.w, h: rect.h };
  const pixels = context.getImageData(rect.x, rect.y, rect.w, rect.h).data;
  let minX = rect.w;
  let minY = rect.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rect.h; y += 1) {
    for (let x = 0; x < rect.w; x += 1) {
      if (pixels[(y * rect.w + x) * 4 + 3] < 32) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const bounds = maxX < 0
    ? { x: 0, y: 0, w: rect.w, h: rect.h }
    : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  cache.set(key, bounds);
  return bounds;
}

function ensureSound(world: World) {
  if (!world.sound.enabled) return null;
  if (world.sound.context) {
    if (world.sound.context.state === 'suspended') {
      void world.sound.context.resume();
    }
    return world.sound.context;
  }

  const AudioContextClass =
    window.AudioContext ??
    (
      window as Window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!AudioContextClass) return null;
  world.sound.context = new AudioContextClass();
  return world.sound.context;
}

function playSweep(
  world: World,
  startHz: number,
  endHz: number,
  duration: number,
  volume = 0.16,
  type: OscillatorType = 'sine',
) {
  const context = ensureSound(world);
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startHz, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endHz),
    context.currentTime + duration,
  );
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime + duration,
  );
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playClip(world: World, cue: SoundCue, volume = 1, cooldownMs = 0) {
  if (!world.sound.enabled) return;
  const template = world.sound.clips[cue];
  if (!template) return;
  const now = performance.now();
  const lastPlayed = world.sound.lastPlayed[cue] ?? -Infinity;
  if (now - lastPlayed < cooldownMs) return;
  world.sound.lastPlayed[cue] = now;

  const clip = template.cloneNode(true) as HTMLAudioElement;
  clip.volume = clamp(volume, 0, 1);
  world.sound.active.add(clip);
  const release = () => world.sound.active.delete(clip);
  clip.addEventListener('ended', release, { once: true });
  clip.addEventListener('error', release, { once: true });
  void clip.play().catch(release);
}

function playNinjaKiai(world: World) {
  const context = ensureSound(world);
  if (!context) return;
  const now = context.currentTime;
  if ((now - world.sound.lastNinjaKiai) * 1000 < 420) return;
  world.sound.lastNinjaKiai = now;

  // A short formant-shaped "yā!" gives the existing kick impact a clear,
  // voice-like Kunoichi battle cry without another network-loaded sound.
  const duration = 0.34;
  const base = 170 + random(world) * 40;
  const voice = context.createOscillator();
  const envelope = context.createGain();
  voice.type = 'sawtooth';
  voice.frequency.setValueAtTime(base, now);
  voice.frequency.linearRampToValueAtTime(base * 1.7, now + 0.09);
  voice.frequency.linearRampToValueAtTime(base * 1.18, now + duration);
  envelope.gain.setValueAtTime(0.001, now);
  envelope.gain.linearRampToValueAtTime(0.12, now + 0.035);
  envelope.gain.setValueAtTime(0.095, now + 0.16);
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const iVowel = context.createBiquadFilter();
  iVowel.type = 'bandpass';
  iVowel.Q.value = 2.4;
  iVowel.frequency.setValueAtTime(340, now);
  iVowel.frequency.linearRampToValueAtTime(760, now + 0.11);
  iVowel.frequency.linearRampToValueAtTime(650, now + duration);

  const openVowel = context.createBiquadFilter();
  openVowel.type = 'bandpass';
  openVowel.Q.value = 1.7;
  openVowel.frequency.setValueAtTime(2380, now);
  openVowel.frequency.linearRampToValueAtTime(1320, now + 0.13);

  const upperHarmonics = context.createBiquadFilter();
  upperHarmonics.type = 'bandpass';
  upperHarmonics.Q.value = 1.2;
  upperHarmonics.frequency.value = 2900;

  const iGain = context.createGain();
  const openGain = context.createGain();
  const upperGain = context.createGain();
  iGain.gain.value = 0.65;
  openGain.gain.value = 0.32;
  upperGain.gain.value = 0.11;

  voice.connect(iVowel);
  voice.connect(openVowel);
  voice.connect(upperHarmonics);
  iVowel.connect(iGain);
  openVowel.connect(openGain);
  upperHarmonics.connect(upperGain);
  iGain.connect(envelope);
  openGain.connect(envelope);
  upperGain.connect(envelope);
  envelope.connect(context.destination);
  voice.start(now);
  voice.stop(now + duration + 0.02);
}

function playKarateAttackVoice(
  world: World,
  fighter: 'blonde' | 'ebony',
  volume: number,
) {
  const context = ensureSound(world);
  if (!context) return;
  const now = context.currentTime;
  if ((now - world.sound.lastKarateKiai[fighter]) * 1000 < 180) return;
  world.sound.lastKarateKiai[fighter] = now;

  // Distinct synthesized shouts: Blonde is brighter and higher, Ebony is
  // lower and rougher. They use the normal AudioContext mute state and a
  // deliberately restrained gain so the voices stay beneath the impacts.
  const blonde = fighter === 'blonde';
  const duration = blonde ? 0.29 : 0.32;
  const base = blonde ? 218 + random(world) * 24 : 154 + random(world) * 18;
  const voice = context.createOscillator();
  const envelope = context.createGain();
  voice.type = blonde ? 'triangle' : 'sawtooth';
  voice.frequency.setValueAtTime(base, now);
  voice.frequency.linearRampToValueAtTime(base * (blonde ? 1.85 : 1.55), now + 0.075);
  voice.frequency.linearRampToValueAtTime(base * (blonde ? 1.28 : 1.12), now + duration);
  envelope.gain.setValueAtTime(0.001, now);
  envelope.gain.linearRampToValueAtTime(volume, now + 0.025);
  envelope.gain.setValueAtTime(volume * 0.78, now + duration * 0.42);
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const firstFormant = context.createBiquadFilter();
  firstFormant.type = 'bandpass';
  firstFormant.Q.value = blonde ? 2.2 : 2.8;
  firstFormant.frequency.setValueAtTime(blonde ? 470 : 390, now);
  firstFormant.frequency.linearRampToValueAtTime(blonde ? 820 : 650, now + 0.1);
  firstFormant.frequency.linearRampToValueAtTime(blonde ? 690 : 530, now + duration);

  const secondFormant = context.createBiquadFilter();
  secondFormant.type = 'bandpass';
  secondFormant.Q.value = blonde ? 1.8 : 2.1;
  secondFormant.frequency.setValueAtTime(blonde ? 1980 : 1250, now);
  secondFormant.frequency.linearRampToValueAtTime(blonde ? 1450 : 980, now + 0.13);

  const firstGain = context.createGain();
  const secondGain = context.createGain();
  firstGain.gain.value = blonde ? 0.72 : 0.82;
  secondGain.gain.value = blonde ? 0.38 : 0.27;
  voice.connect(firstFormant);
  voice.connect(secondFormant);
  firstFormant.connect(firstGain);
  secondFormant.connect(secondGain);
  firstGain.connect(envelope);
  secondGain.connect(envelope);
  envelope.connect(context.destination);
  voice.start(now);
  voice.stop(now + duration + 0.02);
}

function stopClips(world: World) {
  for (const clip of world.sound.active) {
    clip.pause();
    clip.currentTime = 0;
  }
  world.sound.active.clear();
}

function playHit(world: World) {
  const context = ensureSound(world);
  if (!context) return;
  const length = Math.floor(context.sampleRate * 0.12);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = (random(world) * 2 - 1) * (1 - i / samples.length);
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  noise.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = 1500;
  gain.gain.value = 0.22;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  noise.start();
  playSweep(world, 180, 48, 0.16, 0.12, 'triangle');
}

function playStomp(world: World) {
  playSweep(world, 100, 25, 0.23, 0.18, 'sine');
}

function spawnParticle(
  world: World,
  kind: Particle['kind'],
  offsetX = world.facing * 65,
  offsetY = -39,
) {
  const heroX = clamp(world.heroX, 110, WIDTH - 110) + offsetX;
  const heroY = world.heroY + offsetY;
  world.particles.push({
    x: heroX + (random(world) - 0.5) * 34,
    y: heroY + (random(world) - 0.5) * 10,
    vx: (random(world) - 0.4) * 22,
    vy: kind === 'heart' ? -38 - random(world) * 18 : -17 - random(world) * 11,
    age: 0,
    life: kind === 'heart' ? 1.65 : 1.2,
    kind,
    size: kind === 'heart' ? 6 + random(world) * 6 : 8 + random(world) * 8,
  });
}

function drawHeart(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.beginPath();
  context.moveTo(x, y + size * 0.85);
  context.bezierCurveTo(x - size * 1.2, y + size * 0.2, x - size * 0.7, y - size * 0.45, x, y);
  context.bezierCurveTo(x + size * 0.7, y - size * 0.45, x + size * 1.2, y + size * 0.2, x, y + size * 0.85);
  context.fill();
}

function drawAtlasSprite(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement | null,
  rect: SpriteRect,
  x: number,
  groundY: number,
  drawW: number,
  drawH: number,
  flipped = false,
  hue = 0,
  lift = 0,
  groundOffset = 0,
) {
  if (!image) {
    context.fillStyle = hue ? '#a66a3f' : '#68734a';
    context.fillRect(x - drawW / 2, groundY - drawH - lift + groundOffset, drawW, drawH);
    return;
  }

  context.save();
  if (hue) context.filter = `hue-rotate(${hue}deg) saturate(0.88)`;
  if (flipped) {
    context.translate(x, 0);
    context.scale(-1, 1);
    context.translate(-x, 0);
  }
  const visible = getVisibleBounds(image, rect);
  const isolated = spriteFrameCache.get(image)?.get(`${rect.x},${rect.y},${rect.w},${rect.h}`);
  const scaleX = drawW / rect.w;
  const scaleY = drawH / rect.h;
  const visibleW = visible.w * scaleX;
  const visibleH = visible.h * scaleY;
  const destinationX = x - drawW / 2 + visible.x * scaleX;
  const destinationY = groundY - lift - visibleH + groundOffset;
  context.drawImage(
    isolated ?? image,
    (isolated ? 0 : rect.x) + visible.x,
    (isolated ? 0 : rect.y) + visible.y,
    visible.w,
    visible.h,
    destinationX,
    destinationY,
    visibleW,
    visibleH,
  );
  const polish = getRedToenailFrame(image, rect, isolated);
  if (polish) {
    // Outfit palette variations must never shift the requested red polish.
    context.filter = 'none';
    context.drawImage(polish, visible.x, visible.y, visible.w, visible.h,
      destinationX, destinationY, visibleW, visibleH);
  }
  context.restore();
}

function drawFootsmotherFrame(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement | null,
  frame: SpriteRect,
  heroX: number,
  groundY: number,
  flipped: boolean,
) {
  if (!image) return;
  const visible = getCompositeVisibleBounds(image, frame);
  const endingStrip = frame.w < 300;
  // Keep body scale fixed, but seat each cleaned pose on its actual bottom edge.
  // A sheet-wide guessed baseline makes shorter poses hover between frames.
  const scale = 164 / (endingStrip ? 140 : 190);
  const heroineAnchor = endingStrip ? 187 : 286;

  context.save();
  if (flipped) {
    context.translate(heroX, 0);
    context.scale(-1, 1);
    context.translate(-heroX, 0);
  }
  const seatCenter = endingStrip ? 112 : 170;
  context.fillStyle = 'rgba(7, 13, 8, 0.26)';
  context.beginPath();
  context.ellipse(
    heroX + (seatCenter - heroineAnchor) * scale,
    groundY + 7,
    110 * scale,
    6,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.drawImage(
    image,
    frame.x + visible.x,
    frame.y + visible.y,
    visible.w,
    visible.h,
    heroX + (visible.x - heroineAnchor) * scale,
    groundY + 7 - visible.h * scale,
    visible.w * scale,
    visible.h * scale,
  );
  context.restore();
}

function drawRoxyDefeatFrame(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement | null,
  frame: SpriteRect,
  centerX: number,
  groundY: number,
  targetHeight: number,
  flipped: boolean,
) {
  if (!image) return;
  const visible = getCompositeVisibleBounds(image, frame);
  const scale = targetHeight / frame.h;
  context.save();
  if (flipped) {
    context.translate(centerX, 0);
    context.scale(-1, 1);
    context.translate(-centerX, 0);
  }
  context.fillStyle = 'rgba(7, 13, 8, 0.25)';
  context.beginPath();
  context.ellipse(centerX, groundY + 7, targetHeight * 0.48, 6, 0, 0, Math.PI * 2);
  context.fill();
  context.drawImage(
    image,
    frame.x + visible.x,
    frame.y + visible.y,
    visible.w,
    visible.h,
    centerX - frame.w * scale / 2 + visible.x * scale,
    groundY + 7 - visible.h * scale,
    visible.w * scale,
    visible.h * scale,
  );
  context.restore();
}

function drawKarateSequenceFrame(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement | null,
  frame: SpriteRect,
  centerX: number,
  groundY: number,
  targetHeight: number,
  flipped: boolean,
) {
  if (!image) return;
  const visible = getCompositeVisibleBounds(image, frame);
  const scale = targetHeight / Math.max(1, visible.h);
  context.save();
  if (flipped) {
    context.translate(centerX, 0);
    context.scale(-1, 1);
    context.translate(-centerX, 0);
  }
  context.fillStyle = 'rgba(7, 13, 8, 0.26)';
  context.beginPath();
  context.ellipse(centerX, groundY + 7, targetHeight * 0.52, 7, 0, 0, Math.PI * 2);
  context.fill();
  context.drawImage(
    image,
    frame.x + visible.x,
    frame.y + visible.y,
    visible.w,
    visible.h,
    centerX - visible.w * scale / 2,
    groundY + 7 - visible.h * scale,
    visible.w * scale,
    visible.h * scale,
  );
  context.restore();
}

function drawKarateBaseSprite(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement | null,
  frame: SpriteRect,
  centerX: number,
  groundY: number,
  targetHeight: number,
  flipped: boolean,
  lift = 0,
  groundOffset = 7,
) {
  if (!image) return;
  const visible = getKarateVisibleBounds(image, frame);
  const scaleX = targetHeight / frame.h;
  const scaleY = scaleX;
  context.save();
  if (flipped) {
    context.translate(centerX, 0);
    context.scale(-1, 1);
    context.translate(-centerX, 0);
  }
  context.drawImage(
    image,
    frame.x + visible.x,
    frame.y + visible.y,
    visible.w,
    visible.h,
    centerX - frame.w * scaleX / 2 + visible.x * scaleX,
    groundY - lift - visible.h * scaleY + groundOffset,
    visible.w * scaleX,
    visible.h * scaleY,
  );
  context.restore();
}

function enemyAnimationFrame(enemy: Enemy, now: number): SpriteRect {
  if (enemy.ebony) {
    if (enemy.state === 'walk') {
      const frameIndex = WALK_CYCLE[Math.floor(now / 175 + enemy.id * 0.67) % WALK_CYCLE.length];
      return EBONY_WALK[frameIndex];
    }
    if (enemy.state === 'run') return EBONY_RUN[Math.floor(now / 145 + enemy.id) % EBONY_RUN.length];
    if (enemy.state === 'attack') return EBONY_ATTACKS[enemy.attackPoseIndex % EBONY_ATTACKS.length];
    if (enemy.state === 'hurt') return EBONY_FRAMES.hurt;
    if (enemy.state === 'down') return EBONY_FRAMES.down;
    return EBONY_FRAMES.idle;
  }
  if (enemy.kind === 'karateBlonde' || enemy.kind === 'karateEbony') {
    const karate = enemy.kind === 'karateBlonde' ? KARATE_BLONDE : KARATE_EBONY;
    const walkCycle = enemy.kind === 'karateBlonde' ? KARATE_BLONDE_WALK : KARATE_EBONY_WALK;
    if (enemy.state === 'walk' || enemy.state === 'run') {
      const speed = enemy.state === 'run' ? 104 : 150;
      return walkCycle[Math.floor(now / speed + enemy.id * 0.61) % walkCycle.length];
    }
    if (enemy.state === 'attack') {
      return ATTACK_FRAMES[enemy.kind][enemy.attackPoseIndex % ATTACK_FRAMES[enemy.kind].length];
    }
    if (enemy.state === 'hurt') return karate.hurt;
    if (enemy.state === 'down') return karate.hurt;
    return karate.idle;
  }
  const frames = ENEMY_FRAMES[enemy.kind];
  if (enemy.state === 'walk') {
    const cycleIndex = Math.floor(now / 175 + enemy.id * 0.67) % WALK_CYCLE.length;
    const frameIndex = WALK_CYCLE[cycleIndex];
    return enemy.kind === 'ninja'
      ? NINJA_WALK_FRAMES[frameIndex]
      : enemy.kind === 'amazon' ? AMAZON_WALK_FRAMES[frameIndex] : ROXY_FRAMES.walk;
  }
  if (enemy.state === 'run') {
    return enemy.kind === 'ninja'
      ? NINJA_RUN_FRAMES[Math.floor(now / 145 + enemy.id) % NINJA_RUN_FRAMES.length]
      : frames.run;
  }
  if (enemy.state === 'attack') {
    return ATTACK_FRAMES[enemy.kind][enemy.attackPoseIndex % ATTACK_FRAMES[enemy.kind].length];
  }
  if (enemy.state === 'hurt') return frames.hurt;
  if (enemy.state === 'down') return frames.down;
  return frames.idle;
}

function drawEnemySprite(
  context: CanvasRenderingContext2D,
  atlas: SpriteAtlas,
  enemy: Enemy,
  frame: SpriteRect,
  height = 190,
  lift = 0,
  groundOffset = 7,
  anchorX = enemy.x,
) {
  if (enemy.kind === 'roxy') {
    drawRoxyFrame(context, atlas.roxy, frame as RoxyFrame,
      enemy.x, enemy.y, enemy.direction < 0, enemy.state, enemy.stride, lift);
    return;
  }
  if (enemy.kind === 'karateBlonde' || enemy.kind === 'karateEbony') {
    drawKarateBaseSprite(
      context,
      atlas[enemy.kind],
      frame,
      anchorX,
      enemy.y,
      height,
      enemy.direction < 0,
      lift,
      groundOffset,
    );
    return;
  }
  if (enemy.ebony) {
    drawEbonyFrame(context, atlas.ebony, frame as EbonyFrame,
      anchorX, enemy.y, enemy.direction < 0, lift, undefined,
      height >= 180 ? 1.04 : 1);
    return;
  }
  const width = Math.max(126, (height * frame.w) / frame.h);
  drawAtlasSprite(
    context,
    atlas[enemy.kind],
    frame,
    anchorX,
    enemy.y,
    width,
    height,
    enemy.direction < 0,
    enemy.kind === 'amazon' ? enemy.hue : 0,
    lift,
    groundOffset,
  );
}

function drawParticle(context: CanvasRenderingContext2D, particle: Particle) {
  const progress = particle.age / particle.life;
  context.save();
  context.globalAlpha = Math.max(0, 1 - progress);
  if (particle.kind === 'heart') {
    context.fillStyle = '#ff7ecb';
    drawHeart(context, particle.x, particle.y, particle.size * (1 - progress * 0.25));
  } else {
    context.fillStyle = '#f28bc5';
    context.beginPath();
    context.ellipse(
      particle.x,
      particle.y,
      particle.size * (0.65 + progress * 0.4),
      particle.size * (0.45 + progress * 0.55),
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

function heroRect(world: World) {
  if (world.phase === 'group-defeat' || (world.phase === 'game-over' && world.defeatKind === 'group')) {
    return HERO_FRAMES.defeated;
  }
  if (world.phase === STATE_NINJA_FOOTSMOTHER ||
      (world.phase === 'game-over' && world.defeatKind === 'ninja-footsmother')) {
    return HERO_FRAMES.defeated;
  }
  if (world.phase === STATE_ROXY_SMOTHER ||
      (world.phase === 'game-over' && world.defeatKind === 'roxy-smother')) {
    return HERO_FRAMES.defeated;
  }
  if (world.phase === 'special-defeat' || (world.phase === 'game-over' && world.defeatKind === 'special')) return HERO_FRAMES.down;
  if (world.phase === 'grapple') return HERO_FRAMES.hurt;
  if (world.heroAction === 'hurt') return HERO_FRAMES.hurt;
  if (world.heroAction === 'punch') return HERO_FRAMES.punch;
  if (world.heroAction === 'kick') return HERO_FRAMES.kick;
  if (world.heroAction === 'jump') return HERO_FRAMES.jump;
  if (world.heroAction === 'run') return HERO_FRAMES.run;
  if (world.heroAction === 'walk') return HERO_FRAMES.walk;
  return HERO_FRAMES.idle;
}

function drawWorld(
  context: CanvasRenderingContext2D,
  world: World,
  atlas: SpriteAtlas,
  now: number,
) {
  context.setTransform(context.canvas.width / WIDTH, 0, 0, context.canvas.height / HEIGHT, 0, 0);
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.imageSmoothingEnabled = false;
  if (atlas.background) {
    context.drawImage(atlas.background, 0, 0, WIDTH, HEIGHT);
  } else {
    context.fillStyle = '#17352c';
    context.fillRect(0, 0, WIDTH, HEIGHT);
  }

  const floorTint = context.createLinearGradient(0, 408, 0, HEIGHT);
  floorTint.addColorStop(0, 'rgba(21, 38, 21, 0)');
  floorTint.addColorStop(1, 'rgba(19, 24, 12, .2)');
  context.fillStyle = floorTint;
  context.fillRect(0, 408, WIDTH, HEIGHT - 408);

  const ninjaFootsmotherSequence = world.phase === STATE_NINJA_FOOTSMOTHER ||
    (world.phase === 'game-over' && world.defeatKind === 'ninja-footsmother');
  const roxyVoluntarySequence = world.phase === STATE_ROXY_CHALLENGE;
  const roxySmotherSequence = world.phase === STATE_ROXY_SMOTHER ||
    (world.phase === 'game-over' && world.defeatKind === 'roxy-smother');
  const roxyDefeatSequence = roxyVoluntarySequence || roxySmotherSequence;
  const karateOfferSequence = world.phase === STATE_KARATE_OFFER;
  const karateDefeatSequence = world.phase === STATE_KARATE_CHALLENGE ||
    (world.phase === 'game-over' && world.defeatKind === 'karate-victory');
  if (karateOfferSequence) {
    const attacker = world.enemies.find((enemy) => enemy.id === world.currentGrappler);
    const groundY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
    drawAtlasSprite(
      context,
      atlas.hero,
      HERO_FRAMES.defeated,
      world.heroX,
      groundY,
      230,
      80,
      world.facing < 0,
    );
    if (attacker && (attacker.kind === 'karateBlonde' || attacker.kind === 'karateEbony')) {
      const attackerX = clamp(
        world.heroX + (attacker.direction === 1 ? -150 : 150),
        100,
        WIDTH - 100,
      );
      const idlePose = attacker.kind === 'karateEbony' ? KARATE_EBONY.idle : KARATE_BLONDE.idle;
      drawEnemySprite(context, atlas, attacker, idlePose, 205, 0, 7, attackerX);
    }
  } else if (karateDefeatSequence) {
    const sequence = world.karateSequence ?? 'blonde';
    const elapsed = world.phase === STATE_KARATE_CHALLENGE
      ? world.karateDefeatElapsed : KARATE_DEFEAT_DURATION;
    if (sequence === 'duo' && atlas.karateEbonyAttackOne) {
      const frames = karateDuoSequenceFrames(
        atlas.karateEbonyAttackOne.width,
        atlas.karateEbonyAttackOne.height,
      );
      const index = Math.min(frames.length - 1,
        Math.floor((elapsed / KARATE_DEFEAT_DURATION) * frames.length));
      drawKarateSequenceFrame(context, atlas.karateEbonyAttackOne,
        frames[Math.max(0, index)], WIDTH / 2, world.heroY, 250, false);
    } else if (sequence === 'ebony' && atlas.karateEbonyAttackTwo) {
      const frames = karateEbonySequenceFrames(
        atlas.karateEbonyAttackTwo.width,
        atlas.karateEbonyAttackTwo.height,
      );
      const index = Math.min(frames.length - 1,
        Math.floor((elapsed / KARATE_DEFEAT_DURATION) * frames.length));
      drawKarateSequenceFrame(context, atlas.karateEbonyAttackTwo,
        frames[Math.max(0, index)], WIDTH / 2, world.heroY, 260, false);
    } else if (atlas.karateBlondeAttackOne && atlas.karateBlondeAttackTwo) {
      const first = karateBlondeSequenceFrames(
        atlas.karateBlondeAttackOne.width,
        atlas.karateBlondeAttackOne.height,
      );
      const ending = karateBlondeSequenceFrames(
        atlas.karateBlondeAttackTwo.width,
        atlas.karateBlondeAttackTwo.height,
      ).slice(3, 6);
      const frames = [...first, ...ending];
      const index = Math.min(frames.length - 1,
        Math.floor((elapsed / KARATE_DEFEAT_DURATION) * frames.length));
      const sheet = index < first.length ? atlas.karateBlondeAttackOne : atlas.karateBlondeAttackTwo;
      const pose = index < first.length ? frames[index] : ending[index - first.length];
      drawKarateSequenceFrame(context, sheet, pose, WIDTH / 2, world.heroY, 265, false);
    }
  } else if (ninjaFootsmotherSequence) {
    const grappler = world.enemies.find((enemy) => enemy.id === world.currentGrappler);
    const bystanders = world.enemies
      .filter((enemy) => enemy.hp > 0 && enemy.active && enemy.id !== world.currentGrappler)
      .sort((a, b) => a.y - b.y);
    for (const enemy of bystanders) {
      drawEnemySprite(context, atlas, enemy, enemyAnimationFrame(enemy, now));
    }
    const elapsed = Math.max(0, world.ninjaFootsmotherElapsed);
    const endingStartsAt =
      NINJA_FOOTSMOTHER_DURATION - NINJA_FOOTSMOTHER_ENDING_DURATION;
    const heroX = clamp(world.heroX, 180, WIDTH - 180);
    const groundY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
    const flipped = grappler?.direction === -1;
    if (elapsed < endingStartsAt) {
      const frameIndex = Math.floor(
        elapsed * NINJA_FOOTSMOTHER_FRAME_RATE,
      ) % NINJA_FOOTSMOTHER_FRAMES.length;
      drawFootsmotherFrame(
        context,
        atlas.ninjaFootsmother,
        NINJA_FOOTSMOTHER_FRAMES[frameIndex],
        heroX,
        groundY,
        flipped,
      );
    } else {
      const endingFrameIndex = elapsed >= NINJA_FOOTSMOTHER_DURATION
        ? NINJA_FOOTSMOTHER_ENDING_FRAMES.length - 1
        : Math.min(
          NINJA_FOOTSMOTHER_ENDING_FRAMES.length - 1,
          Math.floor(
            (elapsed - endingStartsAt) /
              (NINJA_FOOTSMOTHER_ENDING_DURATION /
                NINJA_FOOTSMOTHER_ENDING_FRAMES.length),
          ),
        );
      drawFootsmotherFrame(
        context,
        atlas.ninjaFootsmotherEnding,
        NINJA_FOOTSMOTHER_ENDING_FRAMES[endingFrameIndex],
        heroX,
        groundY,
        flipped,
      );
    }
  }
  if (roxyDefeatSequence) {
    const grappler = world.enemies.find((enemy) => enemy.id === world.currentGrappler);
    const bystanders = world.enemies
      .filter((enemy) => enemy.hp > 0 && enemy.active && enemy.id !== world.currentGrappler)
      .sort((a, b) => a.y - b.y);
    for (const enemy of bystanders) {
      drawEnemySprite(context, atlas, enemy, enemyAnimationFrame(enemy, now));
    }
    const frames = roxyVoluntarySequence ? ROXY_HYPNO_FRAMES : ROXY_SMOTHER_FRAMES;
    const sheet = roxyVoluntarySequence ? atlas.roxyHypno : atlas.roxySmother;
    const elapsed = Math.max(0, world.roxyDefeatElapsed);
    const introDuration = 3.6;
    const introIndex = Math.min(
      frames.length - 1,
      Math.floor((elapsed / introDuration) * frames.length),
    );
    // These are distinct story poses, not interchangeable animation frames:
    // pose 2 has Roxy alone. Hold the complete final pair instead of making
    // the heroine disappear on every other frame.
    const loopIndex = roxyVoluntarySequence
      ? elapsed < ROXY_HYPNOSIS_DURATION
        ? Math.min(1, Math.floor(elapsed / ROXY_HYPNOSIS_FRAME_DURATION))
        : 3
      : elapsed < introDuration ? introIndex : 3;
    const finalPose = roxyVoluntarySequence
      ? elapsed >= ROXY_HYPNOSIS_DURATION
      : elapsed >= introDuration;
    const poseBreath = finalPose ? Math.sin(elapsed * 2.2) * 0.02 : 0;
    drawRoxyDefeatFrame(
      context,
      sheet,
      frames[Math.max(0, loopIndex)],
      clamp(
        world.heroX + (finalPose ? Math.sin(elapsed * 1.1) * 1.25 : 0),
        190,
        WIDTH - 190,
      ),
      world.heroY,
      (roxyVoluntarySequence ? 220 : 225) * (1 + poseBreath),
      grappler?.direction === -1,
    );
  }

  const specialSequence = world.phase === 'special-defeat' ||
    (world.phase === 'game-over' && world.defeatKind === 'special');
  const ebonyScene = world.phase === 'ebony-stomp' || world.phase === 'ebony-victory' ||
    (world.phase === 'game-over' && world.defeatKind === 'ebony-victory');
  if (ebonyScene) {
    const attacker = world.enemies.find((enemy) => enemy.id === world.currentGrappler);
    for (const enemy of world.enemies.filter((e) => e.active && e.hp > 0 && e !== attacker &&
      (world.phase === 'ebony-stomp' || e.id !== world.ebonyPartnerId))
      .sort((a, b) => a.y - b.y)) {
      drawEnemySprite(context, atlas, enemy, enemy.ebony ? EBONY_FRAMES.idle : ENEMY_FRAMES[enemy.kind].idle);
    }
    const flipped = attacker?.direction === -1;
    if (world.phase === 'ebony-stomp') {
      const index = Math.min(5, Math.floor(world.ebonyElapsed / (EBONY_STOMP_DURATION / 6)));
      drawEbonyFrame(context, atlas.ebonyStomp, EBONY_STOMP[index],
        world.heroX, world.heroY, flipped);
    } else {
      const frames = world.ebonyPartnerId ? EBONY_DUO_VICTORY : EBONY_VICTORY;
      const sheet = world.ebonyPartnerId ? atlas.ebonyDuoVictory : atlas.ebonyVictory;
      const index = ebonyVictoryPose(world.ebonyElapsed, world.phase === 'game-over');
      drawEbonyFrame(context, sheet, frames[index], world.heroX, world.heroY, flipped,
        0, now / 1000);
    }
  } else if (
    karateOfferSequence || karateDefeatSequence || ninjaFootsmotherSequence || roxyDefeatSequence
  ) {
    // The paired sprite sheet already contains both fighters; skip the regular actor pass.
  } else if (specialSequence || world.phase === 'grapple') {
    const isStruggle = specialSequence;
    const grappler = world.enemies.find((enemy) => enemy.id === world.currentGrappler);
    const ninjaGrappler = grappler?.kind === 'ninja';
    const bystanders = world.enemies
      .filter((enemy) => enemy.hp > 0 && enemy.active && enemy.id !== world.currentGrappler)
      .sort((a, b) => a.y - b.y);
    for (const enemy of bystanders) {
      drawEnemySprite(context, atlas, enemy, enemyAnimationFrame(enemy, now));
    }
    const remaining = isStruggle ? world.defeatSecondsLeft : world.grappleSecondsLeft;
    const duration = isStruggle ? SPECIAL_DEFEAT_DURATION : GRAPPLE_DURATION;
    const elapsed = duration - remaining;
    const struggleFrame = elapsed < 0.72
      ? Math.min(2, Math.floor(elapsed / 0.18))
      : [3, 4, 5, 4][Math.floor(now / 180) % 4];
    const frame = isStruggle
      ? STRUGGLE_FRAMES[struggleFrame]
      : sequenceFrame(GRAPPLE_FRAMES, elapsed, duration);
    const struggleMotion = isStruggle ? Math.sin(now / 82) * 2 : 0;
    if (grappler?.kind === 'roxy') {
      // Roxy's combat finisher uses her own kick-to-standing pair, not the
      // Amazon-only pin sheets used by the generic special-defeat branch.
      const roxyFinisherFrame = elapsed < 0.55
        ? ROXY_SMOTHER_FRAMES[0]
        : ROXY_SMOTHER_FRAMES[1];
      drawRoxyDefeatFrame(
        context,
        atlas.roxySmother,
        roxyFinisherFrame,
        clamp(world.heroX, 190, WIDTH - 190),
        clamp(world.heroY, FLOOR_MIN, FLOOR_MAX),
        225,
        grappler.direction === -1,
      );
    } else if (ninjaGrappler && grappler) {
      const ninjaMotion = isStruggle ? Math.sin(now / 92) * 2.1 : 0;
      const heroX = clamp(world.heroX + struggleMotion + ninjaMotion, 110, WIDTH - 110);
      drawAtlasSprite(
        context,
        atlas.hero,
        HERO_FRAMES.defeated,
        heroX,
        world.heroY + Math.sin(now / 104) * (isStruggle ? 1.6 : 0),
        230,
        80,
        world.facing < 0,
      );
          drawEnemySprite(context, atlas, grappler, NINJA_FRAMES.special, 190, 0, 7);
    } else {
      // Amazon grapples use the paired pose sheets; they already contain both fighters.
      drawAtlasSprite(
        context,
        isStruggle ? atlas.pinExtended : atlas.pinAttack,
        frame,
        clamp(world.heroX + struggleMotion, 110, WIDTH - 110),
        world.heroY,
        (190 * frame.w) / frame.h,
        190,
        world.facing < 0,
      );
    }
    if (isStruggle) world.particles.forEach((particle) => drawParticle(context, particle));
  } else if (world.phase === 'group-defeat' || (world.phase === 'game-over' && world.defeatKind === 'group')) {
    const centerX = clamp(world.heroX, 80, WIDTH - 80);
    const centerY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
    const elapsed = world.actionTimer > 0
      ? 0.9 - world.actionTimer
      : 0.9 + GROUP_DEFEAT_DURATION - world.defeatSecondsLeft;
    const fallenPose = elapsed < 0.3 ? HERO_FRAMES.hurt
      : elapsed < 0.9 ? HERO_FRAMES.down : HERO_FRAMES.defeated;
    const defeatActors: Array<{ y: number; draw: () => void }> = [{
      y: centerY,
      draw: () => drawAtlasSprite(
        context,
        atlas.hero,
        fallenPose,
        centerX,
        elapsed < 0.9 ? centerY : Math.min(FLOOR_MAX, centerY + 24),
        elapsed < 0.9 ? 150 : 230,
        elapsed < 0.9 ? 164 : 80,
        world.facing < 0,
      ),
    }];
    world.enemies
      .filter((enemy) => enemy.hp > 0 && enemy.active)
      .forEach((enemy) => {
        const idlePose = enemy.ebony ? EBONY_FRAMES.idle : ENEMY_FRAMES[enemy.kind].idle;
        defeatActors.push({
          y: enemy.y,
          draw: () => drawEnemySprite(context, atlas, enemy, idlePose),
        });
      });
    defeatActors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());
  } else {
    const actors: Array<{ y: number; draw: () => void }> = [];
    const visibleEnemies = world.enemies.filter(
      (enemy) => enemy.active || (enemy.hp <= 0 && enemy.respawnAt > now),
    );

    for (const enemy of visibleEnemies) {
      const defeated = !enemy.active;
      const enemyFrames = enemy.ebony ? EBONY_FRAMES : ENEMY_FRAMES[enemy.kind];
      const rect = defeated
        ? enemy.stateTimer > 0 ? enemyFrames.down : enemyFrames.defeated
        : enemyAnimationFrame(enemy, now);
      actors.push({
        // Keep Roxy's extended kick silhouette readable when it crosses the
        // heroine at the same depth.
        y: enemy.y + (enemy.kind === 'roxy' && enemy.state === 'attack' ? 0.5 : 0),
        draw: () =>
          drawEnemySprite(context, atlas, enemy, rect, defeated ? 120 : 190, 0, 7),
      });
    }

    actors.push({
      y: world.heroY,
      draw: () =>
        drawAtlasSprite(
          context,
          atlas.hero,
          heroRect(world),
          world.heroX,
          world.heroY,
          world.heroAction === 'jump' ? 126 : 116,
          world.heroAction === 'jump' ? 171 : 164,
          world.facing < 0,
          0,
          Math.min(world.jumpOffset, world.heroY - FLOOR_MIN),
        ),
    });
    actors.sort((a, b) => a.y - b.y);
    actors.forEach((actor) => actor.draw());
  }
}

function enterGameOver(world: World) {
  if (world.phase === 'game-over') return;
  if (world.defeatKind === 'special' || world.defeatKind === 'ninja-footsmother' ||
      world.defeatKind === 'roxy-smother') {
    stopClips(world);
    playClip(world, 'heroineFaintSigh', 0.68, 3500);
  }
  world.phase = 'game-over';
  world.defeatSecondsLeft = 0;
}

function beginGenericDefeat(world: World, attacker?: Enemy) {
  if (attacker?.ebony && world.fightConfig.ebonyVictory) {
    world.heroHp = 0;
    world.phase = 'ebony-victory';
    world.defeatKind = 'ebony-victory';
    world.isGrappleActive = true;
    world.currentGrappler = attacker.id;
    world.ebonyElapsed = 0;
    world.struggleVoiceTimer = .5;
    world.ebonyHitFrame = -1;
    world.ebonyPartnerId = world.enemies.find((enemy) =>
      enemy.ebony && enemy.id !== attacker.id && enemy.active && enemy.hp > 0)?.id ?? null;
    world.defeatSecondsLeft = EBONY_VICTORY_DURATION;
    world.heroX = clamp(world.heroX, 240, WIDTH - 240);
    world.heroY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
    world.jumpOffset = 0;
    world.jumpVelocity = 0;
    world.heroVelocityX = 0;
    world.heroVelocityY = 0;
    world.particles = [];
    stopClips(world);
    playStomp(world);
    return;
  }
  world.heroHp = 0;
  world.phase = 'group-defeat';
  world.defeatKind = 'group';
  world.isGrappleActive = false;
  world.defeatSecondsLeft = GROUP_DEFEAT_DURATION;
  world.heroAction = 'hurt';
  world.actionTimer = 0.9;
  world.heroVelocityX = 0;
  world.heroVelocityY = 0;
  playClip(world, 'heroineFaintSigh', 0.68, 3500);
}

function stopEbonyVictory(world: World) {
  if (world.defeatKind !== 'ebony-victory') return;
  stopClips(world);
  world.ebonyPartnerId = null;
  world.currentGrappler = null;
  beginGenericDefeat(world);
}

function beginRoxyOffer(world: World, enemy: Enemy) {
  stopClips(world);
  world.phase = STATE_ROXY_OFFER;
  world.defeatKind = null;
  world.isGrappleActive = false;
  world.grappleSecondsLeft = 0;
  world.defeatSecondsLeft = 0;
  world.roxyDefeatElapsed = 0;
  world.roxyDialoguePlayed = false;
  world.heroAction = 'idle';
  world.actionTimer = 0;
  world.heroVelocityX = 0;
  world.heroVelocityY = 0;
  world.jumpOffset = 0;
  world.jumpVelocity = 0;
  world.particles = [];
  enemy.state = 'idle';
  enemy.stateTimer = 0;
  enemy.x = clamp(world.heroX + world.facing * 130, 64, WIDTH - 64);
  enemy.y = world.heroY;
  enemy.vx = 0;
  enemy.vy = 0;
  world.enemies.forEach((other) => {
    if (other.hp > 0 && other.active) other.state = 'idle';
  });
}

function respondToRoxyOffer(world: World, accepted: boolean) {
  if (world.phase !== STATE_ROXY_OFFER) return;
  stopClips(world);
  if (!accepted) {
    world.currentGrappler = null;
    beginGenericDefeat(world);
    return;
  }
  // Consent starts a separate scene, not an HP-draining defeat.
  world.phase = STATE_ROXY_CHALLENGE;
  world.defeatKind = null;
  world.defeatSecondsLeft = ROXY_DEFEAT_DURATION;
  world.roxyDefeatElapsed = 0;
  world.roxyDialoguePlayed = false;
  playSweep(world, 720, 330, 0.7, 0.026, 'sine');
}

function endRoxyChallenge(world: World) {
  if (world.phase !== STATE_ROXY_CHALLENGE) return;
  stopClips(world);
  world.phase = 'playing';
  world.defeatKind = null;
  world.isGrappleActive = false;
  world.currentGrappler = null;
  world.defeatSecondsLeft = 0;
  world.heroAction = 'idle';
  world.heroHitCooldown = 2.5;
  world.actionTimer = 0.35;
  world.enemies.forEach((enemy) => {
    if (enemy.hp > 0 && enemy.active) {
      enemy.state = 'idle';
      enemy.stateTimer = 0;
      enemy.attackCooldown = Math.max(enemy.attackCooldown, 2.5);
    }
  });
}

function beginKarateOffer(world: World, enemy: Enemy) {
  stopClips(world);
  world.phase = STATE_KARATE_OFFER;
  world.defeatKind = null;
  world.isGrappleActive = true;
  world.currentGrappler = enemy.id;
  world.heroHp = 0;
  world.defeatSecondsLeft = 0;
  world.karateDefeatElapsed = 0;
  world.karateSequence = enemy.kind === 'karateEbony' ? 'ebony' : 'blonde';
  world.heroAction = 'hurt';
  world.actionTimer = 0;
  world.heroVelocityX = 0;
  world.heroVelocityY = 0;
  world.jumpOffset = 0;
  world.jumpVelocity = 0;
  world.particles = [];
  enemy.direction = enemy.x < world.heroX ? 1 : -1;
  enemy.state = 'idle';
  enemy.stateTimer = 0;
  enemy.vx = 0;
  enemy.vy = 0;
  world.enemies.forEach((other) => {
    if (other.hp > 0 && other.active) {
      other.state = 'idle';
      other.vx = 0;
      other.vy = 0;
    }
  });
}

function respondToKarateOffer(world: World, accepted: boolean) {
  if (world.phase !== STATE_KARATE_OFFER) return;
  stopClips(world);
  if (!accepted) {
    world.currentGrappler = null;
    world.karateSequence = null;
    beginGenericDefeat(world);
    return;
  }
  world.phase = STATE_KARATE_CHALLENGE;
  world.defeatKind = 'karate-victory';
  world.defeatSecondsLeft = KARATE_DEFEAT_DURATION;
  world.karateDefeatElapsed = 0;
  playSweep(world, 570, 250, 0.45, 0.022, 'sine');
}

function endKarateChallenge(world: World) {
  if (world.phase !== STATE_KARATE_CHALLENGE) return;
  stopClips(world);
  playClip(world, 'heroineFaintSigh', 0.68, 3500);
  world.phase = 'game-over';
  world.defeatKind = 'karate-victory';
  world.defeatSecondsLeft = 0;
  world.isGrappleActive = false;
}

function beginSpecialGrapple(world: World, enemy: Enemy) {
  if (enemy.ebony) {
    world.phase = 'ebony-stomp';
    world.isGrappleActive = true;
    world.currentGrappler = enemy.id;
    world.ebonyElapsed = 0;
    world.ebonyHitFrame = -1;
    world.heroX = clamp(world.heroX, 240, WIDTH - 240);
    world.heroY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
    world.heroVelocityX = 0;
    world.heroVelocityY = 0;
    world.jumpOffset = 0;
    world.jumpVelocity = 0;
    enemy.direction = enemy.x < world.heroX ? 1 : -1;
    enemy.x = world.heroX - enemy.direction * 100;
    enemy.y = world.heroY;
    enemy.vx = 0;
    enemy.vy = 0;
    return;
  }
  world.phase = 'grapple';
  world.isGrappleActive = true;
  world.currentGrappler = enemy.id;
  world.grappleSecondsLeft = GRAPPLE_DURATION;
  world.escapeProgress = 0;
  world.heroX = clamp(world.heroX, 180, WIDTH - 180);
  world.heroY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
  world.heroAction = 'hurt';
  world.heroVelocityX = 0;
  world.heroVelocityY = 0;
  world.facing = enemy.x < world.heroX ? -1 : 1;
  enemy.direction = world.heroX < enemy.x ? -1 : 1;
  enemy.x = clamp(world.heroX - enemy.direction * 72, 64, WIDTH - 64);
  enemy.y = world.heroY;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.state = 'attack';
  enemy.stateTimer = 5.2;
  world.heroHitCooldown = 1.1;
  world.struggleVoiceTimer = 1.45;
  playStomp(world);
  playClip(world, 'heroineStruggle', 0.32, 900);
}

function escapeGrapple(world: World) {
  world.phase = 'playing';
  world.isGrappleActive = false;
  world.currentGrappler = null;
  world.grappleSecondsLeft = 0;
  world.escapeProgress = 0;
  world.heroAction = 'idle';
  world.actionTimer = 0.35;
  world.heroVelocityX = 0;
  world.heroVelocityY = 0;
  world.heroHitCooldown = 1.2;
  world.heroX = clamp(world.heroX - world.facing * 60, 48, WIDTH - 48);
  playHit(world);
}

function doHeroAttack(world: World, action: 'punch' | 'kick') {
  if (world.phase !== 'playing' || world.isGrappleActive) return;
  if (world.actionTimer > 0) return;
  world.heroAction = action;
  world.actionTimer = action === 'punch' ? 0.25 : 0.38;
  const range = action === 'punch' ? 112 : 148;
  const damage = action === 'punch' ? 1 : 1;
  let connected = false;

  for (const enemy of world.enemies.filter((item) => item.hp > 0 && item.active)) {
    const dx = enemy.x - world.heroX;
    const dy = Math.abs(enemy.y - world.heroY);
    if (
      dy < 65 &&
      Math.abs(dx) < range &&
      (Math.sign(dx) === world.facing || Math.abs(dx) < 42)
    ) {
      enemy.hp -= damage;
      enemy.state = enemy.hp <= 0 ? 'down' : 'hurt';
      enemy.stateTimer = enemy.hp <= 0 ? 1.15 : 0.34;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.attackCooldown = Math.max(enemy.attackCooldown, 0.7);
      connected = true;
      if (enemy.hp <= 0) {
        enemy.active = false;
        enemy.respawnAt = performance.now() + 2200;
        world.score += 100;
        world.defeatedEnemies += 1;
      }
    }
  }
  if (connected) playHit(world);
}

function handleMovement(world: World, pressed: Set<string>, dt: number) {
  if (world.phase !== 'playing' || world.isGrappleActive) return;
  let horizontal = 0;
  let depth = 0;
  if (pressed.has('KeyA') || pressed.has('ArrowLeft')) horizontal -= 1;
  if (pressed.has('KeyD') || pressed.has('ArrowRight')) horizontal += 1;
  if (pressed.has('KeyW') || pressed.has('ArrowUp')) depth -= 1;
  if (pressed.has('KeyS') || pressed.has('ArrowDown')) depth += 1;
  const moving = horizontal !== 0 || depth !== 0;
  const running = pressed.has('ShiftLeft') || pressed.has('ShiftRight');
  const inputLength = Math.hypot(horizontal, depth);
  if (inputLength > 1) {
    horizontal /= inputLength;
    depth /= inputLength;
  }
  if (horizontal !== 0) world.facing = horizontal < 0 ? -1 : 1;
  const speed = running ? 326 : 220;
  const targetVelocityX = horizontal * speed;
  const targetVelocityY = depth * speed * 0.56;
  const response = Math.min(1, dt * (moving ? 10 : 8.5));
  world.heroVelocityX += (targetVelocityX - world.heroVelocityX) * response;
  world.heroVelocityY += (targetVelocityY - world.heroVelocityY) * response;
  world.heroX += world.heroVelocityX * dt;
  world.heroY += world.heroVelocityY * dt;
  world.heroX = clamp(world.heroX, 48, WIDTH - 48);
  world.heroY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
  if ((world.heroX === 48 && world.heroVelocityX < 0) ||
      (world.heroX === WIDTH - 48 && world.heroVelocityX > 0)) {
    world.heroVelocityX = 0;
  }
  if ((world.heroY === FLOOR_MIN && world.heroVelocityY < 0) ||
      (world.heroY === FLOOR_MAX && world.heroVelocityY > 0)) {
    world.heroVelocityY = 0;
  }

  const actualSpeed = Math.hypot(world.heroVelocityX, world.heroVelocityY);
  if (actualSpeed > 16 && world.jumpOffset <= 0 && world.actionTimer <= 0) {
    world.heroAction = running && moving ? 'run' : 'walk';
    world.footstepTimer -= dt;
    if (world.footstepTimer <= 0) {
      playSweep(world, 100, 25, 0.13, 0.025);
      world.footstepTimer = world.heroAction === 'run' ? 0.22 : 0.38;
    }
  } else if (actualSpeed <= 16 && world.actionTimer <= 0 && world.jumpOffset <= 0) {
    world.heroVelocityX = 0;
    world.heroVelocityY = 0;
    world.heroAction = 'idle';
  }
}

function updateEnemies(world: World, dt: number, now: number) {
  if (world.phase === STATE_ROXY_OFFER || world.phase === STATE_ROXY_CHALLENGE ||
      world.phase === STATE_KARATE_OFFER || world.phase === STATE_KARATE_CHALLENGE) return;
  if (world.phase === 'playing') {
    for (const enemy of world.enemies) {
      if (!enemy.active && enemy.hp <= 0) {
        enemy.stateTimer = Math.max(0, enemy.stateTimer - dt);
      }
      if (!enemy.active && enemy.respawnAt > 0 && now >= enemy.respawnAt) {
        const edge = random(world) > 0.5 ? -22 : WIDTH + 22;
        enemy.x = edge;
        enemy.y = FLOOR_MIN + 12 + random(world) * (FLOOR_MAX - FLOOR_MIN - 12);
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.hp = 3;
        enemy.active = true;
        enemy.direction = edge < 0 ? 1 : -1;
        enemy.state = 'walk';
        enemy.stateTimer = 0.5;
        enemy.attackCooldown = 0.7 + random(world) * 0.7;
        enemy.attackPoseIndex = Math.floor(random(world) * 3);
        enemy.respawnAt = 0;
        enemy.hue = enemy.kind === 'amazon' ? Math.round(random(world) * 60 - 30) : 0;
      }
    }
  }

  const activeEnemies = world.enemies.filter((enemy) => enemy.hp > 0 && enemy.active);
  for (const enemy of activeEnemies) {
    const previousX = enemy.x;
    const previousY = enemy.y;
    enemy.stateTimer = Math.max(0, enemy.stateTimer - dt);
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    if (enemy.stateTimer <= 0 &&
        (enemy.state === 'hurt' || enemy.state === 'down' || enemy.state === 'attack')) {
      enemy.state = 'idle';
    }
    if (world.phase === 'group-defeat' || (world.phase === 'game-over' && world.defeatKind === 'group')) {
      continue;
    }

    if (world.isGrappleActive) {
      if (enemy.id !== world.currentGrappler) {
        const bystanders = activeEnemies.filter((enemy) => enemy.id !== world.currentGrappler);
        const index = bystanders.findIndex((item) => item.id === enemy.id);
        const offsets = [-390, -260, -130, 0, 130, 260, 390];
        const offset = offsets[Math.max(0, index) % offsets.length] ?? 0;
        const perimeterX = clamp(world.heroX + offset +
          Math.sin(now / 1200 + index) * 12, 48, WIDTH - 48);
        const perimeterY = clamp(world.heroY - 12 + (index % 2) * 24 +
          Math.sin(now / 1400 + index) * 3, FLOOR_MIN, FLOOR_MAX);
        enemy.x += (perimeterX - enemy.x) * Math.min(1, dt * 4);
        enemy.y += (perimeterY - enemy.y) * Math.min(1, dt * 4);
        enemy.state = Math.hypot(perimeterX - enemy.x, perimeterY - enemy.y) > 3 ? 'walk' : 'idle';
        enemy.stride += Math.hypot(enemy.x - previousX, enemy.y - previousY) * Math.PI * 2 / 60;
      }
      continue;
    }
    if (world.phase !== 'playing') continue;

    // Let Roxy finish the current pose before pursuing again. Otherwise the
    // next AI tick replaces her kick/hit pose with a walk and slides her legs.
    if (enemy.kind === 'roxy' && enemy.stateTimer > 0 &&
        (enemy.state === 'attack' || enemy.state === 'hurt' || enemy.state === 'down')) {
      enemy.vx = 0;
      enemy.vy = 0;
      continue;
    }

    const dx = world.heroX - enemy.x;
    const dy = world.heroY - enemy.y;
    const distance = Math.hypot(dx, dy);
    enemy.direction = dx < 0 ? -1 : 1;

    if (distance > 78) {
      const pace = (distance > 250 ? 92 : 68) *
        (enemy.kind === 'ninja' ? 1.14 : enemy.kind === 'roxy' ? 1.06 : 1);
      const velocityResponse = Math.min(1, dt * 7.5);
      const targetVelocityX = (dx / Math.max(distance, 1)) * pace;
      const targetVelocityY = (dy / Math.max(distance, 1)) * pace * 0.56;
      enemy.vx += (targetVelocityX - enemy.vx) * velocityResponse;
      enemy.vy += (targetVelocityY - enemy.vy) * velocityResponse;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.state = distance > 250 && Math.hypot(enemy.vx, enemy.vy) > 88 ? 'run' : 'walk';
    } else if (enemy.attackCooldown <= 0) {
      const velocityResponse = Math.min(1, dt * 10);
      enemy.vx += (0 - enemy.vx) * velocityResponse;
      enemy.vy += (0 - enemy.vy) * velocityResponse;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.state = 'attack';
      enemy.stateTimer = 0.48;
      enemy.attackPoseIndex = (enemy.attackPoseIndex + 1) % ATTACK_FRAMES[enemy.kind].length;
      enemy.attackCooldown =
        (enemy.kind === 'ninja' ? 1.08 : enemy.kind === 'roxy' ? 1.18 : 1.3) +
        random(world) * 0.75;
      if (enemy.kind === 'karateBlonde' || enemy.kind === 'karateEbony') {
        playKarateAttackVoice(
          world,
          enemy.kind === 'karateBlonde' ? 'blonde' : 'ebony',
          0.09,
        );
      } else {
        playClip(
          world,
          enemy.kind === 'ninja' ? 'ninjaKick'
            : enemy.kind === 'roxy' ? 'roxyKick' : 'amazonKick',
          enemy.kind === 'ninja' ? 0.48 : enemy.kind === 'roxy' ? 0.52 : 0.56,
          120,
        );
      }
      if (enemy.kind === 'ninja') playNinjaKiai(world);
      if (distance < 106 && world.heroHitCooldown <= 0) {
        world.heroHp = Math.max(0, world.heroHp - (7 + Math.floor(random(world) * 4)));
        world.heroHitCooldown = 0.68;
        world.heroAction = 'hurt';
        world.actionTimer = 0.36;
        playStomp(world);
        playClip(world, 'heroineHurt', 0.64, 430);
        if (world.heroHp <= 0) {
          if (enemy.kind === 'karateBlonde' || enemy.kind === 'karateEbony') {
            beginKarateOffer(world, enemy);
          } else {
            beginGenericDefeat(world, enemy);
          }
          continue;
        }
        if (enemy.ebony) {
          const specialRoll = random(world);
          if (specialRoll < EBONY_FINISHER_KO_CHANCE) {
            world.heroHp = 0;
            beginGenericDefeat(world, enemy);
            continue;
          }
          if (specialRoll < EBONY_FINISHER_KO_CHANCE + EBONY_STOMP_CHANCE) {
            beginSpecialGrapple(world, enemy);
            continue;
          }
        } else if (world.heroHp <= 42 && random(world) < 0.25) {
          beginSpecialGrapple(world, enemy);
          continue;
        }
      }
    } else {
      const velocityResponse = Math.min(1, dt * 9);
      enemy.vx += (0 - enemy.vx) * velocityResponse;
      enemy.vy += (0 - enemy.vy) * velocityResponse;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      if (enemy.state !== 'attack' && enemy.state !== 'hurt') {
        enemy.state = Math.hypot(enemy.vx, enemy.vy) > 14 ? 'walk' : 'idle';
      }
    }
    enemy.x = clamp(enemy.x, -24, WIDTH + 24);
    enemy.y = clamp(enemy.y, FLOOR_MIN, FLOOR_MAX);
    if (enemy.state === 'walk' || enemy.state === 'run') {
      enemy.stride += Math.hypot(enemy.x - previousX, enemy.y - previousY) * Math.PI * 2 / 60;
    }
    if ((enemy.x <= -24 && enemy.vx < 0) || (enemy.x >= WIDTH + 24 && enemy.vx > 0)) {
      enemy.vx = 0;
    }
  }

  if (world.phase === 'playing') {
    const combatants = world.enemies.filter((enemy) => enemy.hp > 0 && enemy.active);
    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < combatants.length; i += 1) {
        for (let j = i + 1; j < combatants.length; j += 1) {
          const first = combatants[i];
          const second = combatants[j];
          let dx = first.x - second.x;
          let dy = first.y - second.y;
          if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            dx = first.id < second.id ? -1 : 1;
            dy = (first.id + second.id) % 2 === 0 ? -1 : 1;
          }
          const crowding = Math.hypot(dx / 102, dy / 52);
          if (crowding >= 1) continue;

          const directionX = (dx / 102) / crowding;
          const directionY = (dy / 52) / crowding;
          const separation = Math.min(2.2, (1 - crowding) * 64 * dt);
          first.x += directionX * separation;
          second.x -= directionX * separation;
          first.y += directionY * separation;
          second.y -= directionY * separation;
        }
      }
    }
    combatants.forEach((enemy) => {
      enemy.x = clamp(enemy.x, -24, WIDTH + 24);
      enemy.y = clamp(enemy.y, FLOOR_MIN, FLOOR_MAX);
    });
  }

}

function stepWorld(world: World, dt: number, now: number, pressed: Set<string>) {
  world.heroHitCooldown = Math.max(0, world.heroHitCooldown - dt);
  world.actionTimer = Math.max(0, world.actionTimer - dt);

  if (world.phase === 'playing') {
    handleMovement(world, pressed, dt);
    if (world.jumpOffset > 0 || world.jumpVelocity > 0) {
      world.jumpOffset += world.jumpVelocity * dt;
      world.jumpVelocity -= 490 * dt;
      if (world.jumpOffset <= 0) {
        world.jumpOffset = 0;
        world.jumpVelocity = 0;
        playStomp(world);
      }
    }
    if (world.actionTimer <= 0 && (world.heroAction === 'punch' || world.heroAction === 'kick' || world.heroAction === 'hurt')) {
      world.heroAction = 'idle';
    }

    if (world.heroHp <= 0) {
      beginGenericDefeat(world);
    }
  } else if (world.phase === 'ebony-stomp') {
    world.ebonyElapsed = Math.min(EBONY_STOMP_DURATION, world.ebonyElapsed + dt);
    // Process each impact once, including slow frames that cross a boundary.
    for (const index of [3, 4, 5]) {
      if (world.ebonyElapsed >= index * EBONY_STOMP_DURATION / 6 && world.ebonyHitFrame < index) {
        world.ebonyHitFrame = index;
        // Three heavy impacts make the stomp dangerous; any impact may also
        // trigger Ebony's instant-finisher chance.
        world.heroHp = Math.max(0, world.heroHp - 24);
        if (random(world) < EBONY_FINISHER_KO_CHANCE) world.heroHp = 0;
        playStomp(world);
        playClip(world, 'amazonKick', .56, 120);
        playClip(world, 'heroineHurt', .48, 300);
      }
    }
    if (world.ebonyElapsed >= EBONY_STOMP_DURATION) {
      if (world.heroHp <= 0) {
        const attacker = world.enemies.find((enemy) => enemy.id === world.currentGrappler);
        beginGenericDefeat(world, attacker);
      } else {
        world.phase = 'playing';
        world.isGrappleActive = false;
        world.currentGrappler = null;
        world.defeatSecondsLeft = 0;
        world.heroHitCooldown = 2;
        world.heroAction = 'idle';
        world.enemies.forEach((enemy) => {
          enemy.state = 'idle';
          enemy.attackCooldown = Math.max(enemy.attackCooldown, 2);
          enemy.vx = 0;
          enemy.vy = 0;
        });
      }
    }
  } else if (world.phase === 'ebony-victory') {
    world.ebonyElapsed = Math.min(EBONY_VICTORY_DURATION, world.ebonyElapsed + dt);
    world.defeatSecondsLeft = Math.max(0, EBONY_VICTORY_DURATION - world.ebonyElapsed);
    world.struggleVoiceTimer -= dt;
    // The existing neutral deep-breath clip lasts 3.03 seconds. Leave space
    // for it to finish and never overlap two heroine breaths.
    if (world.struggleVoiceTimer <= 0 && world.defeatSecondsLeft > 3.05) {
      playClip(world, 'heroineBreathing', .44, 3100);
      world.struggleVoiceTimer = 3.2;
    }
    if (world.ebonyElapsed >= 2.5 && world.ebonyHitFrame < 1) {
      world.ebonyHitFrame = 1;
      playClip(world, 'enemyLaugh', .4, 1600);
    }
    if (world.defeatSecondsLeft <= 0) {
      stopClips(world);
      enterGameOver(world);
    }
  } else if (world.phase === 'grapple') {
    world.grappleSecondsLeft = Math.max(0, world.grappleSecondsLeft - dt);
    const grappler = world.enemies.find((enemy) => enemy.id === world.currentGrappler);
    world.struggleVoiceTimer -= dt;
    if (world.struggleVoiceTimer <= 0) {
      playClip(world, 'heroineStruggle', 0.28, 1000);
      world.struggleVoiceTimer = 1.55 + random(world) * 0.55;
    }
    if (world.grappleSecondsLeft <= 0) {
      world.defeatStartHp = world.heroHp;
      world.particles = [];
      world.smokeTimer = 0;
      world.heartTimer = 0.12;
      stopClips(world);
      world.struggleVoiceTimer = 1.1;
      world.nextStruggleBreath = true;
      if (grappler?.kind === 'ninja') {
        world.phase = STATE_NINJA_FOOTSMOTHER;
        world.defeatKind = 'ninja-footsmother';
        world.defeatSecondsLeft = NINJA_FOOTSMOTHER_DURATION;
        world.ninjaFootsmotherElapsed = 0;
        world.heroX = clamp(world.heroX, 180, WIDTH - 180);
        world.heroY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
        grappler.x = clamp(world.heroX - grappler.direction * 72, 64, WIDTH - 64);
        grappler.y = world.heroY;
        grappler.vx = 0;
        grappler.vy = 0;
        world.heroVelocityX = 0;
        world.heroVelocityY = 0;
      } else if (grappler?.kind === 'roxy') {
        if (random(world) < 0.5) {
          beginRoxyOffer(world, grappler);
        } else {
          world.phase = STATE_ROXY_SMOTHER;
          world.defeatKind = 'roxy-smother';
          world.defeatSecondsLeft = ROXY_DEFEAT_DURATION;
          world.roxyDefeatElapsed = 0;
        }
      } else {
        world.phase = 'special-defeat';
        world.defeatKind = 'special';
        world.defeatSecondsLeft = SPECIAL_DEFEAT_DURATION;
        playSweep(world, 550, 220, 0.6, 0.045, 'sine');
      }
      if (world.isGrappleActive) playClip(world, 'enemyLaugh', 0.55, 1600);
    }
  } else if (world.phase === STATE_NINJA_FOOTSMOTHER ||
    (world.phase === 'game-over' && world.defeatKind === 'ninja-footsmother')) {
    world.ninjaFootsmotherElapsed += dt;
    if (world.phase === STATE_NINJA_FOOTSMOTHER) {
      world.defeatSecondsLeft = Math.max(0, world.defeatSecondsLeft - dt);
      world.heroHp = Math.max(
        0,
        (world.defeatSecondsLeft / NINJA_FOOTSMOTHER_DURATION) * world.defeatStartHp,
      );
      if (world.defeatSecondsLeft <= 0) {
        world.heroHp = 0;
        enterGameOver(world);
      }
    }
  } else if (world.phase === STATE_ROXY_CHALLENGE) {
    const wasRunning = world.defeatSecondsLeft > 0;
    world.roxyDefeatElapsed = Math.min(ROXY_DEFEAT_DURATION, world.roxyDefeatElapsed + dt);
    world.defeatSecondsLeft = Math.max(0, ROXY_DEFEAT_DURATION - world.roxyDefeatElapsed);
    if (!world.roxyDialoguePlayed && world.roxyDefeatElapsed >= 3.6) {
      world.roxyDialoguePlayed = true;
      playClip(world, 'roxyDialogue', 0.65, 1000);
    }
    if (wasRunning && world.defeatSecondsLeft <= 0) stopClips(world);
  } else if (world.phase === STATE_KARATE_CHALLENGE) {
    world.karateDefeatElapsed = Math.min(
      KARATE_DEFEAT_DURATION,
      world.karateDefeatElapsed + dt,
    );
    world.defeatSecondsLeft = Math.max(
      0,
      KARATE_DEFEAT_DURATION - world.karateDefeatElapsed,
    );
    if (world.defeatSecondsLeft <= 0) endKarateChallenge(world);
  } else if (world.phase === STATE_ROXY_SMOTHER ||
    (world.phase === 'game-over' && world.defeatKind === 'roxy-smother')) {
    world.roxyDefeatElapsed += dt;
    if (world.phase === STATE_ROXY_SMOTHER) {
      world.defeatSecondsLeft = Math.max(0, world.defeatSecondsLeft - dt);
      const progress = 1 - world.defeatSecondsLeft / ROXY_DEFEAT_DURATION;
      world.heroHp = Math.max(0, world.defeatStartHp * (1 - progress));
      if (world.defeatSecondsLeft <= 0) enterGameOver(world);
    }
  } else if (world.phase === 'special-defeat' ||
    (world.phase === 'game-over' && world.defeatKind === 'special')) {
    if (world.phase === 'special-defeat') {
      world.defeatSecondsLeft = Math.max(0, world.defeatSecondsLeft - dt);
      world.heroHp = Math.max(0, (world.defeatSecondsLeft / SPECIAL_DEFEAT_DURATION) * world.defeatStartHp);
    }
    world.smokeTimer -= dt;
    world.heartTimer -= dt;
    if (world.smokeTimer <= 0) {
      const effectX = world.facing * 65;
      const effectY = -39;
      spawnParticle(world, 'smoke', effectX, effectY);
      world.smokeTimer = 0.12;
      if (world.phase === 'special-defeat') playSweep(world, 350, 245, 0.3, 0.014, 'sine');
    }
    if (world.heartTimer <= 0) {
      const effectX = world.facing * 65;
      const effectY = -39;
      spawnParticle(world, 'heart', effectX, effectY);
      world.heartTimer = 0.28;
    }
    world.particles.forEach((particle) => {
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy -= 8 * dt;
    });
    world.particles = world.particles.filter((particle) => particle.age < particle.life);
    if (world.phase === 'special-defeat' && world.defeatSecondsLeft <= 0) {
      world.heroHp = 0;
      enterGameOver(world);
    }
  } else if (world.phase === 'group-defeat' ||
    (world.phase === 'game-over' && world.defeatKind === 'group')) {
    // Complete the fall first, then keep the group pin for the full 20 seconds.
    if (world.phase === 'group-defeat' && world.actionTimer <= 0) {
      world.defeatSecondsLeft = Math.max(0, world.defeatSecondsLeft - dt);
    }
    if (world.phase === 'group-defeat' && world.defeatSecondsLeft <= 0) enterGameOver(world);
  }

  if (world.phase === STATE_NINJA_FOOTSMOTHER || world.phase === 'special-defeat' ||
      world.phase === STATE_ROXY_SMOTHER) {
    world.struggleVoiceTimer -= dt;
    if (world.struggleVoiceTimer <= 0 && world.defeatSecondsLeft > 1.5) {
      // Smoke is present throughout these custom scenes. Alternate breaths and
      // soft effort cues rather than layering two heroine voices over each other.
      const breathing = world.nextStruggleBreath;
      playClip(world, breathing ? 'heroineBreathing' : 'heroineStruggle',
        breathing ? 0.44 : 0.28, breathing ? 3200 : 1000);
      world.nextStruggleBreath = !breathing;
      world.struggleVoiceTimer = breathing ? 3.2 : 1.6;
    }
  }

  updateEnemies(world, dt, now);
}

function canvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas 2D is not supported in this browser.');
  return context;
}

export function useJungleGame(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  selectedConfig: FightConfig = DEFAULT_FIGHT_CONFIG,
) {
  const worldRef = useRef<World>(createWorld());
  const selectedConfigRef = useRef(selectedConfig);
  selectedConfigRef.current = selectedConfig;
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [heroPortrait, setHeroPortrait] = useState<string | null>(null);
  const pressedRef = useRef<Set<string>>(new Set());

  const startGame = useCallback((config: FightConfig = selectedConfigRef.current) => {
    const world = worldRef.current;
    if (world.phase === 'title' || world.phase === 'game-over') {
      const lineup = createFightLineup(config);
      if (!lineup.length) return;
      const soundEnabled = world.soundEnabled;
      const previousSound = world.sound;
      stopClips(world);
      Object.assign(world, createWorld(lineup, config), {
        phase: 'playing',
        soundEnabled,
        sound: { ...previousSound, enabled: soundEnabled },
      });
      pressedRef.current.clear();
      setSnapshot(publishSnapshot(world));
      if (soundEnabled) playStomp(world);
    }
  }, []);

  const resetGame = useCallback((phase: 'title' | 'playing') => {
    const world = worldRef.current;
    const lineup = [...world.enemyLineup];
    const soundEnabled = world.soundEnabled;
    const previousSound = world.sound;
    stopClips(world);
    Object.assign(world, createWorld(lineup, world.fightConfig), {
      phase,
      soundEnabled,
      sound: { ...previousSound, enabled: soundEnabled },
    });
    pressedRef.current.clear();
    setSnapshot(publishSnapshot(world));
    if (phase === 'playing' && soundEnabled) playStomp(world);
  }, []);
  const restartGame = useCallback(() => resetGame('title'), [resetGame]);
  const retryGame = useCallback(() => resetGame('playing'), [resetGame]);

  const exitEbonyVictory = useCallback(() => {
    stopEbonyVictory(worldRef.current);
    setSnapshot(publishSnapshot(worldRef.current));
  }, []);

  const chooseRoxyChallenge = useCallback((accepted: boolean) => {
    respondToRoxyOffer(worldRef.current, accepted);
    pressedRef.current.clear();
    setSnapshot(publishSnapshot(worldRef.current));
  }, []);

  const exitRoxyChallenge = useCallback(() => {
    endRoxyChallenge(worldRef.current);
    pressedRef.current.clear();
    setSnapshot(publishSnapshot(worldRef.current));
  }, []);

  const chooseKarateChallenge = useCallback((accepted: boolean) => {
    respondToKarateOffer(worldRef.current, accepted);
    pressedRef.current.clear();
    setSnapshot(publishSnapshot(worldRef.current));
  }, []);

  const exitKarateChallenge = useCallback(() => {
    endKarateChallenge(worldRef.current);
    pressedRef.current.clear();
    setSnapshot(publishSnapshot(worldRef.current));
  }, []);

  const pressVirtualControl = useCallback((code: string) => {
    const world = worldRef.current;
    if (code === 'Escape' && world.defeatKind === 'ebony-victory') {
      exitEbonyVictory();
      return;
    }
    const wasPressed = pressedRef.current.has(code);
    pressedRef.current.add(code);

    if (!wasPressed && world.phase === STATE_ROXY_OFFER) {
      if (code === 'KeyY') chooseRoxyChallenge(true);
      if (code === 'KeyN' || code === 'Escape') chooseRoxyChallenge(false);
      return;
    }
    if (!wasPressed && world.phase === STATE_KARATE_OFFER) {
      if (code === 'KeyY') chooseKarateChallenge(true);
      if (code === 'KeyN' || code === 'Escape') chooseKarateChallenge(false);
      return;
    }
    if (!wasPressed && world.phase === STATE_ROXY_CHALLENGE && code === 'Escape') {
      exitRoxyChallenge();
      return;
    }
    if (!wasPressed && world.phase === STATE_KARATE_CHALLENGE && code === 'Escape') {
      exitKarateChallenge();
      return;
    }
    if (code === 'KeyJ') {
      if (world.phase === 'grapple') {
        world.escapeProgress = Math.min(1, world.escapeProgress + 0.105);
        if (world.escapeProgress >= 1) escapeGrapple(world);
        playHit(world);
      } else if (world.phase === 'playing' && !world.isGrappleActive && !wasPressed) {
        doHeroAttack(world, 'punch');
      }
    }
    if (code === 'KeyK' && world.phase === 'playing' &&
        !world.isGrappleActive && !wasPressed) {
      doHeroAttack(world, 'kick');
    }
    if (code === 'Space' && world.phase === 'playing' && !world.isGrappleActive &&
        world.jumpOffset === 0 && !wasPressed) {
      world.jumpVelocity = 380;
      world.heroAction = 'jump';
      world.actionTimer = 0.32;
      playStomp(world);
    }
    if (code === 'KeyR' && world.phase === 'game-over' && !wasPressed) restartGame();
  }, [
    chooseRoxyChallenge,
    chooseKarateChallenge,
    exitRoxyChallenge,
    exitKarateChallenge,
    restartGame,
  ]);

  const releaseVirtualControl = useCallback((code: string) => {
    pressedRef.current.delete(code);
  }, []);

  const toggleSound = useCallback(() => {
    const world = worldRef.current;
    world.soundEnabled = !world.soundEnabled;
    world.sound.enabled = world.soundEnabled;
    if (!world.soundEnabled && world.sound.context) {
      void world.sound.context.suspend();
    }
    if (!world.soundEnabled) stopClips(world);
    setSnapshot(publishSnapshot(world));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvasContext(canvas);
    let disposed = false;
    let frameId = 0;
    let lastTime = 0;
    let lastPublish = 0;
    let freezePreview = false;
    let atlas: SpriteAtlas = {
      background: null,
      hero: null,
      amazon: null,
      ebony: null,
      ebonyStomp: null,
      ebonyVictory: null,
      ebonyDuoVictory: null,
      karateBlonde: null,
      karateBlondeAttackOne: null,
      karateBlondeAttackTwo: null,
      karateEbony: null,
      karateEbonyAttackOne: null,
      karateEbonyAttackTwo: null,
      ninja: null,
      ninjaFootsmother: null,
      ninjaFootsmotherEnding: null,
      roxy: null,
      roxyHypno: null,
      roxySmother: null,
      pinAttack: null,
      pinExtended: null,
    };
    const soundUrls: Record<SoundCue, string> = {
      amazonKick: amazonKickAudioUrl,
      ninjaKick: ninjaKickAudioUrl,
      heroineHurt: heroineHurtAudioUrl,
      heroineStruggle: heroineStruggleAudioUrl,
      heroineBreathing: heroineBreathingAudioUrl,
      enemyLaugh: enemyLaughAudioUrl,
      heroineFaintSigh: heroineFaintSighAudioUrl,
      roxyKick: roxyKickAudioUrl,
      roxyDialogue: roxyDialogueAudioUrl,
    };
    const worldSound = worldRef.current.sound;
    for (const [cue, url] of Object.entries(soundUrls) as [SoundCue, string][]) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      worldSound.clips[cue] = audio;
    }

    // Development-only scene previews make timed animation states inspectable
    // without changing normal gameplay or exposing shortcuts in production.
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const scene = params.get('_scene');
      if (scene === 'karate-blonde' || scene === 'karate-ebony') {
        const blonde = scene === 'karate-blonde';
        const config: FightConfig = {
          amazonas: 0,
          ebony: 0,
          ninjas: 0,
          roxy: 0,
          karateBlonde: blonde ? 1 : 0,
          karateEbony: blonde ? 0 : 1,
          ebonyVictory: false,
        };
        const world = worldRef.current;
        const oldSound = world.sound;
        Object.assign(world, createWorld(createFightLineup(config), config), {
          phase: 'playing',
          heroX: 390,
          heroY: 512,
          sound: oldSound,
          soundEnabled: false,
        });
        const karateka = world.enemies[0];
        if (karateka) {
          karateka.x = 650;
          karateka.y = 510;
          karateka.direction = -1;
          karateka.state = params.get('_action') === 'attack' ? 'attack' : 'walk';
          karateka.attackPoseIndex = clamp(Number(params.get('_pose') ?? 2), 0, 4);
        }
        freezePreview = params.get('_freeze') === '1';
        setSnapshot(publishSnapshot(world));
      }
      if (scene === 'karate-offer' || scene === 'karate-challenge' || scene === 'karate-duo') {
        const duo = scene === 'karate-duo';
        const blonde = params.get('_opponent') === 'blonde' || duo;
        const config: FightConfig = {
          amazonas: scene === 'karate-offer' ? 3 : 0,
          ebony: 0,
          ninjas: 0,
          roxy: 0,
          karateBlonde: blonde ? 1 : 0,
          karateEbony: !blonde || duo ? 1 : 0,
          ebonyVictory: false,
        };
        const world = worldRef.current;
        const oldSound = world.sound;
        Object.assign(world, createWorld(createFightLineup(config), config), {
          phase: scene === 'karate-offer' ? STATE_KARATE_OFFER : STATE_KARATE_CHALLENGE,
          heroX: WIDTH / 2,
          heroY: 510,
          heroHp: 0,
          sound: oldSound,
          soundEnabled: false,
          isGrappleActive: true,
          defeatKind: scene === 'karate-offer' ? null : 'karate-victory',
          karateSequence: duo ? 'duo' : blonde ? 'blonde' : 'ebony',
          karateDefeatElapsed: Number(params.get('_elapsed') ?? 3),
          defeatSecondsLeft: KARATE_DEFEAT_DURATION,
        });
        const grapplerKind = blonde ? 'karateBlonde' : 'karateEbony';
        world.currentGrappler =
          world.enemies.find((enemy) => enemy.kind === grapplerKind)?.id ?? null;
        freezePreview = params.get('_freeze') === '1';
        setSnapshot(publishSnapshot(world));
      }
      if (scene === 'ebony-base' || scene === 'ebony-stomp' || scene === 'ebony-victory') {
        const duo = params.get('_duo') === '1';
        const config: FightConfig = {
          amazonas: 0, ninjas: 0, roxy: 0,
          karateBlonde: 0,
          karateEbony: 0,
          ebony: duo ? 2 : 1,
          ebonyVictory: true,
        };
        const world = worldRef.current;
        const oldSound = world.sound;
        Object.assign(world, createWorld(createFightLineup(config), config), {
          phase: 'playing', heroX: 512, heroY: 510, heroHp: 35,
          sound: oldSound, soundEnabled: false,
        });
        world.sound.enabled = false;
        const enemy = world.enemies[0];
        enemy.x = 642;
        enemy.y = 510;
        enemy.direction = 1;
        const pose = Math.floor(clamp(Number(params.get('_pose') ?? '0'), 0, 5));
        if (scene === 'ebony-stomp') {
          beginSpecialGrapple(world, enemy);
          world.ebonyElapsed = pose * EBONY_STOMP_DURATION / 6 + .05;
          world.ebonyHitFrame = pose;
        } else if (scene === 'ebony-victory') {
          beginGenericDefeat(world, enemy);
          world.ebonyElapsed = [.1, 1, 1.6, 8][Math.min(3, pose)];
        } else {
          enemy.state = params.get('_action') === 'walk' ? 'walk'
            : params.get('_action') === 'run' ? 'run'
            : params.get('_action') === 'hurt' ? 'hurt' : 'attack';
          enemy.attackPoseIndex = pose % 3;
        }
        freezePreview = params.get('_freeze') === '1';
        setSnapshot(publishSnapshot(world));
      }
      if (scene === 'playing' || scene === 'roxy-kick' || scene === 'roxy-move' || scene === 'grapple' ||
          scene === 'special-defeat' || scene === STATE_NINJA_FOOTSMOTHER ||
          scene === STATE_ROXY_OFFER || scene === STATE_ROXY_CHALLENGE || scene === STATE_ROXY_SMOTHER ||
          scene === 'group-defeat') {
        const world = worldRef.current;
        if (scene === 'playing' || scene === 'roxy-kick' || scene === 'roxy-move') {
          world.phase = 'playing';
          world.heroX = WIDTH / 2;
          world.heroY = 508;
          world.heroHp = 100;
          world.defeatKind = null;
          world.isGrappleActive = false;
          world.currentGrappler = null;
          world.defeatSecondsLeft = 0;
          world.ninjaFootsmotherElapsed = 0;
          world.enemies.forEach((enemy) => {
            enemy.hp = 3;
            enemy.active = true;
            enemy.state = 'walk';
            enemy.stateTimer = 0;
            enemy.respawnAt = 0;
          });
          if (scene === 'roxy-kick' || scene === 'roxy-move') {
            const pose = clamp(Number(params.get('_pose') ?? 0), 0, 1);
            world.heroX = 654;
            const roxy = world.enemies.find((enemy) => enemy.kind === 'roxy');
            world.enemies.forEach((enemy) => {
              enemy.active = enemy === roxy;
              enemy.hp = enemy.active ? 3 : 0;
            });
            if (roxy) {
              roxy.x = 722;
              roxy.y = 522;
              roxy.direction = -1;
              roxy.state = scene === 'roxy-move'
                ? params.get('_action') === 'run' ? 'run' : 'walk' : 'attack';
              roxy.stride = Number(params.get('_stride') ?? '1.57');
              roxy.stateTimer = 10;
              roxy.attackCooldown = 8;
              roxy.attackPoseIndex = pose;
            }
            freezePreview = params.get('_freeze') === '1';
          }
        } else {
        const requestedKind = params.get('_grappler');
        const preferredKind: EnemyKind = requestedKind === 'roxy' ||
          scene === STATE_ROXY_OFFER || scene === STATE_ROXY_CHALLENGE || scene === STATE_ROXY_SMOTHER ? 'roxy'
          : requestedKind === 'amazon' ? 'amazon'
            : requestedKind === 'ninja' || scene === STATE_NINJA_FOOTSMOTHER
              ? 'ninja' : 'amazon';
        const ninjaFootsmotherScene = scene === STATE_NINJA_FOOTSMOTHER ||
          (scene === 'special-defeat' && preferredKind === 'ninja');
        const roxyOfferScene = scene === STATE_ROXY_OFFER;
        const roxyChallengeScene = scene === STATE_ROXY_CHALLENGE;
        const roxySmotherScene = scene === STATE_ROXY_SMOTHER;
        const activePhase: GamePhase = ninjaFootsmotherScene
          ? STATE_NINJA_FOOTSMOTHER
          : roxySmotherScene ? STATE_ROXY_SMOTHER : scene;
        const duration = activePhase === 'grapple' ? GRAPPLE_DURATION
          : activePhase === 'group-defeat' ? GROUP_DEFEAT_DURATION
          : activePhase === STATE_NINJA_FOOTSMOTHER
            ? NINJA_FOOTSMOTHER_DURATION
            : activePhase === STATE_ROXY_CHALLENGE || activePhase === STATE_ROXY_SMOTHER
              ? ROXY_DEFEAT_DURATION : SPECIAL_DEFEAT_DURATION;
        const requestedElapsed = Number(params.get('_elapsed') ?? 0);
        const elapsed = Number.isFinite(requestedElapsed)
          ? clamp(requestedElapsed, 0, duration - 0.1) : 0;
        world.phase = activePhase;
        world.heroX = clamp(WIDTH / 2, 180, WIDTH - 180);
        world.heroY = clamp(508, FLOOR_MIN, FLOOR_MAX);
        world.heroHp = activePhase === 'group-defeat' ? 0 : 35;
        world.defeatStartHp = 35;
        world.ninjaFootsmotherElapsed = ninjaFootsmotherScene ? elapsed : 0;
        world.roxyDefeatElapsed = roxyChallengeScene || roxySmotherScene ? elapsed : 0;
        world.roxyDialoguePlayed = roxyChallengeScene && elapsed >= 3.6;
        world.enemies.forEach((enemy) => {
          enemy.hp = 3;
          enemy.active = true;
        });
        const selectedGrappler = world.enemies.find((enemy) => enemy.kind === preferredKind) ??
          world.enemies[0];
        selectedGrappler.direction = selectedGrappler.x < world.heroX ? 1 : -1;
        selectedGrappler.x = clamp(
          world.heroX - selectedGrappler.direction * 72,
          64,
          WIDTH - 64,
        );
        selectedGrappler.y = world.heroY;
        selectedGrappler.state = 'attack';
        selectedGrappler.stateTimer = duration;
        world.currentGrappler = activePhase === 'group-defeat' ? null : selectedGrappler.id;
        world.defeatKind = activePhase === 'group-defeat' ? 'group'
          : activePhase === STATE_NINJA_FOOTSMOTHER ? 'ninja-footsmother'
          : activePhase === STATE_ROXY_SMOTHER ? 'roxy-smother'
          : activePhase === 'special-defeat' ? 'special' : null;
        world.isGrappleActive = activePhase === 'grapple' ||
          activePhase === 'special-defeat' || activePhase === STATE_NINJA_FOOTSMOTHER ||
          activePhase === STATE_ROXY_SMOTHER;
        world.grappleSecondsLeft = activePhase === 'grapple' ? duration - elapsed : 0;
        world.defeatSecondsLeft = activePhase === 'grapple' ? 0 : duration - elapsed;
        world.actionTimer = activePhase === 'group-defeat' && elapsed < 0.9 ? 0.9 - elapsed : 0;
        world.particles = [];
        if (roxyOfferScene || roxyChallengeScene) {
          world.heroAction = 'idle';
          world.enemies.forEach((enemy) => { enemy.state = 'idle'; });
          if (roxyOfferScene) {
            beginRoxyOffer(world, selectedGrappler);
          }
        }
        if (activePhase === 'group-defeat' && elapsed > 4) {
          const groupAmazons = world.enemies.filter((enemy) => enemy.kind === 'amazon');
          const groupNinjas = world.enemies.filter((enemy) => enemy.kind === 'ninja');
          world.enemies.forEach((enemy) => {
            const index = enemy.kind === 'amazon'
              ? groupAmazons.indexOf(enemy)
              : groupNinjas.indexOf(enemy);
            const groupCenterX = clamp(world.heroX, 80, WIDTH - 80);
            const darkCount = groupNinjas.length +
              world.enemies.filter((item) => item.kind === 'roxy' && item.hp > 0 && item.active).length;
            const darkIndex = enemy.kind === 'amazon'
              ? -1
              : world.enemies.filter((item) => item.kind !== 'amazon' &&
                  item.hp > 0 && item.active).indexOf(enemy);
            const amazonOffset = enemy.kind === 'amazon'
              ? GROUP_AMAZON_OFFSETS[index] : undefined;
            const darkOffsetX = darkCount <= 1 ? 0
              : (darkIndex - (darkCount - 1) / 2) * Math.min(220, 600 / (darkCount - 1));
            if (enemy.kind === 'amazon' && !amazonOffset) return;
            enemy.x = clamp(
              groupCenterX + (amazonOffset?.dx ?? darkOffsetX),
              64,
              WIDTH - 64,
            );
            const groupOffsetY = amazonOffset?.dy ?? -80 + (darkIndex % 2) * 6;
            enemy.y = clamp(world.heroY + groupOffsetY, FLOOR_MIN, FLOOR_MAX);
            enemy.pinElapsed = enemy.kind === 'amazon' ? elapsed - 3 : 0;
            enemy.state = 'idle';
            const offsetX = amazonOffset?.dx ?? darkOffsetX;
            enemy.direction = offsetX < 0 ? 1 : offsetX > 0 ? -1 : 1;
          });
        }
        }
        world.soundEnabled = false;
        world.sound.enabled = false;
        setSnapshot(publishSnapshot(world));
      }
    }

    const assetsReady = Promise.all([
      loadImage(backgroundUrl),
      loadImage(heroSheetUrl),
      loadImage(amazonSheetUrl),
      loadImage(ninjaSheetUrl),
      loadImage(ninjaFootsmotherUrl),
      loadImage(ninjaFootsmotherEndingUrl),
      loadImage(roxySheetUrl),
      loadImage(roxyHypnoUrl),
      loadImage(roxySmotherUrl),
      loadImage(pinAttackUrl),
      loadImage(pinExtendedUrl),
      loadImage(ebonySheetUrl),
      loadImage(ebonyStompUrl),
      loadImage(ebonyVictoryUrl),
      loadImage(ebonyDuoVictoryUrl),
      loadImage(karateBlondeSheetUrl),
      loadImage(karateBlondeAttackOneUrl),
      loadImage(karateBlondeAttackTwoUrl),
      loadImage(karateEbonySheetUrl),
      loadImage(karateEbonyAttackOneUrl),
      loadImage(karateEbonyAttackTwoUrl),
    ]).then(([
      background,
      hero,
      amazon,
      ninja,
      ninjaFootsmother,
      ninjaFootsmotherEnding,
      roxy,
      roxyHypno,
      roxySmother,
      pinAttack,
      pinExtended,
      ebony,
      ebonyStomp,
      ebonyVictory,
      ebonyDuoVictory,
      karateBlonde,
      karateBlondeAttackOne,
      karateBlondeAttackTwo,
      karateEbony,
      karateEbonyAttackOne,
      karateEbonyAttackTwo,
    ]) => {
      if (disposed) return;
      atlas = {
        background,
        hero: removeCheckerboard(hero),
        amazon: withRedToenails(removeCheckerboard(amazon), 'amazon'),
        ebony: withRedToenails(prepareEbonySheet(ebony, EBONY_BASE_CROPS), 'ebony'),
        ebonyStomp: withRedToenails(prepareEbonySheet(ebonyStomp, EBONY_STOMP), 'ebonyStomp'),
        ebonyVictory: withRedToenails(prepareEbonySheet(ebonyVictory, EBONY_VICTORY), 'ebonyVictory'),
        ebonyDuoVictory: withRedToenails(prepareEbonySheet(ebonyDuoVictory, EBONY_DUO_VICTORY, 572), 'ebonyDuoVictory'),
        karateBlonde: prepareKarateSheet(karateBlonde),
        karateBlondeAttackOne: (() => {
          const sheet = prepareKarateSheet(karateBlondeAttackOne, true);
          removeStoryboardHeadings(
            sheet,
            karateBlondeSequenceFrames(sheet.width, sheet.height),
            24,
          );
          return sheet;
        })(),
        karateBlondeAttackTwo: (() => {
          const sheet = prepareKarateSheet(karateBlondeAttackTwo, true);
          removeStoryboardHeadings(
            sheet,
            karateBlondeSequenceFrames(sheet.width, sheet.height),
            24,
          );
          return sheet;
        })(),
        karateEbony: prepareKarateSheet(karateEbony),
        karateEbonyAttackOne: (() => {
          const sheet = prepareKarateSheet(karateEbonyAttackOne, true);
          removeStoryboardHeadings(
            sheet,
            karateDuoSequenceFrames(sheet.width, sheet.height),
            48,
          );
          return sheet;
        })(),
        karateEbonyAttackTwo: (() => {
          const sheet = prepareKarateSheet(karateEbonyAttackTwo);
          removeStoryboardHeadings(
            sheet,
            karateEbonySequenceFrames(sheet.width, sheet.height),
            48,
            28,
          );
          return sheet;
        })(),
        ninja: removeNinjaCheckerboard(ninja),
        ninjaFootsmother: removeFootsmotherCheckerboard(ninjaFootsmother),
        ninjaFootsmotherEnding: removeFootsmotherCheckerboard(
          ninjaFootsmotherEnding,
          false,
        ),
        roxy: prepareRoxySheet(roxy),
        roxyHypno: removeRoxyCheckerboard(roxyHypno, ROXY_HYPNO_FRAMES),
        roxySmother: removeRoxyCheckerboard(roxySmother, ROXY_SMOTHER_FRAMES),
        pinAttack: withRedToenails(removeCheckerboard(pinAttack, true), 'pinAttack'),
        pinExtended: withRedToenails(removeCheckerboard(pinExtended, true), 'pinExtended'),
      };
      if (atlas.hero) {
        const portrait = document.createElement('canvas');
        portrait.width = 105;
        portrait.height = 178;
        const portraitContext = portrait.getContext('2d');
        portraitContext?.drawImage(atlas.hero, 28, 83, 105, 178, 0, 0, 105, 178);
        setHeroPortrait(portrait.toDataURL());
      }
    });

    const loop = (time: number) => {
      if (disposed) return;
      if (canvas.width !== WIDTH || canvas.height !== HEIGHT) {
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
      }
      const world = worldRef.current;
      const dt = lastTime === 0 ? 0 : Math.min(0.045, (time - lastTime) / 1000);
      lastTime = time;
      if (!freezePreview) stepWorld(world, dt, time, pressedRef.current);
      drawWorld(context, world, atlas, time);
      if (time - lastPublish >= 100) {
        setSnapshot(publishSnapshot(world));
        lastPublish = time;
      }
      frameId = window.requestAnimationFrame(loop);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
      ) {
        return;
      }
      if (event.target instanceof HTMLElement && event.target.tagName === 'BUTTON' &&
          (event.code === 'Space' || event.code === 'Enter' || event.code === 'NumpadEnter')) {
        return;
      }
      const controlKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
      ];
      if (controlKeys.includes(event.code)) event.preventDefault();
      pressVirtualControl(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressedRef.current.delete(event.code);
    };
    const clearPressed = () => pressedRef.current.clear();

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearPressed);
    frameId = window.requestAnimationFrame(loop);

    void assetsReady.catch((error: unknown) => {
      if (!disposed) {
        setSnapshot((current) => ({ ...current, phase: current.phase }));
        throw error;
      }
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      stopClips(worldRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearPressed);
      if (worldRef.current.sound.context) {
        void worldRef.current.sound.context.close();
      }
    };
  }, [canvasRef, pressVirtualControl, restartGame, startGame]);

  return {
    snapshot,
    startGame,
    restartGame,
    retryGame,
    exitEbonyVictory,
    toggleSound,
    chooseRoxyChallenge,
    exitRoxyChallenge,
    chooseKarateChallenge,
    exitKarateChallenge,
    heroPortrait,
    pressVirtualControl,
    releaseVirtualControl,
  };
}
