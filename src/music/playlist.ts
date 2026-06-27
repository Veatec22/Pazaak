export interface Track {
    file: string;
  title: string;
  game: 'KotOR I' | 'KotOR II';
}

export const PLAYLIST: readonly Track[] = [
  { file: '01_kotor1_cantina_a.mp3', title: 'Cantina', game: 'KotOR I' },
  { file: '02_kotor1_cantina_b.mp3', title: 'Cantina (II)', game: 'KotOR I' },
  { file: '03_kotor2_iziz_cantina.mp3', title: 'Iziz Cantina', game: 'KotOR II' },
];
