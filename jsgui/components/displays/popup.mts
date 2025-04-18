import { div } from "../basics.mts";
import { addPx, BaseProps, clamp, Component, makeComponent, RenderReturn, SCROLLBAR_WIDTH } from "../../jsgui.mts";

// dialog
export type DialogProps = BaseProps & ({
  open: boolean;
  onClose?: () => void;
  closeOnClickBackdrop?: boolean;
});
export const dialog = makeComponent(function dialog(props: DialogProps): RenderReturn {
  const {open, onClose, closeOnClickBackdrop} = props;
  const [state] = this.useState({ prevOpen: false });
  const element = this.useNode(() => document.createElement("dialog"));
  element.onclick = (event) => {
    if (closeOnClickBackdrop && (event.target === element) && onClose) onClose();
  }
  return {
    onMount: () => {
      if (open !== state.prevOpen) {
        if (open) {
          element.showModal();
        } else {
          element.close();
        }
        state.prevOpen = open;
      }
    },
  };
});

// popup
export type PopupDirection = "up" | "right" | "down" | "left" | "mouse";
export function _getPopupLeftTop(direction: PopupDirection, props: {
  mouse: {x: number, y: number},
  wrapperRect: DOMRect,
  popupRect: DOMRect,
}) {
  const {mouse, popupRect, wrapperRect} = props;
  switch (direction) {
    case "up":
      return [
        wrapperRect.left + 0.5 * (wrapperRect.width - popupRect.width),
        wrapperRect.top - popupRect.height
      ];
    case "right":
      return [
        wrapperRect.left + wrapperRect.width,
        wrapperRect.top + 0.5 * (wrapperRect.height - popupRect.height)
      ];
    case "down":
      return [
        wrapperRect.left + 0.5 * (wrapperRect.width - popupRect.width),
        wrapperRect.top + wrapperRect.height
      ]
    case "left":
      return [
        wrapperRect.left - popupRect.width,
        wrapperRect.top + 0.5 * (wrapperRect.height - popupRect.height)
      ];
    case "mouse":
      return [
        mouse.x,
        mouse.y - popupRect.height
      ];
  }
}
export function _getPopupLeftTopWithFlipAndClamp(props: {
  direction: PopupDirection,
  mouse: {x: number, y: number},
  windowRight: number;
  windowBottom: number;
  wrapperRect: DOMRect,
  popupRect: DOMRect,
}) {
  let {direction, windowBottom, windowRight, popupRect} = props;
  // flip
  let [left, top] = _getPopupLeftTop(direction, props);
  switch (direction) {
    case "up":
      if (top < 0) {
        direction = "down";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    case "down": {
      const bottom = top + popupRect.height;
      if (bottom >= windowBottom) {
        direction = "up";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    }
    case "left":
      if (left < 0) {
        direction = "right";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    case "right": {
      const right = left + popupRect.width;
      if (right >= windowRight) {
        direction = "left";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    }
  }
  // clamp
  const maxLeft = windowRight - popupRect.width - SCROLLBAR_WIDTH;
  left = clamp(left, 0, maxLeft);
  const maxTop = windowBottom - popupRect.height - SCROLLBAR_WIDTH;
  top = clamp(top, 0, maxTop);
  return [left, top] as [number, number];
}
export type PopupWrapperProps = {
  content: Component;
  direction?: PopupDirection;
  // TODO: arrow?: boolean;
  /** NOTE: open on hover if undefined */
  open?: boolean;
  interactable?: boolean;
};
export const popupWrapper = makeComponent(function popupWrapper(props: PopupWrapperProps): RenderReturn {
  const {content, direction: _direction = "up", open, interactable = false} = props;
  const [state] = this.useState({mouse: {x: -1, y: -1}, open: false, prevOnScroll: null as EventListener | null});
  const wrapper = this.useNode(() => document.createElement("div"));
  const {windowBottom, windowRight} = this.useWindowResize(); // TODO: just add a window listener?
  const movePopup = () => {
    if (!state.open) return;
    const popupNode = popup._.prevNode as HTMLDivElement;
    const popupContentWrapperNode = popupContentWrapper._.prevNode as HTMLDivElement;
    const wrapperRect = wrapper.getBoundingClientRect();
    popupNode.style.left = "0px"; // NOTE: we move popup to top left to allow it to grow
    popupNode.style.top = "0px";
    const popupRect = popupContentWrapperNode.getBoundingClientRect();
    const [left, top] = _getPopupLeftTopWithFlipAndClamp({
      direction: _direction,
      mouse: state.mouse,
      popupRect,
      windowBottom,
      windowRight,
      wrapperRect
    });
    popupNode.style.left = addPx(left);
    popupNode.style.top = addPx(top);
  }
  const openPopup = () => {
    state.open = true;
    (popup._.prevNode as HTMLDivElement | null)?.showPopover();
    movePopup();
  }
  const closePopup = () => {
    state.open = false;
    (popup._.prevNode as HTMLDivElement | null)?.hidePopover();
  };
  if (open == null) {
    wrapper.onmouseenter = openPopup;
    wrapper.onmouseleave = closePopup;
  }
  if (_direction === "mouse") {
    wrapper.onmousemove = (event) => {
      state.mouse = {x: event.clientX, y: event.clientY};
      movePopup();
    }
  }
  const popup = this.append(div({
    className: "popup",
    attribute: {popover: "manual", dataInteractable: interactable},
  }));
  const popupContentWrapper = popup.append(div({className: "popup-content-wrapper"}));
  popupContentWrapper.append(content);
  return {
    onMount: () => {
      for (let acc = (this._.prevNode as ParentNode | null); acc != null; acc = acc.parentNode) {
        acc.removeEventListener("scroll", state.prevOnScroll);
        acc.addEventListener("scroll", movePopup, {passive: true});
      }
      state.prevOnScroll = movePopup;
      if (open == null) return;
      if (open != state.open) {
        if (open) {
          openPopup();
        } else {
          closePopup();
        }
      }
    },
    onUnmount: () => {
      for (let acc = (this._.prevNode as ParentNode | null); acc != null; acc = acc.parentNode) {
        acc.removeEventListener("scroll", state.prevOnScroll);
      }
    },
  };
});
