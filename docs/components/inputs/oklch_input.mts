import { addPercent, BaseProps, clamp, div, glSetBuffer, glUseProgram, lerp, makeComponent, mod, numberInput, sliderInput, span, useCachedRequest, useOnPointerMove, UseOnPointerMoveValue, vec2, vec2_circle_norm, vec2_clamp_to_circle, vec3, vec3_max_component, vec3_min_component, webgl } from "../../../jsgui/out/jsgui.mts";
import { oklch_to_srgb255, oklch_to_srgb255i } from "../../utils/color_utils.mts";
import { binary_search_float } from "../../utils/optimization/optimization_utils.mts";

// utils
function oklch_to_dot_pos(props: {oklch: vec3, chroma_max: number}) {
  const {oklch, chroma_max} = props;
  let dotPos = vec2(
    oklch.y / chroma_max * Math.cos(oklch.z),
    oklch.y / chroma_max * Math.sin(oklch.z),
  );
  const dotOffset = vec2(
    (dotPos.x + 1) * 0.5,
    (1 - dotPos.y) * 0.5
  );
  return {dotPos, dotOffset};
}
function dot_offset_to_oklch(props: {L: number, dotOffset: vec2, chroma_max: number}) {
  const {L, dotOffset, chroma_max} = props;
  const dotPos = vec2(
    dotOffset.x * 2 - 1,
    1 - dotOffset.y * 2,
  );
  const C = vec2_circle_norm(dotPos) * chroma_max;
  const H = Math.atan2(dotPos.y, dotPos.x);
  return vec3(L, C, H);
}
function find_min_L(oklch: vec3) {
  const {y: C, z: H} = oklch;
  const get_srgb255 = (L: number) => {
    return oklch_to_srgb255(vec3(L, C, H));
  }
  const is_valid_srgb255 = (L: number) => {
    const srgb255 = get_srgb255(L);
    return vec3_min_component(srgb255) >= 0.0 && vec3_max_component(srgb255) <= 255.0;
  }
  return binary_search_float(0, 1, is_valid_srgb255);
}
function find_max_L(oklch: vec3) {
  const {y: C, z: H} = oklch;
  const get_srgb255 = (L: number) => {
    return oklch_to_srgb255(vec3(L, C, H));
  }
  const is_valid_srgb255 = (L: number) => {
    const srgb255 = get_srgb255(L);
    return vec3_min_component(srgb255) >= 0.0 && vec3_max_component(srgb255) <= 255.0;
  }
  return binary_search_float(1, 0, is_valid_srgb255);
}

// OKLCH color picker (perceptual Lightness, Chroma, Hue)
type OKLCHInputProps = BaseProps & {
  defaultValue?: vec3;
  onChange?: (newValue: vec3 | null) => void;
};
export const oklchInput = makeComponent(function oklchInput(props: OKLCHInputProps) {
  const {defaultValue = vec3(0.50, 0.10, 0.4), onChange} = props;

  const BACKGROUND_COLOR = [0.4, 0.4, 0.4] as [number, number, number];
  const chroma_max = 0.3171; // 0.127

  type OKLCHState = {
    oklch: vec3;
    L_steps: number;
    /** precomputed dot offset */
    _dotOffset: vec2;
  }
  const [state, setState] = this.useState<OKLCHState>((diff, prevState) => {
    let newState = {...prevState, ...diff} as OKLCHState;
    if (prevState === undefined) {
      newState.oklch = defaultValue;
      newState.L_steps = 3;
    }
    // recompute dotOffset
    newState._dotOffset = oklch_to_dot_pos({
      oklch: newState.oklch,
      chroma_max: chroma_max,
    }).dotOffset;
    return newState;
  });

  // LH circle input
  const wrapper = this.append(div());
  const updateDotPos = (_event: PointerEvent, pointerPos: UseOnPointerMoveValue) => {
    const {fractionX, fractionY} = pointerPos;
    let dotPos = vec2(
      fractionX * 2 - 1,
      1 - fractionY * 2,
    );
    dotPos = vec2_clamp_to_circle(dotPos);
    const dotOffset = vec2(
      (dotPos.x + 1) * 0.5,
      (1 - dotPos.y) * 0.5
    );
    setState({
      oklch: dot_offset_to_oklch({L: state.oklch.x, dotOffset, chroma_max})
    });
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
        gl.uniform1f(colorWheel.u_chroma, state.oklch.y);
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
    style: {left: addPercent(state._dotOffset.x), top: addPercent(state._dotOffset.y)}
  }));

  // main slider input (C or L)
  const L_min = find_min_L(state.oklch) ?? state.oklch.x;
  const L_max = find_max_L(state.oklch) ?? state.oklch.x;
  state.oklch.x = (L_min + L_max)*0.5;
  let srgb255i = oklch_to_srgb255i(state.oklch);
  srgb255i = vec3(
    clamp(srgb255i.x, 0, 255),
    clamp(srgb255i.y, 0, 255),
    clamp(srgb255i.z, 0, 255),
  )

  const main_sliderWrapper = wrapper.append(div({className: "color-slider-wrapper"}));
  main_sliderWrapper.append(span("C:", {className: "color-slider-wrapper-label"}));
  main_sliderWrapper.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: `rgb(${srgb255i.x}, ${srgb255i.y}, ${srgb255i.z})`,
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: [0, chroma_max],
    decimalPlaces: 3,
    value: state.oklch.y,
    onInput: (event) => {
      setState({ oklch: vec3(state.oklch.x, event.target.value, state.oklch.z) });
    }
  }));

  // H input
  const H_sliderWrapper = wrapper.append(div({className: "color-slider-wrapper"}));
  H_sliderWrapper.append(span("H:", {className: "color-slider-wrapper-label"}));
  H_sliderWrapper.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: `rgb(${srgb255i.x}, ${srgb255i.y}, ${srgb255i.z})`,
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: [0, 2*Math.PI],
    decimalPlaces: 3,
    value: mod(state.oklch.z, 2*Math.PI),
    onInput: (event) => {
      setState({ oklch: vec3(state.oklch.x, state.oklch.y, event.target.value) });
    }
  }));

  // L_steps input
  wrapper.append(numberInput({
    style: {marginTop: 4},
    label: "L_steps",
    value: state.L_steps,
    min: 1,
    onChange: (event) => {
      setState({L_steps: +event.target.value});
    }
  }));

  // hex string
  const {L_steps} = state;
  for (let i = 0; i < L_steps; i++) {
    const L = lerp(i/(L_steps - 1), L_max, L_min);
    const oklch = vec3(L, state.oklch.y, state.oklch.z);
    let srgb255i = oklch_to_srgb255i(oklch);
    srgb255i = vec3(
      clamp(srgb255i.x, 0, 255),
      clamp(srgb255i.y, 0, 255),
      clamp(srgb255i.z, 0, 255),
    )

    const colorWrapper = wrapper.append(div({
      key: `color-${i}`,
      style: {
        width: 110,
        height: 40,
        background: `rgb(${srgb255i.x}, ${srgb255i.y}, ${srgb255i.z})`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "monospace",
      },
    }));
    const colorText = "#" + [srgb255i.x, srgb255i.y, srgb255i.z].map(v => v.toString(16).padStart(2, "0")).join("")
    colorWrapper.append(colorText);
  }
});
