import { addPercent, BaseProps, clamp, div, glSetBuffer, glUseProgram, makeComponent, mod, sliderInput, span, useOnPointerMove, UseOnPointerMoveValue, vec2, vec2_circle_norm, vec2_clamp_to_square, vec3, vec3_max_component, vec3_min_component, webgl } from "../../jsgui/out/jsgui.mts";
import { oklch_to_srgb255, oklch_to_srgb255i } from "../utils/color_utils.mts";
import { binary_search_float } from "../utils/optimization/optimization_utils.mts";

// TODO: verify against 3rd party library
// TODO: use CH_L mode, clamp to unit circle and clamp chroma in shader (and have toggle for clamp vs alpha)

// TODO!: theme creator with: L, L_step, C%, H, H_step?
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const wrapper = this.append(div());
  wrapper.append(oklchInput({
    defaultValue: vec3(0.7482, 0.127, -2.7041853071795865),
    inputMode: 0,
    onChange: (oklch) => {
      const srgb255i = oklch != null && oklch_to_srgb255i(oklch);
      console.log('onchange', {
        oklch,
        srgb255i,
      });
    }
  }));
  wrapper.append(oklchInput({
    defaultValue: vec3(0.68, 0.18, -2.7041853071795865),
    onChange: (oklch) => {
      const srgb255i = oklch != null && oklch_to_srgb255i(oklch);
      console.log('onchange', {
        oklch,
        srgb255i,
      });
    }
  }));
});

// OKLCH color picker (perceptual Lightness, Chroma, Hue)
function oklch_to_dot_pos(props: {inputMode: OKLCH_InputMode, oklch: vec3, chroma_max: number}) {
  const {inputMode, oklch, chroma_max} = props;
  // TODO: checkbox or something for switching input_mode
  let dotPos: vec2;
  if (inputMode == 0) {
    dotPos = vec2(
      oklch.x * Math.cos(oklch.z),
      oklch.x * Math.sin(oklch.z),
    );
  } else {
    dotPos = vec2(
      oklch.y / chroma_max * Math.cos(oklch.z),
      oklch.y / chroma_max * Math.sin(oklch.z),
    );
  }
  const dotOffset = vec2(
    (dotPos.x + 1) * 0.5,
    (1 - dotPos.y) * 0.5
  );
  return {dotPos, dotOffset};
}
function dot_pos_to_oklch(props: {inputMode: OKLCH_InputMode, slider: number, dotOffset: vec2, chroma_max: number}) {
  const {inputMode, dotOffset, slider, chroma_max} = props;
  const dotPos = vec2(
    dotOffset.x * 2 - 1,
    1 - dotOffset.y * 2,
  );
  const distance = vec2_circle_norm(dotPos);
  let L: number, C: number;
  if (inputMode === 0) {
    L = distance;
    C = slider;
  } else {
    L = slider;
    C = distance * chroma_max;
  }
  const H = Math.atan2(dotPos.y, dotPos.x);
  return vec3(L, C, H);
}

enum OKLCH_InputMode {
  LH_C = 0,
  CH_L = 1,
}
type OKLCHInputProps = BaseProps & {
  defaultValue?: vec3;
  inputMode?: OKLCH_InputMode
  onChange?: (newValue: vec3 | null) => void;
};
const oklchInput = makeComponent(function oklchInput(props: OKLCHInputProps) {
  const {defaultValue = vec3(0.50, 0.10, 0.4), inputMode = OKLCH_InputMode.CH_L, onChange} = props;

  const BACKGROUND_COLOR = [0.4, 0.4, 0.4] as [number, number, number];
  const chroma_max = inputMode === 0 ? 0.127 : 0.3171;

  type OKLCHState = {
    /** input dot position */
    dotOffset: vec2;
    /** input slider */
    slider: number;
    /** clamped output */
    _clamped_oklch: vec3;
  }
  const [state, setState] = this.useState<OKLCHState>((diff, prevState) => {
    let newState = {...prevState, ...diff} as OKLCHState;
    // default values
    if (prevState === undefined) {
      const defaultDotPos = oklch_to_dot_pos({
        inputMode,
        oklch: defaultValue,
        chroma_max: chroma_max,
      });
      newState = {
        dotOffset: defaultDotPos.dotOffset,
        slider: inputMode === 0 ? defaultValue.y : defaultValue.x,
        _clamped_oklch: defaultValue,
      };
    }
    // clamp to nearest valid oklch
    let {dotOffset, slider} = newState;
    let oklch = dot_pos_to_oklch({
      inputMode,
      dotOffset,
      slider,
      chroma_max,
    });
    let L: number | null = oklch.x;
    let C: number | null = oklch.y;
    const H = oklch.z;

    if (inputMode === 0) {
      const get_srgb255 = (lightness: number) => {
        return oklch_to_srgb255(vec3(lightness, C as number, H));
      }
      const is_valid_srgb255 = (lightness: number) => {
        const srgb255 = get_srgb255(lightness);
        return vec3_min_component(srgb255) >= 0.0 && vec3_max_component(srgb255) <= 255.0;
      }
      const srgb255 = get_srgb255(L);
      if (vec3_min_component(srgb255) < 0.0) {
        const new_L = binary_search_float(L, 1, is_valid_srgb255);
        //console.log('L too low', {L, new_L, 'get_srgb255(new_L)': new_L != null && get_srgb255(new_L)});
        L = new_L;
      } else if (vec3_max_component(srgb255) > 255.0) {
        const new_L = binary_search_float(Math.min(L, 1), 0, is_valid_srgb255);
        //console.log('L too high', {L, new_L, 'get_srgb255(new_L)': new_L != null && get_srgb255(new_L)});
        L = new_L;
      }
    } else {
      const get_srgb255 = (chroma: number) => {
        return oklch_to_srgb255(vec3(L as number, chroma, H));
      }
      const is_valid_srgb255 = (chroma: number) => {
        const srgb255 = get_srgb255(chroma);
        return vec3_min_component(srgb255) >= 0.0 && vec3_max_component(srgb255) <= 255.0;
      }
      if (!is_valid_srgb255(C)) {
        C = binary_search_float(Math.min(C, chroma_max), 0, is_valid_srgb255);
      }
    }

    if (L != null && C != null) {
      const _clamped_oklch = vec3(L, C, H);
      newState._clamped_oklch = _clamped_oklch;
      setTimeout(() => {
        if (onChange) onChange(_clamped_oklch);
      });
    }
    return newState;
  });

  // LH circle input
  const wrapper = this.append(div());
  const updateDotPos = (_event: PointerEvent, pointerPos: UseOnPointerMoveValue) => {
    const {fractionX, fractionY} = pointerPos;
    const dotOffset = vec2(clamp(fractionX, 0, 1), clamp(fractionY, 0, 1));
    setState({dotOffset});
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
          uniform float u_slider;
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
            float L, C;
            if (u_input_mode == 0) {
              L = distance / radius;
              C = u_slider;
            } else {
              L = u_slider;
              C = distance / radius * u_chroma_max;
            }
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
        `,
      }
    },
    renderResolutionMultiplier: 4,
    render: ({gl, programs: {colorWheel}, rect}) => {
      glUseProgram(gl, colorWheel);
      gl.uniform2f(colorWheel.u_viewport, rect.width, rect.height);
      gl.uniform3f(colorWheel.u_background_color, ...BACKGROUND_COLOR);
      gl.uniform1i(colorWheel.u_input_mode, inputMode);
      gl.uniform1f(colorWheel.u_slider, state.slider);
      gl.uniform1f(colorWheel.u_chroma_max, chroma_max);
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

  // main slider input (C or L)
  let srgb255 = oklch_to_srgb255i(state._clamped_oklch);

  const main_sliderWrapper = wrapper.append(div({className: "color-slider-wrapper"}));
  main_sliderWrapper.append(span(inputMode === 0 ? "C:" : "L:", {className: "color-slider-wrapper-label"}));
  main_sliderWrapper.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: `rgb(${srgb255.x}, ${srgb255.y}, ${srgb255.z})`,
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: inputMode === 0 ? [0, chroma_max] : [0, 1],
    decimalPlaces: 3,
    value: state.slider,
    onInput: (event) => {
      setState({
        slider: event.target.value,
      });
    }
  }));

  // H input
  const H_sliderWrapper = wrapper.append(div({className: "color-slider-wrapper"}));
  H_sliderWrapper.append(span("H:", {className: "color-slider-wrapper-label"}));
  H_sliderWrapper.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: `rgb(${srgb255.x}, ${srgb255.y}, ${srgb255.z})`,
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: [0, 2*Math.PI],
    decimalPlaces: 3,
    value: mod(state._clamped_oklch.z, 2*Math.PI),
    onInput: (event) => {
      const oklch = dot_pos_to_oklch({
        inputMode,
        dotOffset: state.dotOffset,
        slider: state.slider,
        chroma_max,
      });
      oklch.z = event.target.value;
      const dotOffset = oklch_to_dot_pos({inputMode, oklch, chroma_max}).dotOffset;
      setState({dotOffset});
    }
  }));

  // hex string
  wrapper.append(span("#" + [srgb255.x, srgb255.y, srgb255.z].map(v => v.toString(16).padStart(2, "0")).join(""), {style: {marginLeft: 4}}))
});
