/**
 * Client for the pazaak minigame endpoints. Mirrors the JSON contract emitted by the
 * Python `PazaakSession` (see src/hk47_audio/pazaak/session.py): a `state` snapshot from
 * the human's point of view plus an ordered `events` stream the board replays to animate.
 */

export type PazaakActor = 0 | 1; // 0 = you, 1 = HK-47

export interface PazaakEvent {
  type: 'draw' | 'play' | 'stand' | 'end_turn' | 'set_over' | 'match_over';
  actor?: PazaakActor;
  card?: string;
  total?: number;
  winner?: 'you' | 'opponent' | null;
  reason?: string;
  totals?: { you: number; opponent: number };
  voice_cue?: 'PLAYER_WON' | 'PLAYER_LOST';
}

export interface PazaakAction {
  type: 'stand' | 'end_turn' | 'play';
  hand_index?: number;
  option_index?: number;
  label?: string;
}

export interface PazaakOutcome {
  player_won: boolean;
  voice_cue: 'PLAYER_WON' | 'PLAYER_LOST';
  player_sets: number;
  opponent_sets: number;
}

export interface PazaakState {
  phase: 'PLAYER_DECISION' | 'MATCH_OVER';
  set_number: number;
  your_turn: boolean;
  opponent_name: string;
  match_score: { you: number; opponent: number };
  you: {
    total: number;
    table: [string, number][];
    hand: string[];
    hand_options: string[][];
    standing: boolean;
    played_this_turn: boolean;
    sets_won: number;
  };
  opponent: {
    total: number;
    table: [string, number][];
    hand_size: number;
    standing: boolean;
    sets_won: number;
  };
  legal_actions: PazaakAction[];
  outcome: PazaakOutcome | null;
}

export interface NewGameResponse {
  game_id: string;
  state: PazaakState;
  opening_events: PazaakEvent[];
}

export interface ActionResponse {
  events: PazaakEvent[];
  state: PazaakState;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      detail = ((await response.json()) as { detail?: string }).detail ?? detail;
    } catch {
      // keep status text
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export function createPazaakGame(): Promise<NewGameResponse> {
  return postJson<NewGameResponse>('/api/pazaak/games');
}

export function sendPazaakAction(gameId: string, action: PazaakAction): Promise<ActionResponse> {
  return postJson<ActionResponse>(`/api/pazaak/games/${gameId}/actions`, {
    type: action.type,
    hand_index: action.hand_index,
    option_index: action.option_index,
  });
}

export function abandonPazaakGame(gameId: string): void {
  // best-effort cleanup; ignore failures (the server drops finished games anyway)
  void fetch(`/api/pazaak/games/${gameId}`, { method: 'DELETE' }).catch(() => {});
}
