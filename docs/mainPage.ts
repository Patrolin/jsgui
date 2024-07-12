function getSizeLabel(size: string) {
  return size[0].toUpperCase() + size.slice(1);
}
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
});
const textInputSection = makeComponent(function textInputSection() {
  const state = this.useState({ username: "" });
  // username
  let row = this.append(div({className: "displayRow", style: {marginTop: 6}}));
  row.append(
    textInput({
      label: "Username",
      value: state.username,
      onInput: (newUsername: string) => {
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
  const [count, setCount] = this.useLocalStorage("count", 0 as number | null);
  row.append(
    numberInput({
      label: "Count",
      value: count,
      onInput: (newCount: string) => {
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
  const [count] = this.useLocalStorage("count", 0 as number | null);
  const rows = Array(+(count ?? 0))
    .fill(0)
    .map((_, i) => i);
  this.append(
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
    //this.append(testKeysComponent({ key: "testKeysComponent" }));
  }
});
const testKeysComponent = makeComponent(function testKeysComponent(_: BaseProps) {
  this.append(span(""));
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
  dialogWrapper.append(span("hello world"));
});

type MainPageSection = {
  label: string;
  id: string;
  component: ComponentFunction<[]>;
}
const MAIN_PAGE_SECTIONS: MainPageSection[] = [
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
    label: "Text input",
    id: "textInput",
    component: textInputSection,
  },
  {
    label: "Table",
    id: "table",
    component: tableSection,
  },
  {
    label: "Media query",
    id: "mediaQuery",
    component: mediaQuerySection,
  },
  {
    label: "Dialog",
    id: "dialog",
    component: dialogSection,
  }
];

const mainPage = makeComponent(function mainPage() {
  const wrapper = this.append(
    div({
      style: {display: "flex", flexDirection: "column", alignItems: "flex-start"},
    })
  );
  wrapper.append(span(`version: ${JSGUI_VERSION}`, {size: "small", selfLink: "", id: "version"}));
  for (let section of MAIN_PAGE_SECTIONS) {
    wrapper.append(span(section.label, {size: "big", selfLink: section.id}));
    wrapper.append(section.component());
    // TODO!: show the code
  }
});
