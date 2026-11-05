import { expect, test } from 'bun:test';

import { USERNAME } from './schemas';
import { suggestUsername } from './username';

test('builds a valid username from a full name', () => {
  expect(suggestUsername('Ayesha Khan')).toBe('ayesha_khan');
  expect(suggestUsername('  Muhammad   Ali-Jinnah ')).toBe('muhammad_ali_jinnah');
  expect(suggestUsername("Zoë O'Brien")).toBe('zoe_o_brien');
  expect(suggestUsername('Al')).toBe('al_go');
  expect(suggestUsername('عائشہ')).toBe(''); // Urdu script: the traveller picks one
  expect(suggestUsername('')).toBe('');
});

test('numbered alternatives when a name is taken, always within 24 characters', () => {
  expect(suggestUsername('Ayesha Khan', 1)).toBe('ayesha_khan2');
  expect(suggestUsername('Ayesha Khan', 8)).toBe('ayesha_khan9');
  const long = suggestUsername('Muhammad Abubakar Aijaz Khan Travels', 3);
  expect(long.length).toBeLessThanOrEqual(24);
  expect(long.endsWith('4')).toBe(true);
  for (const name of ['Ayesha Khan', 'Al', 'Muhammad Abubakar Aijaz Khan Travels']) {
    for (let i = 0; i < 5; i++) expect(USERNAME.test(suggestUsername(name, i))).toBe(true);
  }
});
