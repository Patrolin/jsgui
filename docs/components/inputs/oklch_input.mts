import { addPercent, BaseProps, clamp, div, glSetBuffer, glUseProgram, makeComponent, mod, sliderInput, span, useCachedRequest, useOnPointerMove, UseOnPointerMoveValue, vec2, vec2_circle_norm, vec3, vec3_max_component, vec3_min_component, webgl } from "../../../jsgui/out/jsgui.mts";
import { oklch_to_srgb255, oklch_to_srgb255i } from "../../utils/color_utils.mts";
import { binary_search_float } from "../../utils/optimization/optimization_utils.mts";

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

export enum OKLCH_InputMode {
  LH_C = 0,
  CH_L = 1,
}
type OKLCHInputProps = BaseProps & {
  defaultValue?: vec3;
  inputMode?: OKLCH_InputMode
  onChange?: (newValue: vec3 | null) => void;
};
export const oklchInput = makeComponent(function oklchInput(props: OKLCHInputProps) {
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
  const {data: oklchInput_fragmentShader} = useCachedRequest({
    component: this,
    url: '/jsgui/docs/components/inputs/oklch_input.frag',
    responseType: 'text',
  });
  if (oklchInput_fragmentShader == null) {
    circleInputWrapper.append(div({style: {width: '100%', height: '100%', background: `rgb(${BACKGROUND_COLOR.map(v => 255*v)})`}}));
  } else {
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
          fragment: oklchInput_fragmentShader,
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
  }
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
