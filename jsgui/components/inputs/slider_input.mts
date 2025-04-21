import { BaseProps, makeComponent, ParentNodeType } from "../../jsgui.mts";
import { clamp, lerp, unlerp } from "../../utils/number_utils.mts";
import { addPercent } from "../../utils/string_utils.mts";
import { div } from "../basics.mts";

// useOnPointerMove()
export type UseOnPointerMoveValue = {
  rect: DOMRect;
  fractionX: number;
  fractionY: number;
};
export type UseOnPointerMoveProps = {
  getNode?: (node: ParentNodeType) => ParentNodeType;
  onPointerDown?: (event: PointerEvent, value: UseOnPointerMoveValue) => void;
  onPointerMove?: (event: PointerEvent, value: UseOnPointerMoveValue) => void;
  onPointerUp?: (event: PointerEvent, value: UseOnPointerMoveValue) => void;
};
export type UseOnPointerMove = {
  onPointerDown: (event: PointerEvent) => void;
};
export function useOnPointerMove(props: UseOnPointerMoveProps): UseOnPointerMove {
  const {
    getNode = (v) => v,
    onPointerDown: userOnPointerDown,
    onPointerMove: userOnPointerMove,
    onPointerUp: userOnPointerUp,
  } = props;
  // NOTE: this will be recreated on next render, but remembered by the callback :shrug:
  const ref = {startTarget: null as ParentNodeType | null};
  const getPointerPosition = (event: PointerEvent) => {
    if (ref.startTarget === null) {
      ref.startTarget = event.target as ParentNodeType;
    }
    const node = getNode(ref.startTarget as ParentNodeType);
    const rect = node.getBoundingClientRect();
    const fractionX = (event.clientX - rect.left) / rect.width;
    const fractionY = (event.clientY - rect.top) / rect.height;
    return {rect, fractionX, fractionY};
  }
  const onPointerMove = (event: PointerEvent) => {
    if (userOnPointerMove) userOnPointerMove(event, getPointerPosition(event));
  };
  const onPointerUp = (event: any) => {
    window.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointermove", onPointerMove);
    if (userOnPointerUp) userOnPointerUp(event, getPointerPosition(event));
  };
  const onPointerDown = (event: PointerEvent) => {
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    event.preventDefault();
    if (userOnPointerDown) userOnPointerDown(event, getPointerPosition(event));
  };
  return {onPointerDown};
}

// slider input
export type SliderInputProps = BaseProps & {
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
  let t = unlerp(state.value ?? range[0], range[0], range[1]);
  t = clamp(t, 0, 1);
  const leftPercent = addPercent(t);
  const element = this.useNode(() => document.createElement("div"));
  const rail = this.append(div({className: "slider-input-rail", ...railProps}));
  rail.append(div({
    className: "slider-input-rail slider-input-color-rail",
    style: {width: leftPercent},
    ...knobProps,
  }));
  rail.append(div({
    className: "slider-input-knob",
    style: {left: leftPercent},
    ...knobProps,
  }));
  // events
  const updateValue = (pointerPos: UseOnPointerMoveValue) => {
    const {fractionX} = pointerPos;
    let newValue = lerp(fractionX, range[0], range[1]);
    newValue = +newValue.toFixed(decimalPlaces ?? 0);
    newValue = clamp(newValue, range[0], range[1]);
    setState({value: newValue});
    if (onInput) onInput({target: {value: newValue}});
  }
  const {onPointerDown} = useOnPointerMove({
    getNode: () => rail.getNode() as ParentNodeType,
    onPointerDown: (_event, pointerPos) => updateValue(pointerPos),
    onPointerMove: (_event, pointerPos) => updateValue(pointerPos),
    onPointerUp: (_event, pointerPos) => {
      updateValue(pointerPos);
      if (onChange) onChange({target: {value: state.value}});
    },
  });
  element.onpointerdown = onPointerDown;
});
