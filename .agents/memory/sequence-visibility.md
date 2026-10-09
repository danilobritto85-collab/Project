---
name: Sequence visibility
description: User's requirement that defeat and struggle action remain visible while their countdown runs.
---

Keep defeat and struggle scenes visible. Use small countdown indicators rather than a modal or full-screen dimming layer during the sequence.

Do not show a Game Over screen at the end. Generic defeats may hold the heroine's final fainted pose; custom struggle sequences keep their specified motion.

**Why:** The user reported that “aparece uma janela com contagem que não deixa ver mais nada,” requested “deixe mais clean,” and then explicitly said “Tire a tela da game over, e deixe elas se movimentando.”

**How to apply:** Put countdown and escape instructions outside the main fight area and never replace the scene with an end-screen modal.

Generic defeats show only the heroine falling and fainting. Do not render or animate Amazonas or Ninjas in this state; for now, enemy defeat choreography is limited to the personalized struggle sequences.

**Why:** The user explicitly removed generic Amazon/Ninja defeat animations and asked to keep only personalized struggle animations for now.

**How to apply:** Keep the heroine's short hurt/down/defeated progression, hide all enemies for the generic defeat branch, and leave custom grapple/struggle branches unchanged.

For the Kunoichi's ten-second defeat, use the original six-frame sheet for the opening 8.5 seconds and the new three-frame sheet for the final 1.5 seconds. Once HP reaches zero, hold the last frame of the new sheet.

**Why:** The user wants the new sequence to finish the Ninja defeat, preserve the ten-second HP drain, and hold its final pose. The end pose can be static without adding a Game Over screen.

**How to apply:** Select the ending sheet from elapsed defeat time; keep the HP timer unchanged and clamp its frame index to the last frame after the defeat transition.
