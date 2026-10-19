import { PANTERA_ATTACK_FRAMES, PANTERA_FRAMES, PANTERA_VICTORY_FRAME } from './panteraSprites';

export const PANTERA_COMBO_DURATION = 6;
export const PANTERA_COMBO_HITS = [
  { time: .22, damage: 8 },
  { time: .8, damage: 12 },
  { time: 2.12, damage: 12 },
  { time: 2.84, damage: 12 },
  { time: 3.56, damage: 12 },
] as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const p = clamp01(value);
  return p * p * (3 - 2 * p);
};

/** Ground-relative choreography; the sprites never scale with jumps or impacts. */
export function panteraComboPose(time: number) {
  const t = Math.max(0, time);
  if (t < .55) {
    return {
      stage: 'advance', frame: PANTERA_ATTACK_FRAMES[t < .16 ? 0 : 2],
      x: -135 + 80 * ease(t / .4), lift: 0, groundOffset: 0,
      hero: 'hurt', heroX: 75, heroLift: 0, impact: 0,
    } as const;
  }
  if (t < 1.3) {
    const fall = ease((t - .8) / .5);
    return {
      stage: 'knockdown', frame: PANTERA_ATTACK_FRAMES[5],
      x: -55, lift: Math.sin(clamp01((t - .55) / .75) * Math.PI) * 6,
      groundOffset: 0, hero: t < .9 ? 'hurt' : 'down',
      heroX: 75 + fall * 30, heroLift: Math.sin(fall * Math.PI) * 25, impact: 0,
    } as const;
  }
  if (t < 1.6) {
    return {
      stage: 'prepare', frame: PANTERA_FRAMES.walk,
      x: -55 + 95 * ease((t - 1.3) / .3), lift: 0, groundOffset: 0,
      hero: 'defeated', heroX: 105, heroLift: 0, impact: 0,
    } as const;
  }
  if (t < 3.76) {
    const cycle = (t - 1.6) % .72;
    const landing = .52;
    const airborne = cycle < landing;
    return {
      stage: 'stomp', frame: airborne ? PANTERA_ATTACK_FRAMES[4] : PANTERA_FRAMES.idle,
      x: 40, lift: airborne ? Math.sin(cycle / landing * Math.PI) * 44 : 0,
      groundOffset: -24, hero: 'defeated', heroX: 105,
      heroLift: 0, impact: airborne ? 0 : 1 - (cycle - landing) / .2,
    } as const;
  }
  const retreat = ease((t - 3.76) / .6);
  return {
    stage: 'victory', frame: retreat < 1 ? PANTERA_FRAMES.walk : PANTERA_VICTORY_FRAME,
    x: 40 - 150 * retreat, lift: 0, groundOffset: retreat === 1 ? 0 : -24 * (1 - retreat),
    hero: 'defeated', heroX: 105, heroLift: 0, impact: 0,
  } as const;
}
