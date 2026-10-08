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
