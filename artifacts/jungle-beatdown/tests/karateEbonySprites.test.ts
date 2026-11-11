import assert from 'node:assert/strict';
import test from 'node:test';
import {
  KARATE_EBONY,
  KARATE_EBONY_ATTACKS,
  KARATE_EBONY_DEFEAT_DURATION,
  KARATE_EBONY_PUNISHMENT_COUNT,
  karateDuoSequenceFrames,
  karateEbonyPunishmentSequence,
  karateEbonySequenceFrames,
} from '../src/game/karateSprites';

const TAKEDOWN = { width: 748, height: 1000 };
const SUBMISSION = { width: 1024, height: 572 };

test('Ebony combat attacks include the high kick instead of a duplicate kick', () => {
  assert.equal(KARATE_EBONY_ATTACKS.length, 5);
  assert.equal(KARATE_EBONY_ATTACKS[4], KARATE_EBONY.highKick);
  for (const frame of KARATE_EBONY_ATTACKS) {
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= 748);
    assert.ok(frame.y + frame.h <= 1000);
  }
});

test('Ebony takedown storyboard maps eight panels on the tall sheet', () => {
  const frames = karateEbonySequenceFrames(TAKEDOWN.width, TAKEDOWN.height);
  assert.equal(frames.length, 8);
  for (const frame of frames) {
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.w > 0 && frame.h > 0);
    assert.ok(frame.x + frame.w <= TAKEDOWN.width);
    assert.ok(frame.y + frame.h <= TAKEDOWN.height);
  }
});

test('Ebony solo punishment plays the eight takedown panels then the four submissions', () => {
  const steps = karateEbonyPunishmentSequence(
    TAKEDOWN.width,
    TAKEDOWN.height,
    SUBMISSION.width,
    SUBMISSION.height,
  );
  const takedown = karateEbonySequenceFrames(TAKEDOWN.width, TAKEDOWN.height);
  const submission = karateDuoSequenceFrames(SUBMISSION.width, SUBMISSION.height);
  assert.equal(steps.length, KARATE_EBONY_PUNISHMENT_COUNT);
  assert.equal(steps.length, takedown.length + submission.length);
  assert.deepEqual(steps.slice(0, 8).map((step) => step.sheet), Array(8).fill('takedown'));
  assert.deepEqual(steps.slice(8).map((step) => step.sheet), Array(4).fill('submission'));
  assert.deepEqual(steps.slice(0, 8).map((step) => step.frame), takedown);
  assert.deepEqual(steps.slice(8).map((step) => step.frame), submission);
  assert.equal(KARATE_EBONY_DEFEAT_DURATION, 14);
});
