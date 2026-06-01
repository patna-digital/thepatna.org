const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function pad(value) {
  return String(value).padStart(2, "0");
}

function asDate(dateLike) {
  if (!dateLike) {
    return null;
  }

  const date = dateLike instanceof Date ? new Date(dateLike.getTime()) : new Date(dateLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateOnly(dateLike) {
  if (typeof dateLike !== "string") {
    return null;
  }

  const match = DATE_ONLY_PATTERN.exec(dateLike);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function getUtcDateParts(dateLike) {
  const parsedDate = parseDateOnly(dateLike);
  if (parsedDate) {
    return parsedDate;
  }

  const date = asDate(dateLike);
  if (!date) {
    return null;
  }

  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function addLocalDays(date, days) {
  const nextDate = new Date(date.getTime());
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfLocalDay(dateLike) {
  const date = asDate(dateLike);
  if (!date) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function createLocalDateFromKey(dateKey) {
  const parsedDate = parseDateOnly(dateKey);
  return parsedDate
    ? new Date(parsedDate.year, parsedDate.monthIndex, parsedDate.day)
    : asDate(dateKey);
}

export function toLocalDateKey(dateLike) {
  const date = asDate(dateLike);

  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getDisplayRangeForEvent(event = {}) {
  const start = startOfLocalDay(event.starts_at);

  if (!start) {
    return { start: null, end: null };
  }

  let end = startOfLocalDay(event.ends_at || event.starts_at) || new Date(start.getTime());

  if (event.event_source === "external" && event.is_all_day && event.ends_at) {
    end = addLocalDays(end, -1);
  }

  if (end < start) {
    end = new Date(start.getTime());
  }

  return { start, end };
}

export function getDisplayStartForEvent(event = {}) {
  return getDisplayRangeForEvent(event).start;
}

export function getDateKeysForEvent(event = {}) {
  const { start, end } = getDisplayRangeForEvent(event);

  if (!start || !end) {
    return [];
  }

  const keys = [];
  let cursor = new Date(start.getTime());

  while (cursor <= end) {
    keys.push(toLocalDateKey(cursor));
    cursor = addLocalDays(cursor, 1);
  }

  return keys;
}

export function eventOccursInMonth(event, year, month) {
  const { start, end } = getDisplayRangeForEvent(event);

  if (!start || !end) {
    return false;
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return start <= monthEnd && end >= monthStart;
}

export function eventOccursInYear(event, year) {
  const { start, end } = getDisplayRangeForEvent(event);

  if (!start || !end) {
    return false;
  }

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  return start <= yearEnd && end >= yearStart;
}

export function formatEventTimeLabel(event = {}) {
  if (!event.starts_at || event.is_all_day) {
    return null;
  }

  const start = asDate(event.starts_at);
  if (!start) {
    return null;
  }

  const startLabel = TIME_FORMATTER.format(start);
  const end = asDate(event.ends_at);

  if (!end) {
    return startLabel;
  }

  return `${startLabel} – ${TIME_FORMATTER.format(end)}`;
}

export function normalizeAllDayDateRange(startValue, endValue = null) {
  const startParts = getUtcDateParts(startValue);

  if (!startParts) {
    return {
      startsAt: startValue,
      endsAt: endValue,
    };
  }

  const startDate = new Date(Date.UTC(startParts.year, startParts.monthIndex, startParts.day));
  const endParts = getUtcDateParts(endValue);
  const endDate = endParts
    ? new Date(Date.UTC(endParts.year, endParts.monthIndex, endParts.day))
    : new Date(Date.UTC(startParts.year, startParts.monthIndex, startParts.day + 1));

  return {
    startsAt: startDate.toISOString(),
    endsAt: endDate.toISOString(),
  };
}
