import { BaseProps, code, div, makeComponent, tabs } from '../../jsgui/out/jsgui.mts';
import { BASIC_COMPONENT_SECTIONS } from '../components/basicComponents.mts';
import { INPUT_SECTIONS } from '../components/inputs.mts';
import { WEBGPU_SECTION } from '../components/webgpuSection.mts';
import {MainPageSection} from '../utils/utils.mts';

export const MAIN_PAGE_SECTIONS: MainPageSection[] = [
  ...BASIC_COMPONENT_SECTIONS,
  ...INPUT_SECTIONS,
  WEBGPU_SECTION,
];
export const mainPage = makeComponent(function mainPage() {
  const column = this.append(
    div({style: {display: "flex", flexDirection: "column", alignItems: "flex-start"}})
  );
  const [state, setState] = this.useState({
    selectedTab: MAIN_PAGE_SECTIONS[0].id
  });
  const tabOptions = MAIN_PAGE_SECTIONS.map(v => ({
    ...v,
    component: (props: BaseProps) => {
      const divWrapper = div(props);
      divWrapper.append(v.component());
      return divWrapper;
    }
  }));
  column.append(tabs({
    options: tabOptions,
    selectedId: state.selectedTab,
    setSelectedId: (newId) => setState({selectedTab: newId as string}),
  }));
  const selectedOnRender = tabOptions.find(v => v.id === state.selectedTab)?.component({}).onRender;
  const codeString = `const ${selectedOnRender?.name} = makeComponent(${selectedOnRender});`;
  column.append(code(codeString, {style: {
    margin: "6px 0px 4px 0px",
    padding: "4px 8px",
    background: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
  }}));
});
