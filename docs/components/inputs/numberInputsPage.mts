import { div, makeComponent, numberInput, sliderInput, span } from "../../../jsgui/out/jsgui.mts";

export const numberInputsPage = makeComponent("numberInputsPage", function() {
  // count
  const [count, setCount] = this.useLocalStorage("count", 0 as number | null);

  let row = this.append(div({className: "display-row"}));
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

  row = this.append(div({className: "display-row"}));
  row.append(span(`count: ${count}`));

  row = this.append(div({className: "display-row"}));
  row.append(sliderInput({
    range: [0, 100],
    value: count,
    onInput: (event) => {
      setCount(event.target.value);
    },
  }));
})
