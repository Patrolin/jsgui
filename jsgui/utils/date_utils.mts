export function getCurrentTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "shortOffset",
};
export function formatDate(
  date: Date,
  timeZone: string | undefined,
  locale?: string,
  options?: Omit<Intl.DateTimeFormatOptions, "timeZone">,
): string {
  return new Intl.DateTimeFormat(locale, {...DEFAULT_DATE_FORMAT, ...options, timeZone}).format(date);
}
export function formatDateIso(
  date: Date,
  timeZone: string = "GMT",
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    fractionalSecondDigits: 3,
    timeZoneName: 'longOffset',
    timeZone,
  });
  const parts_array = formatter.formatToParts(date);
  const parts = {} as Record<keyof Intl.DateTimeFormatPartTypesRegistry, string>;
  for (let part of parts_array) {
    parts[part.type] = part.value;
  }
  const {year, month, day, hour, minute, second, fractionalSecond, timeZoneName} = parts;
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.${fractionalSecond}${timeZoneName.slice(3) || 'Z'}`;
  return isoString;
}
