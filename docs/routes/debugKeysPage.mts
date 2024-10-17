import { button, makeComponent, span } from "../../jsgui/out/jsgui.mts";

export const debugKeysPage = makeComponent(function debugKeysPage() {
  const state = this.useState({
    toggle: false,
  });
  this.append(button("Toggle", {events: {
    click: () => {
      state.toggle = !state.toggle;
      this.rerender();
    }
  }}));
  if (state.toggle) {
    //this.append(span("wow"));
    this.append(span("wow", {key: undefined}));
    //this.append(span("wow", {key: null}));
    //this.append(span("wow", {key: ''}));
  }
});
