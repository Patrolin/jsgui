import { makeComponent, renderRoot, span } from "../jsgui/jsgui.mts";

const root = makeComponent(function root() {
  this.append(span("Hello world"));
});
renderRoot(root());
