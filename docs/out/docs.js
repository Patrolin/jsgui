/* mainPage.ts */
const MAIN_PAGE_SECTIONS/*: MainPageSection[] */= [
  ...BASIC_COMPONENT_SECTIONS,
  ...INPUT_SECTIONS,
];
const mainPage = makeComponent(function mainPage() {
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
    const row = wrapper.append(div({className: "displayRow"}));
    const onRender = component.onRender;
    const codeString = `const ${onRender.name} = makeComponent(${onRender});`;
    row.append(code(codeString, {style: {
      margin: "8px 0",
      padding: "3px 6px 4px 6px",
      background: "rgba(0, 0, 0, 0.1)",
      borderRadius: 4,
    }}));
  }
});
/* notFoundPage.ts */
const notFoundPage = makeComponent(function notFoundPage() {
  this.append(span("Page not found"));
});
/* routes.ts */
const GITHUB_PAGES_PREFIX = "(/jsgui)?";
const ROUTES = [
  {
    path: `${GITHUB_PAGES_PREFIX}/`,
    defaultPath: "/#version",
    component: () => mainPage(),
    wrapper: true,
    showInNavigation: true,
    label: "Docs",
  },
  {
    path: `${GITHUB_PAGES_PREFIX}/themeCreator`,
    defaultPath: "/themeCreator",
    component: () => themeCreatorPage(),
    wrapper: true,
    showInNavigation: true,
    label: "Theme creator",
  },
];
const root = makeComponent(function root() {
  this.append(
    router({
      pageWrapperComponent: pageWrapper,
      routes: ROUTES,
      notFoundRoute: {
        component: () => notFoundPage(),
      },
    })
  );
});
const pageWrapper = makeComponent(function pageWrapper(props/*: PageWrapperProps*/) {
  const {routes, currentRoute, contentWrapperComponent} = props;
  const isGithubPages = window.location.pathname.startsWith("/jsgui");
  const githubPagesPrefix = isGithubPages ? `/jsgui` : "";
  const wrapper = this.append(div({
    style: {
      height: "100%",
      display: "flex",
      alignItems: "stretch",
    },
  }));
  const navigation = wrapper.append(div({
    className: "navMenu", // TODO: styles
    style: {display: "flex", flexDirection: "column"},
  }));
  const appendRoute = (route/*: Route*/) => {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: `${githubPagesPrefix}${route.defaultPath ?? route.path}` }));
    }
  }
  const docsRoute = ROUTES[0];
  appendRoute(docsRoute);
  navigation.append(divider());
  for (let section of MAIN_PAGE_SECTIONS) {
    navigation.append(span(section.label, {href: `${githubPagesPrefix}/#${section.id}`}));
  }
  navigation.append(divider());
  for (let route of routes.slice(1)) {
    appendRoute(route);
  }
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component());
})
renderRoot(root());
/* themeCreatorPage.ts */
const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const state = this.useState({
    color: '#1450a0',
    count: 7,
  });
  this.append(textInput({
    value: state.color,
    allowString: (value, prevAllowedValue) => {
      return value.match("#[0-9a-zA-Z]{6}") ? value : prevAllowedValue;
    },
    onChange: (newValue) => {
      state.color = newValue;
      this.rerender();
    },
    label: 'Color',
  }));
  this.append(numberInput({
    value: state.count,
    min: 0,
    onChange: (newValue) => {
      state.count = +newValue;
      this.rerender();
    },
    label: 'Count',
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Exponential",
    alphaFunction: (i, N) => {
      return 2 - 2**(i/N);
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Chebyshev roots",
    alphaFunction: (i, N) => (Math.cos(Math.PI*i / N) + 1) / 2,
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "lerp(Chebyshev, linear)",
    alphaFunction: (i, N) => {
      const v = (Math.cos(Math.PI*i / N) + 1) / 2;
      return lerp(i/(N-1), v, (N-i)/N)
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "linear",
    alphaFunction: (i, N) => {
      return (N-i)/N;
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Sigmoid",
    alphaFunction: (i, N) => {
      const v = (i / (0.59*N));
      return Math.exp(-v*v);
    },
  }));
});
/* type ColorPaletteProps = BaseProps & {
  color: string;
  count: number;
  name: string;
  alphaFunction: (i: number, count: number) => number;
}; */
const colorPalette = makeComponent(function colorPalette(props/*: ColorPaletteProps*/) {
  const {color, count, name, alphaFunction} = props;
  this.append(span(name, {style: {marginTop: 4}}));
  // color
  const appendColorRow = (color/*: string*/) => {
    const colorRow = this.append(div({
      style: {display: "flex"},
    }));
    for (let i = 0; i < count; i++) {
      const colorRgb = rgbFromHexString(color);
      const alpha = alphaFunction(i, count);
      colorRow.append(div({
        key: `box-${i}`,
        style: {
          width: 30,
          height: 24,
          background: `rgba(${colorRgb}, ${alpha})`,
        },
      }));
    }
    for (let i = 0; i < count; i++) {
      const colorRgb = rgbFromHexString(color);
      const alpha = alphaFunction(i, count);
      colorRow.append(span("text", {
        key: `text-${i}`,
        style: {
          width: 30,
          textAlign: "right",
          color: `rgba(${colorRgb}, ${alpha})`,
        },
      }));
    }
  }
  appendColorRow(color);
  appendColorRow("#000000");
});
/* utils.ts */
/* type MainPageSection = {
  label: string;
  id: string;
  component: ComponentFunction<[]>;
}
function getSizeLabel(size: string) {
  return size[0].toUpperCase() + size.slice(1);
}
/* basicComponents.ts *//*
const htmlSection = makeComponent(function htmlSection() {
  let column = this.append(div({className: "displayColumn", style: {gap: 4}}));
  column.append(span("span"));
  column.append(input());
  const someButton = column.append(button("Button", {style: {fontSize: "14px"}}));
  someButton.append(svg(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" />
    </svg>`, {style: {width: "1em", height: "1em"}}));
}); */
const spanSection = makeComponent(function spanSection() {
  for (let href of [undefined, "https/*://www.google.com"*/]) {
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
  for (let direction of ["up", "right", "down", "left", "mouse"] /* as PopupDirection[] */) {
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
const BASIC_COMPONENT_SECTIONS/*: MainPageSection[] */= [
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
/* inputs.ts */
const textInputSection = makeComponent(function textInputSection() {
  const state = this.useState({ username: "" });
  // username
  let row = this.append(div({className: "displayRow", style: {marginTop: 6}}));
  row.append(
    textInput({
      label: "Username",
      value: state.username,
      onInput: (newUsername/*: string*/) => {
        state.username = newUsername;
        this.rerender();
      },
      autoFocus: true,
    })
  );
  row.append(span("This input is stored in the component state."));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  row.append(span(`state: ${JSON.stringify(state)}`));
  // count
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  const [count, setCount] = this.useLocalStorage("count", 0 /* as number | null */);
  row.append(
    numberInput({
      label: "Count",
      value: count,
      onInput: (newCount/*: string*/) => {
        setCount(newCount === "" ? null : +newCount);
        this.rerender();
      },
      min: 0,
      clearable: false,
    })
  );
  row.append(span("This input is stored in local storage (synced across tabs and components)."));
  row = this.append(div({className: "displayRow", style: {marginTop: -4, marginBottom: 4}}));
  row.append(span(`count: ${count}`));
});
const tableSection = makeComponent(function tableSection() {
  const [count] = this.useLocalStorage("count", 0 /* as number | null */);
  const rows = Array(+(count ?? 0))
    .fill(0)
    .map((_, i) => i);
  const displayRow = this.append(div({ className: "wideDisplayRow" }));
  displayRow.append(
    table({
      label: "Stuff",
      rows,
      columns: [
        {
          label: "#",
          onRender: (props) => span(props.rowIndex + 1),
        },
        {
          label: "Name",
          onRender: (props) => span(`foo ${props.row}`),
        },
        {
          label: "Count",
          onRender: (props) => span(props.row),
        },
      ],
    })
  );
  if ((count ?? 0) % 2 === 0) {
    displayRow.append(testKeysComponent({ key: "testKeysComponent" }));
  }
});
const testKeysComponent = makeComponent(function testKeysComponent(_/*: BaseProps*/) {
  this.append(span(""));
});

const INPUT_SECTIONS/*: MainPageSection[] */= [
  {
    label: "Text input",
    id: "textInput",
    component: textInputSection,
  },
  {
    label: "Table",
    id: "table",
    component: tableSection,
  },
];
