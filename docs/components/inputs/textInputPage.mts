import {div, makeComponent, numberInput, span, textInput} from '../../../jsgui/out/jsgui.mts';

export const textInputPage = makeComponent("textInputPage", function() {
  // username
  const [state, setState] = this.useState({username: ""});

  let row = this.append(div({className: "display-row"}));
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
});
