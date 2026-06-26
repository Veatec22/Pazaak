import { useState, useEffect, useCallback } from 'react';

export type Language = 'pl' | 'en';

let currentLang: Language = 'en';
const listeners = new Set<(lang: Language) => void>();

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('pz-lang') as Language;
  if (saved === 'pl' || saved === 'en') return saved;
  const nav = navigator.language || '';
  return nav.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

export function setLanguage(lang: Language) {
  currentLang = lang;
  localStorage.setItem('pz-lang', lang);
  listeners.forEach((l) => l(lang));
}

// Initialize language
currentLang = getLanguage();

export const translations = {
  en: {
    logo_subtitle: 'Republic Cantina Edition',
    menu_tagline: 'The classic card game from KotOR. Duel another player or play local hotseat.',
    single_player: 'Single Player',
    single_player_desc: 'Duel the computer (Offline) — Coming soon',
    single_player_title: 'Single Player',
    quick_play: 'Quick Play',
    quick_play_desc: 'Start a quick duel against the bot (HK-47)',
    campaign: 'Campaign',
    campaign_desc: 'Travel the galaxy and win tournaments — Coming soon',
    deck_builder: 'Deck Builder',
    deck_builder_desc: 'Assemble your custom side deck — Coming soon',
    multiplayer: 'Multiplayer',
    multiplayer_desc: 'Host or browse online matches (P2P)',
    pass_and_play: 'Pass & Play',
    pass_and_play_desc: 'Two players, one device',
    create_match: 'Create Match',
    create_match_desc: 'Host a new game and wait for players',
    join_via_code: 'Join via Code',
    join_via_code_desc: 'Enter a Room Code or Invite Link',
    browse_matches: 'Browse Matches',
    browse_matches_desc: 'Scan for active hosts waiting in the lobby',
    your_nickname: 'Your Nickname',
    placeholder_nickname: 'Type nickname...',
    btn_back: 'Back',
    btn_cancel: 'Cancel',
    btn_connect: 'Connect',
    join_match_title: 'Join Match',
    placeholder_join: 'Paste invite link or room code...',
    active_servers: 'Active Holonet Servers',
    scanning_holonet: 'Scanning holonet...',
    no_active_games: 'No active games found. Tell a friend to click "Create Match" or host one yourself!',
    server_code: 'Code',
    btn_join: 'Join',
    room_created: 'Game Room Created',
    waiting_opponent: 'Waiting for opponent...',
    room_code: 'Room Code',
    invite_link: 'Invite Link',
    btn_copy: 'Copy',
    btn_copied: 'Copied!',
    btn_share_link: 'Share Link',
    match_room: 'Match Room',
    your_turn: 'Your turn',
    opponents_turn: "Opponent's turn",
    pass_and_play_subtitle: 'Set {set} · hot-seat (pass & play)',
    player_to_move: 'Player {player} to move',
    you: 'You',
    opponent: 'Opponent',
    player_seat: 'Player {player}',
    player_hand_title: 'Player Hand',
    opponent_hand_title: 'Opponent Hand',
    btn_end_turn: 'End Turn',
    btn_stand: 'Stand',
    btn_new_match: 'New Match',
    btn_play_again: 'Play again',
    reconnect_warning: 'The match resumes automatically when they reconnect.',
    flip_card: 'Flip card',
    standing_label: 'STANDING',
    status_waiting_for_friend: 'Share the link — waiting for your friend to join…',
    status_connecting_to_host: 'Connecting to the host…',
    status_friend_connected: 'Friend connected.',
    status_connected_to_host: 'Connected to the host.',
    status_friend_disconnected: 'Friend disconnected — waiting for them to return…',
    status_host_disconnected: 'Lost the host — trying to reconnect…',
    tie_set: 'Tie {mine}–{theirs}. Replaying the set.',
    player_wins_set: 'Player {player} wins the set · {mine}–{theirs}',
    you_win_set: 'You win the set · {mine}–{theirs}',
    opponent_wins_set: 'Opponent wins the set · {mine}–{theirs}',
    player_wins_match: 'Player {player} wins the match.',
    you_win_match: 'You win the match.',
    opponent_wins_match: 'Opponent wins the match.',
    help_title: 'How to Play Pazaak',
    help_p1: 'Pazaak is a famous cantina card game from Star Wars: KotOR. The rules are simple but require tactical planning:',
    help_h1: '1. Objective',
    help_p2: 'Win 3 sets. To win a set, get your total card sum as close to 20 as possible without going over (busting).',
    help_h2: '2. Gameplay',
    help_li1: 'Each turn, a card (value 1 to 10) is automatically drawn for you from the main deck.',
    help_li2: 'You can then play one card from your side deck (optional).',
    help_li3: 'Finally, choose to either End Turn (draw again next turn) or Stand (lock your score and wait for your opponent).',
    help_h3: '3. Side Cards',
    help_p3: 'You start the match with 4 random side cards. They can be positive (e.g. +3) or negative (e.g. -2) and can be used to rescue you from busting or hit exactly 20.',
    help_h4: '4. Victory',
    help_li4: 'The player with the highest score \u2264 20 wins the set.',
    help_li5: 'If you go over 20 (bust), you immediately lose the set (unless a side card brings you back down).',
    help_li6: 'A tie results in a draw (no points).',
  },
  pl: {
    logo_subtitle: 'Edycja Republikańskiej Kantyny',
    menu_tagline: 'Klasyczna gra karciana z KotOR. Zmierz się z innym graczem lub zagraj lokalnie.',
    single_player: 'Gra jednoosobowa',
    single_player_desc: 'Pojedynek z komputerem (Offline) — wkrótce',
    single_player_title: 'Jednoosobowa',
    quick_play: 'Szybka gra',
    quick_play_desc: 'Rozpocznij pojedynek z botem (HK-47)',
    campaign: 'Kampania',
    campaign_desc: 'Podróżuj po galaktyce i wygrywaj turnieje — wkrótce',
    deck_builder: 'Kreator talii',
    deck_builder_desc: 'Zbuduj swoją idealną talię boczną — wkrótce',
    multiplayer: 'Gra wieloosobowa',
    multiplayer_desc: 'Stwórz lub szukaj gier online (P2P)',
    pass_and_play: 'Graj i przekaż',
    pass_and_play_desc: 'Dwaj gracze, jedno urządzenie',
    create_match: 'Stwórz grę',
    create_match_desc: 'Załóż nową grę i czekaj na gracza',
    join_via_code: 'Dołącz przez kod',
    join_via_code_desc: 'Wpisz kod pokoju lub link zaproszenia',
    browse_matches: 'Szukaj gier',
    browse_matches_desc: 'Skanuj w poszukiwaniu czekających hostów',
    your_nickname: 'Twój pseudonim',
    placeholder_nickname: 'Wpisz pseudonim...',
    btn_back: 'Wróć',
    btn_cancel: 'Anuluj',
    btn_connect: 'Połącz',
    join_match_title: 'Dołącz do gry',
    placeholder_join: 'Wklej link lub kod pokoju...',
    active_servers: 'Aktywne serwery holonetu',
    scanning_holonet: 'Skanowanie holonetu...',
    no_active_games: 'Nie znaleziono aktywnych gier. Poproś znajomego o kliknięcie "Stwórz grę" lub załóż ją sam!',
    server_code: 'Kod',
    btn_join: 'Dołącz',
    room_created: 'Pokój gry utworzony',
    waiting_opponent: 'Oczekiwanie na przeciwnika...',
    room_code: 'Kod pokoju',
    invite_link: 'Link do zaproszenia',
    btn_copy: 'Kopiuj',
    btn_copied: 'Skopiowano!',
    btn_share_link: 'Udostępnij link',
    match_room: 'Pokój meczu',
    your_turn: 'Twoja kolej',
    opponents_turn: 'Kolej przeciwnika',
    pass_and_play_subtitle: 'Zestaw {set} · hot-seat (gra lokalna)',
    player_to_move: 'Kolej Gracza {player}',
    you: 'Ty',
    opponent: 'Przeciwnik',
    player_seat: 'Gracz {player}',
    player_hand_title: 'Ręka Gracza',
    opponent_hand_title: 'Ręka Przeciwnika',
    btn_end_turn: 'Koniec tury',
    btn_stand: 'Stand',
    btn_new_match: 'Nowy mecz',
    btn_play_again: 'Graj ponownie',
    reconnect_warning: 'Mecz zostanie wznowiony automatycznie, gdy przeciwnik się ponownie połączy.',
    flip_card: 'Odwróć kartę',
    standing_label: 'STAND',
    status_waiting_for_friend: 'Udostępnij link — oczekiwanie na dołączenie gracza...',
    status_connecting_to_host: 'Łączenie z hostem...',
    status_friend_connected: 'Gracz dołączył.',
    status_connected_to_host: 'Połączono z hostem.',
    status_friend_disconnected: 'Gracz rozłączony — oczekiwanie na powrót...',
    status_host_disconnected: 'Stracono połączenie z hostem — próba ponownego połączenia...',
    tie_set: 'Remis {mine}–{theirs}. Powtarzanie zestawu.',
    player_wins_set: 'Gracz {player} wygrywa zestaw · {mine}–{theirs}',
    you_win_set: 'Wygrywasz zestaw · {mine}–{theirs}',
    opponent_wins_set: 'Przeciwnik wygrywa zestaw · {mine}–{theirs}',
    player_wins_match: 'Gracz {player} wygrywa mecz.',
    you_win_match: 'Wygrywasz mecz!',
    opponent_wins_match: 'Przeciwnik wygrywa mecz.',
    help_title: 'Jak grać w Pazaaka',
    help_p1: 'Pazaak to słynna kantynowa gra karciana ze Star Wars: KotOR. Zasady są proste, ale wymagają planowania taktycznego:',
    help_h1: '1. Cel gry',
    help_p2: 'Wygraj 3 zestawy. Aby wygrać zestaw, uzyskaj sumę kart jak najbliższą 20, ale nie przekraczając jej (fura).',
    help_h2: '2. Rozgrywka',
    help_li1: 'W każdej turze automatycznie dobierana jest dla Ciebie karta (od 1 do 10) z talii głównej.',
    help_li2: 'Możesz wtedy zagrać jedną kartę ze swojej talii bocznej (opcjonalnie).',
    help_li3: 'Na koniec wybierz Koniec tury (dobierasz kolejną kartę w następnej turze) lub Stand (blokujesz swój wynik i czekasz na ruch przeciwnika).',
    help_h3: '3. Karty boczne',
    help_p3: 'Zaczynasz mecz z 4 losowymi kartami bocznymi. Mogą mieć wartość dodatnią (np. +3) lub ujemną (np. -2) i służą do ratowania się przed furą lub trafienia idealnie w 20.',
    help_h4: '4. Zwycięstwo',
    help_li4: 'Gracz z najwyższym wynikiem \u2264 20 wygrywa zestaw.',
    help_li5: 'Jeśli przekroczysz 20 (fura), natychmiast przegrywasz zestaw (chyba że karta boczna zbije wynik z powrotem poniżej 20).',
    help_li6: 'Remis oznacza powtórzenie zestawu (nikt nie dostaje punktu).',
  },
};

export function useI18n() {
  const [lang, setLangState] = useState<Language>(currentLang);

  useEffect(() => {
    const handler = (l: Language) => setLangState(l);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = translations[lang] || translations.en;
      let str = (dict as any)[key] || (translations.en as any)[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, String(v));
        });
      }
      return str;
    },
    [lang],
  );

  return { lang, setLanguage, t };
}
