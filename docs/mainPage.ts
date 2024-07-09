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
        row.append(span("Small", {size: "small", href}));
        row.append(span("Normal", {size: "normal", href}));
        row.append(span("Big", {size: "big", href}));
        row.append(span("Bigger", {size: "bigger", href}));
      }
    }
  },
  {
    label: "Icon",
    id: "icon",
    onRender: (wrapper: Component) => {
      let row = wrapper.append(div({className: "displayRow"}));
      row.append(icon("link", {size: "small"}));
      row.append(icon("link", {size: "normal"}));
      row.append(icon("link", {size: "big"}));
      row.append(icon("link", {size: "bigger"}));
      row = wrapper.append(div({className: "displayRow"}));
      for (let size of SIZES) {
        const itemWrapper = row.append(div());
        const label = size[0].toUpperCase() + size.slice(1);
        itemWrapper.append(span(label, {size}));
        itemWrapper.append(icon("link", {size}));
      }
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
    wrapper.append(span(section.label, {size: "big", selfLink: section.id}));
    section.onRender(wrapper); // TODO: show code
  }
  // text input
  wrapper.append(span("Text Input", {size: "big", selfLink: "textInput"}));
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
  wrapper.append(span("Foo", { selfLink: "foo" }));
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
  wrapper.append(span("Bar", { selfLink: "bar" }));
  wrapper.append(loadingSpinner());
});
const someComponent = makeComponent(function someComponent(_props) {
  const lgOrBigger = this.useMedia({ minWidth: 1200 });
  this.append(span(`lgOrBigger: ${lgOrBigger}`));
});
