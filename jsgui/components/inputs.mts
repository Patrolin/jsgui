import { fragment, icon, legend, span, SpanProps } from "./basics.mts";
import { _EventListener, BaseColor, BaseProps, ChangeEventWithTarget, Component, InputEventWithTarget, makeComponent, ParentNodeType, Size } from "../jsgui.mts";

export type ButtonProps = {
  size?: Size;
  color?: BaseColor;
  onClick?: () => void;
  disabled?: boolean;
}
// inputs
export const coloredButton = makeComponent(function coloredButton(text: string, props: ButtonProps = {}) {
  const {size, color, onClick, disabled} = props;
  const e = this.useNode(() => document.createElement("button"));
  if (text) this.append(span(text));
  const {attribute} = this.baseProps;
  if (size) attribute.dataSize = size;
  if (color) attribute.dataColor = color;
  if (disabled) attribute.disabled = "true";
  else if (onClick) {
    e.onmousedown = () => {
      requestAnimationFrame(onClick);
    }
  }
});
export type InputProps = {
  type?: "text";
  placeholder?: string;
  value: string | number | null | undefined;
  autoFocus?: boolean;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onRawInput?: (event: InputEventWithTarget) => void;
  onInput?: (event: InputEventWithTarget) => void;
  onChange?: (event: ChangeEventWithTarget) => void;
  allowDisplayString?: (value: string) => boolean;
  allowString?: (value: string) => string | undefined;
} & BaseProps;
export const controlledInput = makeComponent(function controlledInput(props: InputProps) {
  const { type = "text", placeholder, value, autoFocus, onFocus, onBlur, onKeyDown, onRawInput, onInput, onChange,
    allowDisplayString = () => true,
    allowString = (value) => value,
  } = props;
  const [state] = this.useState({ prevAllowedDisplayString: String(value ?? ''), prevAllowedString: '' });
  state.prevAllowedString = String(value ?? '');
  const e = this.useNode(() => document.createElement('input'));
  e.type = type;
  if (placeholder) e.placeholder = placeholder;
  if (autoFocus) e.autofocus = true;
  if (value != null) e.value = String(value);
  e.onfocus = onFocus as _EventListener;
  e.onblur = onBlur as _EventListener;
  e.onkeydown = onKeyDown as _EventListener;
  e.oninput = (_event) => {
    const event = _event as InputEventWithTarget;
    if (event.data != null && !allowDisplayString(e.value)) {
      event.preventDefault();
      event.stopPropagation();
      e.value = state.prevAllowedDisplayString;
      return;
    }
    state.prevAllowedDisplayString = e.value;
    if (onRawInput) onRawInput(event);
    const allowedString = allowString(e.value);
    if (allowedString === e.value && onInput) onInput(event);
  }
  e.onchange = (_event) => { // NOTE: called only on blur
    const event = _event as ChangeEventWithTarget;
    const allowedString = allowString(e.value) ?? state.prevAllowedString;
    state.prevAllowedString = allowedString;
    if (e.value !== allowedString) {
      e.value = allowedString;
      const target = event.target;
      if (onRawInput) onRawInput({target} as InputEventWithTarget);
      if (onInput) onInput({target} as InputEventWithTarget);
    }
    if (onChange) onChange(event);
  };
});
export type LabeledInputProps = {
  label?: string;
  leftComponent?: Component;
  inputComponent: Component;
  rightComponent?: Component;
} & BaseProps;
export const labeledInput = makeComponent(function labeledInput(props: LabeledInputProps) {
  const {label = " ", leftComponent, inputComponent, rightComponent} = props;
  const fieldset = this.useNode(() => document.createElement("fieldset"));
  fieldset.onmousedown = (_event: any) => {
    const event = _event as MouseEvent;
    if (event.target !== inputComponent._.prevNode) {
      event.preventDefault();
    }
  }
  fieldset.onclick = (_event: any) => {
    const event = _event as MouseEvent;
    const prevNode = inputComponent._.prevNode as ParentNodeType;
    if (prevNode && (event.target !== prevNode)) {
      prevNode.focus();
    }
  };
  this.append(legend(label))
  if (leftComponent) this.append(leftComponent);
  this.append(inputComponent);
  if (rightComponent) this.append(rightComponent);
});
export const errorMessage = makeComponent(function errorMessage(error: string, props: SpanProps = {}) {
  this.append(span(error, {color: "red", size: "small", ...props}));
});
export type TextInputProps = Omit<InputProps, "value"> & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  value: string | null | undefined;
};
export const textInput = makeComponent(function textInput(props: TextInputProps) {
  const {label, leftComponent, rightComponent, error, ...extraProps} = props;
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent: controlledInput(extraProps),
    rightComponent,
  }));
  if (error) this.append(errorMessage(error));
});
export type NumberArrowProps = {
  onClickUp?: (event: MouseEvent) => void;
  onClickDown?: (event: MouseEvent) => void;
} & BaseProps;
export const numberArrows = makeComponent(function numberArrows(props: NumberArrowProps = {}) {
  const { onClickUp, onClickDown } = props;
  this.useNode(() => document.createElement("div"));
  this.append(icon("arrow_drop_up", {size: "small", onClick: onClickUp}));
  this.append(icon("arrow_drop_down", {size: "small", onClick: onClickDown}));
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
export const numberInput = makeComponent(function numberInput(props: NumberInputProps) {
  const {
    label, leftComponent, rightComponent: customRightComponent, error, // labeledInput
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
    ...extraProps,
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
  const rightComponent = fragment();
  if (customRightComponent) rightComponent.append(customRightComponent);
  rightComponent.append(numberArrows({
    onClickUp: (_event: MouseEvent) => {
      incrementValue(step ?? 1);
      inputComponent._.state.needFocus = true;
      inputComponent.rerender();
    },
    onClickDown: (_event: MouseEvent) => {
      incrementValue(-(step ?? 1));
      inputComponent._.state.needFocus = true;
      inputComponent.rerender();
    },
  }));
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent,
    rightComponent: rightComponent,
  }));
  if (error) this.append(errorMessage(error));
});
