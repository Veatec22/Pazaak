/**
 * Background cantina music — the tunes that played behind pazaak in the cantinas of KotOR.
 *
 * To add a track: drop the `.mp3` into `public/music/` and add a line here. (KotOR
 * `streammusic/*.wav` files are really MP3 behind a 58-byte fake WAV header — strip the
 * first 58 bytes to get a browser-playable `.mp3`. See memory `kotor-cantina-music`.)
 */
export interface Track {
  /** File name under `public/music/`. */
  file: string;
  title: string;
  game: 'KotOR I' | 'KotOR II';
}

export const PLAYLIST: readonly Track[] = [
  { file: '01_kotor1_cantina_a.mp3', title: 'Cantina', game: 'KotOR I' },
  { file: '02_kotor1_cantina_b.mp3', title: 'Cantina (II)', game: 'KotOR I' },
  { file: '03_kotor2_iziz_cantina.mp3', title: 'Iziz Cantina', game: 'KotOR II' },
];
