import { expect, test } from 'bun:test';

import { destinationQrValue, parseDestinationQr } from './qr';

test('round-trips destination QR codes and deep links', () => {
  expect(parseDestinationQr(destinationQrValue('badshahi-mosque'))).toBe('badshahi-mosque');
  expect(parseDestinationQr('gotourgodevelopment://destination/lahore-fort')).toBe('lahore-fort');
  expect(parseDestinationQr('https://example.com/menu')).toBeNull();
  expect(parseDestinationQr('hello')).toBeNull();
});
