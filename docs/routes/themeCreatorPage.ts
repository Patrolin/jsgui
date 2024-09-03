const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const state = this.useState({
    color: '#1450a0',
    count: 7,
  });
  this.append(textInput({
    value: state.color,
    allowString: (value, prevAllowedValue) => {
      return value.match("#[0-9a-zA-Z]{6}") ? value : prevAllowedValue;
    },
    onChange: (newValue) => {
      state.color = newValue;
      this.rerender();
    },
    label: 'Color',
  }));
  this.append(numberInput({
    value: state.count,
    min: 0,
    onChange: (newValue) => {
      state.count = +newValue;
      this.rerender();
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
