import { BaseProps, makeComponent } from "../jsgui.mts";
import { div, icon, IconProps } from "./basics.mts";

export const loadingSpinner = makeComponent(function loadingSpinner(props: IconProps = {}) {
  this.append(icon("progress_activity", props));
});
export type ProgressProps = {
  fraction?: number;
} & BaseProps;
export const progress = makeComponent(function progress(props: ProgressProps = {}) {
  const {fraction} = props;
  const wrapper = this.append(div({}));
  wrapper.append(div(fraction == null
    ? {className: 'progress-bar progress-bar-indeterminate'}
    : {className: 'progress-bar', style: {width: `${fraction * 100}%`}}
  ));
});
