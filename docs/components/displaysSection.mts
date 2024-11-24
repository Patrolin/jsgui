import {coloredButton, dialog, div, loadingSpinner, makeComponent, PopupDirection, popupWrapper, progress, SIZES, span, tabs, TabsOption} from '../../jsgui/out/jsgui.mts';
import { DocsSection } from '../utils/utils.mts';

const spinnerPage = makeComponent(function spinnerPage() {
  // loading spinner
  let row = this.append(div({className: "display-row"}));
  for (let size of Object.values(SIZES)) row.append(loadingSpinner({size, color: 'secondary-1'}));
  // linear progress indeterminate
  row = this.append(div({className: "wide-display-row", style: {marginBottom: 4}}));
  row.append(progress({color: 'secondary-0'}));
  // linear progress determinate
  const [state, setState] = this.useState({ progress: 0.0 });
  row = this.append(div({className: "wide-display-row", style: {marginBottom: 4}}));
  row.append(progress({fraction: state.progress, color: 'secondary-0'}));
  row = this.append(div({className: "display-row", style: {marginTop: 0}}));
  row.append(coloredButton("progress = (progress + 0.2) % 1.2", {
    color: "secondary",
    onClick: () => {
      setState({progress: (state.progress + 0.2) % 1.2});
    }
  }));
});
const dialogPage = makeComponent(function dialogPage() {
  const row = this.append(div({className: "display-row", style: {marginTop: 2}}));
  const [state, setState] = this.useState({dialogOpen: false});
  const openDialog = () => setState({dialogOpen: true});
  const closeDialog = () => setState({dialogOpen: false});
  row.append(coloredButton("Open dialog", {color: "secondary", onClick: openDialog}));
  const dialogWrapper = row.append(dialog({open: state.dialogOpen, onClose: closeDialog, closeOnClickBackdrop: true}));
  dialogWrapper.append(span("Hello world"));
});
const popupPage = makeComponent(function popupPage() {
  for (let direction of ["up", "right", "down", "left", "mouse"] as PopupDirection[]) {
    const row = this.append(div({className: "wide-display-row"}));
    const leftPopup = row.append(popupWrapper({
      content: span("Tiny"),
      direction,
      interactable: direction !== "mouse",
    }));
    leftPopup.append(span(`direction: "${direction}"`));
    const rightPopup = row.append(popupWrapper({
      content: span("I can be too big to naively fit on the screen!"),
      direction,
      interactable: direction !== "mouse",
    }));
    rightPopup.append(span(`direction: "${direction}"`));
  }
  const [state, setState] = this.useState({buttonPopupOpen: false});
  const row = this.append(div({className: "wide-display-row"}));
  const popup = row.append(popupWrapper({
    content: span("Tiny"),
    direction: "down",
    open: state.buttonPopupOpen,
    interactable: true,
  }));
  popup.append(coloredButton(`Toggle popup`, {
    onClick: () => {
      setState({buttonPopupOpen: !state.buttonPopupOpen});
    },
  }));
});
const mediaQueryPage = makeComponent(function mediaQueryPage() {
  const smOrBigger = this.useMedia({minWidth: 600});
  const mdOrBigger = this.useMedia({minWidth: 900});
  const lgOrBigger = this.useMedia({minWidth: 1200});
  const xlOrBigger = this.useMedia({minWidth: 1500});
  const column = this.append(div({className: "display-column"}));
  column.append(span(`smOrBigger: ${smOrBigger}`));
  column.append(span(`mdOrBigger: ${mdOrBigger}`));
  column.append(span(`lgOrBigger: ${lgOrBigger}`));
  column.append(span(`xlOrBigger: ${xlOrBigger}`));
});
const tabsPage = makeComponent(function tabsPage() {
  const [state, setState] = this.useState({selectedTab: 0 as string | number});
  const tabOptions: TabsOption[] = [
    {label: "foo"},
    {label: "bar"},
    {id: "customId", label: "zoo"},
  ];
  this.append(tabs({
    options: tabOptions,
    selectedId: state.selectedTab,
    setSelectedId: (newId) => setState({selectedTab: newId}),
  }));
  const selectedTab = tabOptions.find((option, i) => (option.id ?? i) === state.selectedTab);
  if (selectedTab) {
    this.append(span(selectedTab.label, {key: state.selectedTab}))
  }
});

export const DISPLAYS_SECTION: DocsSection = {
    id: "displays",
    label: "Displays",
    pages: [
        {id: "spinner", label: "Spinner", component: spinnerPage},
        {id: "dialog", label: "Dialog", component: dialogPage},
        {id: "popup", label: "Popup", component: popupPage},
        {id: "mediaQuery", label: "Media query", component: mediaQueryPage},
        {id: "tabs", label: "Tabs", component: tabsPage},
    ],
};
