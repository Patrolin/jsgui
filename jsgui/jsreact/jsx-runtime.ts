import { VNode } from "./jsgui.mts";

export function jsx(type: VNode["type"], props: VNode["props"] | null): VNode {
  return { type, props: props ?? {} };
}
export const jsxs = jsx;
export const Fragment = undefined;
