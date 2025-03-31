import { div, makeComponent, span } from "../../../jsgui/out/jsgui.mts";

export const mediaQueryPage = makeComponent(function mediaQueryPage() {
    const column = this.append(div({className: "display-column"}));
    const smOrBigger = this.useMedia({minWidth: 600});
    column.append(span(`smOrBigger: ${smOrBigger}`));

    const mdOrBigger = this.useMedia({minWidth: 900});
    column.append(span(`mdOrBigger: ${mdOrBigger}`));

    const lgOrBigger = this.useMedia({minWidth: 1200});
    column.append(span(`lgOrBigger: ${lgOrBigger}`));

    const xlOrBigger = this.useMedia({minWidth: 1500});
    column.append(span(`xlOrBigger: ${xlOrBigger}`));
});
