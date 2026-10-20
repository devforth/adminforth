export type JsonTokenKind = 'key' | 'string' | 'number' | 'literal' | 'punct';
export type JsonToken = { kind: JsonTokenKind, text: string };
export type JsonEntry = [key: string | undefined, value: unknown];

// a node which fits in a line with its indent and key stays on one line, like in Prettier;
// a line holds this many characters, fewer when the viewer is narrower
export const JSON_LINE_WIDTH = 60;
// a folded node and the inline viewer show the value up to two levels deep and cut after this many characters
export const JSON_PREVIEW_DEPTH = 2;
export const JSON_PREVIEW_LENGTH = 200;

export const JSON_TOKEN_CLASSES: Record<JsonTokenKind, string> = {
  key: 'text-lightShowTableBodyText dark:text-darkShowTableBodyText',
  string: 'text-lightPrimary dark:text-darkPrimary',
  number: 'text-lightWarning dark:text-darkWarning',
  literal: 'italic text-lightInputIconColor dark:text-darkInputIconColor',
  punct: 'text-lightInputPlaceholderText dark:text-darkInputPlaceholderText',
};

export const JSON_SIZE_CLASSES = 'inline-flex items-center shrink-0 h-[18px] px-1.5 rounded-full font-sans text-[11px] font-medium whitespace-nowrap align-[1px] bg-lightSecondaryDarken text-lightInputIconColor dark:bg-darkSecondaryLighten dark:text-darkInputIconColor';

export function isJsonContainer(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export function jsonEntries(value: object): JsonEntry[] {
  return Array.isArray(value) ? value.map((item) => [undefined, item]) : Object.entries(value);
}

export function jsonBrackets(value: object): [string, string] {
  return Array.isArray(value) ? ['[', ']'] : ['{', '}'];
}

export function jsonKeyTokens(key: string | undefined): JsonToken[] {
  return key === undefined ? [] : [{ kind: 'key', text: JSON.stringify(key) }, { kind: 'punct', text: ': ' }];
}

export function jsonSizeLabel(t: (message: string, plural: number) => string, value: object): string {
  const size = jsonEntries(value).length;
  return Array.isArray(value) ? t('{count} item | {count} items', size) : t('{count} key | {count} keys', size);
}

export function jsonTokensLength(tokens: JsonToken[]): number {
  return tokens.reduce((sum, token) => sum + token.text.length, 0);
}

// the value in one line as JSON.stringify prints it, with a space after "," and ":";
// containers deeper than maxDepth become {…}, the walk stops once the text is longer than maxLength
export function inlineJsonTokens(value: unknown, maxDepth = Infinity, maxLength = Infinity): JsonToken[] {
  const tokens: JsonToken[] = [];
  let length = 0;

  const push = (kind: JsonTokenKind, text: string) => {
    tokens.push({ kind, text });
    length += text.length;
  };

  const walk = (node: unknown, depth: number) => {
    if (!isJsonContainer(node)) {
      push(typeof node === 'string' ? 'string' : typeof node === 'number' ? 'number' : 'literal', JSON.stringify(node));
      return;
    }
    const [open, close] = jsonBrackets(node);
    const entries = jsonEntries(node);
    if (entries.length && depth >= maxDepth) {
      push('punct', `${open}…${close}`);
      return;
    }
    push('punct', open);
    for (const [index, [key, item]] of entries.entries()) {
      if (length > maxLength) {
        return;
      }
      if (index) {
        push('punct', ', ');
      }
      jsonKeyTokens(key).forEach((token) => push(token.kind, token.text));
      walk(item, depth + 1);
    }
    push('punct', close);
  };

  walk(value, 0);
  return tokens;
}
