const mainPage = makeComponent(function mainPage() {
  const wrapper = this.append(
    div({
      style: {display: "flex", flexDirection: "column", alignItems: "flex-start"},
    })
  );
  const state = this.useState({ username: "" });
  const [count, setCount] = this.useLocalStorage("count", 0 as number | null);
  // span
  wrapper.append(span("Span", {fontSize: "big", id: "text"}));
  // TODO: show code
  const makeTextRow = () => wrapper.append(div({style: {
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    //border: "1px solid black",
    borderRadius: 4,
  }}))
  let textRow = makeTextRow();
  textRow.append(span("Small", {fontSize: "small"}));
  textRow.append(span("Normal", {fontSize: "normal"}));
  textRow.append(span("Big", {fontSize: "big"}));
  textRow.append(span("Bigger", {fontSize: "bigger"}));
  textRow = makeTextRow();
  textRow.append(span("Link", {href: "https://www.google.com"}))
  // icon
  wrapper.append(span("Icon", {fontSize: "big", id: "text"}));
  textRow = makeTextRow();
  textRow.append(icon("link", {href: "https://www.google.com"}));
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
