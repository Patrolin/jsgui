
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
    onChange: (newValue) => {
      state.count = +newValue;
      this.rerender();
    },
    label: 'Count',
  }));
  this.append(colorPallete({
    color: state.color,
    count: state.count,
    name: "Exponential",
    alphaFunction: (i, N) => {
      return 2 - 2**(i/N);
    },
  }));
  this.append(colorPallete({
    color: state.color,
    count: state.count,
    name: "Chebyshev roots",
    alphaFunction: (i, N) => (Math.cos(Math.PI*i / N) + 1) / 2,
  }));
  this.append(colorPallete({
    color: state.color,
    count: state.count,
    name: "lerp(Chebyshev, linear)",
    alphaFunction: (i, N) => {
      const v = (Math.cos(Math.PI*i / N) + 1) / 2;
      return lerp(i/(N-1), v, (N-i)/N)
    },
  }));
  this.append(colorPallete({
    color: state.color,
    count: state.count,
    name: "linear",
    alphaFunction: (i, N) => {
      return (N-i)/N;
    },
  }));
  this.append(colorPallete({
    color: state.color,
    count: state.count,
    name: "Sigmoid",
    alphaFunction: (i, N) => {
      const v = (i / (0.59*N));
      return Math.exp(-v*v);
    },
  }));
});
type ColorPalleteProps = BaseProps & {
  color: string;
  count: number;
  name: string;
  alphaFunction: (i: number, count: number) => number;
};
const colorPallete = makeComponent(function colorPallete(props: ColorPalleteProps) {
  const {color, count, name, alphaFunction} = props;
  this.append(span(name, {style: {marginTop: name === "Chebyshev roots" ? 2 : 4}}))
  const colorBoxRow = this.append(div({
    style: {display: "flex"},
  }));
  for (let i = 0; i < count; i++) {
    const colorRgb = rgbFromHexString(color);
    const alpha = alphaFunction(i, count);
    colorBoxRow.append(div({
      key: i,
      style: {
        width: 30,
        height: 24,
        background: `rgba(${colorRgb}, ${alpha})`,
      },
    }));
  }
  const colorTextRow = this.append(div({
    style: {display: "flex"},
  }));
  for (let i = 0; i < count; i++) {
    const colorRgb = rgbFromHexString(color);
    const alpha = alphaFunction(i, count);
    colorTextRow.append(span("text", {
      key: i,
      style: {
        width: 30,
        textAlign: "center",
        color: `rgba(${colorRgb}, ${alpha})`,
      },
    }));
  }
});
