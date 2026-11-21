export type PrebuiltVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface VoiceProfile {
  voiceName: PrebuiltVoiceName;
  style: string;
  pitch: number;
  rate: number;
}

const DEFAULT_PROFILE: VoiceProfile = {
  voiceName: 'Zephyr',
  style:
    'Warm, expressive Spanish children storybook narrator, gentle pacing, clear articulation, theatrical warmth.',
  pitch: 1.02,
  rate: 0.98,
};

const SPEAKER_PROFILES: Record<string, VoiceProfile> = {
  Narrador: {
    voiceName: 'Zephyr',
    style:
      'Warm, expressive Spanish children storybook narrator, clear diction, gentle wonder and excitement.',
    pitch: 1.02,
    rate: 0.98,
  },
  Zaqueo: {
    voiceName: 'Puck',
    style:
      'Lively, eager, cheerful and heartfelt Spanish voice of Zacchaeus, bright energetic timbre suitable for kids.',
    pitch: 1.12,
    rate: 1.03,
  },
  'Jesús': {
    voiceName: 'Charon',
    style:
      'Calm, tender, deeply loving and reassuring Spanish voice of Jesus, gentle warmth and serene authority.',
    pitch: 0.92,
    rate: 0.92,
  },
  'Simón el Alfarero': {
    voiceName: 'Fenrir',
    style:
      'Friendly, grateful adult townsman in Spanish, warm smile in the voice, cheerful storybook character.',
    pitch: 0.94,
    rate: 0.98,
  },
  'Marta la Panadera': {
    voiceName: 'Kore',
    style:
      'Warm, joyful motherly baker in Spanish, smiling and welcoming storybook tone.',
    pitch: 1.15,
    rate: 0.99,
  },
  'Elián el Tejedor': {
    voiceName: 'Puck',
    style:
      'Kind, upbeat neighbor in Spanish, heartfelt gratitude and friendly warmth.',
    pitch: 1.05,
    rate: 1.02,
  },
  Daniel: {
    voiceName: 'Charon',
    style:
      'Courageous, serene, faithful prophet in Spanish, calm resolve and steady hope.',
    pitch: 0.95,
    rate: 0.96,
  },
  'Ángel del Señor': {
    voiceName: 'Zephyr',
    style:
      'Luminous, gentle, comforting heavenly angel in Spanish, peaceful resonance and protective grace.',
    pitch: 1.16,
    rate: 0.94,
  },
  David: {
    voiceName: 'Puck',
    style:
      'Brave, youthful, cheerful Spanish shepherd boy voice, determined, bright and full of faith.',
    pitch: 1.18,
    rate: 1.04,
  },
  Goliat: {
    voiceName: 'Fenrir',
    style:
      'Deep, booming, theatrical giant warrior voice in Spanish, dramatic storybook antagonist.',
    pitch: 0.78,
    rate: 0.9,
  },
  Sadrac: {
    voiceName: 'Puck',
    style:
      'Faithful, courageous young friend voice in Spanish, calm and hopeful under trial.',
    pitch: 1.08,
    rate: 1.0,
  },
  'Moisés': {
    voiceName: 'Charon',
    style:
      'Wise, resonant, courageous prophetic voice of Moses in Spanish, steady authority and awe.',
    pitch: 0.88,
    rate: 0.94,
  },
  'Noé': {
    voiceName: 'Fenrir',
    style:
      'Warm, kind, wise elder patriarch voice of Noah in Spanish, gentle joy and care.',
    pitch: 0.86,
    rate: 0.94,
  },
  'Mujer de Fe': {
    voiceName: 'Kore',
    style:
      'Hopeful, tender, emotional Spanish woman voice filled with quiet courage and joyful relief.',
    pitch: 1.14,
    rate: 0.96,
  },
  Bartimeo: {
    voiceName: 'Puck',
    style:
      'Eager, heartfelt, expressive Spanish voice crying out in faith and overflowing with joy.',
    pitch: 1.04,
    rate: 1.0,
  },
  Muchacho: {
    voiceName: 'Puck',
    style:
      'Sweet, generous, enthusiastic young boy voice in Spanish, eager to share.',
    pitch: 1.2,
    rate: 1.05,
  },
  Pedro: {
    voiceName: 'Fenrir',
    style:
      'Earnest, expressive fisherman voice in Spanish, moving from fear in the storm to awe.',
    pitch: 0.94,
    rate: 1.02,
  },
  Multitud: {
    voiceName: 'Kore',
    style:
      'Lively, warm, expressive Spanish townspeople voice reacting with wonder and friendliness in a children storybook.',
    pitch: 1.08,
    rate: 1.02,
  },
  'Hombre de Jericó': {
    voiceName: 'Fenrir',
    style:
      'Encouraging, kind, enthusiastic Spanish bystander voice cheering someone on warmly.',
    pitch: 0.96,
    rate: 1.0,
  },
  Guardia: {
    voiceName: 'Fenrir',
    style:
      'Firm, theatrical royal palace guard voice in Spanish, dramatic storybook authority suitable for kids.',
    pitch: 0.84,
    rate: 0.96,
  },
  'Rey Darío': {
    voiceName: 'Charon',
    style:
      'Noble, warm, deeply relieved royal king voice in Spanish, filled with admiration and joy.',
    pitch: 0.88,
    rate: 0.93,
  },
  'Rey Nabucodonosor': {
    voiceName: 'Fenrir',
    style:
      'Grand, astonished royal king voice in Spanish marveling at a great miracle.',
    pitch: 0.84,
    rate: 0.92,
  },
  Mesac: {
    voiceName: 'Zephyr',
    style:
      'Brave, joyful young friend voice in Spanish, amazed and grateful for divine protection.',
    pitch: 1.1,
    rate: 1.02,
  },
  'Abed-nego': {
    voiceName: 'Kore',
    style:
      'Warm, wonder-filled young friend voice in Spanish speaking with awe and steady faith.',
    pitch: 1.14,
    rate: 1.0,
  },
  'Discípulo': {
    voiceName: 'Puck',
    style:
      'Urgent, earnest young fisherman companion voice in Spanish calling out over wind and waves.',
    pitch: 1.06,
    rate: 1.05,
  },
  Familia: {
    voiceName: 'Kore',
    style:
      'Kind, supportive family member voice in Spanish helping care for the animals with warmth.',
    pitch: 1.12,
    rate: 0.99,
  },
  Pueblo: {
    voiceName: 'Kore',
    style:
      'Joyful, awestruck voice of the Israelite people in Spanish celebrating God parting the sea.',
    pitch: 1.1,
    rate: 1.02,
  },
};

export function getVoiceProfile(speaker: string): VoiceProfile {
  return SPEAKER_PROFILES[speaker] ?? DEFAULT_PROFILE;
}
