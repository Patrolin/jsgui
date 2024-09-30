/* TODO
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
  countryIsoString: string;
  country: string;
  constructor(countryIsoString: string, country: string = "GMT") {
    this.countryIsoString = countryIsoString;
    this.country = country;
  }
  /** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones - e.g. "Europe/Prague" */
/* TODO
  static fromIsoString(isoString: string, country: string = "GMT"): CountryDate {
    const match = isoString.match(/^(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(?:\.(\d+))?)?(?:([\-+\d]+):(\d+))?/);
    if (match === null) throw new Error(`Invalid isoString: '${isoString}'`);
    const [_, year, month, day, hour, minute, second, milli, tzOffsetHours, tzOffsetMinutes] = match;
    const date = new Date(Date.UTC(+year, +month, +day, +(hour ?? 0), +(minute ?? 0), +(second ?? 0), +(milli ?? 0)));
    const tzOffset = +(tzOffsetHours ?? 0) + +(tzOffsetMinutes ?? 0)*60;
    date.setHours(date.getHours() - tzOffset);
    const parts = reparseDate(date, country);
    const countryYear = String(parts.year).padStart(4, "0");
    const countryMonth = String(parts.month).padStart(2, "0");
    const countryDate = String(parts.date).padStart(2, "0");
    const countryHours = String(parts.hours).padStart(2, "0");
    const countryMinutes = String(parts.minutes).padStart(2, "0");
    const countrySeconds = String(parts.seconds).padStart(2, "0");
    const countryMillis = String(parts.millis).padStart(3, "0");
    return new CountryDate(`${countryYear}-${countryMonth}-${countryDate}T${countryHours}:${countryMinutes}:${countrySeconds}.${countryMillis}`, country);
  }
  _toCountryUTCDate(): Date {
    const [year, month, day, hour, minute, second, milli] = this.countryIsoString.split(/\D+/);
    console.log('ayaya.toDate', [year, month, day, hour, minute, second, milli]);
    return new Date(Date.UTC(+year, +month-1, +day, +hour, +minute, +second, +milli));
  }
  add(offset: DateParts): CountryDate {
    const date = this._toCountryUTCDate();
    date.setUTCFullYear(date.getUTCFullYear() + (offset.year ?? 0));
    date.setUTCMonth(date.getUTCMonth() + (offset.month ?? 0));
    date.setUTCDate(date.getUTCDate() + (offset.date ?? 0));
    date.setUTCHours(date.getUTCHours() + (offset.hours ?? 0));
    date.setUTCMinutes(date.getUTCMinutes() + (offset.minutes ?? 0));
    date.setUTCSeconds(date.getUTCSeconds() + (offset.seconds ?? 0));
    date.setUTCMilliseconds(date.getUTCMilliseconds() + (offset.millis ?? 0));
    return new CountryDate(date.toISOString(), this.country);
  }
  with(parts: DateParts, country?: string): CountryDate {
    const date = this._toCountryUTCDate();
    if (parts.year) date.setUTCFullYear(parts.year);
    if (parts.month) date.setUTCMonth(parts.month);
    if (parts.date) date.setUTCDate(parts.date);
    if (parts.hours) date.setUTCHours(parts.hours);
    if (parts.minutes) date.setUTCMinutes(parts.minutes);
    if (parts.seconds) date.setUTCSeconds(parts.seconds);
    if (parts.millis) date.setUTCMilliseconds(parts.millis);
    return new CountryDate(date.toISOString(), country ?? this.country);
  }
  /** https://www.unicode.org/cldr/charts/45/supplemental/language_territory_information.html - e.g. "cs-CZ" */
/* TODO
  toLocaleString(format: string, options: Omit<Intl.DateTimeFormatOptions, "timeZone"> = {}): string {
    return this._toCountryUTCDate().toLocaleString(format, {...options, timeZone: "GMT"});
  }
  toIsoString(): string {
    return ""; // TODO: search for iso string matching this date
  }
}
setTimeout(() => {
  console.log("ayaya.dateUtil", CountryDate.fromIsoString("2022-03-01T00:00:00Z"))
})
*/
