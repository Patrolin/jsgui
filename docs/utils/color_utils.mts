import { round_away_from_zero, vec3 } from "../../jsgui/out/jsgui.mts";

export function oklch_to_srgb255(oklch: vec3): vec3 {
  const oklab = _oklch_to_oklab(oklch);
  const linear_srgb = _oklab_to_linear_srgb(oklab);
  const srgb = _linear_srgb_to_srgb(linear_srgb);
  return _srgb_to_srgb255(srgb);
}
export function oklch_to_srgb255i(oklch: vec3): vec3 {
  return _srgb255_to_srgb255i(oklch_to_srgb255(oklch))
}

export function _oklch_to_oklab(oklch: vec3): vec3 {
  return vec3(oklch.x, oklch.y * Math.cos(oklch.z), oklch.y * Math.sin(oklch.z));
}
// oklab_to_linear_srgb() from https://bottosson.github.io/posts/oklab/
export function _oklab_to_linear_srgb(c: vec3): vec3 {
  let l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  let m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  let s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

  let l = l_*l_*l_;
  let m = m_*m_*m_;
  let s = s_*s_*s_;

  return vec3(
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  );
}
export function _linear_srgb_to_srgb(linear_srgb: vec3): vec3 {
  const srgb_companding = (v: number) => {
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v**(1/2.4) - 0.055
  }
  return vec3(srgb_companding(linear_srgb.x), srgb_companding(linear_srgb.y), srgb_companding(linear_srgb.z))
}
export function _srgb_to_srgb255(srgb: vec3): vec3 {
  return vec3(srgb.x * 255.0, srgb.y * 255.0, srgb.z * 255.0);
}
export function _srgb255_to_srgb255i(srgb255: vec3): vec3 {
  return vec3(
    round_away_from_zero(srgb255.x),
    round_away_from_zero(srgb255.y),
    round_away_from_zero(srgb255.z),
  );
}
