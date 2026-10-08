---
name: Uploaded game art
description: Why sprite sheet coordinates must be based on verified dimensions, not chat image previews.
---

Inspect the actual format and dimensions of uploaded art before assigning sprite crops. Normalize sheets to a known logical grid before applying reference-image coordinates.

**Why:** The supplied Jungle Beatdown files had .png names but contained high-resolution JPEG data. Their chat previews were reduced in size; using preview coordinates directly cropped headings and checker tiles rather than characters.

**How to apply:** For replacement or additional sprite sheets, check image metadata first, and keep the crop coordinate grid consistent with the preprocessed canvas dimensions.

For single-character sheets, avoid making every neutral-colored pixel transparent. Use edge-connected background removal, then find each pose's visible bounds and anchor its feet to the ground plane. Combined fight illustrations need separate treatment for enclosed checkerboard islands, but must also protect neutral foreground details with a repaired or hand-authored alpha mask.

**Why:** Broad color-keying punched holes in neutral clothing details and left silhouettes anchored to empty margins. Edge-only removal left enclosed checkerboard patches in combined scenes; unrestricted keying then damaged the Amazon's hair and outfit during struggle.

**How to apply:** Preserve gray outfit shading and outlines; inspect both single-character and combined illustrations after cleanup. Keep crop bounds local to their source rectangle, and use the visible bottom edge for ground contact.

Individual poses from irregular sheets need a silhouette mask, not just a tighter bounding rectangle. Keep combined fight scenes exempt from single-character isolation.

**Why:** Neighboring kick frames extended detached feet into the standing pose's rectangular crop. Repeating that pose for five Amazonas repeated the stray limbs too, even when bounds were computed from the largest character.

**How to apply:** Isolate the connected artwork for single-character frames while retaining both participants in paired scenes. Inspect crowded scenes for artifacts repeated from a shared crop.

For warm-tinted checkerboards behind dark costumes, sample both tones from clean margins and key by RGB palette rather than broad grayscale or a large silhouette halo.

**Why:** A warm brown checkerboard is not removed by neutral-gray keys; broad keys damage black clothing, while wide edge protection leaves checker pixels around the silhouette.

**How to apply:** Compare full RGB against the sampled warm tones, keep cool dark outline colors outside the key, and inspect both idle and paired combat poses for leftover tiles or holes.
