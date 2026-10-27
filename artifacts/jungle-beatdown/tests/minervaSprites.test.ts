import assert from 'node:assert/strict';
import test from 'node:test';
import {
  karateDuoSequenceFrames,
  MINERVA,
  MINERVA_ATTACKS,
  MINERVA_WALK,
  MAY,
  MAY_ATTACKS,
  MAY_WALK_FRAMES,
  mayStorySequenceFrames,
} from '../src/game/karateSprites';

test('Minerva movement and attack crops fit the uploaded 428×572 sheet', () => {
  const frames = [
    ...MINERVA_WALK,
    ...MINERVA_ATTACKS,
    MINERVA.idle,
    MINERVA.hurt,
    MINERVA.kick,
    MINERVA.spin,
    MINERVA.highKick,
  ];
  for (const frame of frames) {
    assert.ok(frame.x >= 0 && frame.y >= 0);
    assert.ok(frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= 428);
    assert.ok(frame.y + frame.h <= 572);
  }
});

test('Minerva victory storyboard maps to four panels inside the uploaded sheet', () => {
  const frames = karateDuoSequenceFrames(896, 1198);
  assert.equal(frames.length, 4);
  for (const frame of frames) {
    assert.ok(frame.x >= 0 && frame.y >= 0);
    assert.ok(frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= 896);
    assert.ok(frame.y + frame.h <= 1198);
  }
});

test('May movement and combat crops fit the uploaded 765×1024 sheet', () => {
  const frames = [
    ...MAY_WALK_FRAMES,
    ...MAY_ATTACKS,
    MAY.idle,
    MAY.run,
    MAY.hurt,
    MAY.down,
    MAY.block,
  ];
  for (const frame of frames) {
    assert.ok(frame.x >= 0 && frame.y >= 0);
    assert.ok(frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= 765);
    assert.ok(frame.y + frame.h <= 1024);
  }
  assert.equal(MAY_ATTACKS.length, 8);
});

test('May victory storyboard maps to four panels inside the uploaded sheet', () => {
  const frames = mayStorySequenceFrames(1024, 572);
  assert.equal(frames.length, 4);
  for (const frame of frames) {
    assert.ok(frame.x >= 0 && frame.y >= 0);
    assert.ok(frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= 1024);
    assert.ok(frame.y + frame.h <= 572);
  }
});
