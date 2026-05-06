// PST date utilities
const { toZonedTime, fromZonedTime } = require('date-fns-tz');
const { parseISO, isAfter, startOfDay } = require('date-fns');

const TZ = 'America/Los_Angeles';

function nowPST() {
  return toZonedTime(new Date(), TZ);
}

function deadlinePST(dateStr) {
  // Returns 11:59:59 PM Pacific of the given date string (YYYY-MM-DD)
  const d = parseISO(dateStr);
  const pst = toZonedTime(d, TZ);
  pst.setHours(23, 59, 59, 999);
  return fromZonedTime(pst, TZ);
}

function isPastDeadline(dateStr) {
  return isAfter(new Date(), deadlinePST(dateStr));
}

function todayStrPST() {
  const d = nowPST();
  return d.toISOString().slice(0, 10);
}

module.exports = { nowPST, deadlinePST, isPastDeadline, todayStrPST, TZ };
