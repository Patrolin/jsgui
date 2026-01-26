import { makeComponent, span } from "../../jsgui/out/jsgui.mts";

export const notFoundPage = makeComponent("notFoundPage", function() {
  this.append(span("Page not found"));
});
