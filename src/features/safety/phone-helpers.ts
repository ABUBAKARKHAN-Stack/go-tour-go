/** Pure helpers for SOS messages and WhatsApp links (unit-tested). */

export function normalizePhone(raw: string): string {
  // Keep digits; convert local Pakistani numbers (03xx...) to +92 for WhatsApp.
  let digits = raw.replace(/[^0-9+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (/^03\d{9}$/.test(digits)) digits = `+92${digits.slice(1)}`;
  return digits;
}

export function isValidPhone(phone: string) {
  return /^\+?[0-9]{7,15}$/.test(phone);
}

export function mapsLink(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function sosMessage(name: string, lat: number | null, lng: number | null) {
  const where = lat != null && lng != null ? `My location: ${mapsLink(lat, lng)}` : 'I could not get my exact location.';
  return `SOS from ${name} via GoTourGo. I may need help. ${where} (Sent ${new Date().toLocaleString()})`;
}

/** WhatsApp click-to-chat link (opens WhatsApp or the browser; no extra Android permissions). */
export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

