import { button, makeComponent, span } from "../../jsgui/out/jsgui.mts";

export const debugKeysPage = makeComponent("debugKeysPage", function() {
  const [state, setState] = this.useState({
    toggle: false,
  });
  this.append(button("Toggle", {events: {
    click: () => {
      setState({toggle: !state.toggle});
    }
  }}));
  if (state.toggle) {
    //this.append(span("wow"));
    this.append(span("wow", {key: undefined}));
    //this.append(span("wow", {key: null}));
    //this.append(span("wow", {key: ''}));
  }
});
