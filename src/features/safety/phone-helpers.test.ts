import { expect, test } from 'bun:test';

import { isValidPhone, normalizePhone, sosMessage, whatsappLink } from './phone-helpers';

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

test('SOS message uses the GoTourGo link, never Google Maps', () => {
  const link = 'https://go-tour-go-development.expo.app/sos?t=' + 'a'.repeat(32);
  const withLink = sosMessage('Ayesha', link, 24.86, 67.03);
  expect(withLink).toContain(link);
  expect(withLink).not.toContain('google');
  const offline = sosMessage('Ayesha', null, 24.86, 67.03);
  expect(offline).toContain('24.86000, 67.03000');
  expect(offline).toContain('openstreetmap.org');
  expect(offline).not.toContain('google');
  expect(sosMessage('Ayesha', null, null, null)).toContain('could not get my exact location');
});
