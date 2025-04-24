import { noise } from "./number_utils.mts";

/** find the closest value to `start`, such that `condition(value) == true`, assuming `condition` has boxcar or monotonic shape */
export function binary_search_float(start: number, end: number, condition: (value: number) => boolean): number | null {
  // find some endpoint, such that `condition(endpoint) == true`
  for (let i = 0; i < 1000; i++) { // runs in <100 steps
    let new_end = end + (start - end)*noise(i);
    if (condition(new_end)) {
      end = new_end;
      break;
    }
  }
  if (!condition(end)) return null;
  // NOTE: `condition` must be monotonic here
  while (true) {
    let midpoint = end + (start - end)*0.5;
    if (midpoint === start || midpoint === end) break;
    if (condition(midpoint)) {
      end = midpoint;
    } else {
      start = midpoint;
    }
  }
  if (condition(start)) {
    return start;
  } else if (condition(end)) {
    return end;
  } else {
    return null;
  }
}
