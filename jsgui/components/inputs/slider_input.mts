import { makeComponent } from "../../jsgui.mts";
import { div } from "../basics.mts";

export type SliderInputProps = {
  range: [number, number];
  value: number;
};
export const sliderInput = makeComponent(function sliderInput(props: SliderInputProps) {
  const {range, value} = props;
  const [state, setState] = this.useState({
    value: range[0],
  });
  if (value != null) state.value = value;

  const element = this.useNode(() => document.createElement("div"));
  this.append(div({className: ""}));
  const onMouseUp = () => {

  };
  return {
    onMount: () => {
      // NOTE: window events fire even if you drag outside the window
      window.addEventListener("mouseup", onMouseUp);
    },
    onUnmount: () => {
      window.removeEventListener("mouseup", onMouseUp);
    }
  }
});
