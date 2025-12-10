export function randomLetter(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const idx = Math.floor(Math.random() * alphabet.length);
  return alphabet[idx];
}