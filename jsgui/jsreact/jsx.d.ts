import { BaseProps, VNode } from "./jsgui.mts"

export interface VNode {
  type: ElementType;
  props: Props;
}
type ElementType = FunctionComponent<any> | string | undefined;
export interface FunctionComponent<P = {}> {
  (props: P & BaseProps & { children?: Children }): VNode;
}
type Props = {
  children?: Children;
  [key: string]: any;
}
type Children = Child | Child[];
export type Child =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined

type JSXProps = BaseProps & {children?: Children};

declare global {
  namespace JSX {
    type Element = VNode;
    interface IntrinsicElements {
      [tagName: string]: JSXProps;
    }
  }
}
