import { code, div, makeComponent, navigate, NavType, tabs } from '../../jsgui/out/jsgui.mts';
import { BASICS_SECTION } from '../components/basicsSection.mts';
import {DocsSection, getGithubPagesPrefix} from '../utils/utils.mts';
import { textInputPage } from '../components/inputs/textInputPage.mts';
import { dialogPage } from '../components/displays/dialogPage.mts';
import { progressPage } from '../components/displays/progressPage.mts';
import { popupPage } from '../components/displays/popupPage.mts';
import { mediaQueryPage } from '../components/displays/mediaQueryPage.mts';
import { tablePage } from '../components/displays/tablePage.mts';
import { tabsPage } from '../components/displays/tabsPage.mts';
import { webgpuPage } from '../components/displays/webgpuPage.mts';

export const DOCS_SECTIONS: DocsSection[] = [
  BASICS_SECTION,
  {
    id: "displays",
    label: "Displays",
    pages: [
        {id: "dialog", label: "Dialog", component: dialogPage},
        {id: "popup", label: "Popup", component: popupPage},
        {id: "progress", label: "Progress", component: progressPage},
        {id: "mediaQuery", label: "Media query", component: mediaQueryPage},
        // TODO: document the router
        {id: "table", label: "Table", component: tablePage},
        {id: "tabs", label: "Tabs", component: tabsPage},
        {id: "webgpu", label: "WebGPU", component: webgpuPage},
    ],
  },
  {
    id: "inputs",
    label: "Inputs",
    pages: [
      {id: "textInput", label: "Text input", component: textInputPage},
    ]
  },
];

export const docsPage = makeComponent(function docsPage() {
  const params = this.useParams<{
    selectedSectionId: string,
    selectedPageId: string,
  }>();
  const [state, setState] = this.useState({
    selectedSectionId: params.selectedSectionId ?? DOCS_SECTIONS[0].id,
    selectedPageId: params.selectedPageId ?? DOCS_SECTIONS[0].pages[0].id,
  });
  const column = this.append(
    div({style: {display: "flex", flexDirection: "column", alignItems: "flex-start"}})
  );
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
  const wantPathname = `/${state.selectedSectionId}/${state.selectedPageId}`;
  if (window.location.pathname !== wantPathname) {
    navigate({
      pathname: `${getGithubPagesPrefix()}/${state.selectedSectionId}/${state.selectedPageId}`,
      query: '',
      hash: '',
    }, NavType.Replace);
  }
});
