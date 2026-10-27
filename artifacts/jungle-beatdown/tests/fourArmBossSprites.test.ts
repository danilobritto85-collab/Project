import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  FOUR_ARM_HIGH_KICK,
  FOUR_ARM_IDLE,
  FOUR_ARM_PUNCH_FRAMES,
  FOUR_ARM_SHEET_SIZE,
  FOUR_ARM_SPIN_KICK,
  FOUR_ARM_STORY_FRAMES,
  FOUR_ARM_WALK_FRAMES,
  fourArmStoryFrameIndex,
} from '../src/game/fourArmBossSprites';

test('four-arm boss sprite crops stay inside the uploaded sheets', () => {
  const combatFrames = [
    ...FOUR_ARM_WALK_FRAMES,
    ...FOUR_ARM_PUNCH_FRAMES,
    FOUR_ARM_IDLE,
    FOUR_ARM_HIGH_KICK,
    FOUR_ARM_SPIN_KICK,
  ];
  for (const frame of combatFrames) {
    assert.ok(frame.x >= 0 && frame.y >= 0);
    assert.ok(frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= FOUR_ARM_SHEET_SIZE.width);
    assert.ok(frame.y + frame.h <= FOUR_ARM_SHEET_SIZE.height);
  }
});

test('the optional ending advances through all four paired panels and holds the last', () => {
  assert.equal(FOUR_ARM_STORY_FRAMES.length, 4);
  assert.deepEqual(
    [0, 2, 4, 6, 8].map((elapsed) => fourArmStoryFrameIndex(elapsed, 8)),
    [0, 1, 2, 3, 3],
  );
  assert.equal(fourArmStoryFrameIndex(1, 8, true), 3);
});
