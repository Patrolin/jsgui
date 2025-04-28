import { legend, span, SpanProps } from "../basics.mts";
import { _EventListener, BaseProps, ChangeEventWithTarget, Component, InputEventWithTarget, makeComponent, ParentNodeType, Size } from "../../jsgui.mts";

// inputs
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
  const element = this.useNode(() => document.createElement('input'));
  element.type = type;
  if (placeholder) element.placeholder = placeholder;
  if (autoFocus) element.autofocus = true;
  if (value != null) element.value = String(value);
  element.onfocus = onFocus as _EventListener;
  element.onblur = onBlur as _EventListener;
  element.onkeydown = onKeyDown as _EventListener;
  element.oninput = (_event) => {
    const event = _event as InputEventWithTarget;
    if (event.data != null && !allowDisplayString(element.value)) {
      event.preventDefault();
      event.stopPropagation();
      element.value = state.prevAllowedDisplayString;
      return;
    }
    state.prevAllowedDisplayString = element.value;
    if (onRawInput) onRawInput(event);
    const allowedString = allowString(element.value);
    if (allowedString === element.value && onInput) onInput(event);
  }
  element.onchange = (_event) => { // NOTE: called only on blur
    const event = _event as ChangeEventWithTarget;
    const allowedString = allowString(element.value) ?? state.prevAllowedString;
    state.prevAllowedString = allowedString;
    if (element.value !== allowedString) {
      element.value = allowedString;
      const target = event.target;
      if (onRawInput) onRawInput({target} as InputEventWithTarget);
      if (onInput) onInput({target} as InputEventWithTarget);
    }
    if (onChange) onChange(event);
  };
});
export type LabeledInputProps = {
  label?: string;
  leftComponent?: () => Component;
  inputComponent: Component;
  rightComponent?: () => Component;
} & BaseProps;
export const labeledInput = makeComponent(function labeledInput(props: LabeledInputProps) {
  const {label = " ", leftComponent, inputComponent, rightComponent} = props;
  const fieldset = this.useNode(() => document.createElement("fieldset"));
  fieldset.onpointerdown = (_event: PointerEvent) => {
    const inputNode = inputComponent._.prevNode as ParentNodeType;
    inputNode.focus(); // TODO: does this break mobile text select or not?
  }
  this.append(legend(label))
  if (leftComponent) this.append(leftComponent());
  this.append(inputComponent);
  if (rightComponent) this.append(rightComponent());
});
export const errorMessage = makeComponent(function errorMessage(error: string, props: SpanProps = {}) {
  this.append(span(error, {color: "red", size: Size.small, ...props}));
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
