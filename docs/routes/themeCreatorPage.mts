import { BaseProps, div, glSetBuffer, glUseProgram, lerp, makeComponent, numberInput, rgbFromHexString, span, textInput, webgl } from "../../jsgui/out/jsgui.mts";

// TODO!: theme creator with: L, L_step, C%, H, H_step?
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  this.append(webgl({
    style: {width: 150, height: 150, background: '#606060'},
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
            float L_MAX = 1.0;
            vec3 oklch = vec3(distance / radius * L_MAX, 0.13, angle);
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
      gl.uniform3f(colorWheel.u_background_color, 0.4, 0.4, 0.4);
      glSetBuffer(gl, colorWheel.v_position, new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
      ]));
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
  }));
  this.append("TODO: clickable color 'wheel'");

  //
  const [state, setState] = this.useState({
    color: '#1450a0',
    count: 7,
  });
  this.append(textInput({
    value: state.color,
    allowString: (value) => {
      if (value.match("#[0-9a-zA-Z]{6}")) return value;
    },
    onInput: (event) => {
      setState({color: event.target.value});
    },
    label: 'Color',
  }));
  this.append(numberInput({
    value: state.count,
    min: 0,
    onInput: (event) => {
      setState({count: +event.target.value});
    },
    label: 'Count',
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Exponential",
    alphaFunction: (i, N) => {
      return 2 - 2**(i/N);
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Chebyshev roots",
    alphaFunction: (i, N) => (Math.cos(Math.PI*i / N) + 1) / 2,
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "lerp(Chebyshev, linear)",
    alphaFunction: (i, N) => {
      const v = (Math.cos(Math.PI*i / N) + 1) / 2;
      return lerp(i/(N-1), v, (N-i)/N)
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "linear",
    alphaFunction: (i, N) => {
      return (N-i)/N;
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Sigmoid",
    alphaFunction: (i, N) => {
      const v = (i / (0.59*N));
      return Math.exp(-v*v);
    },
  }));
});
type ColorPaletteProps = BaseProps & {
  color: string;
  count: number;
  name: string;
  alphaFunction: (i: number, count: number) => number;
};
const colorPalette = makeComponent(function colorPalette(props: ColorPaletteProps) {
  const {color, count, name, alphaFunction} = props;
  this.append(span(name, {style: {marginTop: 4}}));
  // color
  const appendColorRow = (color: string) => {
    const colorRow = this.append(div({
      style: {display: "flex"},
    }));
    for (let i = 0; i < count; i++) {
      const colorRgb = rgbFromHexString(color);
      const alpha = alphaFunction(i, count);
      colorRow.append(div({
        key: `box-${i}`,
        style: {
          width: 30,
          height: 24,
          background: `rgba(${colorRgb}, ${alpha})`,
        },
      }));
    }
    for (let i = 0; i < count; i++) {
      const colorRgb = rgbFromHexString(color);
      const alpha = alphaFunction(i, count);
      colorRow.append(span("text", {
        key: `text-${i}`,
        style: {
          width: 30,
          textAlign: "right",
          color: `rgba(${colorRgb}, ${alpha})`,
        },
      }));
    }
  }
  appendColorRow(color);
  appendColorRow("#000000");
});
