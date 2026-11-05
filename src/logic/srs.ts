/**
 * Інтервальне повторення за системою Лейтнера.
 * Коробка 1 - повторюємо в кожній місії; що вища коробка, то рідше повертаємося до букви.
 * Помилка або підказка не «штрафує», а просто повертає букву ближче, щоб частіше її бачити.
 * Підніматися можна лише на одну коробку за день: кілька правильних відповідей в одній місії
 * ще не означають довготривалого запам'ятовування.
 */
export interface ReviewItem {
  box: number;
  /** Дата наступного повторення (YYYY-MM-DD). */
  due: string;
  /** Коли коробку востаннє підвищено (YYYY-MM-DD). */
  promotedAt?: string;
}

export const MAX_BOX = 5;
/** Через скільки днів повторювати букву з відповідної коробки. */
export const INTERVAL_DAYS: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 7 };

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function nextReview(item: ReviewItem, firstTry: boolean, today: string): ReviewItem {
  if (!firstTry) return { box: 1, due: today, promotedAt: item.promotedAt };
  if (item.promotedAt === today) return { box: item.box, due: addDays(today, INTERVAL_DAYS[item.box]), promotedAt: today };
  const box = Math.min(MAX_BOX, item.box + 1);
  return { box, due: addDays(today, INTERVAL_DAYS[box]), promotedAt: today };
}

export function isDue(item: ReviewItem, today: string): boolean {
  return item.due <= today;
}
