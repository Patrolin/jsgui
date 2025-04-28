import { sortByArray } from "./array_utils.mts";
import { is_number, is_string } from "./type_utils.mts";

// name manipulation
export function camelCaseToKebabCase(key: string) {
  return (key.match(/[A-Z][a-z]*|[a-z]+/g) ?? []).map(v => v.toLowerCase()).join("-");
}
export function removePrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
export function removeSuffix(value: string, prefix: string): string {
  return value.endsWith(prefix) ? value.slice(value.length - prefix.length) : value;
}

// css
export function rgbFromHexString(hexString: string): string {
  let hexString2 = removePrefix(hexString.trim(), '#');
  return `${parseInt(hexString2.slice(0, 2), 16)}, ${parseInt(hexString2.slice(2, 4), 16)}, ${parseInt(hexString2.slice(4, 6), 16)}`;
}
export function addPx(pixelsOrString: string | number) {
  return is_number(pixelsOrString) ? `${pixelsOrString}px` : pixelsOrString as string;
}
export function addPercent(fractionOrString: string | number) {
  return is_number(fractionOrString) ? `${(fractionOrString * 100).toFixed(2)}%` : fractionOrString as string;
}

/** Return stringified JSON with extra undefineds for printing */
export function stringifyJs(v: any): string {
  if (v === undefined) return "undefined";
  return JSON.stringify(v); // TODO: also handle nested undefineds
}

// json
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

// path
export type PathParts = {
  origin?: string;
  pathname?: string;
  query?: string | Record<string, string>;
  hash?: string;
};
/** Make path `${origin}${pathname}?${queryString}#{hash}` and normalize to no trailing `"/"` */
export function makePath(parts: string | PathParts): string {
  if (is_string(parts)) {return parts}
  let origin = parts.origin ?? window.location.origin;
  let pathname = parts.pathname ?? window.location.pathname;
  let query = parts.query ?? window.location.search;
  let hash = parts.hash ?? window.location.hash;
  // build path
  let pathLocation = (origin ?? "") + (pathname ?? "");
  if (pathLocation.endsWith("/index.html")) pathLocation = pathLocation.slice(0, -10);
  pathLocation = pathLocation.replace(/(\/*$)/g, "") || "/";
  let queryString = '';
  if (is_string(query)) {
    queryString = query;
  } else if (Object.keys(query ?? {}).length) {
    const queryObject = query as any;
    queryString = `?${Object.entries(queryObject).map(([k, v]) => `${k}=${v}`).join("&")}`;
  }
  let hashString = hash ?? "";
  if (hashString && !hashString.startsWith("#")) hashString = "#" + hashString;
  return pathLocation + queryString + hashString;
}

// search
/** return `patternMask` for bitap_search() */
export function bitap_pattern_mask(pattern: string): Record<string, number> {
  if (pattern.length > 31) throw new Error("Pattern too long! Bitap supports patterns up to 31 characters.");
  const patternMask: Record<string, number> = {};
  for (let i = 0; i < pattern.length; i++) {
    patternMask[pattern[i]] = (patternMask[pattern[i]] || ~0) & ~(1 << i);
  }
  return patternMask;
}
/** Usage:
 * ```ts
 * const patternMask = bitap_pattern_mask(pattern);
 * bitap_search(text1, pattern.length, patternMask);
 * bitap_search(text2, pattern.length, patternMask);
 * ```
 *
 * return `[index_of_pattern_in_text, number_of_edits]` (up to 1 add/replace/delete), return `[-1, -1]` if not found */
export function bitap_search(text: string, patternLength: number, patternMask: Record<string, number>): [number, number] {
  if (patternLength === 0) return [0, 0];

  let R_0 = ~1;
  let R_1 = ~1;
  let best_match_i = -1;
  for (let i = 0; i < text.length; i++) {
    let oldPrevR = R_0;
    R_0 |= (patternMask[text[i]] || ~0);
    R_0 <<= 1;

    /* allow 1 edit */
    //tmp = R_1
    const match = (R_1 | (patternMask[text[i]] || ~0));
    const replace = oldPrevR;
    const add_or_delete = oldPrevR << 1;
    R_1 = match & replace & add_or_delete;
    R_1 <<= 1;
    //oldPrevR = tmp;

    if ((R_0 & (1 << patternLength)) === 0) {
      return [i, 0];
    } else if ((R_1 & (1 << patternLength)) === 0) {
      best_match_i = i;
    }
  }

  return best_match_i == -1 ? [-1, -1] : [best_match_i, 1];
}
export function search_options(pattern: string, options: string[]): string[] {
  if (pattern.length === 0) return options;
  const patternMask = bitap_pattern_mask(pattern);

  type SearchInfo = {
    option: string;
    index: number;
    editCount: number;
  };
  const infos: SearchInfo[] = [];
  for (let option of options) {
    let index, editCount = 0;
    if (pattern.length > 31) {
      index = option.indexOf(pattern);
    } else {
      [index, editCount] = bitap_search(option, pattern.length, patternMask);
    }
    if (index !== -1) {
      infos.push({option, index, editCount});
    }
  }

  return sortByArray(infos, v => [v.editCount, v.index]).map(v => v.option);
}
