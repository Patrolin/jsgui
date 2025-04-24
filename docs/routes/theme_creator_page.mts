import { addPercent, BaseProps, binary_search_float, clamp, div, glSetBuffer, glUseProgram, makeComponent, sliderInput, span, useOnPointerMove, UseOnPointerMoveValue, vec2, vec2_circle_norm, vec2_clamp_to_square, vec3, vec3_max_component, vec3_min_component, webgl } from "../../jsgui/out/jsgui.mts";
import { oklch_to_srgb255, srgb255_round_away_from_zero } from "../utils/color_utils.mts";

// TODO!: theme creator with: L, L_step, C%, H, H_step?
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const wrapper = this.append(div());
  wrapper.append(oklchInput({
    onChange: (oklch) => {
      const srgb255 = oklch != null && oklch_to_srgb255(oklch);
      console.log('onchange', {
        oklch,
        srgb255,
      });
    }
  }));
  wrapper.append(oklchInput({
    onChange: (oklch) => {
      const srgb255 = oklch != null && oklch_to_srgb255(oklch);
      console.log('onchange', {
        oklch,
        srgb255,
      });
    }
  }));
});

// oklchInput
type OKLCHInputProps = BaseProps & {
  onChange?: (newValue: vec3 | null) => void;
};
const oklchInput = makeComponent(function oklchInput(props: OKLCHInputProps) {
  const {onChange} = props;

  const BACKGROUND_COLOR = [0.4, 0.4, 0.4] as [number, number, number];
  const CHROMA_MAX = 0.145;
  const OKLCH_DEFAULT = vec3(0.40, 0.00, 0.4);
  const defaultDotPos = vec2(
    OKLCH_DEFAULT.x * Math.cos(OKLCH_DEFAULT.z),
    OKLCH_DEFAULT.x * Math.sin(OKLCH_DEFAULT.z),
  );
  const defaultDotOffset = vec2((defaultDotPos.x + 1) * 0.5, (1 - defaultDotPos.y) * 0.5);

  type OKLCHState = {
    chroma: number;
    dotOffset: vec2;
    // only for rendering srgb255 color
    _oklch: vec3 | null;
  }
  const [state, _setState] = this.useState<OKLCHState>({
    chroma: OKLCH_DEFAULT.y,
    dotOffset: defaultDotOffset, // TODO: compute dotOffset from oklch instead?
    _oklch: OKLCH_DEFAULT,
  });
  const updateState = (diff: Partial<typeof state>) => {
    const newState = {...state, ...diff};
    const {chroma, dotOffset} = newState;
    const dotPos = {x: dotOffset.x*2 - 1, y: 1 - dotOffset.y*2};

    // NOTE: same as glsl shader
    const distance = vec2_circle_norm(dotPos);
    const angle = Math.atan2(dotPos.y, dotPos.x);

    let L: number | null = distance;
    const get_srgb255 = (L: number) => {
      return oklch_to_srgb255(vec3(L, chroma, angle));
    }
    const is_valid_srgb255 = (L: number) => {
      const srgb255 = get_srgb255(L);
      return vec3_min_component(srgb255) >= 0.0 && vec3_max_component(srgb255) <= 255.0;
    }

    const srgb255 = get_srgb255(L);
    if (vec3_min_component(srgb255) < 0.0) {
      const new_L = binary_search_float(L, 1, is_valid_srgb255);
      console.log('L too low', {L, new_L, 'get_srgb255(new_L)': new_L != null && get_srgb255(new_L)});
      L = new_L;
    } else if (vec3_max_component(srgb255) > 255.0) {
      const new_L = binary_search_float(Math.min(L, 1), 0, is_valid_srgb255);
      console.log('L too high', {L, new_L, 'get_srgb255(new_L)': new_L != null && get_srgb255(new_L)});
      L = new_L;
    }

    const _oklch = L == null ? null : vec3(L, chroma, angle);
    _setState({...newState, _oklch});
    if (onChange) onChange(_oklch);
  };

  // LH circle input
  const wrapper = this.append(div());
  const updateDotPos = (_event: PointerEvent, pointerPos: UseOnPointerMoveValue) => {
    const {fractionX, fractionY} = pointerPos;
    updateState({
      dotOffset: vec2(clamp(fractionX, 0, 1), clamp(fractionY, 0, 1))
    });
  }
  const {onPointerDown: LHCircleOnPointerDown} = useOnPointerMove({
    onPointerDown: updateDotPos,
    onPointerMove: updateDotPos,
  });
  const circleInputWrapper = wrapper.append(div({className: "color-circle-wrapper"}));
  circleInputWrapper.append(webgl({
    events: {
      pointerdown: LHCircleOnPointerDown,
    },
    programs: {
      colorWheel: {
        vertex: `
          in vec2 v_position;
          void main() {
            gl_Position = vec4(v_position, 0, 1);
          }
        `,
        fragment: `
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
          vec3 srgb_to_srgb255(vec3 srgb) {
            return roundAwayFromZero(srgb * 255.0);
          }

          uniform vec2 u_viewport;
          uniform vec3 u_background_color;
          uniform float u_chroma;
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
            vec3 oklch = vec3(L, u_chroma, angle);
            vec3 oklab = oklch_to_oklab(oklch);

            vec3 srgb = oklab_to_linear_srgb(oklab);
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
        `,
      }
    },
    renderResolutionMultiplier: 4,
    render: ({gl, programs: {colorWheel}, rect}) => {
      glUseProgram(gl, colorWheel);
      gl.uniform2f(colorWheel.u_viewport, rect.width, rect.height);
      gl.uniform3f(colorWheel.u_background_color, ...BACKGROUND_COLOR);
      gl.uniform1f(colorWheel.u_chroma, state.chroma);
      glSetBuffer(gl, colorWheel.v_position, new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
      ]));
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
  }));
  circleInputWrapper.append(div({
    className: "color-circle-dot",
    style: {left: addPercent(state.dotOffset.x), top: addPercent(state.dotOffset.y)}
  }));
  // C input
  console.log('oklchInput', state);
  let srgb255 = state._oklch != null ? srgb255_round_away_from_zero(oklch_to_srgb255(state._oklch)) : vec3(80, 0, 0);
  wrapper.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: `rgb(${srgb255.x}, ${srgb255.y}, ${srgb255.z})`,
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: [0, CHROMA_MAX],
    decimalPlaces: 3,
    value: state.chroma,
    onInput: (event) => {
      updateState({
        chroma: event.target.value,
      });
    }
  }));
  wrapper.append(span("#" + [srgb255.x, srgb255.y, srgb255.z].map(v => v.toString(16).padStart(2, "0")).join("")))
});
