import { getStoryMeta } from './catalog';
import type {
  AngelLight,
  Climbable,
  Collectible,
  CrowdGroup,
  GameWorld,
  GoliathBoss,
  GuardPatrol,
  HazardWave,
  HudSnapshot,
  InputState,
  InteractSpot,
  LionEnemy,
  NeighborNpc,
  Particle,
  Platform,
  PrayerWindow,
  RunSummary,
  SlingStone,
  StoryId,
  StoryProgress,
} from './types';

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

const GRAVITY = 1520;
const MOVE_SPEED = 292;
const JUMP_VEL = -600;
const CLIMB_SPEED = 215;
const COYOTE_TIME = 0.11;
const JUMP_BUFFER = 0.11;
const STORAGE_KEY = 'cronicas_biblicas_progress_v2';

const DEFAULT_COMPLETED: Record<StoryId, boolean> = {
  zaqueo: false,
  flujo: false,
  bartimeo: false,
  panes: false,
  tormenta: false,
  daniel: false,
  david: false,
  horno: false,
  moises: false,
  noe: false,
};

const DEFAULT_STARS: Record<StoryId, number> = {
  zaqueo: 0,
  flujo: 0,
  bartimeo: 0,
  panes: 0,
  tormenta: 0,
  daniel: 0,
  david: 0,
  horno: 0,
  moises: 0,
  noe: 0,
};

const DEFAULT_TIMES: Record<StoryId, number | null> = {
  zaqueo: null,
  flujo: null,
  bartimeo: null,
  panes: null,
  tormenta: null,
  daniel: null,
  david: null,
  horno: null,
  moises: null,
  noe: null,
};

// Pooled particles so GC pauses never occur mid-run
const PARTICLE_POOL_SIZE = 120;
export const particlePool: Particle[] = Array.from(
  { length: PARTICLE_POOL_SIZE },
  () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 4,
    color: '#F59E0B',
    gravity: 220,
  })
);

export function resetParticles() {
  for (let i = 0; i < particlePool.length; i++) {
    particlePool[i].active = false;
  }
}

export function spawnBurst(
  x: number,
  y: number,
  color: string,
  count = 10,
  speed = 150,
  gravity = 260
) {
  let spawned = 0;
  for (let i = 0; i < particlePool.length && spawned < count; i++) {
    const p = particlePool[i];
    if (!p.active) {
      const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.4;
      const mag = speed * (0.55 + Math.random() * 0.65);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * mag;
      p.vy = Math.sin(angle) * mag - 45;
      p.maxLife = 0.45 + Math.random() * 0.4;
      p.life = p.maxLife;
      p.size = 3 + Math.random() * 3.5;
      p.color = color;
      p.gravity = gravity;
      spawned++;
    }
  }
}

export function stepParticles(dt: number) {
  for (let i = 0; i < particlePool.length; i++) {
    const p = particlePool[i];
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function clampDt(dt: number): number {
  return Math.min(Math.max(dt, 0), 0.05);
}

export function createInputState(): InputState {
  return {
    held: new Set<string>(),
    justPressed: new Set<string>(),
  };
}

function setDialogue(
  world: GameWorld,
  speaker: string,
  text: string,
  x: number,
  y: number,
  timer = 6.2
) {
  world.dialogueSeq += 1;
  world.dialogue = {
    id: world.dialogueSeq,
    speaker,
    text,
    x,
    y,
    timer,
  };
  world.lastDialogue = { speaker, text };
}

function speakThirdPartyOnce(
  world: GameWorld,
  key: string,
  speaker: string,
  text: string,
  x: number,
  y: number,
  forceRepeat = false,
  timer = 5.2
) {
  const alreadySpoken = Boolean(world.spokenPrompts[key]);
  if (!alreadySpoken) {
    world.spokenPrompts[key] = true;
    world.promptSpeechCooldown = 2.4;
    setDialogue(world, speaker, text, x, y, timer);
  } else if (forceRepeat && world.promptSpeechCooldown <= 0) {
    world.promptSpeechCooldown = 2.4;
    setDialogue(world, speaker, text, x, y, timer);
  }
}

export function replayLastDialogue(world: GameWorld): boolean {
  const source = world.dialogue
    ? { speaker: world.dialogue.speaker, text: world.dialogue.text }
    : world.lastDialogue;
  if (!source) return false;
  setDialogue(
    world,
    source.speaker,
    source.text,
    world.player.x + world.player.w / 2,
    world.player.y - 24,
    6.0
  );
  return true;
}

export function computeObjectiveTargetX(world: GameWorld): number | null {
  if (world.outcome) return null;
  if (world.story === 'zaqueo') {
    if (world.stage === 'jericho_road') {
      if (world.zaqueoBeat === 'cross_crowd' || world.zaqueoBeat === 'climb_tree') {
        return world.treeLookoutX;
      }
      return world.jesus.x;
    }
    if (!world.chestOpened) return 340;
    const nextNeighbor = world.neighbors.find((n) => !n.blessed);
    return nextNeighbor ? nextNeighbor.x : null;
  }
  if (world.story === 'daniel') {
    if (world.stage === 'babylon_terrace') {
      const nextWin = world.prayerWindows.find((pw) => !pw.prayed);
      return nextWin ? nextWin.x : null;
    }
    const nextLight = world.angelLights.find((al) => !al.activated);
    return nextLight ? nextLight.x : null;
  }
  if (world.story === 'david') {
    const collected = world.collectibles.filter((c) => c.collected).length;
    if (collected === 0) {
      const firstStone = world.collectibles.find((c) => !c.collected);
      return firstStone ? firstStone.x : null;
    }
    return world.goliath ? world.goliath.x : null;
  }
  const nextSpot = world.interactSpots.find((s) => !s.done);
  return nextSpot ? nextSpot.x : null;
}

function makeBaseWorld(story: StoryId, worldWidth: number, groundY = 576): GameWorld {
  return {
    story,
    stage: 'jericho_road',
    zaqueoBeat: 'cross_crowd',
    danielBeat: 'terrace_pray',
    worldWidth,
    worldHeight: VIEW_HEIGHT,
    groundY,
    cameraX: 0,
    elapsed: 0,
    hitstopTimer: 0,
    trauma: 0,
    defeatDelayTimer: 0,
    outcome: null,
    player: {
      x: 110,
      y: groundY - 56,
      w: 36,
      h: 56,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      climbing: false,
      crouching: false,
      coyoteTimer: COYOTE_TIME,
      jumpBufferTimer: 0,
      walkCycle: 0,
      scaleX: 1,
      scaleY: 1,
      hp: 3,
      maxHp: 3,
      invulnTimer: 0,
      hitFlashTimer: 0,
    },
    platforms: [
      { id: 'ground', x: 0, y: groundY, w: worldWidth, h: 160, kind: 'ground' },
    ],
    climbables: [],
    collectibles: [],
    crowdGroups: [],
    neighbors: [],
    chestOpened: false,
    jesus: {
      active: false,
      x: 1200,
      y: groundY - 64,
      targetX: 1410,
      facing: 1,
      walkCycle: 0,
    },
    treeLookoutX: 1510,
    treeLookoutY: 236,
    houseDoorX: 1740,
    prayerWindows: [],
    guards: [],
    lions: [],
    angelLights: [],
    angelFloatPhase: 0,
    interactSpots: [],
    hazards: [],
    slingStones: [],
    goliath: null,
    seaPartedLevel: 0,
    stormCalm: 0,
    boatTilt: 0,
    sightRevealed: 1,
    breadMultiplied: false,
    dewShieldCharges: 0,
    dialogueSeq: 0,
    dialogue: null,
    lastDialogue: null,
    spokenPrompts: {},
    promptSpeechCooldown: 0,
    objectiveTargetX: null,
    nearbyPrompt: null,
    events: [],
  };
}

function buildZaqueoRoad(world: GameWorld) {
  world.stage = 'jericho_road';
  world.zaqueoBeat = 'cross_crowd';
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1960, h: 160, kind: 'ground' },
    { id: 'c1', x: 310, y: 512, w: 96, h: 64, kind: 'crate' },
    { id: 'a1', x: 460, y: 422, w: 155, h: 20, kind: 'awning', oneWay: true },
    { id: 'c2', x: 675, y: 512, w: 88, h: 64, kind: 'crate' },
    { id: 'a2', x: 825, y: 420, w: 160, h: 20, kind: 'awning', oneWay: true },
    { id: 'a3', x: 1055, y: 365, w: 150, h: 20, kind: 'awning', oneWay: true },
    { id: 'c3', x: 1250, y: 492, w: 95, h: 84, kind: 'crate' },
    { id: 'branch_mid', x: 1365, y: 356, w: 145, h: 20, kind: 'branch', oneWay: true },
    { id: 'branch_top', x: 1440, y: 236, w: 190, h: 22, kind: 'branch', oneWay: true },
  ];
  world.climbables = [{ id: 'sycamore', x: 1486, y: 236, w: 50, h: 340 }];
  world.crowdGroups = [
    { id: 'crowd_1', x: 470, y: 508, w: 135, h: 68, parted: false },
    { id: 'crowd_2', x: 840, y: 508, w: 145, h: 68, parted: false },
    { id: 'crowd_3', x: 1110, y: 508, w: 120, h: 68, parted: false },
  ];
  world.collectibles = [
    { id: 'z_star_1', x: 536, y: 374, collected: false, label: 'Moneda justa', kind: 'star' },
    { id: 'z_star_2', x: 1125, y: 318, collected: false, label: 'Higo dulce', kind: 'star' },
    { id: 'z_star_3', x: 1565, y: 188, collected: false, label: 'Corazón abierto', kind: 'star' },
  ];
  world.jesus = {
    active: false,
    x: 1120,
    y: 512,
    targetX: 1410,
    facing: 1,
    walkCycle: 0,
  };
  setDialogue(
    world,
    'Zaqueo',
    'Jesús viene por la calle de Jericó. Si subo a aquel gran sicómoro, podré verlo.',
    140,
    470,
    5.2
  );
}

function transitionToZaqueoHouse(world: GameWorld) {
  world.stage = 'zaqueo_house';
  world.zaqueoBeat = 'house_chest';
  world.worldWidth = 1280;
  world.cameraX = 0;
  world.player.x = 135;
  world.player.y = 520;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.grounded = true;
  world.player.climbing = false;
  world.platforms = [
    { id: 'house_floor', x: 0, y: 576, w: 1280, h: 160, kind: 'wood' },
    { id: 'shelf', x: 460, y: 446, w: 160, h: 18, kind: 'wood', oneWay: true },
  ];
  world.climbables = [];
  world.crowdGroups = [];
  world.jesus = {
    active: true,
    x: 240,
    y: 512,
    targetX: 240,
    facing: 1,
    walkCycle: 0,
  };
  world.chestOpened = false;
  world.neighbors = [
    {
      id: 'n1',
      name: 'Simón el Alfarero',
      role: 'Vecino',
      x: 590,
      y: 516,
      blessed: false,
      line: '¡Gracias, Zaqueo! Esta ayuda bendice a toda mi familia.',
    },
    {
      id: 'n2',
      name: 'Marta la Panadera',
      role: 'Panadera',
      x: 820,
      y: 516,
      blessed: false,
      line: 'Qué alegría verte compartir con tanta bondad y paz.',
    },
    {
      id: 'n3',
      name: 'Elián el Tejedor',
      role: 'Tejedor',
      x: 1050,
      y: 516,
      blessed: false,
      line: 'Hoy toda la calle de Jericó celebra contigo.',
    },
  ];
  world.events.push({ type: 'interact', x: 240, y: 520 });
  setDialogue(
    world,
    'Jesús',
    'Hoy ha llegado la salvación a esta casa. Abre tu tesoro y comparte con alegría.',
    270,
    460,
    5.4
  );
}

function buildFlujo(world: GameWorld) {
  world.stage = 'capernaum_crowd';
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1900, h: 160, kind: 'ground' },
    { id: 'c1', x: 320, y: 510, w: 92, h: 66, kind: 'crate' },
    { id: 'a1', x: 470, y: 424, w: 170, h: 20, kind: 'awning', oneWay: true },
    { id: 'a2', x: 730, y: 378, w: 185, h: 20, kind: 'awning', oneWay: true },
    { id: 'c2', x: 980, y: 508, w: 96, h: 68, kind: 'crate' },
    { id: 'a3', x: 1145, y: 416, w: 180, h: 20, kind: 'awning', oneWay: true },
    { id: 'c3', x: 1410, y: 510, w: 92, h: 66, kind: 'crate' },
  ];
  world.collectibles = [
    { id: 'f_1', x: 550, y: 374, collected: false, label: 'Chispa de fe', kind: 'hope' },
    { id: 'f_2', x: 820, y: 326, collected: false, label: 'Oración callada', kind: 'hope' },
    { id: 'f_3', x: 1235, y: 368, collected: false, label: 'Paz cercana', kind: 'hope' },
  ];
  world.hazards = [
    {
      id: 'h_crowd_1',
      kind: 'shush_crowd',
      x: 680,
      y: 514,
      w: 56,
      h: 62,
      vx: 105,
      vy: 0,
      minX: 460,
      maxX: 880,
      state: 'patrol',
      timer: 1.6,
    },
    {
      id: 'h_crowd_2',
      kind: 'shush_crowd',
      x: 1220,
      y: 514,
      w: 56,
      h: 62,
      vx: -115,
      vy: 0,
      minX: 1090,
      maxX: 1460,
      state: 'patrol',
      timer: 2.1,
    },
  ];
  world.jesus = {
    active: true,
    x: 1715,
    y: 512,
    targetX: 1715,
    facing: -1,
    walkCycle: 0,
  };
  world.interactSpots = [
    {
      id: 'cloak_hem',
      x: 1685,
      y: 540,
      label: 'Tocar el manto de Jesús',
      done: false,
      kind: 'touch_cloak',
    },
  ];
  setDialogue(
    world,
    'Mujer de Fe',
    'Si tan solo tocare el borde de su manto, quedaré sana. No perderé la esperanza.',
    150,
    470,
    5.4
  );
}

function buildBartimeo(world: GameWorld) {
  world.stage = 'jericho_gate';
  world.sightRevealed = 0.15;
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1860, h: 160, kind: 'ground' },
    { id: 's1', x: 340, y: 506, w: 98, h: 70, kind: 'crate' },
    { id: 'a1', x: 640, y: 428, w: 155, h: 20, kind: 'awning', oneWay: true },
    { id: 's2', x: 870, y: 502, w: 105, h: 74, kind: 'stone' },
    { id: 'a2', x: 1095, y: 416, w: 165, h: 20, kind: 'awning', oneWay: true },
    { id: 's3', x: 1370, y: 506, w: 100, h: 70, kind: 'crate' },
  ];
  world.collectibles = [
    { id: 'b_1', x: 715, y: 380, collected: false, label: 'Fe firme', kind: 'star' },
    { id: 'b_2', x: 1175, y: 368, collected: false, label: 'Manto dejado', kind: 'star' },
    { id: 'b_3', x: 1515, y: 492, collected: false, label: 'Luz esperada', kind: 'star' },
  ];
  world.hazards = [
    {
      id: 'b_hush_1',
      kind: 'shush_crowd',
      x: 780,
      y: 514,
      w: 54,
      h: 62,
      vx: 100,
      vy: 0,
      minX: 590,
      maxX: 980,
      state: 'patrol',
      timer: 1.5,
    },
    {
      id: 'b_hush_2',
      kind: 'shush_crowd',
      x: 1320,
      y: 514,
      w: 54,
      h: 62,
      vx: -110,
      vy: 0,
      minX: 1100,
      maxX: 1470,
      state: 'patrol',
      timer: 2.0,
    },
  ];
  world.jesus = {
    active: true,
    x: 1690,
    y: 512,
    targetX: 1690,
    facing: -1,
    walkCycle: 0,
  };
  world.interactSpots = [
    { id: 'cry_1', x: 490, y: 540, label: 'Clamar con fe', done: false, kind: 'cry_out' },
    { id: 'cry_2', x: 925, y: 465, label: 'Clamar más fuerte', done: false, kind: 'cry_out' },
    { id: 'cry_3', x: 1415, y: 465, label: 'Responder al llamado', done: false, kind: 'cry_out' },
    { id: 'meet_jesus', x: 1650, y: 540, label: 'Acercarse a Jesús', done: false, kind: 'touch_cloak' },
  ];
  setDialogue(
    world,
    'Bartimeo',
    'Escucho pasos junto a la puerta de Jericó. Seguiré los destellos dorados y clamaré a Jesús.',
    140,
    470,
    5.4
  );
}

function buildPanes(world: GameWorld) {
  world.stage = 'galilee_hills';
  world.breadMultiplied = false;
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1920, h: 160, kind: 'ground' },
    { id: 'h1', x: 360, y: 472, w: 180, h: 20, kind: 'grass', oneWay: true },
    { id: 'h2', x: 760, y: 448, w: 220, h: 20, kind: 'grass', oneWay: true },
    { id: 'h3', x: 1090, y: 392, w: 210, h: 20, kind: 'grass', oneWay: true },
    { id: 'h4', x: 1380, y: 456, w: 210, h: 20, kind: 'grass', oneWay: true },
  ];
  world.collectibles = [
    { id: 'p_1', x: 450, y: 422, collected: false, label: 'Pan de cebada', kind: 'bread' },
    { id: 'p_2', x: 1195, y: 342, collected: false, label: 'Pez del lago', kind: 'bread' },
    { id: 'p_3', x: 1620, y: 518, collected: false, label: 'Canasta abundante', kind: 'bread' },
  ];
  world.jesus = {
    active: true,
    x: 560,
    y: 512,
    targetX: 560,
    facing: -1,
    walkCycle: 0,
  };
  world.interactSpots = [
    {
      id: 'jesus_bread',
      x: 530,
      y: 540,
      label: 'Entregar los cinco panes',
      done: false,
      kind: 'jesus_bread',
    },
    { id: 'grp_1', x: 870, y: 416, label: 'Compartir pan con la familia', done: false, kind: 'deliver_bread' },
    { id: 'grp_2', x: 1195, y: 360, label: 'Compartir en la colina', done: false, kind: 'deliver_bread' },
    { id: 'grp_3', x: 1485, y: 424, label: 'Repartir con alegría', done: false, kind: 'deliver_bread' },
    { id: 'grp_4', x: 1740, y: 540, label: 'Completar la merienda', done: false, kind: 'deliver_bread' },
  ];
  setDialogue(
    world,
    'Muchacho',
    'Aquí tengo cinco panes de cebada y dos peces. Se los llevaré a Jesús para que los bendiga.',
    140,
    470,
    5.4
  );
}

function buildTormenta(world: GameWorld) {
  world.stage = 'galilee_storm';
  world.worldWidth = 1360;
  world.groundY = 548;
  world.player.y = 548 - 56;
  world.stormCalm = 0;
  world.platforms = [
    { id: 'deck', x: 0, y: 548, w: 1360, h: 180, kind: 'wood' },
    { id: 'b1', x: 290, y: 458, w: 150, h: 20, kind: 'wood', oneWay: true },
    { id: 'b2', x: 580, y: 412, w: 190, h: 20, kind: 'wood', oneWay: true },
    { id: 'b3', x: 880, y: 458, w: 165, h: 20, kind: 'wood', oneWay: true },
  ];
  world.collectibles = [
    { id: 't_1', x: 365, y: 408, collected: false, label: 'Ancla firme', kind: 'star' },
    { id: 't_2', x: 675, y: 362, collected: false, label: 'Luz en la ola', kind: 'star' },
    { id: 't_3', x: 960, y: 408, collected: false, label: 'Calma en el corazón', kind: 'star' },
  ];
  world.hazards = [
    {
      id: 'wave_1',
      kind: 'sea_wave',
      x: 520,
      y: 496,
      w: 76,
      h: 52,
      vx: 145,
      vy: 0,
      minX: 290,
      maxX: 980,
      state: 'patrol',
      timer: 1.5,
    },
  ];
  world.jesus = {
    active: true,
    x: 1185,
    y: 484,
    targetX: 1185,
    facing: -1,
    walkCycle: 0,
  };
  world.interactSpots = [
    { id: 'rope_1', x: 365, y: 512, label: 'Asegurar cabo de proa', done: false, kind: 'sail_rope' },
    { id: 'rope_2', x: 675, y: 380, label: 'Asegurar la vela mayor', done: false, kind: 'sail_rope' },
    { id: 'rope_3', x: 960, y: 512, label: 'Asegurar cabo de popa', done: false, kind: 'sail_rope' },
    { id: 'wake_j', x: 1150, y: 512, label: 'Despertar a Jesús', done: false, kind: 'wake_jesus' },
  ];
  setDialogue(
    world,
    'Pedro',
    'El viento sacude la barca con fuerza. Aseguremos las velas y despertemos a Jesús en la popa.',
    150,
    440,
    5.4
  );
}

function buildDanielTerrace(world: GameWorld) {
  world.stage = 'babylon_terrace';
  world.danielBeat = 'terrace_pray';
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1620, h: 160, kind: 'stone' },
    { id: 'bal_1', x: 310, y: 478, w: 130, h: 20, kind: 'balustrade', oneWay: true },
    { id: 'bal_2', x: 750, y: 468, w: 145, h: 20, kind: 'balustrade', oneWay: true },
    { id: 'bal_3', x: 1190, y: 478, w: 135, h: 20, kind: 'balustrade', oneWay: true },
  ];
  world.prayerWindows = [
    { id: 'pw_1', x: 420, y: 520, prayed: false, progress: 0 },
    { id: 'pw_2', x: 860, y: 520, prayed: false, progress: 0 },
    { id: 'pw_3', x: 1300, y: 520, prayed: false, progress: 0 },
  ];
  world.guards = [
    {
      id: 'g1',
      x: 620,
      y: 512,
      minX: 460,
      maxX: 780,
      vx: 85,
      facing: 1,
      state: 'patrol',
      timer: 1.8,
      sightRange: 175,
    },
    {
      id: 'g2',
      x: 1100,
      y: 512,
      minX: 930,
      maxX: 1245,
      vx: -90,
      facing: -1,
      state: 'patrol',
      timer: 2.2,
      sightRange: 175,
    },
  ];
  world.collectibles = [
    { id: 'd_1', x: 375, y: 430, collected: false, label: 'Fidelidad', kind: 'star' },
    { id: 'd_2', x: 822, y: 420, collected: false, label: 'Oración constante', kind: 'star' },
    { id: 'd_3', x: 1255, y: 430, collected: false, label: 'Coraje', kind: 'star' },
  ];
  setDialogue(
    world,
    'Daniel',
    'Como cada día, abriré mi ventana hacia Jerusalén y oraré con confianza al Dios viviente.',
    150,
    470,
    5.4
  );
}

function transitionToLionsDen(world: GameWorld) {
  world.stage = 'lions_den';
  world.danielBeat = 'pit_survival';
  world.worldWidth = 1420;
  world.cameraX = 0;
  world.player.x = 120;
  world.player.y = 520;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.grounded = true;
  world.guards = [];
  world.prayerWindows = [];
  world.platforms = [
    { id: 'den_floor', x: 0, y: 576, w: 1420, h: 160, kind: 'stone' },
    { id: 'ledge_1', x: 280, y: 446, w: 170, h: 20, kind: 'stone', oneWay: true },
    { id: 'ledge_2', x: 640, y: 422, w: 185, h: 20, kind: 'stone', oneWay: true },
    { id: 'ledge_3', x: 1020, y: 446, w: 175, h: 20, kind: 'stone', oneWay: true },
  ];
  world.lions = [
    {
      id: 'lion_pacer',
      name: 'León Vigilante',
      policy: 'pacer',
      x: 470,
      y: 526,
      w: 68,
      h: 50,
      vx: 95,
      vy: 0,
      minX: 310,
      maxX: 600,
      facing: 1,
      grounded: true,
      state: 'patrol',
      timer: 1.5,
      cooldown: 1.2,
      hitFlashTimer: 0,
    },
    {
      id: 'lion_leaper',
      name: 'León Saltarín',
      policy: 'leaper',
      x: 820,
      y: 526,
      w: 68,
      h: 50,
      vx: -90,
      vy: 0,
      minX: 640,
      maxX: 930,
      facing: -1,
      grounded: true,
      state: 'patrol',
      timer: 1.8,
      cooldown: 1.6,
      hitFlashTimer: 0,
    },
    {
      id: 'lion_charger',
      name: 'León Rugiente',
      policy: 'charger',
      x: 1180,
      y: 526,
      w: 72,
      h: 50,
      vx: -105,
      vy: 0,
      minX: 980,
      maxX: 1320,
      facing: -1,
      grounded: true,
      state: 'patrol',
      timer: 2.0,
      cooldown: 1.9,
      hitFlashTimer: 0,
    },
  ];
  world.angelLights = [
    { id: 'al_1', x: 365, y: 412, activated: false, targetLionId: 'lion_pacer' },
    { id: 'al_2', x: 732, y: 388, activated: false, targetLionId: 'lion_leaper' },
    { id: 'al_3', x: 1105, y: 412, activated: false, targetLionId: 'lion_charger' },
  ];
  world.events.push({ type: 'pray', x: 200, y: 480 });
  setDialogue(
    world,
    'Ángel del Señor',
    'No temas, Daniel. Enciende las luces celestiales y la boca de los leones quedará cerrada.',
    220,
    430,
    5.4
  );
}

function buildDavid(world: GameWorld) {
  world.stage = 'valley_elah';
  world.worldWidth = 1660;
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1660, h: 160, kind: 'ground' },
    { id: 'r1', x: 270, y: 486, w: 145, h: 20, kind: 'stone', oneWay: true },
    { id: 'r2', x: 520, y: 442, w: 160, h: 20, kind: 'stone', oneWay: true },
    { id: 'r3', x: 780, y: 486, w: 145, h: 20, kind: 'stone', oneWay: true },
  ];
  world.collectibles = [
    { id: 'st_1', x: 220, y: 540, collected: false, label: 'Piedra lisa 1', kind: 'stone' },
    { id: 'st_2', x: 342, y: 444, collected: false, label: 'Piedra lisa 2', kind: 'stone' },
    { id: 'st_3', x: 465, y: 540, collected: false, label: 'Piedra lisa 3', kind: 'stone' },
    { id: 'st_4', x: 600, y: 400, collected: false, label: 'Piedra lisa 4', kind: 'stone' },
    { id: 'st_5', x: 852, y: 444, collected: false, label: 'Piedra lisa 5', kind: 'stone' },
  ];
  world.goliath = {
    x: 1365,
    y: 416,
    w: 96,
    h: 160,
    hp: 3,
    maxHp: 3,
    shieldUp: true,
    state: 'taunt',
    timer: 1.5,
    hitFlashTimer: 0,
  };
  setDialogue(
    world,
    'David',
    'Recogeré piedras lisas del arroyo. Cuando el gigante baje su escudo, lanzaré con mi honda.',
    145,
    470,
    5.4
  );
}

function buildHorno(world: GameWorld) {
  world.stage = 'fiery_furnace';
  world.worldWidth = 1800;
  world.dewShieldCharges = 0;
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1800, h: 160, kind: 'stone' },
    { id: 'f1', x: 340, y: 468, w: 165, h: 20, kind: 'stone', oneWay: true },
    { id: 'f2', x: 840, y: 448, w: 175, h: 20, kind: 'stone', oneWay: true },
    { id: 'f3', x: 1300, y: 468, w: 165, h: 20, kind: 'stone', oneWay: true },
  ];
  world.collectibles = [
    { id: 'dew_1', x: 422, y: 420, collected: false, label: 'Rocío celestial', kind: 'dew' },
    { id: 'dew_2', x: 928, y: 400, collected: false, label: 'Brisa fresca', kind: 'dew' },
    { id: 'dew_3', x: 1382, y: 420, collected: false, label: 'Amparo divino', kind: 'dew' },
  ];
  world.hazards = [
    {
      id: 'fj_1',
      kind: 'fire_jet',
      x: 545,
      y: 446,
      w: 52,
      h: 130,
      vx: 0,
      vy: 0,
      minX: 545,
      maxX: 545,
      state: 'patrol',
      timer: 1.7,
    },
    {
      id: 'fj_2',
      kind: 'fire_jet',
      x: 1030,
      y: 446,
      w: 52,
      h: 130,
      vx: 0,
      vy: 0,
      minX: 1030,
      maxX: 1030,
      state: 'patrol',
      timer: 2.3,
    },
  ];
  world.interactSpots = [
    { id: 'friend_1', x: 690, y: 540, label: 'Reunirse con Mesac', done: false, kind: 'furnace_friend' },
    { id: 'friend_2', x: 1170, y: 540, label: 'Reunirse con Abed-nego', done: false, kind: 'furnace_friend' },
    { id: 'f_exit', x: 1620, y: 540, label: 'Salir ilesos del horno', done: false, kind: 'furnace_exit' },
  ];
  setDialogue(
    world,
    'Sadrac',
    'Nuestro Dios puede librarnos del fuego. Busquemos el rocío fresco y caminemos unidos.',
    145,
    470,
    5.4
  );
}

function buildMoises(world: GameWorld) {
  world.stage = 'red_sea';
  world.worldWidth = 1980;
  world.seaPartedLevel = 0;
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1980, h: 160, kind: 'ground' },
    { id: 'r1', x: 560, y: 478, w: 160, h: 20, kind: 'stone', oneWay: true },
    { id: 'r2', x: 1090, y: 462, w: 170, h: 20, kind: 'stone', oneWay: true },
    { id: 'r3', x: 1580, y: 486, w: 150, h: 20, kind: 'stone', oneWay: true },
  ];
  world.collectibles = [
    { id: 'm_1', x: 640, y: 430, collected: false, label: 'Estandarte de fe', kind: 'banner' },
    { id: 'm_2', x: 1175, y: 414, collected: false, label: 'Columna de nube', kind: 'banner' },
    { id: 'm_3', x: 1655, y: 438, collected: false, label: 'Canto de victoria', kind: 'banner' },
  ];
  world.hazards = [
    {
      id: 'ch_1',
      kind: 'chariot',
      x: 760,
      y: 510,
      w: 88,
      h: 66,
      vx: -95,
      vy: 0,
      minX: 500,
      maxX: 890,
      state: 'patrol',
      timer: 1.8,
    },
    {
      id: 'ch_2',
      kind: 'chariot',
      x: 1290,
      y: 510,
      w: 88,
      h: 66,
      vx: -100,
      vy: 0,
      minX: 1050,
      maxX: 1410,
      state: 'patrol',
      timer: 2.2,
    },
  ];
  world.interactSpots = [
    { id: 'sea_1', x: 415, y: 540, label: 'Alzar la vara en la orilla', done: false, kind: 'sea_pillar' },
    { id: 'sea_2', x: 955, y: 540, label: 'Abrir el camino profundo', done: false, kind: 'sea_pillar' },
    { id: 'sea_3', x: 1485, y: 540, label: 'Guiar al pueblo en seco', done: false, kind: 'sea_pillar' },
  ];
  setDialogue(
    world,
    'Moisés',
    'No teman, manténganse firmes. Alzaré la vara para que el Señor abra camino en el mar.',
    145,
    470,
    5.4
  );
}

function buildNoe(world: GameWorld) {
  world.stage = 'noah_ark';
  world.worldWidth = 1900;
  world.platforms = [
    { id: 'ground', x: 0, y: 576, w: 1900, h: 160, kind: 'ground' },
    { id: 'n1', x: 640, y: 468, w: 185, h: 20, kind: 'wood', oneWay: true },
    { id: 'n2', x: 1180, y: 452, w: 175, h: 20, kind: 'wood', oneWay: true },
    { id: 'ark_ramp', x: 1470, y: 492, w: 155, h: 20, kind: 'wood', oneWay: true },
    { id: 'ark_deck', x: 1615, y: 422, w: 235, h: 22, kind: 'wood', oneWay: true },
  ];
  world.collectibles = [
    { id: 'n_1', x: 730, y: 420, collected: false, label: 'Madera de gofer', kind: 'star' },
    { id: 'n_2', x: 1265, y: 404, collected: false, label: 'Rama de olivo', kind: 'star' },
    { id: 'n_3', x: 1780, y: 374, collected: false, label: 'Promesa del arco', kind: 'star' },
  ];
  world.interactSpots = [
    {
      id: 'an_1',
      x: 410,
      y: 540,
      label: 'Guiar a las ovejitas al arca',
      done: false,
      kind: 'animal_pair',
      animalKind: 'sheep',
    },
    {
      id: 'an_2',
      x: 730,
      y: 436,
      label: 'Llamar a las palomas',
      done: false,
      kind: 'animal_pair',
      animalKind: 'dove',
    },
    {
      id: 'an_3',
      x: 1020,
      y: 540,
      label: 'Guiar a los leones mansos',
      done: false,
      kind: 'animal_pair',
      animalKind: 'lion',
    },
    {
      id: 'an_4',
      x: 1265,
      y: 420,
      label: 'Guiar a los elefantes',
      done: false,
      kind: 'animal_pair',
      animalKind: 'elephant',
    },
    {
      id: 'dove_release',
      x: 1690,
      y: 390,
      label: 'Soltar la paloma de la paz',
      done: false,
      kind: 'ark_dove',
    },
  ];
  setDialogue(
    world,
    'Noé',
    'Las primeras gotas comienzan a caer. Reunamos con cariño a cada pareja de animales hacia el arca.',
    145,
    470,
    5.4
  );
}

export function createStoryWorld(story: StoryId): GameWorld {
  resetParticles();
  const world = makeBaseWorld(story, 1920, 576);
  switch (story) {
    case 'zaqueo':
      world.worldWidth = 1960;
      buildZaqueoRoad(world);
      break;
    case 'flujo':
      world.worldWidth = 1900;
      buildFlujo(world);
      break;
    case 'bartimeo':
      world.worldWidth = 1860;
      buildBartimeo(world);
      break;
    case 'panes':
      world.worldWidth = 1920;
      buildPanes(world);
      break;
    case 'tormenta':
      buildTormenta(world);
      break;
    case 'daniel':
      world.worldWidth = 1620;
      buildDanielTerrace(world);
      break;
    case 'david':
      buildDavid(world);
      break;
    case 'horno':
      buildHorno(world);
      break;
    case 'moises':
      buildMoises(world);
      break;
    case 'noe':
      buildNoe(world);
      break;
  }
  world.objectiveTargetX = computeObjectiveTargetX(world);
  return world;
}

function damagePlayer(world: GameWorld, knockDir: number) {
  if (world.player.invulnTimer > 0 || world.outcome) return;
  if (world.dewShieldCharges > 0) {
    world.dewShieldCharges -= 1;
    world.player.invulnTimer = 1.4;
    world.player.hitFlashTimer = 0.22;
    world.player.vx = knockDir * 150;
    world.player.vy = -240;
    spawnBurst(
      world.player.x + world.player.w / 2,
      world.player.y + world.player.h / 2,
      '#38BDF8',
      14,
      160
    );
    world.events.push({ type: 'interact' });
    setDialogue(
      world,
      'Ángel del Señor',
      'El rocío fresco los protege del calor del horno.',
      world.player.x,
      world.player.y - 24,
      3.5
    );
    return;
  }

  world.player.hp = Math.max(0, world.player.hp - 1);
  world.player.invulnTimer = 1.5;
  world.player.hitFlashTimer = 0.25;
  world.hitstopTimer = 0.06;
  world.trauma = Math.min(1, world.trauma + 0.52);
  world.player.vx = knockDir * 220;
  world.player.vy = -310;
  world.player.grounded = false;
  world.events.push({ type: 'hurt' });
  spawnBurst(
    world.player.x + world.player.w / 2,
    world.player.y + 24,
    '#EF4444',
    10,
    170
  );

  if (world.player.hp <= 0) {
    world.defeatDelayTimer = 0.35;
  }
}

function moveAndCollidePlayer(world: GameWorld, input: InputState, dt: number) {
  const p = world.player;
  const moveLeft = input.held.has('ArrowLeft') || input.held.has('KeyA');
  const moveRight = input.held.has('ArrowRight') || input.held.has('KeyD');
  const moveUp = input.held.has('ArrowUp') || input.held.has('KeyW');
  const moveDown = input.held.has('ArrowDown') || input.held.has('KeyS');
  const jumpPressed =
    input.justPressed.has('Space') ||
    input.justPressed.has('ArrowUp') ||
    input.justPressed.has('KeyW');

  const dir = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
  if (dir !== 0) p.facing = dir as 1 | -1;

  p.crouching = moveDown && p.grounded && !p.climbing;

  const pCenterX = p.x + p.w / 2;
  const pBottom = p.y + p.h;
  const ladder = world.climbables.find(
    (c) =>
      pCenterX >= c.x - 10 &&
      pCenterX <= c.x + c.w + 10 &&
      pBottom >= c.y - 6 &&
      p.y <= c.y + c.h
  );

  if (ladder && (moveUp || (moveDown && !p.grounded))) {
    p.climbing = true;
  }
  if (!ladder) {
    p.climbing = false;
  }

  if (p.climbing && ladder) {
    p.vx = dir * (MOVE_SPEED * 0.52);
    p.vy = ((moveDown ? 1 : 0) - (moveUp ? 1 : 0)) * CLIMB_SPEED;
    p.grounded = false;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y + p.h > world.groundY) {
      p.y = world.groundY - p.h;
      p.vy = 0;
      p.grounded = true;
      p.climbing = false;
    }
    if (p.y + p.h <= ladder.y + 4 && moveUp) {
      p.y = ladder.y - p.h;
      p.vy = 0;
      p.climbing = false;
      p.grounded = true;
    }
  } else {
    const targetVx = dir * (p.crouching ? MOVE_SPEED * 0.45 : MOVE_SPEED);
    p.vx += (targetVx - p.vx) * Math.min(1, dt * 15);

    if (jumpPressed) {
      p.jumpBufferTimer = JUMP_BUFFER;
    } else {
      p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    }

    if (p.grounded) {
      p.coyoteTimer = COYOTE_TIME;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
      p.vy = JUMP_VEL;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.scaleX = 0.82;
      p.scaleY = 1.22;
      spawnBurst(p.x + p.w / 2, p.y + p.h, '#E7D5B8', 5, 70, 90);
      world.events.push({ type: 'jump' });
    }

    // Variable jump height when player releases jump early while rising
    const jumpHeld =
      input.held.has('Space') || input.held.has('ArrowUp') || input.held.has('KeyW');
    if (!jumpHeld && p.vy < -210) {
      p.vy *= 0.86;
    }

    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;

    // Horizontal solid collisions
    for (const plat of world.platforms) {
      if (plat.oneWay || plat.kind === 'ground') continue;
      if (
        p.x + p.w > plat.x &&
        p.x < plat.x + plat.w &&
        p.y + p.h > plat.y + 6 &&
        p.y < plat.y + plat.h - 4
      ) {
        if (p.vx > 0) {
          p.x = plat.x - p.w;
        } else if (p.vx < 0) {
          p.x = plat.x + plat.w;
        }
        p.vx = 0;
      }
    }

    const prevBottom = p.y + p.h;
    p.y += p.vy * dt;
    const wasGrounded = p.grounded;
    p.grounded = false;

    for (const plat of world.platforms) {
      const overlapsX = p.x + p.w - 4 > plat.x && p.x + 4 < plat.x + plat.w;
      if (!overlapsX) continue;

      if (plat.oneWay) {
        if (
          p.vy >= 0 &&
          prevBottom <= plat.y + 10 &&
          p.y + p.h >= plat.y &&
          !(moveDown && input.justPressed.has('Space'))
        ) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
        }
      } else {
        if (p.vy >= 0 && prevBottom <= plat.y + 14 && p.y + p.h >= plat.y) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
        } else if (p.vy < 0 && p.y <= plat.y + plat.h && prevBottom > plat.y + plat.h) {
          p.y = plat.y + plat.h;
          p.vy = 0;
        }
      }
    }

    if (!wasGrounded && p.grounded) {
      p.scaleX = 1.2;
      p.scaleY = 0.82;
      spawnBurst(p.x + p.w / 2, p.y + p.h, '#D9C2A3', 6, 85, 110);
      world.events.push({ type: 'land' });
    }
  }

  p.x = Math.max(18, Math.min(world.worldWidth - p.w - 18, p.x));
  p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 12);
  p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 12);

  // Sync walk cycle to actual travel speed so character never skates when decelerating
  if (Math.abs(p.vx) > 20 && p.grounded) {
    p.walkCycle += (Math.abs(p.vx) / MOVE_SPEED) * dt * 12;
  } else if (p.climbing && Math.abs(p.vy) > 12) {
    p.walkCycle += (Math.abs(p.vy) / CLIMB_SPEED) * dt * 9;
  }
}

function collectNearbyItems(world: GameWorld) {
  const px = world.player.x + world.player.w / 2;
  const py = world.player.y + world.player.h / 2;
  for (const item of world.collectibles) {
    if (item.collected) continue;
    const dist = Math.hypot(px - item.x, py - item.y);
    if (dist <= 40) {
      item.collected = true;
      if (item.kind === 'dew') {
        world.dewShieldCharges += 1;
      }
      world.events.push({ type: 'collect', x: item.x, y: item.y });
      spawnBurst(
        item.x,
        item.y,
        item.kind === 'dew' ? '#38BDF8' : item.kind === 'stone' ? '#CBD5E1' : '#FBBF24',
        12,
        140
      );
    }
  }
}

function stepGenericHazards(world: GameWorld, dt: number) {
  const p = world.player;
  const px = p.x + p.w / 2;
  const py = p.y + p.h / 2;

  for (const h of world.hazards) {
    if (h.state === 'stopped') continue;

    if (h.kind === 'fire_jet') {
      h.timer -= dt;
      if (h.state === 'patrol' && h.timer <= 0) {
        h.state = 'telegraph';
        h.timer = 0.72;
        world.events.push({ type: 'telegraph', x: h.x, y: h.y });
      } else if (h.state === 'telegraph' && h.timer <= 0) {
        h.state = 'active';
        h.timer = 1.25;
      } else if (h.state === 'active' && h.timer <= 0) {
        h.state = 'patrol';
        h.timer = 1.8;
      }

      if (h.state === 'active') {
        if (
          p.x + p.w - 6 > h.x &&
          p.x + 6 < h.x + h.w &&
          p.y + p.h - 6 > h.y &&
          p.y + 6 < h.y + h.h
        ) {
          damagePlayer(world, px < h.x + h.w / 2 ? -1 : 1);
        }
      }
      continue;
    }

    // Patrol + telegraph + active dash/surge hazards (shush_crowd, sea_wave, chariot, spear)
    if (h.kind === 'spear') {
      h.x += h.vx * dt;
      if (h.x < h.minX || h.x > h.maxX) {
        h.state = 'stopped';
        continue;
      }
      if (
        p.x + p.w - 6 > h.x &&
        p.x + 6 < h.x + h.w &&
        p.y + p.h - 6 > h.y &&
        p.y + 6 < h.y + h.h
      ) {
        damagePlayer(world, -1);
        h.state = 'stopped';
      }
      continue;
    }

    if (h.state === 'patrol') {
      h.x += h.vx * dt;
      if (h.x <= h.minX) {
        h.x = h.minX;
        h.vx = Math.abs(h.vx);
      } else if (h.x >= h.maxX) {
        h.x = h.maxX;
        h.vx = -Math.abs(h.vx);
      }
      h.timer -= dt;
      const dist = Math.abs(px - (h.x + h.w / 2));
      if (h.timer <= 0 && dist < 260 && Math.abs(py - (h.y + h.h / 2)) < 90) {
        h.state = 'telegraph';
        h.timer = 0.68;
        world.events.push({ type: 'telegraph', x: h.x, y: h.y });
      }
    } else if (h.state === 'telegraph') {
      h.timer -= dt;
      if (h.timer <= 0) {
        h.state = 'active';
        h.timer = 0.65;
      }
    } else if (h.state === 'active') {
      const surgeDir = h.vx >= 0 ? 1 : -1;
      h.x += surgeDir * Math.abs(h.vx) * 1.9 * dt;
      h.x = Math.max(h.minX, Math.min(h.maxX, h.x));
      h.timer -= dt;
      if (h.timer <= 0) {
        h.state = 'patrol';
        h.timer = 2.0;
      }
    }

    if (
      h.state !== 'telegraph' &&
      p.x + p.w - 8 > h.x + 4 &&
      p.x + 8 < h.x + h.w - 4 &&
      p.y + p.h - 6 > h.y + 6 &&
      p.y + 6 < h.y + h.h
    ) {
      damagePlayer(world, px < h.x + h.w / 2 ? -1 : 1);
    }
  }
}

function stepZaqueo(world: GameWorld, input: InputState, dt: number) {
  const px = world.player.x + world.player.w / 2;
  const interactPressed =
    input.justPressed.has('KeyE') || input.justPressed.has('Enter');

  if (world.stage === 'jericho_road') {
    for (const c of world.crowdGroups) {
      if (!c.parted && Math.abs(px - (c.x + c.w / 2)) < 85 && world.player.y >= 490) {
        c.parted = true;
      }
    }

    if (px > 340 && px < 1180) {
      speakThirdPartyOnce(
        world,
        'zaqueo_crowd_intro',
        'Multitud',
        '¡Ahí viene Jesús por la calle de Jericó! Hay demasiada gente y nadie puede ver desde aquí abajo.',
        530,
        460,
        false,
        5.0
      );
    }

    if (world.zaqueoBeat === 'cross_crowd' && px > 1360) {
      world.zaqueoBeat = 'climb_tree';
    }

    if (
      (world.zaqueoBeat === 'cross_crowd' || world.zaqueoBeat === 'climb_tree') &&
      Math.abs(px - world.treeLookoutX) < 95 &&
      world.player.y <= world.treeLookoutY + 34
    ) {
      world.zaqueoBeat = 'jesus_calling';
      world.jesus.active = true;
      world.events.push({ type: 'jesus_call', x: world.jesus.x, y: world.jesus.y });
      spawnBurst(world.jesus.x, world.jesus.y, '#FBBF24', 16, 150);
      setDialogue(
        world,
        'Jesús',
        '¡Zaqueo, date prisa y desciende, porque hoy es necesario que pose yo en tu casa!',
        world.jesus.x,
        world.jesus.y - 40,
        5.5
      );
    }

    if (world.jesus.active && world.jesus.x < world.jesus.targetX) {
      world.jesus.x = Math.min(world.jesus.targetX, world.jesus.x + 125 * dt);
      world.jesus.walkCycle += dt * 8;
    }

    if (world.zaqueoBeat === 'jesus_calling' && world.jesus.x >= world.jesus.targetX - 18) {
      world.zaqueoBeat = 'descend_tree';
    }

    if (world.zaqueoBeat === 'descend_tree') {
      const distJesus = Math.abs(px - (world.jesus.x + 20));
      if (distJesus < 95 && world.player.y >= 505) {
        world.nearbyPrompt = {
          label: 'Recibir a Jesús [E]',
          x: world.jesus.x + 20,
          y: world.jesus.y - 24,
        };
        if (interactPressed) {
          transitionToZaqueoHouse(world);
        }
      }
    }
  } else if (world.stage === 'zaqueo_house') {
    if (!world.chestOpened && Math.abs(px - 340) < 88) {
      world.nearbyPrompt = {
        label: 'Abrir arca de restitución [E]',
        x: 340,
        y: 500,
      };
      if (interactPressed) {
        world.chestOpened = true;
        world.zaqueoBeat = 'house_bless';
        world.events.push({ type: 'interact', x: 340, y: 530 });
        spawnBurst(340, 530, '#F59E0B', 18, 170);
        setDialogue(
          world,
          'Zaqueo',
          'Señor, la mitad de mis bienes doy a los pobres, y si en algo he defraudado, lo devuelvo cuadruplicado.',
          340,
          470,
          5.6
        );
      }
    } else if (world.chestOpened) {
      const nearest = world.neighbors.find((n) => !n.blessed && Math.abs(px - n.x) < 86);
      if (nearest) {
        world.nearbyPrompt = {
          label: `Bendecir a ${nearest.name.split(' ')[0]} [E]`,
          x: nearest.x,
          y: nearest.y - 26,
        };
        if (interactPressed) {
          nearest.blessed = true;
          world.events.push({ type: 'collect', x: nearest.x, y: nearest.y });
          spawnBurst(nearest.x, nearest.y + 10, '#34D399', 14, 140);
          setDialogue(world, nearest.name, nearest.line, nearest.x, nearest.y - 36, 4.4);
          if (world.neighbors.every((n) => n.blessed)) {
            world.zaqueoBeat = 'complete';
            world.outcome = 'victory';
            world.events.push({ type: 'victory' });
          }
        }
      }
    }
  }
}

function stepDaniel(world: GameWorld, input: InputState, dt: number) {
  const px = world.player.x + world.player.w / 2;
  const interactPressed =
    input.justPressed.has('KeyE') || input.justPressed.has('Enter');

  if (world.stage === 'babylon_terrace') {
    for (const g of world.guards) {
      if (g.state === 'patrol') {
        g.x += g.vx * dt;
        if (g.x <= g.minX) {
          g.x = g.minX;
          g.vx = Math.abs(g.vx);
          g.facing = 1;
        } else if (g.x >= g.maxX) {
          g.x = g.maxX;
          g.vx = -Math.abs(g.vx);
          g.facing = -1;
        }
        g.timer -= dt;
        if (g.timer <= 0) {
          g.state = 'telegraph';
          g.timer = 0.72;
          world.events.push({ type: 'telegraph', x: g.x, y: g.y });
        }
      } else if (g.state === 'telegraph') {
        g.timer -= dt;
        if (g.timer <= 0) {
          g.state = 'alert';
          g.timer = 1.4;
          if (Math.abs(px - g.x) < 420) {
            speakThirdPartyOnce(
              world,
              'daniel_guard_edict',
              'Guardia',
              '¡Atención! El edicto del rey prohíbe orar a otro dios. ¡Vigilad las ventanas!',
              g.x,
              g.y - 36,
              false,
              4.6
            );
          }
        }
      } else if (g.state === 'alert') {
        g.timer -= dt;
        const deltaX = px - (g.x + 18);
        const inFront = g.facing === 1 ? deltaX > 0 : deltaX < 0;
        const dist = Math.abs(deltaX);
        if (
          inFront &&
          dist < g.sightRange &&
          world.player.y > 475 &&
          !world.player.crouching
        ) {
          damagePlayer(world, px < g.x ? -1 : 1);
        }
        if (g.timer <= 0) {
          g.state = 'patrol';
          g.timer = 2.4;
        }
      }
    }

    const nearbyWindow = world.prayerWindows.find(
      (pw) => !pw.prayed && Math.abs(px - pw.x) < 76
    );
    if (nearbyWindow) {
      world.nearbyPrompt = {
        label: 'Orar hacia Jerusalén [E]',
        x: nearbyWindow.x,
        y: nearbyWindow.y - 36,
      };
      if (interactPressed) {
        nearbyWindow.prayed = true;
        nearbyWindow.progress = 1;
        world.events.push({ type: 'pray', x: nearbyWindow.x, y: nearbyWindow.y });
        spawnBurst(nearbyWindow.x, nearbyWindow.y, '#60A5FA', 14, 150);
        const count = world.prayerWindows.filter((w) => w.prayed).length;
        if (count === 1) {
          setDialogue(
            world,
            'Daniel',
            'Gracias, Dios mío, por escuchar mi oración. Agáchate si pasan los guardias.',
            nearbyWindow.x,
            nearbyWindow.y - 44,
            4.5
          );
        } else if (count === 2) {
          setDialogue(
            world,
            'Daniel',
            'Al mediodía también elevo mi voz en acción de gracias.',
            nearbyWindow.x,
            nearbyWindow.y - 44,
            4.2
          );
        } else {
          transitionToLionsDen(world);
        }
      }
    }
  } else if (world.stage === 'lions_den') {
    world.angelFloatPhase += dt * 2.4;

    for (const lion of world.lions) {
      if (lion.hitFlashTimer > 0) lion.hitFlashTimer = Math.max(0, lion.hitFlashTimer - dt);
      if (lion.state === 'calmed') continue;

      if (lion.state === 'patrol') {
        lion.x += lion.vx * dt;
        if (lion.x <= lion.minX) {
          lion.x = lion.minX;
          lion.vx = Math.abs(lion.vx);
          lion.facing = 1;
        } else if (lion.x >= lion.maxX) {
          lion.x = lion.maxX;
          lion.vx = -Math.abs(lion.vx);
          lion.facing = -1;
        }
        lion.timer -= dt;
        if (lion.timer <= 0 && Math.abs(px - (lion.x + lion.w / 2)) < 250) {
          lion.state = 'telegraph';
          lion.timer = 0.68;
          lion.facing = px < lion.x ? -1 : 1;
          world.events.push({ type: 'telegraph', x: lion.x, y: lion.y });
        }
      } else if (lion.state === 'telegraph') {
        lion.timer -= dt;
        if (lion.timer <= 0) {
          lion.state = 'active';
          lion.timer = 0.72;
          if (lion.policy === 'leaper') {
            lion.vy = -440;
            lion.grounded = false;
          }
        }
      } else if (lion.state === 'active') {
        const speed = lion.policy === 'charger' ? 255 : lion.policy === 'leaper' ? 185 : 155;
        lion.x += lion.facing * speed * dt;
        lion.x = Math.max(lion.minX, Math.min(lion.maxX, lion.x));
        if (!lion.grounded) {
          lion.vy += GRAVITY * dt;
          lion.y += lion.vy * dt;
          if (lion.y >= 526) {
            lion.y = 526;
            lion.vy = 0;
            lion.grounded = true;
          }
        }
        lion.timer -= dt;
        if (lion.timer <= 0) {
          lion.state = 'recover';
          lion.timer = 0.85;
        }
      } else if (lion.state === 'recover') {
        if (!lion.grounded) {
          lion.vy += GRAVITY * dt;
          lion.y += lion.vy * dt;
          if (lion.y >= 526) {
            lion.y = 526;
            lion.vy = 0;
            lion.grounded = true;
          }
        }
        lion.timer -= dt;
        if (lion.timer <= 0) {
          lion.state = 'patrol';
          lion.timer = 1.9;
        }
      }

      if (
        lion.state !== 'telegraph' &&
        world.player.x + world.player.w - 8 > lion.x + 6 &&
        world.player.x + 8 < lion.x + lion.w - 6 &&
        world.player.y + world.player.h - 6 > lion.y + 8 &&
        world.player.y + 6 < lion.y + lion.h
      ) {
        damagePlayer(world, px < lion.x + lion.w / 2 ? -1 : 1);
      }
    }

    const nearLight = world.angelLights.find(
      (al) => !al.activated && Math.hypot(px - al.x, world.player.y + 28 - al.y) < 76
    );
    if (nearLight) {
      world.nearbyPrompt = {
        label: 'Encender luz del ángel [E]',
        x: nearLight.x,
        y: nearLight.y - 34,
      };
      if (interactPressed) {
        nearLight.activated = true;
        const lion = world.lions.find((l) => l.id === nearLight.targetLionId);
        if (lion) {
          lion.state = 'calmed';
          lion.y = 526;
          lion.vy = 0;
          lion.grounded = true;
          lion.hitFlashTimer = 0.25;
        }
        world.events.push({ type: 'calm_lion', x: nearLight.x, y: nearLight.y });
        spawnBurst(nearLight.x, nearLight.y, '#FDE047', 16, 170);
        const litCount = world.angelLights.filter((al) => al.activated).length;
        if (litCount === 1) {
          setDialogue(
            world,
            'Ángel del Señor',
            'No temas, Daniel. El Señor me envió para cerrar la boca de los leones.',
            nearLight.x,
            nearLight.y - 40,
            4.8
          );
        } else if (litCount === 2) {
          setDialogue(
            world,
            'Ángel del Señor',
            'La paz del cielo cubre este foso; ningún león podrá hacerte daño.',
            nearLight.x,
            nearLight.y - 40,
            4.8
          );
        } else {
          setDialogue(
            world,
            'Rey Darío',
            '¡Daniel, siervo del Dios viviente! Tu Dios, a quien tú sirves fielmente, te ha librado de los leones.',
            nearLight.x,
            nearLight.y - 44,
            5.6
          );
        }
        if (world.angelLights.every((al) => al.activated)) {
          world.danielBeat = 'complete';
          world.outcome = 'victory';
          world.events.push({ type: 'victory' });
        }
      }
    }
  }
}

function stepDavid(world: GameWorld, input: InputState, dt: number) {
  const goliath = world.goliath;
  if (!goliath) return;

  if (goliath.hitFlashTimer > 0) {
    goliath.hitFlashTimer = Math.max(0, goliath.hitFlashTimer - dt);
  }

  // Ensure brook stones can replenish if player fired all 5 while Goliath is still standing
  const stonesCollected = world.collectibles.filter((c) => c.collected).length;
  const activeStonesInFlight = world.slingStones.filter((s) => s.active).length;
  const hitsDealt = goliath.maxHp - goliath.hp;
  const remainingStones = Math.max(0, stonesCollected - hitsDealt - activeStonesInFlight);

  if (stonesCollected === world.collectibles.length && remainingStones === 0 && goliath.hp > 0) {
    const first = world.collectibles[0];
    if (first) first.collected = false;
  }

  if (goliath.state !== 'defeated') {
    goliath.timer -= dt;
    if (goliath.state === 'taunt') {
      goliath.shieldUp = true;
      if (goliath.timer <= 0) {
        goliath.state = 'telegraph';
        goliath.timer = 0.78;
        world.events.push({ type: 'telegraph', x: goliath.x, y: goliath.y + 40 });
        speakThirdPartyOnce(
          world,
          'goliath_taunt',
          'Goliat',
          '¿Vienes contra mí con una simple honda? ¡Prepárate para esquivar mi lanza!',
          goliath.x,
          goliath.y - 26,
          false,
          4.4
        );
      }
    } else if (goliath.state === 'telegraph') {
      goliath.shieldUp = true;
      if (goliath.timer <= 0) {
        goliath.state = 'attack';
        goliath.timer = 0.45;
        world.hazards.push({
          id: `spear_${Math.round(world.elapsed * 100)}`,
          kind: 'spear',
          x: goliath.x - 42,
          y: 526,
          w: 62,
          h: 22,
          vx: -340,
          vy: 0,
          minX: 40,
          maxX: 1500,
          state: 'active',
          timer: 4,
        });
      }
    } else if (goliath.state === 'attack') {
      goliath.shieldUp = true;
      if (goliath.timer <= 0) {
        goliath.state = 'vulnerable';
        goliath.shieldUp = false;
        goliath.timer = 2.8;
        setDialogue(
          world,
          'David',
          '¡Goliat bajó su escudo! Ahora es el momento de usar la honda.',
          world.player.x + 20,
          world.player.y - 24,
          3.4
        );
      }
    } else if (goliath.state === 'vulnerable') {
      goliath.shieldUp = false;
      if (goliath.timer <= 0) {
        goliath.state = 'taunt';
        goliath.shieldUp = true;
        goliath.timer = 1.6;
      }
    }
  }

  // Launch sling stone on [E] or [KeyF]
  const slingPressed =
    input.justPressed.has('KeyE') ||
    input.justPressed.has('KeyF') ||
    input.justPressed.has('Enter');

  if (stonesCollected > 0 && goliath.state !== 'defeated') {
    world.nearbyPrompt = {
      label:
        goliath.state === 'vulnerable'
          ? 'Lanzar piedra con honda [E]'
          : `Piedras listas (${Math.max(1, stonesCollected - hitsDealt)}) · Espera que baje el escudo`,
      x: world.player.x + 18,
      y: world.player.y - 26,
    };
  }

  if (slingPressed && stonesCollected > hitsDealt && goliath.state !== 'defeated') {
    const stone: SlingStone = {
      id: `sling_${Math.round(world.elapsed * 1000)}`,
      x: world.player.x + world.player.w,
      y: world.player.y + 18,
      vx: 680,
      vy: -185,
      active: true,
    };
    world.slingStones.push(stone);
    world.events.push({ type: 'sling', x: stone.x, y: stone.y });
    spawnBurst(stone.x, stone.y, '#CBD5E1', 6, 90);
  }

  for (const s of world.slingStones) {
    if (!s.active) continue;
    s.vy += 300 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    if (s.x > world.worldWidth || s.y > world.groundY) {
      s.active = false;
      continue;
    }

    if (
      goliath.state !== 'defeated' &&
      s.x >= goliath.x &&
      s.x <= goliath.x + goliath.w &&
      s.y >= goliath.y &&
      s.y <= goliath.y + goliath.h
    ) {
      s.active = false;
      if (!goliath.shieldUp) {
        goliath.hp = Math.max(0, goliath.hp - 1);
        goliath.hitFlashTimer = 0.25;
        world.hitstopTimer = 0.08;
        world.trauma = Math.min(1, world.trauma + 0.55);
        world.events.push({ type: 'interact', x: s.x, y: s.y });
        spawnBurst(s.x, s.y, '#FBBF24', 18, 200);

        if (goliath.hp <= 0) {
          goliath.state = 'defeated';
          setDialogue(
            world,
            'David',
            '¡La victoria es del Señor de los ejércitos!',
            world.player.x + 20,
            world.player.y - 24,
            4.2
          );
          world.outcome = 'victory';
          world.events.push({ type: 'victory' });
        } else {
          goliath.state = 'taunt';
          goliath.shieldUp = true;
          goliath.timer = 1.4;
        }
      } else {
        spawnBurst(s.x, s.y, '#94A3B8', 8, 120);
        setDialogue(
          world,
          'Goliat',
          'Ja, ja, mi escudo detuvo esa piedra. ¡Inténtalo cuando lo baje!',
          goliath.x,
          goliath.y - 24,
          3.0
        );
      }
    }
  }
}

function stepInteractSpotStory(world: GameWorld, input: InputState, dt: number) {
  const px = world.player.x + world.player.w / 2;
  const py = world.player.y + world.player.h / 2;
  const interactPressed =
    input.justPressed.has('KeyE') || input.justPressed.has('Enter');

  if (world.story === 'tormenta') {
    const wavePhase = world.elapsed * 2.2;
    world.boatTilt = (1 - world.stormCalm) * Math.sin(wavePhase) * 0.055;
  }

  if (world.story === 'flujo' && px > 380) {
    speakThirdPartyOnce(
      world,
      'flujo_crowd_intro',
      'Multitud',
      '¡Abran paso! Jesús de Nazaret va caminando por Capernaúm y todos quieren acercarse.',
      px + 80,
      460,
      false,
      4.8
    );
  }

  const nearSpot = world.interactSpots.find((spot) => {
    if (spot.done) return false;
    return Math.hypot(px - spot.x, py - spot.y) < 88;
  });

  if (!nearSpot) return;

  // Story-specific gate conditions: third-party NPCs speak audibly AND show clear visual guidance
  if (world.story === 'panes' && nearSpot.kind === 'deliver_bread' && !world.breadMultiplied) {
    world.nearbyPrompt = {
      label: 'Lleva primero la canasta a Jesús',
      x: nearSpot.x,
      y: nearSpot.y - 34,
    };
    speakThirdPartyOnce(
      world,
      `panes_gate_${nearSpot.id}`,
      'Multitud',
      '¡Qué hambre tenemos! Lleva primero la canasta a Jesús para que bendiga los cinco panes y los dos peces.',
      nearSpot.x,
      nearSpot.y - 44,
      interactPressed,
      5.2
    );
    return;
  }

  if (world.story === 'horno' && nearSpot.kind === 'furnace_exit') {
    const friendsDone = world.interactSpots
      .filter((s) => s.kind === 'furnace_friend')
      .every((s) => s.done);
    if (!friendsDone) {
      world.nearbyPrompt = {
        label: 'Reúne primero a Mesac y Abed-nego',
        x: nearSpot.x,
        y: nearSpot.y - 34,
      };
      speakThirdPartyOnce(
        world,
        'horno_gate_exit',
        'Ángel del Señor',
        'Reúne primero a tus amigos Mesac y Abed-nego; saldrán los tres juntos y sin ningún daño.',
        nearSpot.x,
        nearSpot.y - 44,
        interactPressed,
        5.0
      );
      return;
    }
  }

  if (world.story === 'noe' && nearSpot.kind === 'ark_dove') {
    const pairsDone = world.interactSpots
      .filter((s) => s.kind === 'animal_pair')
      .every((s) => s.done);
    if (!pairsDone) {
      world.nearbyPrompt = {
        label: 'Guía primero a todas las parejas al arca',
        x: nearSpot.x,
        y: nearSpot.y - 34,
      };
      speakThirdPartyOnce(
        world,
        'noe_gate_dove',
        'Familia',
        'Padre Noé, todavía faltan parejas de animales por subir al arca antes de soltar la paloma.',
        nearSpot.x,
        nearSpot.y - 44,
        interactPressed,
        5.0
      );
      return;
    }
  }

  if (world.story === 'tormenta' && nearSpot.kind === 'wake_jesus') {
    const ropesDone = world.interactSpots
      .filter((s) => s.kind === 'sail_rope')
      .every((s) => s.done);
    if (!ropesDone) {
      world.nearbyPrompt = {
        label: 'Asegura primero los cabos de la vela',
        x: nearSpot.x,
        y: nearSpot.y - 34,
      };
      speakThirdPartyOnce(
        world,
        'tormenta_gate_wake',
        'Discípulo',
        '¡Pedro, el viento azota la vela! Asegura primero los cabos antes de despertar al Maestro.',
        nearSpot.x,
        nearSpot.y - 44,
        interactPressed,
        4.8
      );
      return;
    }
  }

  world.nearbyPrompt = {
    label: `${nearSpot.label} [E]`,
    x: nearSpot.x,
    y: nearSpot.y - 36,
  };

  if (!interactPressed) return;

  nearSpot.done = true;
  world.events.push({ type: 'interact', x: nearSpot.x, y: nearSpot.y });
  spawnBurst(nearSpot.x, nearSpot.y, '#FBBF24', 15, 160);

  if (world.story === 'flujo' && nearSpot.kind === 'touch_cloak') {
    world.events.push({ type: 'jesus_call', x: nearSpot.x, y: nearSpot.y });
    setDialogue(
      world,
      'Jesús',
      'Hija, tu fe te ha hecho salva; ve en paz, y queda sana de tu dolencia.',
      nearSpot.x,
      nearSpot.y - 44,
      5.4
    );
    world.outcome = 'victory';
    world.events.push({ type: 'victory' });
    return;
  }

  if (world.story === 'bartimeo') {
    if (nearSpot.kind === 'cry_out') {
      world.sightRevealed = Math.min(0.82, world.sightRevealed + 0.24);
      world.events.push({ type: 'jesus_call', x: nearSpot.x, y: nearSpot.y });
      const criesDone = world.interactSpots.filter((s) => s.kind === 'cry_out' && s.done).length;
      if (criesDone === 1) {
        setDialogue(
          world,
          'Bartimeo',
          '¡Jesús, Hijo de David, ten misericordia de mí!',
          nearSpot.x,
          nearSpot.y - 44,
          4.4
        );
      } else if (criesDone === 2) {
        setDialogue(
          world,
          'Multitud',
          '¡Guarda silencio, Bartimeo! Pero cuanto más le piden callar, más fuerte clama con fe.',
          nearSpot.x,
          nearSpot.y - 44,
          4.8
        );
      } else {
        setDialogue(
          world,
          'Hombre de Jericó',
          '¡Ten confianza, Bartimeo! Levántate, porque Jesús te está llamando.',
          nearSpot.x,
          nearSpot.y - 44,
          4.8
        );
      }
    } else if (nearSpot.kind === 'touch_cloak') {
      world.sightRevealed = 1;
      world.events.push({ type: 'jesus_call', x: nearSpot.x, y: nearSpot.y });
      setDialogue(
        world,
        'Jesús',
        'Tu fe te ha salvado. Recibe la vista y camina con gozo.',
        nearSpot.x,
        nearSpot.y - 44,
        5.2
      );
      world.outcome = 'victory';
      world.events.push({ type: 'victory' });
    }
    return;
  }

  if (world.story === 'panes') {
    if (nearSpot.kind === 'jesus_bread') {
      world.breadMultiplied = true;
      world.events.push({ type: 'jesus_call', x: nearSpot.x, y: nearSpot.y });
      setDialogue(
        world,
        'Jesús',
        'He dado gracias por estos cinco panes y dos peces. Ahora compártelos con toda la multitud.',
        nearSpot.x,
        nearSpot.y - 44,
        5.2
      );
    } else {
      const doneGroups = world.interactSpots.filter(
        (s) => s.kind === 'deliver_bread' && s.done
      ).length;
      if (doneGroups === 1) {
        setDialogue(
          world,
          'Multitud',
          '¡Muchas gracias! Este pan está fresco y delicioso, alcanza para toda nuestra familia.',
          nearSpot.x,
          nearSpot.y - 42,
          4.6
        );
      } else if (doneGroups === 2) {
        setDialogue(
          world,
          'Multitud',
          '¡Qué gran milagro! Nunca habíamos visto multiplicarse el pan y los peces así en Galilea.',
          nearSpot.x,
          nearSpot.y - 42,
          4.8
        );
      } else if (doneGroups === 3) {
        setDialogue(
          world,
          'Muchacho',
          '¡Qué alegría! Cuanto más compartimos, más panes y peces aparecen en la canasta.',
          nearSpot.x,
          nearSpot.y - 42,
          4.6
        );
      } else {
        setDialogue(
          world,
          'Multitud',
          '¡Alabado sea Dios! Todos comimos hasta saciarnos y todavía sobraron cestas llenas.',
          nearSpot.x,
          nearSpot.y - 42,
          5.2
        );
      }
      if (world.interactSpots.every((s) => s.done)) {
        world.outcome = 'victory';
        world.events.push({ type: 'victory' });
      }
    }
    return;
  }

  if (world.story === 'tormenta') {
    if (nearSpot.kind === 'sail_rope') {
      const ropesDone = world.interactSpots.filter((s) => s.kind === 'sail_rope' && s.done).length;
      if (ropesDone === 2) {
        setDialogue(
          world,
          'Discípulo',
          '¡Ya casi terminamos, Pedro! Solo falta un cabo y corremos a despertar a Jesús.',
          nearSpot.x,
          nearSpot.y - 42,
          4.4
        );
      } else {
        setDialogue(
          world,
          'Pedro',
          'Cabo asegurado. ¡Sigamos firmes hasta despertar al Maestro!',
          nearSpot.x,
          nearSpot.y - 42,
          4.0
        );
      }
    } else if (nearSpot.kind === 'wake_jesus') {
      world.stormCalm = 1;
      world.boatTilt = 0;
      for (const h of world.hazards) h.state = 'stopped';
      world.events.push({ type: 'jesus_call', x: nearSpot.x, y: nearSpot.y });
      setDialogue(
        world,
        'Jesús',
        '¡Calla, enmudece! Paz sobre el viento y sobre el mar.',
        nearSpot.x,
        nearSpot.y - 46,
        5.2
      );
      world.outcome = 'victory';
      world.events.push({ type: 'victory' });
    }
    return;
  }

  if (world.story === 'horno') {
    if (nearSpot.kind === 'furnace_friend') {
      world.events.push({ type: 'pray', x: nearSpot.x, y: nearSpot.y });
      const friendsDone = world.interactSpots.filter(
        (s) => s.kind === 'furnace_friend' && s.done
      ).length;
      if (friendsDone === 1) {
        setDialogue(
          world,
          'Mesac',
          '¡Sadrac! El fuego no nos quema, un rocío celestial nos guarda en medio de las llamas.',
          nearSpot.x,
          nearSpot.y - 42,
          4.8
        );
      } else {
        setDialogue(
          world,
          'Abed-nego',
          '¡Mira! El Cuarto Varón camina con nosotros. Vamos juntos hacia la salida del horno.',
          nearSpot.x,
          nearSpot.y - 42,
          4.8
        );
      }
    } else if (nearSpot.kind === 'furnace_exit') {
      setDialogue(
        world,
        'Rey Nabucodonosor',
        '¡Bendito sea el Dios de Sadrac, Mesac y Abed-nego, que envió a su ángel y los libró sin daño!',
        nearSpot.x,
        nearSpot.y - 44,
        5.6
      );
      world.outcome = 'victory';
      world.events.push({ type: 'victory' });
    }
    return;
  }

  if (world.story === 'moises') {
    const partedCount = world.interactSpots.filter((s) => s.done).length;
    world.seaPartedLevel = Math.min(1, partedCount / 3);
    world.events.push({ type: 'jesus_call', x: nearSpot.x, y: nearSpot.y });
    if (partedCount >= 3) {
      for (const h of world.hazards) h.state = 'stopped';
      setDialogue(
        world,
        'Moisés',
        '¡Las aguas se abrieron por completo! El pueblo cruza en seco con alegría.',
        nearSpot.x,
        nearSpot.y - 44,
        5.0
      );
      world.outcome = 'victory';
      world.events.push({ type: 'victory' });
    } else if (partedCount === 2) {
      setDialogue(
        world,
        'Pueblo',
        '¡Qué maravilla! Las aguas se levantan como muros y podemos caminar en tierra seca.',
        nearSpot.x,
        nearSpot.y - 44,
        4.8
      );
    } else {
      setDialogue(
        world,
        'Moisés',
        '¡Miren cómo retrocede el mar! Sigamos avanzando con fe.',
        nearSpot.x,
        nearSpot.y - 44,
        4.4
      );
    }
    return;
  }

  if (world.story === 'noe') {
    if (nearSpot.kind === 'animal_pair') {
      const pairsDone = world.interactSpots.filter(
        (s) => s.kind === 'animal_pair' && s.done
      ).length;
      if (pairsDone % 2 === 0) {
        setDialogue(
          world,
          'Familia',
          '¡Mira qué ordenados suben todos al arca! Dios cuidará de cada criatura.',
          nearSpot.x,
          nearSpot.y - 42,
          4.4
        );
      } else {
        setDialogue(
          world,
          'Noé',
          'Pasen con calma al arca, aquí estarán seguros bajo el cuidado de Dios.',
          nearSpot.x,
          nearSpot.y - 42,
          4.4
        );
      }
    } else if (nearSpot.kind === 'ark_dove') {
      world.events.push({ type: 'jesus_call', x: nearSpot.x, y: nearSpot.y });
      setDialogue(
        world,
        'Noé',
        'La paloma regresó con la rama de olivo y el arco iris brilla en el cielo.',
        nearSpot.x,
        nearSpot.y - 44,
        5.0
      );
      world.outcome = 'victory';
      world.events.push({ type: 'victory' });
    }
  }
}

export function stepWorld(world: GameWorld, input: InputState, rawDt: number) {
  const dt = clampDt(rawDt);
  world.events = [];
  world.nearbyPrompt = null;

  if (world.outcome) {
    stepParticles(dt);
    return;
  }

  if (world.defeatDelayTimer > 0) {
    world.defeatDelayTimer -= dt;
    stepParticles(dt);
    if (world.defeatDelayTimer <= 0) {
      world.outcome = 'defeat';
      world.events.push({ type: 'defeat' });
    }
    return;
  }

  world.elapsed += dt;
  world.trauma = Math.max(0, world.trauma - dt * 1.9);

  if (world.player.invulnTimer > 0) {
    world.player.invulnTimer = Math.max(0, world.player.invulnTimer - dt);
  }
  if (world.player.hitFlashTimer > 0) {
    world.player.hitFlashTimer = Math.max(0, world.player.hitFlashTimer - dt);
  }

  if (world.promptSpeechCooldown > 0) {
    world.promptSpeechCooldown = Math.max(0, world.promptSpeechCooldown - dt);
  }

  if (world.dialogue) {
    world.dialogue.timer -= dt;
    if (world.dialogue.timer <= 0) {
      world.dialogue = null;
    }
  }

  if (world.hitstopTimer > 0) {
    world.hitstopTimer = Math.max(0, world.hitstopTimer - dt);
    stepParticles(dt);
    return;
  }

  moveAndCollidePlayer(world, input, dt);
  collectNearbyItems(world);
  stepGenericHazards(world, dt);

  switch (world.story) {
    case 'zaqueo':
      stepZaqueo(world, input, dt);
      break;
    case 'daniel':
      stepDaniel(world, input, dt);
      break;
    case 'david':
      stepDavid(world, input, dt);
      break;
    default:
      stepInteractSpotStory(world, input, dt);
      break;
  }

  stepParticles(dt);
  world.objectiveTargetX = computeObjectiveTargetX(world);

  // Smooth camera tracking clamped to world bounds
  const targetCamX = Math.max(
    0,
    Math.min(
      Math.max(0, world.worldWidth - VIEW_WIDTH),
      world.player.x + world.player.w / 2 - VIEW_WIDTH * 0.42
    )
  );
  world.cameraX += (targetCamX - world.cameraX) * Math.min(1, dt * 8);
}

export function buildHudSnapshot(world: GameWorld): HudSnapshot {
  const meta = getStoryMeta(world.story);
  const starsCollected = world.collectibles.filter((c) => c.collected).length;
  const starsTotal = world.collectibles.length;

  let stageLabel = meta.title;
  let objectiveText = meta.summary;
  let stepCurrent = 0;
  let stepTotal = 1;
  let showHearts = false;

  if (world.story === 'zaqueo') {
    if (world.stage === 'jericho_road') {
      stageLabel = 'Calles de Jericó';
      if (world.zaqueoBeat === 'cross_crowd' || world.zaqueoBeat === 'climb_tree') {
        objectiveText = 'Cruza la ciudad y trepa hasta lo alto del sicómoro.';
        stepCurrent = 1;
      } else {
        objectiveText = 'Desciende del árbol y recibe a Jesús junto al tronco.';
        stepCurrent = 2;
      }
      stepTotal = 4;
    } else {
      stageLabel = 'Casa de Zaqueo';
      const blessed = world.neighbors.filter((n) => n.blessed).length;
      if (!world.chestOpened) {
        objectiveText = 'Abre el arca para compartir tus bienes con alegría.';
        stepCurrent = 3;
      } else {
        objectiveText = `Bendice a tus vecinos (${blessed}/${world.neighbors.length}).`;
        stepCurrent = 3 + (blessed === world.neighbors.length ? 1 : 0);
      }
      stepTotal = 4;
    }
  } else if (world.story === 'daniel') {
    showHearts = true;
    if (world.stage === 'babylon_terrace') {
      stageLabel = 'Terraza de Babilonia';
      const prayed = world.prayerWindows.filter((w) => w.prayed).length;
      stepCurrent = prayed;
      stepTotal = 6;
      objectiveText = `Ora en las 3 ventanas (${prayed}/3). Agáchate ante los guardias.`;
    } else {
      stageLabel = 'Foso de los Leones';
      const calmed = world.angelLights.filter((a) => a.activated).length;
      stepCurrent = 3 + calmed;
      stepTotal = 6;
      objectiveText = `Enciende las 3 luces celestiales (${calmed}/3).`;
    }
  } else if (world.story === 'david') {
    showHearts = true;
    stageLabel = 'Valle de Ela';
    const hits = world.goliath ? world.goliath.maxHp - world.goliath.hp : 0;
    stepCurrent = hits;
    stepTotal = world.goliath?.maxHp ?? 3;
    objectiveText =
      starsCollected === 0
        ? 'Recoge piedras lisas del arroyo y evita las lanzas de Goliat.'
        : `Lanza piedras con [E] cuando Goliat baje su escudo (${hits}/3).`;
  } else if (world.story === 'flujo') {
    showHearts = true;
    stageLabel = 'Multitud de Capernaúm';
    stepCurrent = world.interactSpots.filter((s) => s.done).length;
    stepTotal = 1;
    objectiveText = 'Ábrete paso con fe hasta tocar el borde del manto de Jesús.';
  } else if (world.story === 'bartimeo') {
    showHearts = true;
    stageLabel = 'Puerta de Jericó';
    stepCurrent = world.interactSpots.filter((s) => s.done).length;
    stepTotal = world.interactSpots.length;
    objectiveText = `Sigue los destellos dorados y clama a Jesús (${stepCurrent}/${stepTotal}).`;
  } else if (world.story === 'panes') {
    stageLabel = 'Colinas de Galilea';
    stepCurrent = world.interactSpots.filter((s) => s.done).length;
    stepTotal = world.interactSpots.length;
    objectiveText = world.breadMultiplied
      ? `Reparte los panes multiplicados (${stepCurrent - 1}/4 grupos).`
      : 'Lleva tu canasta de cinco panes y dos peces hasta Jesús.';
  } else if (world.story === 'tormenta') {
    showHearts = true;
    stageLabel = 'Mar de Galilea';
    stepCurrent = world.interactSpots.filter((s) => s.done).length;
    stepTotal = world.interactSpots.length;
    const ropes = world.interactSpots.filter((s) => s.kind === 'sail_rope' && s.done).length;
    objectiveText =
      ropes < 3
        ? `Salta las olas y asegura los cabos de la vela (${ropes}/3).`
        : 'Camina hacia la popa y despierta a Jesús.';
  } else if (world.story === 'horno') {
    showHearts = true;
    stageLabel = 'Horno de Babilonia';
    stepCurrent = world.interactSpots.filter((s) => s.done).length;
    stepTotal = world.interactSpots.length;
    objectiveText = `Recoge rocío celestial, reúne a tus amigos y sal ileso (${stepCurrent}/${stepTotal}).`;
  } else if (world.story === 'moises') {
    showHearts = true;
    stageLabel = 'Orilla del Mar Rojo';
    stepCurrent = world.interactSpots.filter((s) => s.done).length;
    stepTotal = world.interactSpots.length;
    objectiveText = `Alza la vara en los 3 pilares para abrir el mar (${stepCurrent}/${stepTotal}).`;
  } else if (world.story === 'noe') {
    stageLabel = 'Colina del Arca';
    stepCurrent = world.interactSpots.filter((s) => s.done).length;
    stepTotal = world.interactSpots.length;
    objectiveText = `Guía a las parejas al arca y suelta la paloma (${stepCurrent}/${stepTotal}).`;
  }

  return {
    story: world.story,
    stageLabel,
    objectiveText,
    verseHint: meta.reference,
    stepCurrent,
    stepTotal,
    starsCollected,
    starsTotal,
    hp: world.player.hp,
    maxHp: world.player.maxHp,
    elapsedSeconds: Math.floor(world.elapsed),
    showHearts,
    hudDark: meta.hudDark && world.stormCalm < 0.5,
  };
}

export function buildRunSummary(world: GameWorld): RunSummary {
  const meta = getStoryMeta(world.story);
  const outcome = world.outcome ?? 'defeat';
  const starsCollected = world.collectibles.filter((c) => c.collected).length;
  const starsTotal = world.collectibles.length;

  let primaryMetricLabel = 'Progreso';
  let primaryMetricValue = `${world.interactSpots.filter((s) => s.done).length}/${Math.max(1, world.interactSpots.length)}`;
  let secondaryMetricLabel = 'Tiempo';
  let secondaryMetricValue = `${Math.floor(world.elapsed)}s`;

  if (world.story === 'zaqueo') {
    primaryMetricLabel = 'Vecinos bendecidos';
    primaryMetricValue = `${world.neighbors.filter((n) => n.blessed).length}/3`;
  } else if (world.story === 'daniel') {
    primaryMetricLabel = 'Leones calmados';
    primaryMetricValue = `${world.lions.filter((l) => l.state === 'calmed').length}/3`;
  } else if (world.story === 'david') {
    primaryMetricLabel = 'Piedras recogidas';
    primaryMetricValue = `${starsCollected}/${starsTotal}`;
    secondaryMetricLabel = 'Fe intacta';
    secondaryMetricValue = `${world.player.hp}/${world.player.maxHp}`;
  } else {
    secondaryMetricLabel = 'Estrellas';
    secondaryMetricValue = `${starsCollected}/${starsTotal}`;
  }

  return {
    story: world.story,
    outcome,
    clearTimeSeconds: Math.max(1, Math.round(world.elapsed)),
    starsCollected,
    starsTotal,
    primaryMetricLabel,
    primaryMetricValue,
    secondaryMetricLabel,
    secondaryMetricValue,
    verseText: outcome === 'victory' ? meta.victoryVerse : meta.defeatVerse,
    verseRef: outcome === 'victory' ? meta.victoryRef : meta.defeatRef,
  };
}

export function loadProgress(): StoryProgress {
  const fallback: StoryProgress = {
    completedStories: { ...DEFAULT_COMPLETED },
    bestStars: { ...DEFAULT_STARS },
    bestTimeSeconds: { ...DEFAULT_TIMES },
  };
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoryProgress>;
    return {
      completedStories: { ...DEFAULT_COMPLETED, ...(parsed.completedStories ?? {}) },
      bestStars: { ...DEFAULT_STARS, ...(parsed.bestStars ?? {}) },
      bestTimeSeconds: { ...DEFAULT_TIMES, ...(parsed.bestTimeSeconds ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export function saveRunProgress(summary: RunSummary): StoryProgress {
  const current = loadProgress();
  if (summary.outcome === 'victory') {
    current.completedStories[summary.story] = true;
    current.bestStars[summary.story] = Math.max(
      current.bestStars[summary.story] ?? 0,
      summary.starsCollected
    );
    const prevBest = current.bestTimeSeconds[summary.story];
    current.bestTimeSeconds[summary.story] =
      prevBest === null ? summary.clearTimeSeconds : Math.min(prevBest, summary.clearTimeSeconds);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore storage quota errors
    }
  }
  return current;
}
