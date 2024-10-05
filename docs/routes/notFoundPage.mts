import { makeComponent, span } from "../../jsgui/out/jsgui.mts";

export const notFoundPage = makeComponent(function notFoundPage() {
  this.append(span("Page not found"));
});
