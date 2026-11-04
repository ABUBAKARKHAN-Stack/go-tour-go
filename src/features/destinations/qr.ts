/** QR payload for a destination, read back by Smart Scan. */
export const destinationQrValue = (slug: string) => `gotourgo://destination/${slug}`;

/** Extracts a destination slug or id from a scanned QR / deep link. */
export function parseDestinationQr(value: string): string | null {
  const m = value.trim().match(/^[a-z0-9+.-]+:\/\/(?:[^/]*\/)*destination\/([A-Za-z0-9-]+)/i);
  return m ? m[1] : null;
}
