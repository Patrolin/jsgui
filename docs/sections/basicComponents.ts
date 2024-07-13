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
  for (let size of SIZES) row.append(button(getSizeLabel(size), {size}));
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  for (let size of SIZES) row.append(button(getSizeLabel(size), {color: "secondary", size}));
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  for (let size of SIZES) row.append(button("Disabled", {disabled: true, size}));
});
const iconSection = makeComponent(function spanSection() {
  let row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(icon("link", {size}));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(loadingSpinner({size}));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) {
    const buttonWrapper = row.append(button("", {size, color: "secondary"}));
    buttonWrapper.append(icon("link", {size}));
    buttonWrapper.append(span(getSizeLabel(size)));
  }
  // TODO: circle buttons
});
const dialogSection = makeComponent(function dialogSection() {
  const state = this.useState({ dialogOpen: false });
  const openDialog = () => {
    state.dialogOpen = true;
    this.rerender();
  };
  const closeDialog = () => {
    state.dialogOpen = false;
    this.rerender();
  };
  this.append(button("Open dialog", { color: "secondary", onClick: openDialog }));
  const dialogWrapper = this.append(dialog({ open: state.dialogOpen, onClose: closeDialog, closeOnClickBackdrop: true }));
  dialogWrapper.append(span("Hello world"));
});
const popupSection = makeComponent(function popupSection() {
  for (let direction of ["up", "right", "mouse"] as PopupDirection[]) {
    const row = this.append(div({ className: "wideDisplayRow" }));
    const dialogWrapperA = row.append(popupWrapper({
      popupContent: span("Tiny"),
      direction,
    }));
    dialogWrapperA.append(span(`direction: "${direction}"`));
    const dialogWrapperB = row.append(popupWrapper({
      popupContent: span("I can be too big to naively fit on the screen!"),
      direction,
    }));
    dialogWrapperB.append(span(`direction: "${direction}"`));
  }
});
const mediaQuerySection = makeComponent(function mediaQuerySection() {
  const smOrBigger = this.useMedia({ minWidth: 600 });
  const mdOrBigger = this.useMedia({ minWidth: 900 });
  const lgOrBigger = this.useMedia({ minWidth: 1200 });
  const xlOrBigger = this.useMedia({ minWidth: 1500 });
  this.append(span(`smOrBigger: ${smOrBigger}`));
  this.append(span(`mdOrBigger: ${mdOrBigger}`));
  this.append(span(`lgOrBigger: ${lgOrBigger}`));
  this.append(span(`xlOrBigger: ${xlOrBigger}`));
});
const BASIC_COMPONENT_SECTIONS: MainPageSection[] = [
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
