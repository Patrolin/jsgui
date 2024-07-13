
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
const testKeysComponent = makeComponent(function testKeysComponent(_: BaseProps) {
  this.append(span(""));
});

const INPUT_SECTIONS: MainPageSection[] = [
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
