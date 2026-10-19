import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { PANTERA_COMBO_DURATION, PANTERA_COMBO_HITS, panteraComboPose } from '../src/game/panteraCombo';
import { PANTERA_VICTORY_FRAME } from '../src/game/panteraSprites';

test('the complete combo advances through attacks, three stomps, then victory', () => {
  assert.equal(panteraComboPose(.2).stage, 'advance');
  assert.equal(panteraComboPose(.8).stage, 'knockdown');
  assert.equal(panteraComboPose(1.4).stage, 'prepare');
  for (const hit of PANTERA_COMBO_HITS.slice(2)) {
    assert.equal(panteraComboPose(hit.time + .01).stage, 'stomp');
    assert.ok(panteraComboPose(hit.time + .01).impact > .8);
  }
  assert.equal(panteraComboPose(5).stage, 'victory');
});

test('the final composition remains complete and stops stomping', () => {
  for (const time of [PANTERA_COMBO_DURATION, 12, 100]) {
    const pose = panteraComboPose(time);
    assert.equal(pose.frame, PANTERA_VICTORY_FRAME);
    assert.equal(pose.hero, 'defeated');
    assert.equal(pose.lift, 0);
    assert.equal(pose.groundOffset, 0);
    assert.equal(pose.impact, 0);
  }
});

test('the fixed damage timeline applies only once per ordered impact', () => {
  assert.equal(PANTERA_COMBO_HITS.reduce((total, hit) => total + hit.damage, 0), 56);
  assert.ok(PANTERA_COMBO_HITS.every((hit, i, hits) =>
    hit.time < PANTERA_COMBO_DURATION && (i === 0 || hit.time > hits[i - 1].time)));
});
