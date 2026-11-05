const UNITS = ['', 'один', 'два', 'три', 'чотири', 'п’ять', 'шість', 'сім', 'вісім', 'дев’ять'];
const TENS = ['', '', 'двадцять', 'тридцять', 'сорок', 'п’ятдесят', 'шістдесят', 'сімдесят', 'вісімдесят', 'дев’яносто'];

/** Число 21-99 (не кругле) і його запис словами: «сорок сім». */
export function randomGateNumber(rand = Math.random): { value: string; words: string } {
  const tens = 2 + Math.floor(rand() * 8);
  const units = 1 + Math.floor(rand() * 9);
  return { value: `${tens}${units}`, words: `${TENS[tens]} ${UNITS[units]}` };
}
