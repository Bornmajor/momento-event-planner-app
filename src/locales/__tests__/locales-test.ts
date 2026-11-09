import en from '../en.json';
import fr from '../fr.json';
import sw from '../sw.json';

/** All dotted keys of a nested translation object. */
function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('translations', () => {
  it.each([
    ['fr', fr],
    ['sw', sw],
  ])('%s has exactly the same keys as English', (_lang, translation) => {
    expect(keys(translation).sort()).toEqual(keys(en).sort());
  });

  it('has a message for every API error code', () => {
    const codes = [
      'VALIDATION_ERROR',
      'UNAUTHENTICATED',
      'INVALID_CREDENTIALS',
      'NOT_FOUND',
      'EMAIL_TAKEN',
      'SAVED_LIMIT_REACHED',
      'PAYLOAD_TOO_LARGE',
      'RATE_LIMITED',
      'AI_LIMIT_REACHED',
      'UPSTREAM_UNAVAILABLE',
      'INTERNAL',
    ];
    for (const code of codes) expect(en.errors).toHaveProperty(code);
  });
});
