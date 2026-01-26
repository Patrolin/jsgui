import { BaseProps, clamp, makeComponent, numberInput, span, table } from "../../../jsgui/out/jsgui.mts";

export const tablePage = makeComponent("tablePage", function() {
    const [count, setCount] = this.useLocalStorage("count", 0 as number | null);
    this.append(
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
    this.append(
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
      this.append(testKeysComponent({key: "testKeysComponent"}));
    }
  });
  const testKeysComponent = makeComponent("testKeysComponent", function(_: BaseProps = {}) {
    this.append(span(""));
  });
