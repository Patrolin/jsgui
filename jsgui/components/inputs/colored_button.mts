import { BaseColor, makeComponent, Size } from "../../jsgui.mts";
import { span } from "../basics.mts";

export type ButtonProps = {
  size?: Size;
  color?: BaseColor;
  onClick?: () => void;
  disabled?: boolean;
}
export const coloredButton = makeComponent("coloredButton", function(text: string, props: ButtonProps = {}) {
  const {size, color, onClick, disabled} = props;
  const element = this.useNode(() => document.createElement("button"));
  if (text) this.append(span(text));
  const {attribute} = this.baseProps;
  if (size) attribute.dataSize = size;
  if (color) attribute.dataColor = color;
  if (disabled) attribute.disabled = "true";
  else if (onClick) {
    element.onpointerdown = () => {
      onClick();
    }
  }
});
