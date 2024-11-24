import {div, makeComponent, numberInput, span, textInput} from '../../../jsgui/out/jsgui.mts';

export const textInputPage = makeComponent(function textInputPage() {
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
