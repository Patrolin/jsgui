/** clamp value between min and max (defaulting to min) */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
export function lerp(t: number, x: number, y: number): number {
  return (1-t)*x + t*y;
}
export function unlerp(value: number, x: number, y: number): number {
  return (x - value) / (x - y);
}

// modulo
/** return `a` remainder `b` */
export function rem(a: number, b: number): number {
  return a % b;
}
/** return `a` modulo `b` */
export function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

// noise
const PHI_1_INV = 0.6180339887498948;
/** map `seed` to noise, such that `noise(0) == 0`  */
export function noise(seed: number): number {
  return mod(seed * PHI_1_INV, 1);
}

// directed rounding
export function round_directed_towards_infinity(value: number) {
  return Math.ceil(value);
}
export function round_directed_towards_negative_infinity(value: number) {
  return Math.floor(value);
}
export function round_directed_towards_zero(value: number) {
  return Math.trunc(value);
}
export function round_directed_away_from_zero(value: number) {
  return value > 0 ? Math.ceil(value) : Math.floor(value);
}

// nearest rounding
export function round_towards_infinity(value: number) {
  return Math.floor(value + 0.5);
}
export function round_towards_negative_infinity(value: number) {
  return Math.ceil(value - 0.5);
}
export function round_towards_zero(value: number) {
  return value > 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}
export function round_away_from_zero(value: number) {
  return value > 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}
export function round_to_even(value: number) {
  let result = round_towards_infinity(value);
  const is_tie = (Math.abs(value) % 1 === 0.5);
  const result_is_odd = (result % 2 !== 0);
  if (is_tie && result_is_odd) result -= 1;
  return result;
}
export function round_to_odd(value: number) {
  let result = round_towards_infinity(value);
  const is_tie = (Math.abs(value) % 1 === 0.5);
  const result_is_even = (result % 2 === 0);
  if (is_tie && result_is_even) result -= 1;
  return result;
}
