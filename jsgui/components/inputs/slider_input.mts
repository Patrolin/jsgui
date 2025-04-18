import { BaseProps, clamp, lerp, makeComponent, unlerp } from "../../jsgui.mts";
import { div } from "../basics.mts";

export type SliderInputProps = {
  range: [number, number];
  decimalPlaces?: number;
  value?: number | null;
  onInput?: (event: {target: {value: number}}) => void;
  onChange?: (event: {target: {value: number}}) => void;
  railProps?: BaseProps;
  knobProps?: BaseProps;
};
export const sliderInput = makeComponent(function sliderInput(props: SliderInputProps) {
  const {range, decimalPlaces, value, onInput, onChange, railProps, knobProps} = props;
  const [state, setState] = this.useState({
    value: range[0],
  });
  if (value != null) state.value = value;
  // elements
  let t = unlerp(value ?? range[0], range[0], range[1]);
  t = clamp(t, 0, 1);
  const leftPercent = (t * 100).toFixed(2);
  const element = this.useNode(() => document.createElement("div"));
  const rail = this.append(div({className: "slider-input-rail", ...railProps}));
  rail.append(div({
    className: "slider-input-rail slider-input-color-rail",
    style: {width: `${leftPercent}%`},
    ...knobProps,
  }));
  rail.append(div({
    className: "slider-input-knob",
    style: {left: `${leftPercent}%`},
    ...knobProps,
  }));
  // events
  const updateValue = (event: MouseEvent) => {
    const rect = (rail.getNode() as HTMLDivElement).getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    let newValue = lerp(fraction, range[0], range[1]);
    newValue = +newValue.toFixed(decimalPlaces ?? 0);
    newValue = clamp(newValue, range[0], range[1]);
    if (onInput) onInput({target: {value: newValue}});
    setState({value: newValue});
  }
  const onMouseMove = (event: MouseEvent) => {
    updateValue(event);
  };
  const onMouseUp = (_event: MouseEvent) => {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onMouseMove);
    if (onChange) onChange({target: {value: state.value}});
  };
  element.onmousedown = (event: MouseEvent) => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    updateValue(event);
    event.preventDefault();
  };
});
