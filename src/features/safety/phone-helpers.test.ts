import { expect, test } from 'bun:test';

import { isValidPhone, normalizePhone, whatsappLink } from './phone-helpers';

test('normalizes Pakistani mobile numbers for WhatsApp', () => {
  expect(normalizePhone('0300 1234567')).toBe('+923001234567');
  expect(normalizePhone('00923001234567')).toBe('+923001234567');
  expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
  expect(isValidPhone('+923001234567')).toBe(true);
  expect(isValidPhone('12')).toBe(false);
});

test('builds an encoded wa.me link', () => {
  expect(whatsappLink('+923001234567', 'SOS & help')).toBe('https://wa.me/923001234567?text=SOS%20%26%20help');
});
