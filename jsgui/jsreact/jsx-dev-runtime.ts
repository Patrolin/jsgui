import { VNode } from "./jsgui.mts";

export function jsxDEV(type: VNode["type"], props: VNode["props"] | null): VNode {
  return { type, props: props ?? {} };
}
export const Fragment = undefined;
