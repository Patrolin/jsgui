type MainPageSection = {
  label: string;
  id: string;
  onRender: (wrapper: Component) => void;
}
const MAIN_PAGE_SECTIONS: MainPageSection[] = [
  {
    label: "Span",
    id: "span",
    onRender: (wrapper: Component) => { // TODO: refactor to actual components
      for (let href of [undefined, "https://www.google.com"]) {
        let row = wrapper.append(div({className: "displayRow"}))
        row.append(span("Small", {fontSize: "small", href}));
        row.append(span("Normal", {fontSize: "normal", href}));
        row.append(span("Big", {fontSize: "big", href}));
        row.append(span("Bigger", {fontSize: "bigger", href}));
      }
    }
  },
  {
    label: "Icon",
    id: "icon",
    onRender: (wrapper: Component) => {
      let row = wrapper.append(div({className: "displayRow"}));
      row.append(icon("link", {fontSize: "small"}));
      row.append(icon("link", {fontSize: "normal"}));
      row.append(icon("link", {fontSize: "big"}));
      row.append(icon("link", {fontSize: "bigger"}));
      row = wrapper.append(div({className: "displayRow"}));
      row.append(icon("link", {fontSize: "small", fontSizeOffset: 2})); // TODO: refactor to iconSize
      row.append(icon("link", {fontSize: "normal", fontSizeOffset: 2}));
      row.append(icon("link", {fontSize: "big", fontSizeOffset: 2}));
    }
  },
];

const mainPage = makeComponent(function mainPage() {
  const wrapper = this.append(
    div({
      style: {display: "flex", flexDirection: "column", alignItems: "flex-start"},
    })
  );
  const state = this.useState({ username: "" });
  const [count, setCount] = this.useLocalStorage("count", 0 as number | null);
  for (let section of MAIN_PAGE_SECTIONS) {
    wrapper.append(span(section.label, {fontSize: "big", id: section.id}));
    section.onRender(wrapper); // TODO: show code
  }
  // text input
  wrapper.append(span("Text Input", {fontSize: "big", id: "textInput"}));
  wrapper.append(
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
  wrapper.append(
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
  wrapper.append(span(`state: ${JSON.stringify(state)}`));
  wrapper.append(span("Foo", { id: "foo" }));
  wrapper.append(span("link to bar", { href: "#bar" }));
  const rows = Array(+(count ?? 0))
    .fill(0)
    .map((_, i) => i);
  wrapper.append(
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
    wrapper.append(someComponent({ key: "someComponent" }));
  }
  wrapper.append(span("Bar", { id: "bar" }));
  wrapper.append(loadingSpinner());
});
const someComponent = makeComponent(function someComponent(_props) {
  const lgOrBigger = this.useMedia({ minWidth: 1200 });
  this.append(span(`lgOrBigger: ${lgOrBigger}`));
});
