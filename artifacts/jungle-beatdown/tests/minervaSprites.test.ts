import assert from 'node:assert/strict';
import test from 'node:test';
import {
  karateDuoSequenceFrames,
  MINERVA,
  MINERVA_ATTACKS,
  MINERVA_WALK,
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
