import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import amazonSheetUrl from '@assets/amazon_1791470375689.png';
import backgroundUrl from '@assets/background_1791470375690.png';
import heroSheetUrl from '@assets/hero_1791470375690.png';
import pinAttackUrl from '@assets/pin_attack_1791470375691.png';
import pinExtendedUrl from '@assets/pin_extended_1791470375691.png';

const WIDTH = 1024;
const HEIGHT = 576;
const TARGET_AMAZONS = 5;
const FLOOR_MIN = HEIGHT * 0.75;
const FLOOR_MAX = HEIGHT * 0.95;

export type GamePhase =
  | 'title'
  | 'playing'
  | 'grapple'
  | 'special-defeat'
  | 'group-defeat'
  | 'game-over';

export interface GameSnapshot {
  phase: GamePhase;
  heroHp: number;
  maxHeroHp: number;
  activeEnemies: number;
  defeatedEnemies: number;
  score: number;
  grappleSecondsLeft: number;
  escapeProgress: number;
  defeatSecondsLeft: number;
  soundEnabled: boolean;
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
  pinAttack: HTMLCanvasElement | null;
  pinExtended: HTMLCanvasElement | null;
}

type EnemyState = 'idle' | 'walk' | 'attack' | 'hurt' | 'down';

interface Amazon {
  id: number;
  x: number;
  y: number;
  hp: number;
  active: boolean;
  direction: -1 | 1;
  state: EnemyState;
  stateTimer: number;
  attackCooldown: number;
  respawnAt: number;
  hue: number;
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

interface World {
  phase: GamePhase;
  defeatKind: 'special' | 'group' | null;
  heroX: number;
  heroY: number;
  heroHp: number;
  facing: -1 | 1;
  heroAction: 'idle' | 'walk' | 'run' | 'punch' | 'kick' | 'jump' | 'hurt';
  actionTimer: number;
  jumpOffset: number;
  jumpVelocity: number;
  heroHitCooldown: number;
  score: number;
  defeatedEnemies: number;
  enemies: Amazon[];
  currentGrappler: number | null;
  grappleSecondsLeft: number;
  escapeProgress: number;
  defeatSecondsLeft: number;
  defeatStartHp: number;
  footstepTimer: number;
  groupShake: number;
  soundEnabled: boolean;
  sound: SoundEngine;
  particles: Particle[];
  smokeTimer: number;
  heartTimer: number;
  randomSeed: number;
}

type SoundEngine = {
  context: AudioContext | null;
  enabled: boolean;
};

const HERO_FRAMES = {
  idle: { x: 28, y: 83, w: 105, h: 178 },
  walk: { x: 348, y: 83, w: 110, h: 178 },
  run: { x: 710, y: 84, w: 145, h: 177 },
  punch: { x: 113, y: 337, w: 142, h: 181 },
  kick: { x: 430, y: 337, w: 153, h: 182 },
  jump: { x: 820, y: 317, w: 108, h: 179 },
  hurt: { x: 25, y: 575, w: 159, h: 180 },
  down: { x: 318, y: 575, w: 172, h: 179 },
  defeated: { x: 814, y: 648, w: 191, h: 106 },
} satisfies Record<string, SpriteRect>;

const AMAZON_FRAMES = {
  idle: { x: 27, y: 82, w: 110, h: 179 },
  walk: { x: 367, y: 83, w: 112, h: 178 },
  run: { x: 704, y: 83, w: 150, h: 178 },
  kick: { x: 124, y: 333, w: 136, h: 186 },
  spin: { x: 343, y: 333, w: 153, h: 186 },
  highKick: { x: 562, y: 331, w: 153, h: 189 },
  pinPose: { x: 691, y: 337, w: 111, h: 182 },
  hurt: { x: 24, y: 571, w: 164, h: 186 },
  down: { x: 385, y: 571, w: 172, h: 181 },
  defeated: { x: 817, y: 650, w: 191, h: 106 },
} satisfies Record<string, SpriteRect>;

const GROUP_OFFSETS = [
  { dx: -25, dy: -8, flipped: false },
  { dx: 15, dy: 6, flipped: true },
  { dx: 45, dy: 4, flipped: true },
  { dx: -50, dy: -12, flipped: false },
  { dx: 30, dy: -10, flipped: true },
] as const;

const initialSnapshot: GameSnapshot = {
  phase: 'title',
  heroHp: 100,
  maxHeroHp: 100,
  activeEnemies: TARGET_AMAZONS,
  defeatedEnemies: 0,
  score: 0,
  grappleSecondsLeft: 0,
  escapeProgress: 0,
  defeatSecondsLeft: 0,
  soundEnabled: true,
};

function createEnemy(id: number, index: number): Amazon {
  return {
    id,
    x: 460 + index * 112,
    y: 475 + ((index * 29) % 55),
    hp: 3,
    active: true,
    direction: -1,
    state: 'idle',
    stateTimer: 0,
    attackCooldown: 1.3 + index * 0.32,
    respawnAt: 0,
    hue: index === 0 ? 0 : ((index * 19) % 41) - 20,
  };
}

function createWorld(): World {
  return {
    phase: 'title',
    defeatKind: null,
    heroX: 175,
    heroY: 479,
    heroHp: 100,
    facing: 1,
    heroAction: 'idle',
    actionTimer: 0,
    jumpOffset: 0,
    jumpVelocity: 0,
    heroHitCooldown: 0,
    score: 0,
    defeatedEnemies: 0,
    enemies: Array.from({ length: TARGET_AMAZONS }, (_, index) =>
      createEnemy(index + 1, index),
    ),
    currentGrappler: null,
    grappleSecondsLeft: 0,
    escapeProgress: 0,
    defeatSecondsLeft: 0,
    defeatStartHp: 100,
    footstepTimer: 0,
    groupShake: 0,
    soundEnabled: true,
    sound: { context: null, enabled: true },
    particles: [],
    smokeTimer: 0,
    heartTimer: 0,
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
    defeatedEnemies: world.defeatedEnemies,
    score: world.score,
    grappleSecondsLeft: Math.max(0, world.grappleSecondsLeft),
    escapeProgress: world.escapeProgress,
    defeatSecondsLeft: Math.max(0, world.defeatSecondsLeft),
    soundEnabled: world.soundEnabled,
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

function removeCheckerboard(image: HTMLImageElement) {
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
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // These supplied sheets also contain dark gray checker tiles.
    // Keep near-black outlines, while keying both checkerboard shades.
    if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 20) {
      pixels[i + 3] = 0;
    }
  }
  context.putImageData(frame, 0, 0);
  return canvas;
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

function playGameOver(world: World) {
  const notes = [392, 349, 311, 261, 196];
  notes.forEach((note, index) => {
    window.setTimeout(
      () => playSweep(world, note, note * 0.96, 0.17, 0.1, 'square'),
      index * 155,
    );
  });
}

function spawnParticle(world: World, kind: Particle['kind']) {
  const heroX = world.heroX + world.facing * 18;
  const heroY = world.heroY - 58;
  world.particles.push({
    x: heroX + (random(world) - 0.5) * 34,
    y: heroY + (random(world) - 0.5) * 10,
    vx: (random(world) - 0.4) * 22,
    vy: kind === 'heart' ? -38 - random(world) * 18 : -17 - random(world) * 11,
    age: 0,
    life: kind === 'heart' ? 1.65 : 1.2,
    kind,
    size: kind === 'heart' ? 9 + random(world) * 8 : 12 + random(world) * 12,
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
) {
  if (!image) {
    context.fillStyle = hue ? '#a66a3f' : '#68734a';
    context.fillRect(x - drawW / 2, groundY - drawH - lift, drawW, drawH);
    return;
  }

  context.save();
  if (hue) context.filter = `hue-rotate(${hue}deg) saturate(0.88)`;
  if (flipped) {
    context.translate(x, 0);
    context.scale(-1, 1);
    context.translate(-x, 0);
  }
  context.drawImage(
    image,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    x - drawW / 2,
    groundY - drawH - lift,
    drawW,
    drawH,
  );
  context.restore();
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

  if (world.phase === 'group-defeat' || (world.phase === 'game-over' && world.defeatKind === 'group')) {
    const tremor =
      world.phase === 'group-defeat' && world.groupShake > 0
        ? Math.sin(now / 34) * world.groupShake
        : 0;
    const centerX = clamp(world.heroX + tremor, 135, WIDTH - 135);
    const centerY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);
    drawAtlasSprite(
      context,
      atlas.hero,
      HERO_FRAMES.defeated,
      centerX,
      centerY,
      226,
      132,
      world.facing < 0,
    );
    GROUP_OFFSETS.map((offset, index) => ({ offset, index }))
      .sort((a, b) => a.offset.dy - b.offset.dy)
      .forEach(({ offset, index }) => {
      drawAtlasSprite(
        context,
        atlas.amazon,
        AMAZON_FRAMES.pinPose,
        centerX + offset.dx,
        clamp(centerY + offset.dy, FLOOR_MIN, FLOOR_MAX),
        160,
        188,
        offset.flipped,
        world.enemies[index]?.hue ?? 0,
      );
    });
  } else {
    const actors: Array<{ y: number; draw: () => void }> = [];
    const activeEnemies = world.enemies.filter(
      (amazon) => amazon.hp > 0 && amazon.active,
    );

    for (const amazon of activeEnemies) {
      let rect = AMAZON_FRAMES.idle;
      if (amazon.state === 'walk') rect = AMAZON_FRAMES.walk;
      else if (amazon.state === 'attack') rect = AMAZON_FRAMES.kick;
      else if (amazon.state === 'hurt') rect = AMAZON_FRAMES.hurt;
      else if (amazon.state === 'down') rect = AMAZON_FRAMES.down;
      actors.push({
        y: amazon.y,
        draw: () =>
          drawAtlasSprite(
            context,
            atlas.amazon,
            rect,
            amazon.x,
            amazon.y,
            126,
            180,
            amazon.direction < 0,
            amazon.hue,
          ),
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

    if (world.phase === 'grapple' && world.currentGrappler !== null) {
      const grappler = activeEnemies.find((amazon) => amazon.id === world.currentGrappler);
      const overlayX = grappler ? (world.heroX + grappler.x) / 2 : world.heroX;
      drawAtlasSprite(
        context,
        atlas.pinAttack,
        { x: 5, y: 45, w: 348, h: 320 },
        overlayX,
        clamp(Math.max(world.heroY, grappler?.y ?? world.heroY), FLOOR_MIN, FLOOR_MAX),
        340,
        300,
        false,
      );
    }

    if (world.phase === 'special-defeat' || (world.phase === 'game-over' && world.defeatKind === 'special')) {
      drawAtlasSprite(
        context,
        atlas.pinExtended,
        { x: 687, y: 61, w: 326, h: 316 },
        world.heroX,
        clamp(world.heroY, FLOOR_MIN, FLOOR_MAX),
        352,
        318,
        world.facing < 0,
      );
    }
  }

  if (world.phase === 'special-defeat' || (world.phase === 'game-over' && world.defeatKind === 'special')) {
    world.particles.forEach((particle) => drawParticle(context, particle));
  }

  if (world.phase === 'grapple') {
    context.fillStyle = 'rgba(9, 13, 13, .34)';
    context.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function enterGameOver(world: World) {
  if (world.phase === 'game-over') return;
  world.phase = 'game-over';
  world.defeatSecondsLeft = 0;
  playGameOver(world);
}

function beginSpecialGrapple(world: World, amazon: Amazon) {
  world.phase = 'grapple';
  world.currentGrappler = amazon.id;
  world.grappleSecondsLeft = 5;
  world.escapeProgress = 0;
  world.heroAction = 'hurt';
  amazon.state = 'attack';
  amazon.stateTimer = 5.2;
  world.heroHitCooldown = 1.1;
  playStomp(world);
}

function escapeGrapple(world: World) {
  world.phase = 'playing';
  world.currentGrappler = null;
  world.grappleSecondsLeft = 0;
  world.escapeProgress = 0;
  world.heroAction = 'idle';
  world.actionTimer = 0.35;
  world.heroHitCooldown = 1.2;
  world.heroX = clamp(world.heroX - world.facing * 60, 48, WIDTH - 48);
  playHit(world);
}

function doHeroAttack(world: World, action: 'punch' | 'kick') {
  if (world.phase !== 'playing') return;
  if (world.actionTimer > 0) return;
  world.heroAction = action;
  world.actionTimer = action === 'punch' ? 0.25 : 0.38;
  const range = action === 'punch' ? 112 : 148;
  const damage = action === 'punch' ? 1 : 1;
  let connected = false;

  for (const amazon of world.enemies.filter((item) => item.hp > 0 && item.active)) {
    const dx = amazon.x - world.heroX;
    const dy = Math.abs(amazon.y - world.heroY);
    if (
      dy < 65 &&
      Math.abs(dx) < range &&
      (Math.sign(dx) === world.facing || Math.abs(dx) < 42)
    ) {
      amazon.hp -= damage;
      amazon.state = amazon.hp <= 0 ? 'down' : 'hurt';
      amazon.stateTimer = amazon.hp <= 0 ? 2 : 0.34;
      amazon.attackCooldown = Math.max(amazon.attackCooldown, 0.7);
      connected = true;
      if (amazon.hp <= 0) {
        amazon.active = false;
        amazon.respawnAt = performance.now() + 2000;
        world.score += 100;
        world.defeatedEnemies += 1;
      }
    }
  }
  if (connected) playHit(world);
}

function handleMovement(world: World, pressed: Set<string>, dt: number) {
  if (world.phase !== 'playing') return;
  let horizontal = 0;
  let depth = 0;
  if (pressed.has('KeyA') || pressed.has('ArrowLeft')) horizontal -= 1;
  if (pressed.has('KeyD') || pressed.has('ArrowRight')) horizontal += 1;
  if (pressed.has('KeyW') || pressed.has('ArrowUp')) depth -= 1;
  if (pressed.has('KeyS') || pressed.has('ArrowDown')) depth += 1;
  const moving = horizontal !== 0 || depth !== 0;
  const running = pressed.has('ShiftLeft') || pressed.has('ShiftRight');
  const speed = running ? 326 : 220;

  if (horizontal !== 0) {
    world.facing = horizontal < 0 ? -1 : 1;
    world.heroX += horizontal * speed * dt;
  }
  if (depth !== 0) world.heroY += depth * 142 * dt;
  world.heroX = clamp(world.heroX, 48, WIDTH - 48);
  world.heroY = clamp(world.heroY, FLOOR_MIN, FLOOR_MAX);

  if (moving && world.jumpOffset <= 0 && world.actionTimer <= 0) {
    world.heroAction = running ? 'run' : 'walk';
    world.footstepTimer -= dt;
    if (world.footstepTimer <= 0) {
      playSweep(world, 100, 25, 0.13, 0.025);
      world.footstepTimer = running ? 0.22 : 0.38;
    }
  } else if (!moving && world.actionTimer <= 0 && world.jumpOffset <= 0) {
    world.heroAction = 'idle';
  }
}

function updateEnemies(world: World, dt: number, now: number) {
  const activeEnemies = world.enemies.filter(
    (amazon) => amazon.hp > 0 && amazon.active,
  );

  if (world.phase === 'playing') {
    for (const amazon of world.enemies) {
      if (!amazon.active && amazon.respawnAt > 0 && now >= amazon.respawnAt) {
        const edge = random(world) > 0.5 ? -22 : WIDTH + 22;
        amazon.x = edge;
        amazon.y = FLOOR_MIN + 12 + random(world) * (FLOOR_MAX - FLOOR_MIN - 12);
        amazon.hp = 3;
        amazon.active = true;
        amazon.state = 'walk';
        amazon.stateTimer = 1;
        amazon.respawnAt = 0;
        amazon.hue = Math.round(random(world) * 60 - 30);
      }
    }
  }

  for (const amazon of activeEnemies) {
    amazon.stateTimer = Math.max(0, amazon.stateTimer - dt);
    amazon.attackCooldown = Math.max(0, amazon.attackCooldown - dt);
    if (amazon.stateTimer <= 0 && (amazon.state === 'hurt' || amazon.state === 'down')) {
      amazon.state = 'idle';
    }
    if (world.phase === 'group-defeat' || world.phase === 'game-over') {
      continue;
    }

    if (world.phase === 'grapple' || world.phase === 'special-defeat') {
      if (amazon.id !== world.currentGrappler) {
        const orbit = Math.atan2(amazon.y - world.heroY, amazon.x - world.heroX);
        amazon.x += Math.cos(orbit + 0.18) * 22 * dt;
        amazon.y += Math.sin(orbit + 0.18) * 16 * dt;
        amazon.y = clamp(amazon.y, FLOOR_MIN, FLOOR_MAX);
        amazon.state = 'walk';
      }
      continue;
    }
    if (world.phase !== 'playing') continue;

    const dx = world.heroX - amazon.x;
    const dy = world.heroY - amazon.y;
    const distance = Math.hypot(dx, dy);
    amazon.direction = dx < 0 ? -1 : 1;

    if (distance > 78) {
      const pace = distance > 250 ? 92 : 68;
      amazon.x += (dx / Math.max(distance, 1)) * pace * dt;
      amazon.y += (dy / Math.max(distance, 1)) * pace * 0.56 * dt;
      amazon.state = 'walk';
    } else if (amazon.attackCooldown <= 0) {
      amazon.state = 'attack';
      amazon.stateTimer = 0.48;
      amazon.attackCooldown = 1.35 + random(world) * 0.8;
      if (distance < 106 && world.heroHitCooldown <= 0) {
        world.heroHp = Math.max(0, world.heroHp - (7 + Math.floor(random(world) * 4)));
        world.heroHitCooldown = 0.68;
        world.heroAction = 'hurt';
        world.actionTimer = 0.36;
        playStomp(world);
        if (world.heroHp <= 0) {
          world.phase = 'group-defeat';
          world.defeatKind = 'group';
          world.defeatSecondsLeft = 20;
          world.groupShake = 3;
          world.heroAction = 'hurt';
          continue;
        }
        if (world.heroHp <= 42 && random(world) < 0.1) {
          beginSpecialGrapple(world, amazon);
          continue;
        }
      }
    } else if (amazon.state !== 'attack' && amazon.state !== 'hurt') {
      amazon.state = 'idle';
    }
    amazon.x = clamp(amazon.x, -24, WIDTH + 24);
    amazon.y = clamp(amazon.y, FLOOR_MIN, FLOOR_MAX);
  }

  if (world.phase === 'group-defeat') {
    const offsets = GROUP_OFFSETS;
    world.enemies.forEach((amazon, index) => {
      const offset = offsets[index % offsets.length];
      amazon.x += (world.heroX + offset.dx - amazon.x) * Math.min(1, dt * 1.7);
      amazon.y += (world.heroY + offset.dy - amazon.y) * Math.min(1, dt * 1.7);
      amazon.y = clamp(amazon.y, FLOOR_MIN, FLOOR_MAX);
      amazon.state = 'attack';
    });
  }

  if (activeEnemies.length < TARGET_AMAZONS && world.phase === 'playing') {
    // Defeated opponents remain inactive until their individual two-second respawn.
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
      world.heroHp = 0;
      world.phase = 'group-defeat';
      world.defeatKind = 'group';
      world.defeatSecondsLeft = 20;
    }
  } else if (world.phase === 'grapple') {
    world.grappleSecondsLeft = Math.max(0, world.grappleSecondsLeft - dt);
    if (world.grappleSecondsLeft <= 0) {
      world.phase = 'special-defeat';
      world.defeatKind = 'special';
      world.defeatSecondsLeft = 10;
      world.defeatStartHp = world.heroHp;
      world.particles = [];
      world.smokeTimer = 0;
      world.heartTimer = 0.12;
      playSweep(world, 550, 220, 0.6, 0.045, 'sine');
    }
  } else if (world.phase === 'special-defeat') {
    world.defeatSecondsLeft = Math.max(0, world.defeatSecondsLeft - dt);
    world.heroHp = Math.max(0, (world.defeatSecondsLeft / 10) * world.defeatStartHp);
    world.smokeTimer -= dt;
    world.heartTimer -= dt;
    if (world.smokeTimer <= 0) {
      spawnParticle(world, 'smoke');
      world.smokeTimer = 0.14;
      playSweep(world, 350, 245, 0.3, 0.014, 'sine');
    }
    if (world.heartTimer <= 0) {
      spawnParticle(world, 'heart');
      world.heartTimer = 0.46;
    }
    world.particles.forEach((particle) => {
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy -= 8 * dt;
    });
    world.particles = world.particles.filter((particle) => particle.age < particle.life);
    if (world.defeatSecondsLeft <= 0) {
      world.heroHp = 0;
      enterGameOver(world);
    }
  } else if (world.phase === 'group-defeat') {
    world.defeatSecondsLeft = Math.max(0, world.defeatSecondsLeft - dt);
    world.groupShake = 1.5 + Math.sin(now / 145) * 0.7;
    if (world.defeatSecondsLeft <= 0) enterGameOver(world);
  }

  updateEnemies(world, dt, now);
}

function canvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas 2D is not supported in this browser.');
  return context;
}

export function useJungleGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const worldRef = useRef<World>(createWorld());
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [heroPortrait, setHeroPortrait] = useState<string | null>(null);
  const pressedRef = useRef<Set<string>>(new Set());

  const startGame = useCallback(() => {
    const world = worldRef.current;
    if (world.phase === 'title' || world.phase === 'game-over') {
      const soundEnabled = world.soundEnabled;
      const previousContext = world.sound.context;
      Object.assign(world, createWorld(), {
        phase: 'playing',
        soundEnabled,
        sound: { context: previousContext, enabled: soundEnabled },
      });
      pressedRef.current.clear();
      setSnapshot(publishSnapshot(world));
      if (soundEnabled) playStomp(world);
    }
  }, []);

  const restartGame = useCallback(() => {
    const world = worldRef.current;
    const soundEnabled = world.soundEnabled;
    const previousContext = world.sound.context;
    Object.assign(world, createWorld(), {
      phase: 'playing',
      soundEnabled,
      sound: { context: previousContext, enabled: soundEnabled },
    });
    pressedRef.current.clear();
    setSnapshot(publishSnapshot(world));
    if (soundEnabled) playStomp(world);
  }, []);

  const toggleSound = useCallback(() => {
    const world = worldRef.current;
    world.soundEnabled = !world.soundEnabled;
    world.sound.enabled = world.soundEnabled;
    if (!world.soundEnabled && world.sound.context) {
      void world.sound.context.suspend();
    }
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
    let atlas: SpriteAtlas = {
      background: null,
      hero: null,
      amazon: null,
      pinAttack: null,
      pinExtended: null,
    };

    const assetsReady = Promise.all([
      loadImage(backgroundUrl),
      loadImage(heroSheetUrl),
      loadImage(amazonSheetUrl),
      loadImage(pinAttackUrl),
      loadImage(pinExtendedUrl),
    ]).then(([background, hero, amazon, pinAttack, pinExtended]) => {
      if (disposed) return;
      atlas = {
        background,
        hero: removeCheckerboard(hero),
        amazon: removeCheckerboard(amazon),
        pinAttack: removeCheckerboard(pinAttack),
        pinExtended: removeCheckerboard(pinExtended),
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
      stepWorld(world, dt, time, pressedRef.current);
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
        ['INPUT', 'TEXTAREA'].includes(event.target.tagName)
      ) {
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
      pressedRef.current.add(event.code);
      const world = worldRef.current;
      if (event.code === 'KeyJ') {
        if (world.phase === 'grapple') {
          world.escapeProgress = Math.min(1, world.escapeProgress + 0.105);
          if (world.escapeProgress >= 1) escapeGrapple(world);
          playHit(world);
        } else if (world.phase === 'playing' && !event.repeat) {
          doHeroAttack(world, 'punch');
        } else if (world.phase === 'title' && !event.repeat) {
          startGame();
        }
      }
      if (event.code === 'KeyK' && world.phase === 'playing' && !event.repeat) {
        doHeroAttack(world, 'kick');
      }
      if (event.code === 'Space' && world.phase === 'playing' && world.jumpOffset === 0) {
        world.jumpVelocity = 380;
        world.heroAction = 'jump';
        world.actionTimer = 0.32;
        playStomp(world);
      }
      if ((event.code === 'Enter' || event.code === 'NumpadEnter') && world.phase === 'title') {
        startGame();
      }
      if (event.code === 'KeyR' && world.phase === 'game-over') restartGame();
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
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearPressed);
      if (worldRef.current.sound.context) {
        void worldRef.current.sound.context.close();
      }
    };
  }, [canvasRef, restartGame, startGame]);

  return { snapshot, startGame, restartGame, toggleSound, heroPortrait };
}
