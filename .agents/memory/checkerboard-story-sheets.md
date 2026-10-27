---
name: Checkerboard story sheets
description: Background-removal guidance for storyboard sprite sheets with gray or low-saturation checkerboards.
---

For story sheets with a gray or blue-gray checkerboard, remove only neutral background pixels connected to each panel's edges, then clear title bands explicitly. Avoid global color-keying across the whole sheet.

**Why:** broad gray keys left checkerboard remnants in scene panels and risked erasing neutral details in costumes and outlines.

**How to apply:** flood-fill each frame boundary through a narrow neutral-color range; test both a dialogue/transition panel and the final panel before shipping.
