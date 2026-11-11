import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LAURA, LAURA_IDLE, LAURA_WALK, LAURA_ATTACKS, LAURA_GUARD, LAURA_HURT,
  lauraVictorySequenceFrames, lauraStoryboardFourFrames, lauraContinuationFrames,
  lauraSpecialSequenceFrames, lauraSpecialPanelIndex, lauraSpecialKissElapsed,
  lauraDefeatStage, lauraFallingPose, LAURA_KICKS,
  LAURA_SPECIAL_PANEL_COUNT, LAURA_SPECIAL_DURATION,
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
  assert.equal(LAURA_ATTACKS.length, 6);
  assert.equal(LAURA_WALK.length, 6);
  for (const attack of LAURA_ATTACKS) assert.ok(!LAURA_GUARD.includes(attack));
});

test('Laura excludes kicks with anatomy obscured by adjacent poses', () => {
  assert.ok(!LAURA_ATTACKS.includes(LAURA_KICKS[1]));
  assert.ok(!LAURA_ATTACKS.includes(LAURA_KICKS[2]));
  assert.equal(LAURA_ATTACKS[0].x + LAURA_ATTACKS[0].w, 280);
});

test('Combat defeat advances through punch, kick, recoil and fall, then holds', () => {
  assert.deepEqual([0, 0.3, 0.6, 1.2, 10, 100].map(lauraDefeatStage),
    ['punch', 'kick', 'recoil', 'fall', 'hold', 'hold']);
  assert.deepEqual([1.15, 0.8, 0.5, 0].map(lauraFallingPose),
    [...LAURA_HURT, LAURA.defeated]);
});

test('Laura combat victory preview keeps only final-blow and victory-stance panels', () => {
  const frames = lauraVictorySequenceFrames(1024, 765);
  assert.equal(frames.length, 2);
  assert.deepEqual(frames.map(({ x, y, w, h }) => [x, y, w, h]), [
    [26, 78, 450, 292],
    [555, 77, 448, 292],
  ]);
});

test('Laura storyboard crops the four pre-keyed victory groups', () => {
  const frames = lauraStoryboardFourFrames(1024, 765);
  assert.equal(frames.length, 4);
  assert.deepEqual(frames.map(({ x, y, w, h }) => [x, y, w, h]), [
    [26, 78, 450, 292],
    [555, 77, 448, 292],
    [6, 433, 430, 332],
    [512, 479, 508, 286],
  ]);
  for (const frame of frames) {
    assert.ok(frame.x + frame.w <= 1024);
    assert.ok(frame.y + frame.h <= 765);
  }
});

test('Laura continuation sheet maps Adoration, Foreground Kiss and Reverence', () => {
  const frames = lauraContinuationFrames(1024, 764);
  assert.equal(frames.length, 3);
  for (const frame of frames) {
    assert.ok(frame.x >= 0 && frame.y >= 0);
    assert.ok(frame.x + frame.w <= 1024);
    assert.ok(frame.y + frame.h <= 764);
  }
  assert.ok(frames[2].w > frames[0].w);
});

test('Laura special sequence stitches victory and continuation into seven panels', () => {
  const panels = lauraSpecialSequenceFrames(1024, 765, 1024, 765);
  assert.equal(panels.length, LAURA_SPECIAL_PANEL_COUNT);
  assert.equal(panels.filter((panel) => panel.sheet === 'victory').length, 4);
  assert.equal(panels.filter((panel) => panel.sheet === 'continuation').length, 3);
  assert.equal(lauraSpecialPanelIndex(0), 0);
  assert.equal(lauraSpecialPanelIndex(LAURA_SPECIAL_DURATION - 0.01), 6);
  assert.ok(lauraSpecialKissElapsed() >= LAURA_SPECIAL_DURATION * (4 / 7));
});
