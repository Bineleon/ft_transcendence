// layoutMap.ts
export type Box = { x: number; y: number; w: number; h: number }; // en %

export const LAYOUT = {
  aspect: "1536/864", // IMPORTANT : ratio fixe (comme ton image)
  topLeft:  { x: 0.03, y: 0.04, w: 0.36, h: 0.52 }, // à ajuster
  botRight: { x: 0.63, y: 0.54, w: 0.34, h: 0.41 }, // à ajuster
};
