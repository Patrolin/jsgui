
export type vec2 = {x: number; y: number};
export function vec2(x: number, y: number): vec2 {
  return {x, y};
}
export type vec3 = {x: number; y: number, z: number};
export function vec3(x: number, y: number, z: number): vec3 {
  return {x, y, z};
}

// basic operations
export function vec2_add(A: vec2, B: vec2): vec2 {
  return {x: A.x + B.x, y: A.y + B.y};
}
export function vec3_add(A: vec3, B: vec3): vec3 {
  return {x: A.x + B.x, y: A.y + B.y, z: A.z + B.z};
}

export function vec2_sub(A: vec2, B: vec2): vec2 {
  return {x: A.x - B.x, y: A.y - B.y};
}
export function vec3_sub(A: vec3, B: vec3): vec3 {
  return {x: A.x - B.x, y: A.y - B.y, z: A.z - B.z};
}

export function vec2_mulf(A: vec2, b: number): vec2 {
  return {x: A.x * b, y: A.y * b};
}
export function vec3_mulf(A: vec3, b: number): vec3 {
  return {x: A.x * b, y: A.y * b, z: A.z * b};
}

export function vec2_mul(A: vec2, B: vec2): vec2 {
  return {x: A.x * B.x, y: A.y * B.y};
}
export function vec3_mul(A: vec3, B: vec3): vec3 {
  return {x: A.x * B.x, y: A.y * B.y, z: A.z * B.z};
}

export function vec2_div(A: vec2, B: vec2): vec2 {
  return {x: A.x / B.x, y: A.y / B.y};
}
export function vec3_div(A: vec3, B: vec3): vec3 {
  return {x: A.x / B.x, y: A.y / B.y, z: A.z / B.z};
}

// fancy operations
export function vec2_min_component(A: vec2): number {
  return Math.min(A.x, A.y);
}
export function vec3_min_component(A: vec3): number {
  return Math.min(A.x, A.y, A.z);
}

export function vec2_max_component(A: vec2): number {
  return Math.max(A.x, A.y);
}
export function vec3_max_component(A: vec3): number {
  return Math.max(A.x, A.y, A.z);
}

export function vec2_dot(A: vec2, B: vec2): number {
  return A.x*B.x + A.y*B.y;
}
export function vec3_dot(A: vec3, B: vec3): number {
  return A.x*B.x + A.y*B.y + A.z*B.z;
}

export function vec2_circle_norm(A: vec2): number {
  const {x, y} = A
  return Math.sqrt(x*x + y*y);
}
export function vec3_circle_norm(A: vec3): number {
  const {x, y, z} = A
  return Math.sqrt(x*x + y*y + z*z);
}

export function vec2_clamp_to_circle(A: vec2): vec2 {
  const circle_norm = vec2_circle_norm(A);
  return circle_norm > 1 ? vec2_mulf(A, 1/circle_norm) : A;
}
export function vec3_clamp_to_circle(A: vec3): vec3 {
  const circle_norm = vec3_circle_norm(A);
  return circle_norm > 1 ? vec3_mulf(A, 1/circle_norm) : A;
}

export function vec2_square_norm(A: vec2): number {
  const {x, y} = A
  return Math.max(Math.abs(x), Math.abs(y));
}
export function vec3_square_norm(A: vec3): number {
  const {x, y, z} = A
  return Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
}

export function vec2_clamp_to_square(A: vec2): vec2 {
  const square_norm = vec2_square_norm(A);
  return square_norm > 1 ? vec2_mulf(A, 1/square_norm) : A;
}
export function vec3_clamp_to_square(A: vec3): vec3 {
  const square_norm = vec3_square_norm(A);
  return square_norm > 1 ? vec3_mulf(A, 1/square_norm) : A;
}
