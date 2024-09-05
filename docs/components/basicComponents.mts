import {BASE_COLORS, button, COLOR_SHADES, coloredButton, dialog, div, icon, input, loadingSpinner, makeComponent, PopupDirection, popupWrapper, SIZES, span, svg} from '../../jsgui/jsgui.mts';
import { getSizeLabel, MainPageSection } from '../utils/utils.mts';

const htmlSection = makeComponent(function htmlSection() {
  let column = this.append(div({className: "displayColumn", style: {gap: 4}}));
  column.append(span("span"));
  column.append(input());
  const someButton = column.append(button("Button", {style: {fontSize: "14px"}}));
  someButton.append(svg(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" />
    </svg>`, {style: {width: "1em", height: "1em"}}));
});
const spanSection = makeComponent(function spanSection() {
  for (let href of [undefined, "https://www.google.com"]) {
    let row = this.append(div({className: "displayRow", style: {marginTop: -4, marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: "small", href}));
    row.append(span("Normal", {size: "normal", href}));
    row.append(span("Big", {size: "big", href}));
    row.append(span("Bigger", {size: "bigger", href}));
  }
  for (let baseColor of Object.keys(BASE_COLORS)) {
    let row = this.append(div({className: "displayRow"}))
    for (let shade of COLOR_SHADES) {
      const color = shade ? `${baseColor}-${shade}` : baseColor;
      row.append(span(color, {color}));
    }
  }
});
const buttonSection = makeComponent(function buttonSection() {
  let row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(coloredButton(getSizeLabel(size), {size}));
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  for (let size of SIZES) row.append(coloredButton(getSizeLabel(size), {color: "secondary", size}));
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  for (let size of SIZES) row.append(coloredButton("Disabled", {disabled: true, size}));
});
const iconSection = makeComponent(function spanSection() {
  let row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(icon("link", {size}));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(loadingSpinner({size}));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) {
    const buttonWrapper = row.append(coloredButton("", {size, color: "secondary"}));
    buttonWrapper.append(icon("link", {size}));
    buttonWrapper.append(span(getSizeLabel(size)));
  }
  // TODO: circle buttons
});
const dialogSection = makeComponent(function dialogSection() {
  const row = this.append(div({ className: "displayRow" }));
  const state = this.useState({ dialogOpen: false });
  const openDialog = () => {
    state.dialogOpen = true;
    this.rerender();
  };
  const closeDialog = () => {
    state.dialogOpen = false;
    this.rerender();
  };
  row.append(coloredButton("Open dialog", { color: "secondary", onClick: openDialog }));
  const dialogWrapper = row.append(dialog({ open: state.dialogOpen, onClose: closeDialog, closeOnClickBackdrop: true }));
  dialogWrapper.append(span("Hello world"));
});
const popupSection = makeComponent(function popupSection() {
  for (let direction of ["up", "right", "down", "left", "mouse"] as PopupDirection[]) {
    const popupProps = {direction, interactable: direction !== "mouse"};
    const row = this.append(div({ className: "wideDisplayRow" }));
    const popupA = row.append(popupWrapper({
      content: span("Tiny"),
      ...popupProps,
    }));
    popupA.append(span(`direction: "${direction}"`));
    const popupB = row.append(popupWrapper({
      content: span("I can be too big to naively fit on the screen!"),
      ...popupProps,
    }));
    popupB.append(span(`direction: "${direction}"`));
  }
  const state = this.useState({ buttonPopupOpen: false });
  const row = this.append(div({ className: "wideDisplayRow" }));
  const popup = row.append(popupWrapper({
    content: span("Tiny"),
    direction: "down",
    open: state.buttonPopupOpen,
  }));
  popup.append(coloredButton(`Toggle popup`, {
    onClick: () => {
      state.buttonPopupOpen = !state.buttonPopupOpen;
      this.rerender();
    },
  }));
});
const mediaQuerySection = makeComponent(function mediaQuerySection() {
  const smOrBigger = this.useMedia({ minWidth: 600 });
  const mdOrBigger = this.useMedia({ minWidth: 900 });
  const lgOrBigger = this.useMedia({ minWidth: 1200 });
  const xlOrBigger = this.useMedia({ minWidth: 1500 });
  const column = this.append(div({ className: "displayColumn" }));
  column.append(span(`smOrBigger: ${smOrBigger}`));
  column.append(span(`mdOrBigger: ${mdOrBigger}`));
  column.append(span(`lgOrBigger: ${lgOrBigger}`));
  column.append(span(`xlOrBigger: ${xlOrBigger}`));
});
export const BASIC_COMPONENT_SECTIONS: MainPageSection[] = [
  {
    label: "HTML elements",
    id: "html",
    component: htmlSection,
  },
  {
    label: "Span",
    id: "span",
    component: spanSection,
  },
  {
    label: "Button",
    id: "button",
    component: buttonSection,
  },
  {
    label: "Icon",
    id: "icon",
    component: iconSection,
  },
  {
    label: "Dialog",
    id: "dialog",
    component: dialogSection,
  },
  {
    label: "Popup",
    id: "popup",
    component: popupSection,
  },
  {
    label: "Media query",
    id: "mediaQuery",
    component: mediaQuerySection,
  },
]
