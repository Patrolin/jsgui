import {audio, BASE_COLORS, button, COLOR_SHADES, coloredButton, dialog, div, icon, img, input, loadingSpinner, makeComponent, PopupDirection, popupWrapper, progress, SIZES, span, svg, video} from '../../jsgui/out/jsgui.mts';
import {getSizeLabel, MainPageSection} from '../utils/utils.mts';

const htmlSection = makeComponent(function htmlSection() {
  let column = this.append(div({className: "display-column", style: {gap: 4}}));
  let row = column.append(div({className: "display-row"}));
  row.append(span("span"));
  row.append(input({
    style: {height: 'var(--size-normal)'}, // TODO: make size a baseProp?
    attribute: {placeholder: "input"}},
  ));
  const someButton = row.append(button("button", {
    style: {height: 'var(--size-normal)', fontSize: "14px"},
  }));
  someButton.append(svg(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" />
    </svg>`, {style: {width: "1em", height: "1em"}}));
  row.append(img("assets/test_image.bmp", {style: {width: 24}, attribute: {title: "img"}}));
  row.append(audio("https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3", {attribute: {
    controls: true,
    title: "audio",
  }}));
  column.append(video([
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  ], {style: {height: 240}, attribute: {controls: true, title: "video"}}));
});
const spanSection = makeComponent(function spanSection() {
  for (let href of [undefined]) {
    let row = this.append(div({className: "display-row", style: {marginTop: -4, marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: "small", href}));
    row.append(span("Normal", {size: "normal", href}));
    row.append(span("Big", {size: "big", href}));
    row.append(span("Bigger", {size: "bigger", href}));
  }
  for (let baseColor of Object.keys(BASE_COLORS)) {
    let row = this.append(div({className: "display-row"}))
    for (let shade of COLOR_SHADES) {
      const color = shade ? `${baseColor}-${shade}` : baseColor;
      row.append(span(color, {color}));
    }
  }
});
const anchorSection = makeComponent(function anchorSection() {
  for (let href of ["https://www.google.com"]) {
    let row = this.append(div({className: "display-row", style: {marginTop: -4, marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: "small", href}));
    row.append(span("Normal", {size: "normal", href}));
    row.append(span("Big", {size: "big", href}));
    row.append(span("Bigger", {size: "bigger", href}));
  }
  for (let href of ["assets/test_image.bmp"]) {
    let row = this.append(div({className: "display-row", style: {marginTop: -4, marginBottom: href ? 4 : 0}}))
    row.append(span("download", {size: "small", href, download: "test_image.bmp"}));
  }
});
const buttonSection = makeComponent(function buttonSection() {
  let row = this.append(div({className: "display-row", style: {marginTop: -4}}));
  for (let size of Object.values(SIZES)) row.append(coloredButton(getSizeLabel(size), {size}));
  row = this.append(div({className: "display-row", style: {marginTop: 4}}));
  for (let size of Object.values(SIZES)) row.append(coloredButton(getSizeLabel(size), {color: "secondary", size}));
  row = this.append(div({className: "display-row", style: {marginTop: 4}}));
  for (let size of Object.values(SIZES)) row.append(coloredButton("Disabled", {disabled: true, size}));
});
const iconSection = makeComponent(function iconSection() {
  let row = this.append(div({className: "display-row", style: {marginTop: -4}}));
  for (let size of Object.values(SIZES)) row.append(icon("link", {size}));
  row = this.append(div({className: "display-row", style: {marginTop: -4}}));
  for (let size of Object.values(SIZES)) {
    const buttonWrapper = row.append(coloredButton("", {size, color: "secondary"}));
    buttonWrapper.append(icon("link", {size}));
    buttonWrapper.append(span(getSizeLabel(size)));
  }
  // TODO: circle buttons
});
const spinnerSection = makeComponent(function spinnerSection() {
  // loading spinner
  let row = this.append(div({className: "display-row", style: {marginTop: -4}}));
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
const dialogSection = makeComponent(function dialogSection() {
  const row = this.append(div({className: "display-row"}));
  const [state, setState] = this.useState({dialogOpen: false});
  const openDialog = () => setState({dialogOpen: true});
  const closeDialog = () => setState({dialogOpen: false});
  row.append(coloredButton("Open dialog", {color: "secondary", onClick: openDialog}));
  const dialogWrapper = row.append(dialog({open: state.dialogOpen, onClose: closeDialog, closeOnClickBackdrop: true}));
  dialogWrapper.append(span("Hello world"));
});
const popupSection = makeComponent(function popupSection() {
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
const mediaQuerySection = makeComponent(function mediaQuerySection() {
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
    label: "Anchor",
    id: "anchor",
    component: anchorSection,
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
    label: "Spinner",
    id: "spinner",
    component: spinnerSection,
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
];
