---
name: Sequence visibility
description: User's requirement that defeat and struggle action remain visible while their countdown runs.
---

Keep defeat and struggle scenes visible without a modal or full-screen dimming layer. Show countdown indicators for active grapples and custom timed struggles, but not for generic defeats.

Do not show a Game Over screen at the end. Generic defeats may hold the heroine's final fainted pose; custom struggle sequences keep their specified motion.

**Why:** The user reported that “aparece uma janela com contagem que não deixa ver mais nada,” requested “deixe mais clean,” and then explicitly said “Tire a tela da game over, e deixe elas se movimentando.”

**How to apply:** Put countdown and escape instructions outside the main fight area and never replace the scene with an end-screen modal.

In generic defeats, keep active enemies visible in neutral idle poses at their current positions. Do not animate, reposition, or use enemy defeat/pin poses. Hide the generic defeat countdown card while keeping the internal transition timer.

**Why:** The user asked to remove enemy animations during generic defeats and said the heroine does not need a counter when she falls.

**How to apply:** Freeze enemies in idle poses, keep the heroine's fall/faint progression, and omit only the generic defeat HUD; preserve the timer that advances the game state.

Both Ninja Footsmother and Amazon custom struggle defeats use sound, respecting the player's global sound switch.

**Why:** The user requested sound for both custom defeats, then asked for a softer heroine struggle voice and deep breathing during the smoke.

**How to apply:** Use the enemy laugh on entry, alternate subdued heroine effort cues with slow deep breaths during smoke, and use the fainting/sigh cue at completion. Avoid overlapping heroine voices or continuing loops after the final pose.

For the Kunoichi's ten-second defeat, use the original six-frame sheet for the opening 8.5 seconds and the new three-frame sheet for the final 1.5 seconds. Once HP reaches zero, hold the last frame of the new sheet.

**Why:** The user wants the new sequence to finish the Ninja defeat, preserve the ten-second HP drain, and hold its final pose. The end pose can be static without adding a Game Over screen.

**How to apply:** Select the ending sheet from elapsed defeat time; keep the HP timer unchanged and clamp its frame index to the last frame after the defeat transition.
