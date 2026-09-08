import { parseRelativeTimeValue } from '../../adminforth/spa/src/renderers/relativeTimeValue';

describe('RelativeTime renderer date parsing', () => {
  it.each([[null], [undefined], ['']])('treats %p as no date, not the Unix epoch', (value) => {
    expect(parseRelativeTimeValue(value)).toBeNull();
  });

  it('treats an unparsable string as no date', () => {
    expect(parseRelativeTimeValue('not a date')).toBeNull();
  });

  it('keeps a real timestamp', () => {
    expect(parseRelativeTimeValue('2026-09-08T10:00:00Z')?.toISOString()).toBe('2026-09-08T10:00:00.000Z');
  });
});
