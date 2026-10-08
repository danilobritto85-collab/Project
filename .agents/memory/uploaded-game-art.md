---
name: Uploaded game art
description: Why sprite sheet coordinates must be based on verified dimensions, not chat image previews.
---

Inspect the actual format and dimensions of uploaded art before assigning sprite crops. Normalize sheets to a known logical grid before applying reference-image coordinates.

**Why:** The supplied Jungle Beatdown files had .png names but contained high-resolution JPEG data. Their chat previews were reduced in size; using preview coordinates directly cropped headings and checker tiles rather than characters.

**How to apply:** For replacement or additional sprite sheets, check image metadata first, and keep the crop coordinate grid consistent with the preprocessed canvas dimensions.
