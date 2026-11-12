import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LANA,
  LANA_ATTACKS,
  LANA_DEFEAT_DURATION,
  LANA_PUNISHMENT_COUNT,
  LANA_SHEET,
  LANA_WALK,
  lanaPunishmentSequence,
  lanaStoryboardFrames,
} from '../src/game/lanaSprites';

test('Lana combat poses stay inside the 764×1024 sheet', () => {
  const frames = [...LANA_WALK, ...LANA_ATTACKS, LANA.idle, LANA.hurt, LANA.down];
  for (const frame of frames) {
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= LANA_SHEET.width);
    assert.ok(frame.y + frame.h <= LANA_SHEET.height);
  }
  assert.equal(LANA_ATTACKS.length, 4);
  assert.equal(LANA_WALK.length, 4);
});

test('Lana punishment plays six stomp panels then six grab panels', () => {
  const steps = lanaPunishmentSequence(1024, 1024, 1024, 571);
  assert.equal(steps.length, LANA_PUNISHMENT_COUNT);
  assert.deepEqual(steps.slice(0, 6).map((step) => step.sheet), Array(6).fill('stomp'));
  assert.deepEqual(steps.slice(6).map((step) => step.sheet), Array(6).fill('grab'));
  assert.equal(lanaStoryboardFrames(1024, 1024).length, 6);
  assert.equal(LANA_DEFEAT_DURATION, 14);
});
