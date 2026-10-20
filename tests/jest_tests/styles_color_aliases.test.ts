import { StylesGenerator } from '../../adminforth/modules/styleGenerator';

function colorsOf(light: Record<string, unknown>) {
  return new StylesGenerator({ colors: { light } }).mergeStyles().colors;
}

// a color which went through an alias chain is spaced differently, only the channels matter
const compact = (color: string) => color.replace(/\s/g, '');

describe('customization.styles color aliases', () => {
  it('resolves an alias chain whichever order the tokens are listed in', () => {
    // lightCreateViewSaveButtonText aliases lightButtonsText, which comes later in styles.ts
    const colors = colorsOf({ primary: '#F59E0B', buttons: { text: 'alias:lightPrimary inverse' } });
    expect(colors.lightButtonsText).toBe('rgba(0,0,0,1)');
    expect(compact(colors.lightCreateViewSaveButtonText)).toBe('rgba(0,0,0,1)');
    expect(compact(colors.lightEditViewSaveButtonText)).toBe('rgba(0,0,0,1)');
  });

  it('applies opacity, darken, lighten and inverse to the aliased color', () => {
    const colors = colorsOf({
      primary: '#1a56db',
      buttons: {
        background: 'alias:lightPrimary',
        hover: 'alias:lightPrimary darken',
        border: 'alias:lightPrimary lighten',
        text: 'alias:lightPrimary inverse',
      },
    });
    expect(colors.lightButtonsBackground).toBe('rgba(26,86,219,1)');
    expect(colors.lightButtonsHover).toBe('rgba(21, 69, 175, 1)');
    expect(colors.lightButtonsBorder).toBe('rgba(31, 103, 255, 1)');
    expect(colors.lightButtonsText).toBe('rgba(255,255,255,1)');
    expect(colors.lightButtonFocusRing).toBe('rgba(26,86,219,0.26)');
  });

  it('keeps the ink buttons when only primary is set', () => {
    const colors = colorsOf({ primary: '#b400b8' });
    expect(colors.lightButtonsBackground).toBe('#18181B');
    expect(colors.lightCheckboxBgChecked).toBe('rgba(180,0,184,1)');
  });

  it('rejects an alias cycle instead of looping', () => {
    expect(() => colorsOf({ primary: 'alias:lightButtonsBackground', buttons: { background: 'alias:lightPrimary' } }))
      .toThrow('lightPrimary -> lightButtonsBackground -> lightPrimary');
    expect(() => colorsOf({ primary: 'alias:lightPrimary' })).toThrow('lightPrimary -> lightPrimary');
  });

  it('rejects an alias to a token which does not exist', () => {
    expect(() => colorsOf({ buttons: { background: 'alias:lightPrimry' } })).toThrow('unknown token lightPrimry');
  });
});
