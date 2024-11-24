import { coloredButton, div, loadingSpinner, makeComponent, progress, SIZES } from "../../../jsgui/out/jsgui.mts";

export const progressPage = makeComponent(function progressPage() {
    // loading spinner
    let row = this.append(div({className: "display-row"}));
    for (let size of Object.values(SIZES)) row.append(loadingSpinner({size, color: 'secondary-1'}));
    // linear progress indeterminate
    row = this.append(div({className: "wide-display-row", style: {marginBottom: 4}}));
    row.append(progress({color: 'secondary-0'}));
    // linear progress determinate
    const [state, setState] = this.useState({ progress: 0.0 });
    row = this.append(div({className: "wide-display-row", style: {marginBottom: 4}}));
    row.append(progress({fraction: state.progress, color: 'secondary-0'}));
    row = this.append(div({className: "display-row", style: {marginTop: 0}}));
    row.append(coloredButton("progress = (progress + 0.2) % 1.2", {
        color: "secondary",
        onClick: () => {
            setState({progress: (state.progress + 0.2) % 1.2});
        }
    }));
});
