import { Component, makeComponent } from "../jsgui.mts";
import { Child, FunctionComponent, VNode } from "./jsx";

export * from "../jsgui.mts"

export type FC<T = {}> = FunctionComponent<T>;
function appendJsxChild(parent: Component, child: Child) {
  if (child != null) {
    if (typeof child === "object") {
      parent.append(jsxToComponent(child as VNode));
    } else {
      parent.append(String(child));
    }
  }
}
export const jsxToComponent = makeComponent("", function(vnode: VNode) {
  let {type, props} = vnode;
  if (typeof type === "function") {
    const newElement = type(props);
    type = newElement.type;
    props = newElement.props;
  }
  if (type) {
    this.useNode(() => document.createElement(type as keyof HTMLElementTagNameMap));
    this.baseProps = {...this.baseProps, ...props};
  }
  const {children} = props;
  if (Array.isArray(children)) {
    for (let c of children) {
      appendJsxChild(this, c);
    }
  } else if (children != null) {
    appendJsxChild(this, children);
  }
  return {name: type as string, events: props.events};
});
