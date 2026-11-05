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

/** OpenStreetMap link, used only when a GoTourGo link could not be created (no internet). */
export function osmLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lng.toFixed(6)}#map=17/${lat.toFixed(6)}/${lng.toFixed(6)}`;
}

/**
 * The SOS text sent over WhatsApp. `link` is the GoTourGo SOS link, which opens
 * the in-app SOS screen (or a web page without the app) and follows the live
 * location for 24 hours.
 */
export function sosMessage(name: string, link: string | null, lat: number | null, lng: number | null) {
  const where = link
    ? `See where I am (live for 24 hours): ${link}`
    : lat != null && lng != null
      ? `My location: ${lat.toFixed(5)}, ${lng.toFixed(5)} ${osmLink(lat, lng)}`
      : 'I could not get my exact location.';
  return `SOS from ${name} via GoTourGo. I may need help. ${where} (Sent ${new Date().toLocaleString()})`;
}

/** WhatsApp click-to-chat link (opens WhatsApp or the browser; no extra Android permissions). */
export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

