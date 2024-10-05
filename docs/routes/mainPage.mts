import { code, div, JSGUI_VERSION, makeComponent, span } from '../../jsgui/out/jsgui.mts';
import { BASIC_COMPONENT_SECTIONS } from '../components/basicComponents.mts';
import { INPUT_SECTIONS } from '../components/inputs.mts';
import {MainPageSection} from '../utils/utils.mts';

export const MAIN_PAGE_SECTIONS: MainPageSection[] = [
  ...BASIC_COMPONENT_SECTIONS,
  ...INPUT_SECTIONS,
];
export const mainPage = makeComponent(function mainPage() {
  const wrapper = this.append(
    div({
      style: {display: "flex", flexDirection: "column", alignItems: "flex-start"},
    })
  );
  wrapper.append(span(`version: ${JSGUI_VERSION}`, {size: "small", selfLink: "version"}));
  for (let section of MAIN_PAGE_SECTIONS) {
    wrapper.append(span(section.label, {size: "big", selfLink: section.id}));
    const component = section.component()
    wrapper.append(component);
    const row = wrapper.append(div({className: "display-row"}));
    const onRender = component.onRender;
    const codeString = `const ${onRender.name} = makeComponent(${onRender});`;
    row.append(code(codeString, {style: {
      margin: "6px 0px 4px 0px",
      padding: "4px 8px",
      background: "rgba(0, 0, 0, 0.1)",
      borderRadius: 8,
    }}));
  }
});
