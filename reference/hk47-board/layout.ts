// Auto-generated from pazaakgame_p.gui (KotOR II). Coordinates in the GUI base 800x600.
// Each entry is [left, top, width, height] in px; convert to % against BASE.

export const BASE_W = 800;
export const BASE_H = 600;

export const RAW: Record<string, [number, number, number, number]> = {
  BTN_PLR0: [148, 101, 80, 80],
  BTN_PLR1: [223, 101, 80, 80],
  BTN_PLR2: [298, 101, 80, 80],
  BTN_PLR3: [148, 185, 80, 80],
  BTN_PLR4: [223, 185, 80, 80],
  BTN_PLR5: [298, 185, 80, 80],
  BTN_PLR6: [148, 271, 80, 80],
  BTN_PLR7: [223, 271, 80, 80],
  BTN_PLR8: [298, 271, 80, 80],
  BTN_NPC0: [423, 101, 80, 80],
  BTN_NPC1: [498, 101, 80, 80],
  BTN_NPC2: [573, 101, 80, 80],
  BTN_NPC3: [423, 185, 80, 80],
  BTN_NPC4: [498, 185, 80, 80],
  BTN_NPC5: [573, 185, 80, 80],
  BTN_NPC6: [423, 271, 80, 80],
  BTN_NPC7: [498, 271, 80, 80],
  BTN_NPC8: [573, 271, 80, 80],
  BTN_PLRSIDE0: [83, 381, 80, 80],
  BTN_PLRSIDE1: [158, 381, 80, 80],
  BTN_PLRSIDE2: [234, 381, 80, 80],
  BTN_PLRSIDE3: [308, 381, 80, 80],
  BTN_NPCSIDE0: [413, 381, 80, 80],
  BTN_NPCSIDE1: [488, 381, 80, 80],
  BTN_NPCSIDE2: [563, 381, 80, 80],
  BTN_NPCSIDE3: [638, 381, 80, 80],
  BTN_FLIP0: [99, 467, 20, 20],
  BTN_FLIP1: [174, 467, 20, 20],
  BTN_FLIP2: [250, 467, 20, 20],
  BTN_FLIP3: [323, 467, 20, 20],
  LBL_PLRTOTAL: [352, 64, 42, 24],
  LBL_NPCTOTAL: [406, 64, 42, 24],
  LBL_PLRNAME: [137, 58, 210, 25],
  LBL_NPCNAME: [455, 58, 210, 25],
  LBL_PLRTURN: [90, 61, 42, 42],
  LBL_NPCTURN: [669, 61, 42, 42],
  LBL_PLRSCORE0: [93, 136, 22, 22],
  LBL_PLRSCORE1: [93, 166, 22, 22],
  LBL_PLRSCORE2: [93, 196, 22, 22],
  LBL_NPCSCORE0: [685, 136, 22, 22],
  LBL_NPCSCORE1: [685, 166, 22, 22],
  LBL_NPCSCORE2: [685, 196, 22, 22],
  BTN_XTEXT: [423, 496, 135, 21],
  BTN_YTEXT: [573, 496, 135, 21],
  BTN_FORFEITGAME: [431, 523, 267, 21],
};

export function box([l, t, w, h]: [number, number, number, number]) {
  return {
    left: `${(l / BASE_W) * 100}%`,
    top: `${(t / BASE_H) * 100}%`,
    width: `${(w / BASE_W) * 100}%`,
    height: `${(h / BASE_H) * 100}%`,
  } as const;
}
