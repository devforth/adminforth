import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { numberInputValue } from '../../adminforth/spa/src/afcl/inputValue';

describe('afcl Input number value', () => {
  it.each([[''], ['   ']])('reports an emptied field as no value, not zero (%p)', (raw) => {
    expect(numberInputValue(raw)).toBeNull();
  });

  it('reports a value the browser cannot parse as no value', () => {
    expect(numberInputValue('abc')).toBeNull();
  });

  it('keeps a real number, including zero the user actually typed', () => {
    expect(numberInputValue('0')).toBe(0);
    expect(numberInputValue('42')).toBe(42);
    expect(numberInputValue('-3.5')).toBe(-3.5);
  });
});

it('the component routes its number branch through the helper', async () => {
  const component = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../adminforth/spa/src/afcl/Input.vue');
  const source = await fs.readFile(component, 'utf8');

  expect(source).toMatch(/type === 'number' \? numberInputValue\(/);
  expect(source).not.toMatch(/type === 'number' \? Number\(/);
});
