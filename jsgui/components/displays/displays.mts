import { BaseProps, makeComponent } from "../../jsgui.mts";
import { div, icon, IconProps, span } from "../basics.mts";

// spinners
export const loadingSpinner = makeComponent(function loadingSpinner(props: IconProps = {}) {
  this.append(icon("progress_activity", props));
});
export type ProgressProps = {
  color?: string;
  fraction?: number;
} & BaseProps;
export const progress = makeComponent(function progress(props: ProgressProps = {}) {
  const {color, fraction} = props;
  if (color) this.baseProps.style.color = `var(--${color})`;
  const wrapper = this.append(div({}));
  wrapper.append(div(fraction == null
    ? {className: 'progress-bar progress-bar-indeterminate'}
    : {className: 'progress-bar', style: {width: `${fraction * 100}%`}}
  ));
});
// tabs
export type TabsOptionComponentProps = {key: string, className: string};
export type TabsOption = {
  id?: string | number;
  label: string;
  href?: string;
};
export type TabsProps = {
  options: TabsOption[];
  selectedId: string | number;
  setSelectedId: (newId: string | number) => void;
};
export const tabs = makeComponent(function tabs(props: TabsProps) {
  const {options, setSelectedId} = props;
  let {selectedId} = props;
  if (selectedId == null) selectedId = options[0].id ?? 0;
  const tabsHeader = this.append(div({className: "tabs-header"}));
  options.forEach((option, i) => {
    const optionId = option.id ?? i;
    tabsHeader.append(span(option.label, {
      key: optionId,
      href: option.href,
      className: "tabs-option",
      attribute: {dataSelected: optionId === selectedId, title: option.label},
      events: {click: () => setSelectedId(optionId)},
    }));
  });
});
