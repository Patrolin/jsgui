
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
  const colorBoxRow = this.append(div({
    style: {display: "flex"},
  }));
  for (let i = 0; i < state.count; i++) {
    const colorRgb = rgbFromHexString(state.color);
    const alpha = (Math.cos(Math.PI*i / state.count) + 1) / 2;
    colorBoxRow.append(div({
      style: {
        width: 30,
        height: 24,
        background: `rgba(${colorRgb}, ${alpha})`,
      },
    }));
  }
  const colorTextRow = this.append(div({
    style: {display: "flex", gap: 4},
  }));
  for (let i = 0; i < state.count; i++) {
    const colorRgb = rgbFromHexString(state.color);
    const alpha = (Math.cos(Math.PI*i / state.count) + 1) / 2;
    colorTextRow.append(span("text", {
      style: {
        width: 26,
        color: `rgba(${colorRgb}, ${alpha})`,
      },
    }));
  }
});
