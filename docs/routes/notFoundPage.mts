import { makeComponent, span } from "../../jsgui/jsgui.mts";

export const notFoundPage = makeComponent(function notFoundPage() {
  this.append(span("Page not found"));
});
