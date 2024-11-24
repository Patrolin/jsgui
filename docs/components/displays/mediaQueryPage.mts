import { div, makeComponent, span } from "../../../jsgui/out/jsgui.mts";

export const mediaQueryPage = makeComponent(function mediaQueryPage() {
    const smOrBigger = this.useMedia({minWidth: 600});
    const mdOrBigger = this.useMedia({minWidth: 900});
    const lgOrBigger = this.useMedia({minWidth: 1200});
    const xlOrBigger = this.useMedia({minWidth: 1500});
    const column = this.append(div({className: "display-column"}));
    column.append(span(`smOrBigger: ${smOrBigger}`));
    column.append(span(`mdOrBigger: ${mdOrBigger}`));
    column.append(span(`lgOrBigger: ${lgOrBigger}`));
    column.append(span(`xlOrBigger: ${xlOrBigger}`));
});
