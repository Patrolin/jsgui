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
