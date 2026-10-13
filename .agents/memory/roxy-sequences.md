---
name: Roxy sequences
description: Roxy's roster role, voluntary scene requirements, and custom audio direction.
---

Roxy is the ninth opponent alongside five Amazons and three Kunoichis.

**Why:** The user supplied Roxy's three sprite sheets and requested she have her own kick, Hypnosis, and Smother audio behavior.

**How to apply:** Keep Roxy's kick voice distinct. Smother follows the established custom-defeat pattern: subdued heroine struggle and deep breathing cues alternate without overlapping, then the sequence ends cleanly.

Roxy's hypnosis-and-foot-kiss scene is voluntary: the accept/decline choice must explicitly disclose the hypnosis, which starts only after acceptance. There is no HP drain and the player can stop at any time. Its dialogue must never play before acceptance.

**Why:** The user requested an optional, consensual scene with an explicit accept/decline choice, then asked to include hypnosis in it. Declining follows the normal defeat instead.

**How to apply:** After acceptance, show Roxy's hypnotic introduction, then the foot-kiss poses and dialogue. Preserve the HP, the stop control, and the rejection path. Never show hypnosis before consent.

Roxy's movement sheet has irregular artwork boundaries, not equal-sized pose cells. Keep both feet complete and the body scale consistent between movement and attacks.

**Why:** Cropping at equal cell boundaries cut the feet off. Repeating the single supplied walking pose without leg movement made her appear planted in the floor.

**How to apply:** Verify each sheet's dimensions independently, use its actual pose boundaries, and preserve existing transparent alpha. Do not change the separate paired-scene coordinates to match the movement sheet.

Roxy's paired sheets are storyboards, not continuous animation cycles. A solo preparation panel must not alternate with a completed two-character pose.

**Why:** Alternating these panels made the heroine disappear repeatedly and the victory look like blinking.

**How to apply:** Progress through the introductory poses once, then keep the complete final pair visible. Any subtle motion should preserve that composition.
