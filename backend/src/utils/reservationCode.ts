const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReservationCode(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(2);
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `VC-${datePart}-${randomPart}`;
}
