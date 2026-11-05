import { describe, expect, it } from 'vitest';
import { randomGateNumber } from './gate';

describe('замок для дорослих', () => {
  it('завжди двозначне некругле число, записане двома словами', () => {
    for (let i = 0; i < 200; i++) {
      const { value, words } = randomGateNumber();
      expect(value).toMatch(/^[2-9][1-9]$/);
      expect(words.split(' ')).toHaveLength(2);
    }
  });

  it('словами відповідає цифрам', () => {
    const seq = [0.25, 0.7];
    const n = randomGateNumber(() => seq.shift()!);
    expect(n).toEqual({ value: '47', words: 'сорок сім' });
  });
});
