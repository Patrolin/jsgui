export type DateParts = {
  year?: number;
  month?: number;
  date?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  millis?: number;
};
function reparseDate(date: Date, country: string = "GMT"): Required<DateParts> {
  const localeString = date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    fractionalSecondDigits: 3,
    timeZone: country,
  });
  const [countryDate, countryMonth, countryYear, countryHours, countryMinutes, countrySeconds, countryMillis] = localeString.split(/\D+/);
  return {
    year: +countryYear,
    month: +countryMonth - 1,
    date: +countryDate,
    hours: +countryHours,
    minutes: +countryMinutes,
    seconds: +countrySeconds,
    millis: +countryMillis,
  };
}
export class CountryDate {
  _countryUTCDate: Date;
  country: string;
  constructor(_countryUTCDate: Date, country: string = "GMT") {
    this._countryUTCDate = _countryUTCDate;
    this.country = country;
  }
  get countryUTCString() {
    return this._countryUTCDate.toISOString();
  }
  /** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones - e.g. "Europe/Prague" */
  static fromIsoString(isoString: string, country: string = "GMT"): CountryDate {
    const match = isoString.match(/^(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(?:\.(\d+))?)?(?:([\-+\d]+):(\d+))?/);
    if (match === null) throw new Error(`Invalid isoString: '${isoString}'`);
    const [_, year, month, day, hour, minute, second, milli, tzOffsetHours, tzOffsetMinutes] = match;
    const date = new Date(Date.UTC(+year, +month, +day, +(hour ?? 0), +(minute ?? 0), +(second ?? 0), +(milli ?? 0)));
    const tzOffset = +(tzOffsetHours ?? 0)*60 + +(tzOffsetMinutes ?? 0);
    date.setMinutes(date.getMinutes() - tzOffset);
    const parts = reparseDate(date, country);
    const countryYear = String(parts.year).padStart(4, "0");
    const countryMonth = String(parts.month).padStart(2, "0");
    const countryDate = String(parts.date).padStart(2, "0");
    const countryHours = String(parts.hours).padStart(2, "0");
    const countryMinutes = String(parts.minutes).padStart(2, "0");
    const countrySeconds = String(parts.seconds).padStart(2, "0");
    const countryMillis = String(parts.millis).padStart(3, "0");
    const _countryUTCDate = new Date(Date.UTC(+countryYear, +countryMonth-1, +countryDate, +countryHours, +countryMinutes, +countrySeconds, +countryMillis));
    return new CountryDate(_countryUTCDate, country);
  }
  add(offset: DateParts): CountryDate {
    const date = this._countryUTCDate;
    date.setUTCFullYear(date.getUTCFullYear() + (offset.year ?? 0));
    date.setUTCMonth(date.getUTCMonth() + (offset.month ?? 0));
    date.setUTCDate(date.getUTCDate() + (offset.date ?? 0));
    date.setUTCHours(date.getUTCHours() + (offset.hours ?? 0));
    date.setUTCMinutes(date.getUTCMinutes() + (offset.minutes ?? 0));
    date.setUTCSeconds(date.getUTCSeconds() + (offset.seconds ?? 0));
    date.setUTCMilliseconds(date.getUTCMilliseconds() + (offset.millis ?? 0));
    return new CountryDate(date, this.country);
  }
  with(parts: DateParts, country?: string): CountryDate {
    const date = new Date(this._countryUTCDate);
    if (parts.year) date.setUTCFullYear(parts.year);
    if (parts.month) date.setUTCMonth(parts.month);
    if (parts.date) date.setUTCDate(parts.date);
    if (parts.hours) date.setUTCHours(parts.hours);
    if (parts.minutes) date.setUTCMinutes(parts.minutes);
    if (parts.seconds) date.setUTCSeconds(parts.seconds);
    if (parts.millis) date.setUTCMilliseconds(parts.millis);
    return new CountryDate(date, country ?? this.country);
  }
  /** https://www.unicode.org/cldr/charts/45/supplemental/language_territory_information.html - e.g. "cs-CZ" */
  toLocaleString(format: string = "cs", options: Omit<Intl.DateTimeFormatOptions, "timeZone"> = {}): string {
    return this._countryUTCDate.toLocaleString(format, {...options, timeZone: "GMT"});
  }
  toIsoString(): string {
    return ""; // TODO: search for iso string matching this date
  }
}
setTimeout(() => {
  let a = CountryDate.fromIsoString("2022-03-01T00:00:00Z");
  console.log("ayaya.date", a);
  console.log('ayaya.dateString', a.toLocaleString());
  a = CountryDate.fromIsoString("2022-03-01T00:00:00+01:00", "Europe/Prague");
  console.log("ayaya.date", a);
  console.log('ayaya.dateString', a.toLocaleString());
})
