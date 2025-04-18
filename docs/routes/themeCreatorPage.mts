import { BaseProps, div, glSetBuffer, glUseProgram, lerp, makeComponent, numberInput, rgbFromHexString, span, textInput, webgl } from "../../jsgui/out/jsgui.mts";

// TODO!: theme creator with: L, L_step, C%, H, H_step?
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  this.append(webgl({
    style: {width: 150, height: 150},
    programs: {
      colorWheel: {
        vertex: `
          in vec2 v_position;
          void main() {
            gl_Position = vec4(v_position, 0, 1);
          }
        `,
        fragment: `
          uniform vec2 u_viewport;
          out vec4 out_color;
          float sum(vec2 v) {
            return v.x + v.y;
          }
          float sum(vec3 v) {
            return v.x + v.y;
          }
          void main() {
            vec2 center = u_viewport.xy * 0.5;
            // circle
            float radius = min(center.x, center.y);
            vec2 position = (gl_FragCoord.xy - center);
            float distance = sqrt(sum(position * position));
            float alpha = clamp(radius - distance, 0.0, 1.0);
            // colors
            float red = position.x / radius;
            float green = position.y / radius;
            float blue = 0.0;
            out_color = vec4(red, green, blue, alpha);
          }
        `,
      }
    },
    render: ({gl, programs: {colorWheel}, rect}) => {
      glUseProgram(gl, colorWheel);
      gl.uniform2f(colorWheel.u_viewport, rect.width, rect.height);
      glSetBuffer(gl, colorWheel.v_position, new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
      ]));
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
  }));
  this.append("TODO: clickable color wheel");

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
