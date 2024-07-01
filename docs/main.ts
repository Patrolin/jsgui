const mainPage = makeComponent(function root() {
  const state = this.useState({ username: "" });
  const [count, setCount] = this.useLocalStorage("count", 0 as number | null);
  const wrapper = this.append(
    div({
      style: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
    })
  );
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
          onRender: (props: any) => span(props.rowIndex + 1),
        },
        {
          label: "Name",
          onRender: (props: any) => span(`foo ${props.row}`),
        },
        {
          label: "Count",
          onRender: (props: any) => span(props.row),
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
