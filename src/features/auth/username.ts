/**
 * Usernames from full names: "Ayesha Khan" → "ayesha_khan". Pure (unit-tested).
 * Usernames are 3–24 of a–z, 0–9 and "_" (see USERNAME in schemas.ts).
 */
export function suggestUsername(fullName: string, attempt = 0): string {
  const base = fullName
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  if (!base) return '';
  const suffix = attempt > 0 ? String(attempt + 1) : '';
  let name = base.slice(0, 24 - suffix.length).replace(/_+$/, '') + suffix;
  if (name.length < 3) name = `${name}_go`.slice(0, 24);
  return name;
}
