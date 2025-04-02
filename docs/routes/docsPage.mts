import { code, div, makeComponent, navigate, NavType, tabs } from '../../jsgui/out/jsgui.mts';
import {DocsSection, getGithubPagesPrefix} from '../utils/utils.mts';
import { textInputPage } from '../components/inputs/textInputPage.mts';
import { dialogPage } from '../components/displays/dialogPage.mts';
import { progressPage } from '../components/displays/progressPage.mts';
import { popupPage } from '../components/displays/popupPage.mts';
import { mediaQueryPage } from '../components/displays/mediaQueryPage.mts';
import { tablePage } from '../components/displays/tablePage.mts';
import { tabsPage } from '../components/displays/tabsPage.mts';
import { webgpuPage } from '../components/displays/webgpuPage.mts';
import { anchorPage, buttonPage, htmlPage, iconPage, spanPage } from '../components/basicsSection.mts';
import { routerPage } from '../components/displays/routerPage.mts';
import { jsFormatter } from '../utils/components/formatter.mts';

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: "basics",
    label: "Basics",
    pages: [
        {id: "html", label: "HTML", component: htmlPage},
        {id: "span", label: "Span", component: spanPage},
        {id: "anchor", label: "Anchor", component: anchorPage},
        {id: "button", label: "Button", component: buttonPage},
        {id: "icon", label: "Icon", component: iconPage},
    ],
  },
  {
    id: "displays",
    label: "Displays",
    pages: [
        {id: "router", label: "Router", component: routerPage},
        {id: "dialog", label: "Dialog", component: dialogPage},
        {id: "popup", label: "Popup", component: popupPage},
        {id: "progress", label: "Progress", component: progressPage},
        {id: "mediaQuery", label: "Media query", component: mediaQueryPage},
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

type RouteParams = {
  sectionId: string,
  subsectionId: string,
  routerDemoId: string,
};
export const docsPage = makeComponent(function docsPage(routeParams: RouteParams) {
  const [state, setState] = this.useState({
    sectionId: routeParams.sectionId ?? DOCS_SECTIONS[0].id,
    subsectionId: routeParams.subsectionId ?? DOCS_SECTIONS[0].pages[0].id,
  });
  // section
  const column = this.append(
    div({style: {display: "flex", flexDirection: "column", alignItems: "flex-start", rowGap: 8}})
  );
  const navigationColumn = column.append(div());
  navigationColumn.append(tabs({
    options: DOCS_SECTIONS,
    selectedId: state.sectionId,
    setSelectedId: (newId) => setState({sectionId: newId as string}),
  }));
  // subsection
  const selectedSection = DOCS_SECTIONS.find(v => v.id === state.sectionId);
  const getSelectedPage = () => selectedSection?.pages.find(v => v.id === state.subsectionId);
  if (selectedSection && getSelectedPage() == null) {
    state.subsectionId = selectedSection.pages[0].id;
  }
  navigationColumn.append(tabs({
    options: selectedSection?.pages ?? [],
    selectedId: state.subsectionId,
    setSelectedId: (newId) => setState({subsectionId: newId as string}),
    style: {marginTop: 4},
  }));
  // content
  const tabsContent = column.append(div({className: "display-column", style: {width: "100%", padding: "0 8px"}}));
  const selectedPageComponent = getSelectedPage()?.component();
  if (selectedPageComponent) {
    tabsContent.append(selectedPageComponent);
    const selectedOnRender = selectedPageComponent.onRender;
    const codeString = `const ${selectedOnRender?.name} = makeComponent(${selectedOnRender});`;
    column.append(jsFormatter(codeString));
  }
  // update url
  let wantPathname = `${getGithubPagesPrefix()}/${state.sectionId}/${state.subsectionId}`;
  if (routeParams.routerDemoId) {
    wantPathname += `/${routeParams.routerDemoId}`;
  }
  if (window.location.pathname !== wantPathname) {
    navigate({
      pathname: wantPathname,
      query: '',
      hash: '',
    }, NavType.Replace);
  }
});
