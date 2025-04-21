import { addPercent, clamp, div, glSetBuffer, glUseProgram, makeComponent, sliderInput, useOnPointerMove, UseOnPointerMoveValue, vec2, vec2_clamp_to_square, webgl } from "../../jsgui/out/jsgui.mts";

// TODO!: theme creator with: L, L_step, C%, H, H_step?
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const CHROMA_DEFAULT = 0.00;
  const CHROMA_MAX = 0.147;
  const BACKGROUND_COLOR = [0.4, 0.4, 0.4] as [number, number, number];
  const [state, setState] = this.useState({
    chroma: CHROMA_DEFAULT,
    dotPos: {x: 0.75, y: 0.4} as vec2,
  });
  let pos = {x: state.dotPos.x*2 - 1, y: 1 - state.dotPos.y*2};
  pos = vec2_clamp_to_square(pos);

  // LH circle input
  const updateDotPos = (_event: PointerEvent, pointerPos: UseOnPointerMoveValue) => {
    const {fractionX, fractionY} = pointerPos;
    setState({dotPos: {
      x: clamp(fractionX, 0, 1),
      y: clamp(fractionY, 0, 1),
    }});
  }
  const {onPointerDown: LHCircleOnPointerDown} = useOnPointerMove({
    onPointerDown: updateDotPos,
    onPointerMove: updateDotPos,
  });
  // oklab_to_linear_srgb() from https://bottosson.github.io/posts/oklab/
  const circleInputWrapper = this.append(div({className: "color-circle-wrapper"}));
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
            vec3 color = lerp3(alpha, u_background_color, srgb);
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
    style: {left: addPercent(state.dotPos.x), top: addPercent(state.dotPos.y)}
  }));
  // C input
  console.log('state', state);
  this.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: "rgb(80, 0, 0)",
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: [0, CHROMA_MAX],
    decimalPlaces: 3,
    value: state.chroma,
    onInput: (event) => {
      setState({
        chroma: event.target.value,
      });
    }
  }));
});
