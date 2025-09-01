/* vec utils */
float sum(vec2 v) {
  return v.x + v.y;
}
float min3(vec3 v) {
  return min(min(v.x, v.y), v.z);
}
float max3(vec3 v) {
  return max(max(v.x, v.y), v.z);
}
vec3 lerp3(float t, vec3 a, vec3 b) {
  return (1.0 - t) * a + t*b;
}
float roundAwayFromZero(float x) {
  return (x >= 0.0) ? floor(x + 0.5) : ceil(x - 0.5);
}
vec3 roundAwayFromZero(vec3 v) {
  return vec3(roundAwayFromZero(v.x), roundAwayFromZero(v.y), roundAwayFromZero(v.z));
}
/* color utils */
vec3 oklch_to_oklab(vec3 oklch) {
  return vec3(oklch.x, oklch.y * cos(oklch.z), oklch.y * sin(oklch.z));
}
// oklab_to_linear_srgb() from https://bottosson.github.io/posts/oklab/
vec3 oklab_to_linear_srgb(vec3 oklab) {
  mat3 M2_inv = mat3(
    +1.0, +1.0, +1.0,
    +0.3963377774, -0.1055613458, -0.0894841775,
    +0.2158037573, -0.0638541728, -1.2914855480
  );
  vec3 lms_cbrt = M2_inv * oklab;
  vec3 lms = lms_cbrt * lms_cbrt * lms_cbrt;
  mat3 M1_inv = mat3(
    +4.0767416621, -1.2684380046, -0.0041960863,
    -3.3077115913, +2.6097574011, -0.7034186147,
    +0.2309699292, -0.3413193965, +1.7076147010
  );
  vec3 srgb = M1_inv * lms;
  return srgb;
}
float srgb_companding(float v) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * pow(v, 1.0/2.4) - 0.055;
}
vec3 linear_srgb_to_srgb(vec3 linear_srgb) {
  return vec3(srgb_companding(linear_srgb.x), srgb_companding(linear_srgb.y), srgb_companding(linear_srgb.z));
}
vec3 srgb_to_srgb255(vec3 srgb) {
  return roundAwayFromZero(srgb * 255.0);
}

uniform vec2 u_viewport;
uniform vec3 u_background_color;
uniform int u_input_mode;
uniform float u_chroma;
uniform float u_chroma_max;
out vec4 out_color;
void main() {
  vec2 center = u_viewport.xy * 0.5;
  // circle
  float radius = min(center.x, center.y);
  vec2 position = (gl_FragCoord.xy - center);
  float distance = sqrt(sum(position * position));
  float angle = atan(position.y, position.x);
  //float alpha = clamp(radius - distance, 0.0, 1.0); // circle alpha
  float alpha = 1.0;
  // colors
  float L = distance / radius;
  float C = u_chroma;
  vec3 oklch = vec3(L, C, angle);
  vec3 oklab = oklch_to_oklab(oklch);

  vec3 linear_srgb = oklab_to_linear_srgb(oklab);
  vec3 srgb = linear_srgb_to_srgb(linear_srgb);
  vec3 srgb255 = srgb_to_srgb255(srgb);
  // emulate round to screen color
  if (min3(srgb) < 0.0 || max3(srgb255) > 255.0) {
    alpha = 0.0;
  }
  srgb = srgb255 / 255.0;

  vec3 background_color = u_background_color;
  if (abs(position.x) <= 2.0 || abs(position.y) <= 2.0) {
    background_color = vec3(0.0, 0.0, 0.0);
  }

  vec3 color = lerp3(alpha, background_color, srgb);
  out_color = vec4(color, 1.0); // NOTE: browsers don't anti-alias alpha correctly..
}
