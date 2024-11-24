import {BaseProps, clamp, div, makeComponent, numberInput, span, table, textInput} from '../../jsgui/out/jsgui.mts';
import {DocsSection} from '../utils/utils.mts';

const textInputPage = makeComponent(function textInputPage() {
  const [state, setState] = this.useState({username: ""});
  // username
  let row = this.append(div({className: "display-row", style: {marginTop: 6}}));
  row.append(
    textInput({
      label: "Username",
      value: state.username,
      onInput: (event) => {
        setState({username: event.target.value});
      },
      //autoFocus: true,
    })
  );
  row.append(span("This input is stored in the component state."));
  row = this.append(div({className: "display-row"}));
  row.append(span(`state: ${JSON.stringify(state)}`));
  // count
  row = this.append(div({className: "display-row"}));
  const [count, setCount] = this.useLocalStorage("count", 0 as number | null);
  row.append(
    numberInput({
      label: "Count",
      value: count,
      onInput: (event) => {
        const newCount = event.target.value;
        setCount(newCount === "" ? null : +newCount);
      },
      min: 0,
      clearable: false,
    })
  );
  row.append(span("This input is stored in local storage (synced across tabs and components)."));
  row = this.append(div({className: "display-row", style: {marginBottom: 4}}));
  row.append(span(`count: ${count}`));
});
const tablePage = makeComponent(function tablePage() {
  const displayRow = this.append(div({className: "wide-display-column"}));
  const [count, setCount] = this.useLocalStorage("count", 0 as number | null);
  displayRow.append(
    numberInput({
      label: "Count",
      value: count,
      onInput: (event) => {
        const newCount = event.target.value;
        setCount(newCount === "" ? null : +newCount);
        this.rerender();
      },
      min: 0,
      clearable: false,
    })
  );
  const rows = Array(clamp(+(count ?? 0), 0, 100))
    .fill(0)
    .map((_, i) => i);
  displayRow.append(
    table({
      label: "Stuff",
      rows,
      columns: [
        {
          label: "#",
          render: (props) => span(props.rowIndex + 1),
        },
        {
          label: "Name",
          render: (props) => span(`foo ${props.row}`),
        },
        {
          label: "Count",
          render: (props) => span(props.row),
        },
      ],
    })
  );
  if ((count ?? 0) % 2 === 0) {
    displayRow.append(testKeysComponent({key: "testKeysComponent"}));
  }
});
const testKeysComponent = makeComponent(function testKeysComponent(_: BaseProps = {}) {
  this.append(span(""));
});

export const INPUTS_SECTION: DocsSection = {
  id: "inputs",
  label: "Inputs",
  pages: [
    {id: "textInput", label: "Text Input", component: textInputPage},
    {id: "table", label: "Table", component: tablePage},
  ],
};
