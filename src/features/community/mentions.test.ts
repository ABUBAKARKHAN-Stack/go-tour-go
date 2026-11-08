import { describe, expect, test } from 'bun:test';

import { splitMentions } from './mentions';

describe('splitMentions', () => {
  test('plain text stays whole', () => {
    expect(splitMentions('Lovely sunset')).toEqual([{ text: 'Lovely sunset' }]);
  });
  test('a reply handle at the start', () => {
    expect(splitMentions('@ayesha_khan agreed!')).toEqual([{ text: '@ayesha_khan', username: 'ayesha_khan' }, { text: ' agreed!' }]);
  });
  test('several mentions, mixed case lowercased for lookup', () => {
    expect(splitMentions('Thanks @Ali and @sara_7.')).toEqual([
      { text: 'Thanks ' },
      { text: '@Ali', username: 'ali' },
      { text: ' and ' },
      { text: '@sara_7', username: 'sara_7' },
      { text: '.' },
    ]);
  });
  test('emails and too-short names are not mentions', () => {
    expect(splitMentions('mail me at me@site.com or @ab')).toEqual([{ text: 'mail me at me@site.com or @ab' }]);
  });
});
