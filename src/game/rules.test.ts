import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_CATALOG } from './catalog.ts';
import {
  buildHudSnapshot,
  buildRunSummary,
  clampDt,
  computeObjectiveTargetX,
  createInputState,
  createStoryWorld,
  replayLastDialogue,
  stepWorld,
} from './rules.ts';
import type { StoryId } from './types.ts';
import { getVoiceProfile } from './voiceProfiles.ts';
import { computeViewportLayout } from '../utils/orientation.ts';

function pressOnce(input: ReturnType<typeof createInputState>, code: string) {
  input.justPressed.add(code);
}

test('catalog contains 5 Antiguo and 5 Nuevo Testamento stories (10 total)', () => {
  assert.equal(STORY_CATALOG.length, 10);
  const antiguo = STORY_CATALOG.filter((s) => s.testament === 'antiguo');
  const nuevo = STORY_CATALOG.filter((s) => s.testament === 'nuevo');
  assert.equal(antiguo.length, 5);
  assert.equal(nuevo.length, 5);
});

test('clampDt bounds negative and huge frame deltas safely', () => {
  assert.equal(clampDt(-0.2), 0);
  assert.equal(clampDt(0.016), 0.016);
  assert.equal(clampDt(2.5), 0.05);
});

test('voice profiles never expose directionPrefix and distinguish characters', () => {
  const speakers = ['Narrador', 'Zaqueo', 'Jesús', 'David', 'Goliat', 'Daniel', 'Moisés', 'Noé', 'Bartimeo', 'Mujer de Fe'];
  for (const s of speakers) {
    const profile = getVoiceProfile(s) as unknown as Record<string, unknown>;
    assert.equal('directionPrefix' in profile, false);
    assert.equal(typeof profile.voiceName, 'string');
    assert.equal(typeof profile.style, 'string');
  }
  assert.notEqual(getVoiceProfile('Jesús').voiceName, getVoiceProfile('Zaqueo').voiceName);
  assert.notEqual(getVoiceProfile('David').voiceName, getVoiceProfile('Goliat').voiceName);
});

test('all 10 stories initialize safely, survive idle 4s, and have clean TTS dialogue without key brackets', () => {
  const stories: StoryId[] = STORY_CATALOG.map((s) => s.id);
  for (const story of stories) {
    const world = createStoryWorld(story);
    const input = createInputState();
    assert.ok(world.dialogue, `${story} should start with opening dialogue`);
    assert.equal(world.dialogue.id, 1);
    assert.equal(/\[[A-Z]\]/.test(world.dialogue.text), false, `${story} dialogue must not speak key brackets`);

    for (let i = 0; i < 80; i++) {
      stepWorld(world, input, 0.05);
      input.justPressed.clear();
    }
    assert.equal(world.outcome, null, `${story} should survive 4s idle safely`);
    const hud = buildHudSnapshot(world);
    assert.ok(hud.stageLabel.length > 0);
    assert.ok(hud.objectiveText.length > 0);
  }
});

test('Zaqueo full 2-stage progression ends in victory', () => {
  const world = createStoryWorld('zaqueo');
  const input = createInputState();

  // Place Zaqueo near sycamore lookout
  world.player.x = world.treeLookoutX - 10;
  world.player.y = world.treeLookoutY - 12;
  world.player.grounded = true;
  stepWorld(world, input, 0.02);
  assert.equal(world.zaqueoBeat, 'jesus_calling');
  assert.equal(world.jesus.active, true);
  assert.ok((world.dialogue?.id ?? 0) >= 2);

  // Let Jesus finish walking under the tree
  for (let i = 0; i < 60; i++) {
    stepWorld(world, input, 0.05);
  }
  assert.equal(world.zaqueoBeat, 'descend_tree');

  // Descend to ground next to Jesus and interact [E]
  world.player.x = world.jesus.x;
  world.player.y = world.groundY - world.player.h;
  world.player.grounded = true;
  pressOnce(input, 'KeyE');
  stepWorld(world, input, 0.02);
  input.justPressed.clear();
  assert.equal(world.stage, 'zaqueo_house');

  // Open chest
  world.player.x = 330;
  world.player.y = world.groundY - world.player.h;
  pressOnce(input, 'KeyE');
  stepWorld(world, input, 0.02);
  input.justPressed.clear();
  assert.equal(world.chestOpened, true);

  // Bless all 3 neighbors
  for (const n of world.neighbors) {
    world.player.x = n.x - 10;
    pressOnce(input, 'KeyE');
    stepWorld(world, input, 0.02);
    input.justPressed.clear();
  }
  assert.equal(world.outcome, 'victory');
  const summary = buildRunSummary(world);
  assert.equal(summary.outcome, 'victory');
  assert.equal(summary.primaryMetricValue, '3/3');
});

test('Daniel terrace prayers transition to lions den and calm all 3 lions for victory', () => {
  const world = createStoryWorld('daniel');
  const input = createInputState();

  for (const pw of world.prayerWindows) {
    world.player.x = pw.x - 10;
    world.player.y = world.groundY - world.player.h;
    pressOnce(input, 'KeyE');
    stepWorld(world, input, 0.02);
    input.justPressed.clear();
  }
  assert.equal(world.stage, 'lions_den');
  assert.equal(world.lions.length, 3);

  for (const al of world.angelLights) {
    world.player.x = al.x - 10;
    world.player.y = al.y - 20;
    pressOnce(input, 'KeyE');
    stepWorld(world, input, 0.02);
    input.justPressed.clear();
  }
  assert.equal(world.outcome, 'victory');
});

test('David collects stones and defeats Goliath when shield is down', () => {
  const world = createStoryWorld('david');
  const input = createInputState();

  // Collect all brook stones
  for (const st of world.collectibles) {
    st.collected = true;
  }
  assert.ok(world.goliath);

  for (let hit = 0; hit < 3; hit++) {
    world.goliath!.state = 'vulnerable';
    world.goliath!.shieldUp = false;
    world.goliath!.timer = 2.5;
    world.player.x = world.goliath!.x - 160;
    world.player.y = world.groundY - world.player.h;
    pressOnce(input, 'KeyE');
    stepWorld(world, input, 0.02);
    input.justPressed.clear();

    for (let f = 0; f < 40 && (world.slingStones.some((s) => s.active) || world.hitstopTimer > 0); f++) {
      stepWorld(world, input, 0.02);
    }
  }

  assert.equal(world.goliath!.hp, 0);
  assert.equal(world.goliath!.state, 'defeated');
  assert.equal(world.outcome, 'victory');
});

test('remaining 7 stories (flujo, bartimeo, panes, tormenta, horno, moises, noe) reach victory cleanly', () => {
  const interactStories: StoryId[] = [
    'flujo',
    'bartimeo',
    'panes',
    'tormenta',
    'horno',
    'moises',
    'noe',
  ];

  for (const id of interactStories) {
    const world = createStoryWorld(id);
    const input = createInputState();
    for (const spot of world.interactSpots) {
      world.player.x = spot.x - 12;
      world.player.y = spot.y - 24;
      pressOnce(input, 'KeyE');
      stepWorld(world, input, 0.02);
      input.justPressed.clear();
    }
    assert.equal(world.outcome, 'victory', `${id} should reach victory`);
  }
});

test('defeat triggers cleanly when player loses all hearts in hazard stories', () => {
  const world = createStoryWorld('flujo');
  const input = createInputState();
  world.player.hp = 1;
  world.player.invulnTimer = 0;
  const h = world.hazards[0];
  h.state = 'active';
  world.player.x = h.x + 4;
  world.player.y = h.y;

  stepWorld(world, input, 0.02);
  assert.equal(world.player.hp, 0);

  for (let i = 0; i < 20; i++) {
    stepWorld(world, input, 0.05);
  }
  assert.equal(world.outcome, 'defeat');
});

test('replayLastDialogue restores faded dialogue with incremented id and objectiveTargetX tracks targets', () => {
  const world = createStoryWorld('zaqueo');
  const input = createInputState();
  const initialId = world.dialogue?.id ?? 0;
  const initialText = world.dialogue?.text ?? '';
  assert.ok(initialId >= 1);
  assert.equal(typeof computeObjectiveTargetX(world), 'number');

  // Step past dialogue duration (6.2s -> 140 * 0.05 = 7s)
  for (let i = 0; i < 140; i++) {
    stepWorld(world, input, 0.05);
  }
  assert.equal(world.dialogue, null);

  // Replay restores the dialogue with a fresh id so speech re-triggers
  const replayed = replayLastDialogue(world);
  assert.equal(replayed, true);
  const restored = (world as { dialogue: { id: number; text: string } | null }).dialogue;
  assert.ok(restored);
  assert.equal(restored.text, initialText);
  assert.ok(restored.id > initialId);
});

test('computeViewportLayout classifies mobile portrait, mobile landscape, and desktop accurately', () => {
  const mobilePortrait = computeViewportLayout(390, 844, true, 5);
  assert.equal(mobilePortrait.isPortrait, true);
  assert.equal(mobilePortrait.isMobileLike, true);
  assert.equal(mobilePortrait.isCompactLandscape, false);

  const mobileLandscape = computeViewportLayout(844, 390, true, 5);
  assert.equal(mobileLandscape.isPortrait, false);
  assert.equal(mobileLandscape.isMobileLike, true);
  assert.equal(mobileLandscape.isCompactLandscape, true);

  const desktop = computeViewportLayout(1440, 900, false, 0);
  assert.equal(desktop.isPortrait, false);
  assert.equal(desktop.isMobileLike, false);
  assert.equal(desktop.isCompactLandscape, false);
});

test('third-party NPCs speak audibly when player approaches locked crowd gates and have distinct voice profiles', () => {
  const world = createStoryWorld('panes');
  const input = createInputState();
  const initialCueId = world.dialogue?.id ?? 0;

  // Move boy directly next to first crowd group before delivering basket to Jesus
  const firstCrowd = world.interactSpots.find((s) => s.kind === 'deliver_bread');
  assert.ok(firstCrowd);
  world.player.x = firstCrowd.x - 16;
  world.player.y = firstCrowd.y - 24;
  stepWorld(world, input, 0.02);

  assert.ok(world.dialogue);
  assert.equal(world.dialogue.speaker, 'Multitud');
  assert.ok(world.dialogue.id > initialCueId);
  assert.ok(world.dialogue.text.includes('Jesús'));

  // Verify third-party voice profiles exist and stay clean
  const thirdPartySpeakers = [
    'Multitud',
    'Guardia',
    'Rey Darío',
    'Rey Nabucodonosor',
    'Mesac',
    'Abed-nego',
    'Discípulo',
    'Familia',
    'Pueblo',
    'Hombre de Jericó',
  ];
  for (const s of thirdPartySpeakers) {
    const p = getVoiceProfile(s) as unknown as Record<string, unknown>;
    assert.equal('directionPrefix' in p, false);
    assert.equal(typeof p.voiceName, 'string');
    assert.equal(typeof p.style, 'string');
  }
});



