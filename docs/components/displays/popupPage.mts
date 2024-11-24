import { coloredButton, div, makeComponent, PopupDirection, popupWrapper, span } from "../../../jsgui/out/jsgui.mts";

export const popupPage = makeComponent(function popupPage() {
    for (let direction of ["up", "right", "down", "left", "mouse"] as PopupDirection[]) {
        const row = this.append(div({className: "wide-display-row"}));
        const leftPopup = row.append(popupWrapper({
            content: span("Tiny"),
            direction,
            interactable: direction !== "mouse",
        }));
        leftPopup.append(span(`direction: "${direction}"`));
        const rightPopup = row.append(popupWrapper({
            content: span("I can be too big to naively fit on the screen!"),
            direction,
            interactable: direction !== "mouse",
        }));
        rightPopup.append(span(`direction: "${direction}"`));
    }
    const [state, setState] = this.useState({buttonPopupOpen: false});
    const row = this.append(div({className: "wide-display-row"}));
    const popup = row.append(popupWrapper({
        content: span("Tiny"),
        direction: "down",
        open: state.buttonPopupOpen,
        interactable: true,
    }));
    popup.append(coloredButton(`Toggle popup`, {
        onClick: () => {
            setState({buttonPopupOpen: !state.buttonPopupOpen});
        },
    }));
});
