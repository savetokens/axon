/**
 * Temporal type validation and parsing
 * Supports: date, time, iso8601
 */

/**
 * Validate and parse date (YYYY-MM-DD)
 */
export function parseDate(value: string): Date | null {
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = value.match(datePattern);

  if (!match) {
    return null;
  }

  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const day = parseInt(dayStr!, 10);

  // Validate ranges
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(`${year}-${monthStr}-${dayStr}T00:00:00.000Z`);

  // Validate it's a valid date
  if (isNaN(date.getTime())) {
    return null;
  }

  // Check if the date was changed by JS (e.g., Feb 29 on non-leap year → Mar 1)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    return null;
  }

  return date;
}

/**
 * Validate and parse time (HH:MM:SS or HH:MM:SS.mmm)
 */
export function parseTime(value: string): { hours: number; minutes: number; seconds: number; milliseconds: number } | null {
  const timePattern = /^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/;
  const match = value.match(timePattern);

  if (!match) {
    return null;
  }

  const [, hoursStr, minutesStr, secondsStr, millisecondsStr] = match;
  const hours = parseInt(hoursStr!, 10);
  const minutes = parseInt(minutesStr!, 10);
  const seconds = parseInt(secondsStr!, 10);
  const milliseconds = millisecondsStr ? parseInt(millisecondsStr.padEnd(3, '0'), 10) : 0;

  // Validate ranges
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (seconds < 0 || seconds > 59) return null;
  if (milliseconds < 0 || milliseconds > 999) return null;

  return { hours, minutes, seconds, milliseconds };
}

/**
 * Validate and parse ISO 8601 timestamp
 */
export function parseISO8601(value: string): Date | null {
  // ISO 8601 pattern (basic support)
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?$/;

  if (!iso8601Pattern.test(value)) {
    return null;
  }

  const date = new Date(value);

  // Validate it's a valid date
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Detect if a string is a date
 */
export function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && parseDate(value) !== null;
}

/**
 * Detect if a string is a time
 */
export function isTime(value: string): boolean {
  return /^\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/.test(value) && parseTime(value) !== null;
}

/**
 * Detect if a string is an ISO 8601 timestamp
 */
export function isISO8601(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && parseISO8601(value) !== null;
}

/**
 * Format Date as AXON date string
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date as AXON ISO 8601 string
 */
export function formatISO8601(date: Date): string {
  return date.toISOString();
}
