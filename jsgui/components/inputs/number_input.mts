import { BaseProps, ChangeEventWithTarget, InputEventWithTarget, makeComponent, Size } from "../../jsgui.mts";
import { div, fragment, icon } from "../basics.mts";
import { controlledInput, errorMessage, InputProps, labeledInput, LabeledInputProps } from "./text_input.mts";

export type NumberArrowProps = {
  onClickUp?: (event: PointerEvent) => void;
  onClickDown?: (event: PointerEvent) => void;
} & BaseProps;
export const numberArrows = makeComponent("numberArrows", function(props: NumberArrowProps = {}) {
  const { onClickUp, onClickDown } = props;
  this.useNode(() => document.createElement("div"));
  this.append(icon("arrow_drop_up", {size: Size.small, onClick: onClickUp}));
  this.append(icon("arrow_drop_down", {size: Size.small, onClick: onClickDown}));
  this.append(div({className: "number-arrows-divider"}));
});
export type NumberInputProps = InputProps & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  min?: number,
  max?: number,
  step?: number,
  stepPrecision?: number,
  clearable?: boolean,
  onRawInput?: ((event: InputEventWithTarget) => void);
  onInput?: ((event: InputEventWithTarget) => void);
  onChange?: ((event: ChangeEventWithTarget) => void)
};
export const numberInput = makeComponent("numberInput", function(props: NumberInputProps) {
  const {
    label, leftComponent, rightComponent, error, // labeledInput
    value, min, max, step, stepPrecision, clearable = true, onKeyDown, onRawInput, onInput, onChange, ...extraProps // numberInput
  } = props;
  const stepAndClamp = (number: number) => {
    if (step) {
      const stepOffset = min ?? max ?? 0;
      number = stepOffset + Math.round((number - stepOffset) / step) * step;
    }
    number = Math.min(number, max ?? 1/0);
    number = Math.max(min ?? -1/0, number);
    const defaultStepPrecision = String(step).split(".")[1]?.length ?? 0;
    return number.toFixed(stepPrecision ?? defaultStepPrecision);
  };
  const incrementValue = (by: number) => {
    const number = stepAndClamp(+(value ?? 0) + by);
    const newValue = String(number);
    const target = inputComponent._.prevNode as HTMLInputElement;
    target.value = newValue;
    if (onRawInput) onRawInput({target} as unknown as InputEventWithTarget);
    if (onInput) onInput({target} as unknown as InputEventWithTarget);
    if (onChange) onChange({target} as ChangeEventWithTarget);
  };
  const inputComponent = controlledInput({
    value,
    onKeyDown: (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          incrementValue(step ?? 1);
          event.preventDefault();
          break;
        case "ArrowDown":
          incrementValue(-(step ?? 1));
          event.preventDefault();
          break;
      }
      if (onKeyDown) onKeyDown(event);
    },
    onRawInput,
    onInput,
    onChange,
    allowDisplayString: (value) => value.split("").every((c, i) => {
      if (c === "-" && i === 0) return true;
      if (c === "." && ((step ?? 1) % 1) !== 0) return true;
      return "0123456789".includes(c);
    }),
    allowString: (value) => {
      const isAllowed = (value === "") ? clearable : !isNaN(+value);
      if (isAllowed) {
        return String(stepAndClamp(+value));
      }
    }
  });
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent,
    rightComponent: () => {
      const acc = fragment();
      if (rightComponent) acc.append(rightComponent());
      acc.append(numberArrows({
        onClickUp: (_event: PointerEvent) => {
          incrementValue(step ?? 1);
          inputComponent._.state!.needFocus = true;
          inputComponent.rerender();
        },
        onClickDown: (_event: PointerEvent) => {
          incrementValue(-(step ?? 1));
          inputComponent._.state!.needFocus = true;
          inputComponent.rerender();
        },
      }));
      return acc;
    },
  }));
  if (error) this.append(errorMessage(error));
});
