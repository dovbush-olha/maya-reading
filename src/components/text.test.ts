import { describe, expect, it } from 'vitest';
import { glide } from './text';

describe('злите читання складу', () => {
  it('тягне перший звук і без паузи переходить у наступний', () => {
    expect(glide('ла')).toBe('л-л-ла');
    expect(glide('МА')).toBe('м-м-ма');
    expect(glide('ал')).toBe('а-а-ал');
    expect(glide('сом')).toBe('с-с-сом');
  });

  it('короткий звук не тягне, а тягне голосну після нього', () => {
    expect(glide('ко')).toBe('ко-о-о');
    expect(glide('кіл')).toBe('кі-і-іл');
  });
});
