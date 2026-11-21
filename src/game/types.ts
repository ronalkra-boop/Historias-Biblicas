export type StoryId =
  | 'zaqueo'
  | 'flujo'
  | 'bartimeo'
  | 'panes'
  | 'tormenta'
  | 'daniel'
  | 'david'
  | 'horno'
  | 'moises'
  | 'noe';

export type Testament = 'antiguo' | 'nuevo';

export interface StoryCatalogItem {
  id: StoryId;
  title: string;
  testament: Testament;
  testamentLabel: string;
  reference: string;
  summary: string;
  hudDark: boolean;
  victoryVerse: string;
  victoryRef: string;
  defeatVerse: string;
  defeatRef: string;
}

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type OutcomeType = 'victory' | 'defeat';

export type StageId =
  | 'jericho_road'
  | 'zaqueo_house'
  | 'babylon_terrace'
  | 'lions_den'
  | 'valley_elah'
  | 'fiery_furnace'
  | 'red_sea'
  | 'noah_ark'
  | 'capernaum_crowd'
  | 'jericho_gate'
  | 'galilee_hills'
  | 'galilee_storm';

export type ZaqueoBeat =
  | 'cross_crowd'
  | 'climb_tree'
  | 'jesus_calling'
  | 'descend_tree'
  | 'house_chest'
  | 'house_bless'
  | 'complete';

export type DanielBeat = 'terrace_pray' | 'pit_survival' | 'complete';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'ground' | 'crate' | 'awning' | 'branch' | 'stone' | 'balustrade' | 'wood' | 'grass';
  oneWay?: boolean;
}

export interface Climbable {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  label: string;
  kind?: 'star' | 'stone' | 'dew' | 'hope' | 'bread' | 'banner';
}

export interface CrowdGroup {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  parted: boolean;
}

export interface NeighborNpc {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  blessed: boolean;
  line: string;
}

export interface GuardPatrol {
  id: string;
  x: number;
  y: number;
  minX: number;
  maxX: number;
  vx: number;
  facing: 1 | -1;
  state: 'patrol' | 'telegraph' | 'alert';
  timer: number;
  sightRange: number;
}

export interface PrayerWindow {
  id: string;
  x: number;
  y: number;
  prayed: boolean;
  progress: number;
}

export type LionPolicy = 'pacer' | 'leaper' | 'charger';

export interface LionEnemy {
  id: string;
  name: string;
  policy: LionPolicy;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  facing: 1 | -1;
  grounded: boolean;
  state: 'patrol' | 'telegraph' | 'active' | 'recover' | 'calmed';
  timer: number;
  cooldown: number;
  hitFlashTimer: number;
}

export interface AngelLight {
  id: string;
  x: number;
  y: number;
  activated: boolean;
  targetLionId: string;
}

export interface InteractSpot {
  id: string;
  x: number;
  y: number;
  label: string;
  done: boolean;
  kind:
    | 'sea_pillar'
    | 'sail_rope'
    | 'wake_jesus'
    | 'touch_cloak'
    | 'cry_out'
    | 'deliver_bread'
    | 'jesus_bread'
    | 'animal_pair'
    | 'ark_dove'
    | 'furnace_friend'
    | 'furnace_exit';
  subLabel?: string;
  animalKind?: 'sheep' | 'dove' | 'lion' | 'elephant';
}

export interface HazardWave {
  id: string;
  kind: 'spear' | 'fire_jet' | 'sea_wave' | 'chariot' | 'shush_crowd';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  state: 'patrol' | 'telegraph' | 'active' | 'stopped';
  timer: number;
}

export interface SlingStone {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

export interface GoliathBoss {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  shieldUp: boolean;
  state: 'taunt' | 'telegraph' | 'attack' | 'vulnerable' | 'defeated';
  timer: number;
  hitFlashTimer: number;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  climbing: boolean;
  crouching: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  walkCycle: number;
  scaleX: number;
  scaleY: number;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  hitFlashTimer: number;
}

export interface DialogueCue {
  id: number;
  speaker: string;
  text: string;
  x: number;
  y: number;
  timer: number;
}

export interface InputState {
  held: Set<string>;
  justPressed: Set<string>;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

export interface GameEvent {
  type:
    | 'jump'
    | 'land'
    | 'collect'
    | 'interact'
    | 'jesus_call'
    | 'pray'
    | 'calm_lion'
    | 'telegraph'
    | 'hurt'
    | 'sling'
    | 'victory'
    | 'defeat';
  x?: number;
  y?: number;
}

export interface GameWorld {
  story: StoryId;
  stage: StageId;
  zaqueoBeat: ZaqueoBeat;
  danielBeat: DanielBeat;
  worldWidth: number;
  worldHeight: number;
  groundY: number;
  cameraX: number;
  elapsed: number;
  hitstopTimer: number;
  trauma: number;
  defeatDelayTimer: number;
  outcome: OutcomeType | null;
  player: PlayerState;
  platforms: Platform[];
  climbables: Climbable[];
  collectibles: Collectible[];
  crowdGroups: CrowdGroup[];
  neighbors: NeighborNpc[];
  chestOpened: boolean;
  jesus: {
    active: boolean;
    x: number;
    y: number;
    targetX: number;
    facing: 1 | -1;
    walkCycle: number;
  };
  treeLookoutX: number;
  treeLookoutY: number;
  houseDoorX: number;
  prayerWindows: PrayerWindow[];
  guards: GuardPatrol[];
  lions: LionEnemy[];
  angelLights: AngelLight[];
  angelFloatPhase: number;
  interactSpots: InteractSpot[];
  hazards: HazardWave[];
  slingStones: SlingStone[];
  goliath: GoliathBoss | null;
  seaPartedLevel: number;
  stormCalm: number;
  boatTilt: number;
  sightRevealed: number;
  breadMultiplied: boolean;
  dewShieldCharges: number;
  dialogueSeq: number;
  dialogue: DialogueCue | null;
  lastDialogue: { speaker: string; text: string } | null;
  spokenPrompts: Record<string, boolean>;
  promptSpeechCooldown: number;
  objectiveTargetX: number | null;
  nearbyPrompt: { label: string; x: number; y: number } | null;
  events: GameEvent[];
}

export interface HudSnapshot {
  story: StoryId;
  stageLabel: string;
  objectiveText: string;
  verseHint: string;
  stepCurrent: number;
  stepTotal: number;
  starsCollected: number;
  starsTotal: number;
  hp: number;
  maxHp: number;
  elapsedSeconds: number;
  showHearts: boolean;
  hudDark: boolean;
}

export interface RunSummary {
  story: StoryId;
  outcome: OutcomeType;
  clearTimeSeconds: number;
  starsCollected: number;
  starsTotal: number;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  verseText: string;
  verseRef: string;
}

export interface StoryProgress {
  completedStories: Record<StoryId, boolean>;
  bestStars: Record<StoryId, number>;
  bestTimeSeconds: Record<StoryId, number | null>;
}
