/**
 * parseLocalDate(str)
 * Parses a date string (YYYY-MM-DD or full ISO) as LOCAL midnight.
 * JavaScript's new Date("YYYY-MM-DD") treats date-only strings as UTC,
 * which shifts the date backward in negative-offset timezones (e.g. PDT = UTC-7).
 * This helper always returns midnight in the user's local timezone.
 */
export function parseLocalDate(str) {
  if (!str) return null;
  // Take only the YYYY-MM-DD portion, then parse as local noon to survive setHours.
  const ymd = str.slice(0, 10); // "2026-05-05"
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/**
 * fmtShort(dateStr) → "May 5"
 */
export function fmtShort(dateStr) {
  if (!dateStr) return '—';
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * todayLocal() → Date at local midnight
 */
export function todayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * endOfWeek(from?) → Sunday 23:59:59.999 local
 * from defaults to today.
 */
export function endOfWeek(from) {
  const d = new Date(from || todayLocal());
  const dow = d.getDay(); // 0=Sun … 6=Sat
  d.setDate(d.getDate() + (dow === 0 ? 0 : 7 - dow));
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * endOfMonth(from?) → last day of the month 23:59:59.999 local
 */
export function endOfMonth(from) {
  const d = from ? new Date(from) : todayLocal();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * startOfNextWeek(from?) → next Monday 00:00:00 local
 */
export function startOfNextWeek(from) {
  const ew = endOfWeek(from);
  const d = new Date(ew);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * endOfNextWeek(from?) → Saturday after next Sunday 23:59:59.999
 */
export function endOfNextWeek(from) {
  const snw = startOfNextWeek(from);
  const d = new Date(snw);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
