/** Return stringified JSON with extra undefineds */
export function stringifyJs(v: any): string {
  if (v === undefined) return "undefined";
  return JSON.stringify(v); // TODO: also handle nested nulls
}
/** Return stringified JSON */
export function stringifyJson(v: any): string {
  return JSON.stringify(v);
}
export function parseJson(v: string): any {
  return JSON.parse(v);
}
/** Return stringified JSON with object keys and arrays sorted */
export function stringifyJsonStable(data: Record<string, any>): string {
  const replacer = (_key: string, value: any) =>
    value instanceof Object
      ? value instanceof Array
        ? [...value].sort()
        : Object.keys(value)
            .sort()
            .reduce((sorted: Record<string, any>, key) => {
              sorted[key] = value[key];
              return sorted;
            }, {})
      : value;
  return JSON.stringify(data, replacer);
}
export type PathParts = {
  origin?: string;
  pathname?: string;
  query?: string | Record<string, string>;
  hash?: string;
};
/** Make path `${origin}${pathname}?${queryString}#{hash}` and normalize to no trailing `"/"` */
export function makePath(parts: string | PathParts): string {
  if (typeof parts === "string") {return parts}
  let origin = parts.origin ?? window.location.origin;
  let pathname = parts.pathname ?? window.location.pathname;
  let query = parts.query ?? window.location.search;
  let hash = parts.hash ?? window.location.hash;
  // build path
  let pathLocation = (origin ?? "") + (pathname ?? "");
  if (pathLocation.endsWith("/index.html")) pathLocation = pathLocation.slice(0, -10);
  pathLocation = pathLocation.replace(/(\/*$)/g, "") || "/";
  let queryString = '';
  if (typeof query === "string") {
    queryString = query;
  } else if (Object.keys(query ?? {}).length) {
    const queryObject = query as any;
    queryString = `?${Object.entries(queryObject).map(([k, v]) => `${k}=${v}`).join("&")}`;
  }
  let hashString = hash ?? "";
  if (hashString && !hashString.startsWith("#")) hashString = "#" + hashString;
  return pathLocation + queryString + hashString;
}
