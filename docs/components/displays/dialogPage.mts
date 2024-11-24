import { coloredButton, dialog, div, makeComponent, span } from "../../../jsgui/out/jsgui.mts";

export const dialogPage = makeComponent(function dialogPage() {
    const row = this.append(div({className: "display-row", style: {marginTop: 2}}));
    const [state, setState] = this.useState({dialogOpen: false});
    const openDialog = () => setState({dialogOpen: true});
    const closeDialog = () => setState({dialogOpen: false});
    row.append(coloredButton("Open dialog", {color: "secondary", onClick: openDialog}));
    const dialogWrapper = row.append(dialog({open: state.dialogOpen, onClose: closeDialog, closeOnClickBackdrop: true}));
    dialogWrapper.append(span("Hello world"));
});
