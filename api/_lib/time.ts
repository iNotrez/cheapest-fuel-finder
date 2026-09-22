/** Converts wall-clock date/time components in a given IANA timezone into a
 * correct UTC ISO string, without relying on the server's local timezone
 * (Vercel functions run in UTC). Needed because the NSW FuelCheck API
 * returns timestamps as local Sydney wall-clock time with no offset. */
export function zonedWallClockToUtcIso(
  timeZone: string,
  year: number,
  month: number, // 1-indexed
  day: number,
  hour: number,
  minute: number,
  second: number,
): string {
  const asUtcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(asUtcGuess)).map((p) => [p.type, p.value]),
  );

  const hourPart = parts.hour === '24' ? 0 : Number(parts.hour);
  const asIfUtcInZone = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hourPart,
    Number(parts.minute),
    Number(parts.second),
  );

  const offsetMs = asIfUtcInZone - asUtcGuess;
  return new Date(asUtcGuess - offsetMs).toISOString();
}

const DDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/;
const YYYYMMDD = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;

/** The NSW FuelCheck API inconsistently returns timestamps in either
 * "dd/MM/yyyy HH:mm:ss" or "yyyy-MM-dd HH:mm:ss", always as Sydney local
 * time. Returns null if the string doesn't match either format. */
export function parseNswTimestamp(raw: string | undefined | null): string | null {
  if (!raw) return null;

  const ddmm = DDMMYYYY.exec(raw);
  if (ddmm) {
    const [, dd, mm, yyyy, hh, min, ss] = ddmm;
    return zonedWallClockToUtcIso(
      'Australia/Sydney',
      Number(yyyy),
      Number(mm),
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss),
    );
  }

  const iso = YYYYMMDD.exec(raw);
  if (iso) {
    const [, yyyy, mm, dd, hh, min, ss] = iso;
    return zonedWallClockToUtcIso(
      'Australia/Sydney',
      Number(yyyy),
      Number(mm),
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss),
    );
  }

  return null;
}
