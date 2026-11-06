/** Наскільки два слова чи склади схожі - щоб зайві варіанти не відгадувались з першого погляду. */

/**
 * Наскільки слово-варіант схоже на правильне - менше значить схожіше.
 * Найперше дитина вгадує за першою буквою, тому вона важить найбільше;
 * далі - скільки букв різниться, і чи збігається остання буква.
 */
export function closeness(target: string, candidate: string): [number, number, number] {
  const a = target.toLowerCase();
  const b = candidate.toLowerCase();
  return [a[0] === b[0] ? 0 : 1, editDistance(a, b), a.at(-1) === b.at(-1) ? 0 : 1];
}

export function compareCloseness(x: readonly number[], y: readonly number[]): number {
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/** Скільки букв треба замінити, додати чи прибрати, щоб з одного слова вийшло інше (Левенштейн). */
export function editDistance(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const row = [i];
    for (let j = 1; j <= y.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[y.length];
}
