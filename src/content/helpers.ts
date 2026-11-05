/** Друзі-помічники, яких дитина може обрати собі в подорож. */
export const HELPERS = [
  { id: 'fox', name: 'Лисичка' },
  { id: 'bunny', name: 'Зайчик' },
  { id: 'bear', name: 'Ведмедик' },
  { id: 'cat', name: 'Котик' },
  { id: 'owl', name: 'Совеня' },
  { id: 'flower', name: 'Квіточка' },
  { id: 'butterfly', name: 'Метелик' },
] as const;

export type HelperId = (typeof HELPERS)[number]['id'];

export function isHelperId(v: unknown): v is HelperId {
  return HELPERS.some((h) => h.id === v);
}

export function helperName(id: HelperId): string {
  return HELPERS.find((h) => h.id === id)?.name ?? 'Лисичка';
}
