# Jungle Beatdown: 2.5D Beat 'Em Up Spec

## 1. Asset Mapping (`assets/`)
- `assets/background.png`: Forest/ruins background (100% opaque, no chroma key).
- `assets/hero.png`: Blonde explorer heroine spritesheet (IDLE, WALK, RUN, PUNCH, KICK, JUMP, HURT, KNOCKDOWN, DEFEATED).
- `assets/amazon.png`: Muscular bare-foot Amazon spritesheet (100% kicks: IDLE, WALK, RUN, FRONT_KICK, SPIN_KICK, HIGH_KICK, HURT, KNOCKDOWN, DEFEATED).
- `assets/pin_attack.png`: Grapple phase 1 combined spritesheet (Amazon knock-down kick + chest pin stance).
- `assets/pin_extended.png`: Grapple phase 2 combined spritesheet (Foot on face + pink smoke + hearts + mutual smiles).

## 2. Chroma Keying (Canvas Pre-processing)
- On boot, process `hero.png`, `amazon.png`, `pin_attack.png`, `pin_extended.png` via `ctx.getImageData`:
  - Target neutral gray/white checkerboard pixels (`|r-g| < 15 && |g-b| < 15 && r > 70`).
  - Set alpha `A = 0`. Cache clean images on off-screen canvases.
  - DO NOT chroma-key `background.png`.

## 3. World Constraints & 2.5D Ground Plane
- Strict movement constraint: All entities (Hero & Amazonas) must clamp Y coordinates strictly within the lower ground zone of `background.png` (75% to 95% of canvas height).
- No character may drift or jump above this walkable forest floor.
- Draw sorting: `entities.sort((a, b) => a.y - b.y)` on every render loop.

## 4. Multi-Enemy System & Grapple Lock
- `TARGET_AMAZONS = 5`: Maintain 5 active Amazonas at all times.
- Auto-respawn: When an Amazon is defeated, spawn a new one from screen edges after 2s with slight `hue-rotate` variation.
- Null-safe logic: Always iterate via `amazons.filter(a => a.hp > 0 && a.active)`.
- Global Grapple Lock:
  - `isGrappleActive = false`, `currentGrappler = null`.
  - When an Amazon connects a pin, set `isGrappleActive = true`.
  - While active, the other 4 Amazonas MUST enter passive standby/perimeter patrol.
  - Block all attacks, damage, and second-grapple attempts from any other enemy.
  - Release lock (`isGrappleActive = false`) only upon successful QTE escape.

## 5. Defeat & Struggle Mechanics

### Sequence A: Special Grapple Defeat (1v1)
1. **Phase 1 (QTE)**: Render `pin_attack.png`. Show "MASH [J] TO BREAK FREE!" with 5s countdown.
   - If player mashes `J` successfully: Hero kicks off Amazon, recovers to IDLE, lock released.
2. **Phase 2 (10s Foot on Face)**: On QTE failure, switch to `pin_extended.png`.
   - Amazon pins foot directly on Hero's face.
   - Spawn continuous pink smoke particles + floating pink hearts from foot contact point.
   - Both characters display smiling expressions.
   - Hero struggles for exactly 10.0s while HP drains to 0. Trigger Game Over.

### Sequence B: Regular Combat Defeat (20s Group Pin)
- Trigger: Hero HP reaches 0 via standard kicks.
- Hero transitions to lying down `DEFEATED` frame from `hero.png`.
- All 5 Amazonas converge to Hero's exact coordinate using relative offsets:
  1. Chest/Torso (`dx: -25, dy: -8`)
  2. Abdomen (`dx: 15, dy: 6, flipped: true`)
  3. Thighs/Legs (`dx: 45, dy: 4, flipped: true`)
  4. Left Arm/Shoulder (`dx: -50, dy: -12`)
  5. Ribs/Flank (`dx: 30, dy: -10, flipped: true`)
- Render all 5 Amazonas in standing foot-down pin frames over the Hero.
- Maintain simultaneous pin pose for exactly 20.0s with subtle screen shake before Game Over screen.

## 6. Audio (Web Audio API Synthesizer)
- Kick/Punch: Noise burst + descending frequency sweep.
- Footstep/Heavy Stomp: Low sub-bass sine burst (100Hz -> 25Hz).
- Pink Smoke: Modulated soft sine wave sweep.
- Game Over: Descending 8-bit tone melody.