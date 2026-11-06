import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LAURA, LAURA_IDLE, LAURA_WALK, LAURA_ATTACKS, LAURA_GUARD, LAURA_HURT,
  lauraVictorySequenceFrames,
} from '../src/game/lauraSprites';

test('Laura poses stay inside the native 765×1024 combat sheet', () => {
  for (const frame of [...Object.values(LAURA), ...LAURA_IDLE, ...LAURA_WALK,
    ...LAURA_ATTACKS, ...LAURA_GUARD, ...LAURA_HURT]) {
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= 765);
    assert.ok(frame.y + frame.h <= 1024);
  }
});

test('Laura has distinct punches and kicks rather than damaging guard poses', () => {
  assert.equal(LAURA_ATTACKS.length, 8);
  assert.equal(LAURA_WALK.length, 6);
  for (const attack of LAURA_ATTACKS) assert.ok(!LAURA_GUARD.includes(attack));
});

test('Laura defeat sequence uses only final-blow and victory-stance panels', () => {
  const frames = lauraVictorySequenceFrames(1024, 572);
  assert.equal(frames.length, 2);
  assert.deepEqual(frames.map(({ x, y, w, h }) => [x, y, w, h]), [
    [0, 88, 512, 282],
    [512, 88, 512, 282],
  ]);
  for (const frame of frames) {
    assert.ok(frame.x + frame.w <= 1024);
    assert.ok(frame.y + frame.h <= 572);
  }
});
