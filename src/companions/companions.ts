const BASE = import.meta.env.BASE_URL;

export type CompanionVoiceCategory =
  | 'startGame'
  | 'playerWonRound'
  | 'playerLostRound'
  | 'playerWonGame'
  | 'playerLostGame';

export type CompanionVoiceBank = Record<CompanionVoiceCategory, string[]>;

export interface Companion {
  id: string;
  name: string;
  portrait: string;
  voice: CompanionVoiceBank;
}

function voiceUrl(companionId: string, file: string): string {
  return `${BASE}companions/${companionId}/voice/${file}.wav`;
}

function variants(companionId: string, prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => voiceUrl(companionId, `${prefix}_${i + 1}`));
}

function makeCompanion(id: string, name: string, roundVariants: number): Companion {
  return {
    id,
    name,
    portrait: `${BASE}companions/${id}/portrait.png`,
    voice: {
      startGame: [voiceUrl(id, 'start_game')],
      playerWonRound: variants(id, 'player_won_round', roundVariants),
      playerLostRound: variants(id, 'player_lost_round', roundVariants),
      playerWonGame: [voiceUrl(id, 'player_won_game')],
      playerLostGame: [voiceUrl(id, 'player_lost_game')],
    },
  };
}

export const COMPANION_LIST: Companion[] = [
  makeCompanion('bastila', 'Bastila Shan', 3),
  makeCompanion('canderous', 'Canderous Ordo', 3),
  makeCompanion('jolee', 'Jolee Bindo', 3),
  makeCompanion('juhani', 'Juhani', 3),
  makeCompanion('mission', 'Mission Vao', 3),
  makeCompanion('atton', 'Atton Rand', 3),
  makeCompanion('kreia', 'Kreia', 3),
  makeCompanion('mandalore', 'Mandalore', 3),
  makeCompanion('mira', 'Mira', 3),
  makeCompanion('visas', 'Visas Marr', 3),
  makeCompanion('bao-dur', 'Bao-Dur', 3),
  makeCompanion('carth', 'Carth Onasi', 3),
];

export const COMPANIONS: Record<string, Companion> = Object.fromEntries(
  COMPANION_LIST.map((c) => [c.id, c]),
);

export function getCompanion(id: string | undefined | null): Companion | undefined {
  return id ? COMPANIONS[id] : undefined;
}

export function randomCompanionId(): string {
  return COMPANION_LIST[Math.floor(Math.random() * COMPANION_LIST.length)].id;
}
