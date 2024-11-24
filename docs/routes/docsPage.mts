import { code, div, makeComponent, tabs } from '../../jsgui/out/jsgui.mts';
import { DISPLAYS_SECTION } from '../components/displaysSection.mts';
import { BASICS_SECTION } from '../components/basicsSection.mts';
import {DocsSection, getGithubPrefix} from '../utils/utils.mts';
import { INPUTS_SECTION } from '../components/inputs.mts';

export const DOCS_SECTIONS: DocsSection[] = [
  BASICS_SECTION,
  DISPLAYS_SECTION,
  INPUTS_SECTION,
];

export const docsPage = makeComponent(function docsPage() {
  const column = this.append(
    div({style: {display: "flex", flexDirection: "column", alignItems: "flex-start"}})
  );
  const [state, setState] = this.useState({
    selectedSectionId: DOCS_SECTIONS[0].id,
    selectedPageId: DOCS_SECTIONS[0].pages[0].id,
  });
  const {replaceHistory} = this.useNavigate();
  column.append(tabs({
    options: DOCS_SECTIONS,
    selectedId: state.selectedSectionId,
    setSelectedId: (newId) => setState({selectedSectionId: newId as string}),
  }));
  const selectedSection = DOCS_SECTIONS.find(v => v.id === state.selectedSectionId);
  const getSelectedPage = () => selectedSection?.pages.find(v => v.id === state.selectedPageId);
  if (selectedSection && getSelectedPage() == null) { // TODO: restore from local storage
    state.selectedPageId = selectedSection.pages[0].id;
  }
  column.append(tabs({
    options: selectedSection?.pages ?? [],
    selectedId: state.selectedPageId,
    setSelectedId: (newId) => setState({selectedPageId: newId as string}),
  }));
  const tabsContent = column.append(div({className: "display-column", style: {width: "100%", padding: "0 8px"}}));
  const selectedPageComponent = getSelectedPage()?.component();
  if (selectedPageComponent) {
    tabsContent.append(selectedPageComponent);
    const selectedOnRender = selectedPageComponent.onRender;
    const codeString = `const ${selectedOnRender?.name} = makeComponent(${selectedOnRender});`;
    column.append(code(codeString, {style: {
      marginTop: 8,
      padding: "4px 8px",
      background: "rgba(0, 0, 0, 0.1)",
      borderRadius: 8,
    }}));
  }
  replaceHistory(`${window.location.origin}${getGithubPrefix()}/${state.selectedSectionId}/${state.selectedPageId}`);
});
