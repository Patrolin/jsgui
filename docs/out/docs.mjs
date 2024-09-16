/* jsgui.mts */
// utils
export const JSGUI_VERSION = "v0.10-dev";
export function parseJsonOrNull(jsonString/*: string*/)/*: JSONValue*/ {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}
export function camelCaseToKebabCase(key/*: string*/) {
  return (key.match(/[A-Z][a-z]*|[a-z]+/g) ?? []).map(v => v.toLowerCase()).join("-");
}
export function removePrefix(value/*: string*/, prefix/*: string*/)/*: string*/ {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
export function removeSuffix(value/*: string*/, prefix/*: string*/)/*: string*/ {
  return value.endsWith(prefix) ? value.slice(value.length - prefix.length) : value;
}
export function addPx(value/*: string | number*/) {
  return (value?.constructor?.name === "Number") ? `${value}px` : value/* as string*/;
}
export function lerp(value/*: number*/, x/*: number*/, y/*: number*/)/*: number*/ {
  return (1-value)*x + value*y;
}
/** clamp value between min and max (defaulting to min) */
export function clamp(value/*: number*/, min/*: number*/, max/*: number*/)/*: number*/ {
  return Math.max(min, Math.min(value, max));
}
export function rgbFromHexString(hexString/*: string*/)/*: string*/ {
  let hexString2 = removePrefix(hexString.trim(), '#');
  return `${parseInt(hexString2.slice(0, 2), 16)}, ${parseInt(hexString2.slice(2, 4), 16)}, ${parseInt(hexString2.slice(4, 6), 16)}`;
}
/*export type Nullsy = undefined | null;*/
/*export type StringMap<T = any> = Record<string, T>;*/
/*export type JSONValue = string | number | any[] | StringMap | null;*/
/*export type ParentNodeType = HTMLElement | SVGSVGElement;*/
/*export type NodeType = ParentNodeType | Text;*/
/*export type EventWithTarget<T = Event, E = HTMLInputElement> = T & {target: E};*/
/*export type InputEventWithTarget = EventWithTarget<InputEvent>;*/
/*export type ChangeEventWithTarget = EventWithTarget<Event>;*/
/*export type _EventListener<T = Event> = ((event: T) => void);*/
/*export type EventsMap = Partial<Record<"click" | "dblclick" | "mouseup" | "mousedown", _EventListener<MouseEvent>>
  & Record<"touchstart" | "touchend" | "touchmove" | "touchcancel", _EventListener<TouchEvent>>
  & Record<"focus" | "blur" | "focusin" | "focusout", _EventListener<FocusEvent>>
  & Record<"keydown" | "keypress" | "keyup", _EventListener<KeyboardEvent>>
  & Record<"scroll", _EventListener<WheelEvent>>
  & Record<"beforeinput" | "input", _EventListener<InputEventWithTarget>>
  & Record<"compositionstart" | "compositionend" | "compositionupdate", _EventListener<CompositionEvent>>
  & Record<"change", _EventListener<ChangeEventWithTarget>>
  & Record<string, _EventListener>>;*/
/*export type UndoPartial<T> = T extends Partial<infer R> ? R : T;*/
/*export type Diff<T> = {
  key: string;
  oldValue: T;
  newValue: T;
};*/
export function getDiff/*<T>*/(oldValue/*: StringMap<T>*/, newValue/*: StringMap<T>*/)/*: Diff<T>[]*/ {
  const diffMap/*: StringMap<Partial<Diff<T>>>*/ = {};
  for (let [k, v] of Object.entries(oldValue)) {
    let d = diffMap[k] ?? {key: k};
    d.oldValue = v;
    diffMap[k] = d;
  }
  for (let [k, v] of Object.entries(newValue)) {
    let d = diffMap[k] ?? {key: k};
    d.newValue = v;
    diffMap[k] = d;
  }
  return (Object.values(diffMap)/* as Diff<T>[]*/).filter(v => v.newValue !== v.oldValue);
}
export function getDiffArray(oldValues/*: string[]*/, newValues/*: string[]*/)/*: Diff<string>[]*/ {
  const diffMap/*: StringMap<Partial<Diff<string>>>*/ = {};
  for (let k of oldValues) {
    let d = diffMap[k] ?? {key: k};
    d.oldValue = k;
    diffMap[k] = d;
  }
  for (let k of newValues) {
    let d = diffMap[k] ?? {key: k};
    d.newValue = k;
    diffMap[k] = d;
  }
  return (Object.values(diffMap)/* as Diff<string>[]*/).filter(v => v.newValue !== v.oldValue);
}

// NOTE: tsc is stupid and removes comments before types
/*export type ComponentFunction<T extends any[]> = (...argsOrProps: T) => Component;*/
/*export type ComponentOptions = {
  name?: string;
};*/
/*export type BaseProps = {
  key?: string | number;
  attribute?: StringMap<string | number | boolean>;
  cssVars?: StringMap<string | number | undefined>;
  className?: string | string[];
  style?: StringMap<string | number | undefined>;
  events?: EventsMap;
};*/
/*export type RenderedBaseProps = UndoPartial<Omit<BaseProps, "key" | "className">> & {key?: string, className: string[]};*/
/*export type RenderReturn = void | {
  onMount?: () => void,
  onUnmount?: () => void,
};*/
/*export type RenderFunction<T extends any[]> = (this: Component, ...argsOrProps: T) => RenderReturn;*/
/*export type GetErrorsFunction<K extends string> = (errors: Partial<Record<K, string>>) => void;*/
/*export type NavigateFunction = (url: string) => void;*/
/*export type UseNavigate = {
  /** add url to history and reload page *//*
  pushRoute: NavigateFunction;
  /** replace url in history and reload page *//*
  replaceRoute: NavigateFunction;
  /** add url to history *//*
  pushHistory: NavigateFunction;
  /** replace url in history *//*
  replaceHistory: NavigateFunction;
};*/
/*export type UseWindowResize = { windowBottom: number, windowRight: number };*/
// component
export function _setChildKey(component/*: Component*/, child/*: Component*/) {
  const name = child.name;
  let key = child.baseProps.key;
  if (key == null) {
    if (name === "text") {
      key = `text-${component.indexedTextCount++}`;
    } else {
      key = `${name}-${component.indexedChildCount++}`;
    }
  }
  child.key = key;
}
export class Component {
  // props
  name/*: string*/;
  args/*: any[]*/;
  baseProps/*: RenderedBaseProps*/;
  props/*: StringMap*/;
  children/*: Component[]*/;
  onRender/*: RenderFunction<any[]>*/;
  options/*: ComponentOptions*/;
  // metadata
  _/*: ComponentMetadata | RootComponentMetadata*/;
  key/*: string*/;
  // hooks
  node/*: NodeType | null*/;
  indexedChildCount/*: number*/;
  indexedTextCount/*: number*/;
  constructor(onRender/*: RenderFunction<any[]>*/, args/*: any[]*/, baseProps/*: RenderedBaseProps*/, props/*: StringMap*/, options/*: ComponentOptions*/) {
    this.name = options.name ?? onRender.name;
    if (!this.name && (options.name !== "")) throw `Function name cannot be empty: ${onRender}`;
    this.args = args
    this.baseProps = baseProps;
    this.props = props;
    this.children = [];
    this.onRender = onRender;
    this.options = options;
    // metadata
    this._ = null/* as any*/;
    this.key = "";
    // hooks
    this.node = null;
    this.indexedChildCount = 0;
    this.indexedTextCount = 0;
  }
  useNode/*<T extends NodeType>*/(defaultNode/*: T*/)/*: T*/ {
    return (this.node = (this._?.prevNode ?? defaultNode))/* as T*/;
  }
  append(childOrString/*: string | Component*/)/*: Component*/ {
    const child = (childOrString instanceof Component) ? childOrString : text(childOrString);
    this.children.push(child);
    _setChildKey(this, child);
    return child;
  }
  useState/*<T extends object>*/(defaultState/*: T*/)/*: T*/ {
    const {_} = this;
    if (!_.stateIsInitialized) {
      _.state = defaultState;
      _.stateIsInitialized = true;
    }
    return _.state/* as T*/;
  }
  useValidate/*<K extends string>*/(getErrors/*: GetErrorsFunction<K>*/) {
    return () => {
      let errors/*: Partial<Record<K, string>>*/ = {};
      getErrors(errors);
      const {state} = this._;
      state.errors = errors;
      state.didValidate = true;
      const hasErrors = Object.keys(errors).length > 0;
      if (hasErrors) {
        this.rerender();
      }
      return !hasErrors;
    }
  }
  // dispatch
  useMedia(mediaQuery/*: StringMap<string | number>*/) { // TODO: add types
    const key = Object.entries(mediaQuery).map(([k, v]) => `(${camelCaseToKebabCase(k)}: ${addPx(v)})`).join(' and ');
    const dispatchTarget = _dispatchTargets.media.addDispatchTarget(key);
    dispatchTarget.addComponent(this);
    return dispatchTarget.state.matches; // TODO: this forces recalculate style (4.69 ms), cache value so this doesn't happen?
  }
  useLocalStorage/*<T>*/(key/*: string*/, defaultValue/*: T*/)/*: [T, (newValue: T) => void, (newValue: T) => void]*/ {
    _dispatchTargets.localStorage.addComponent(this);
    const value = (parseJsonOrNull(localStorage[key])/* as [T] | null*/)?.[0] ?? defaultValue;
    const setValue = (newValue/*: T*/) => {
      localStorage.setItem(key, JSON.stringify([newValue]));
    }
    const setValueAndDispatch = (newValue/*: T*/) => {
      setValue(newValue);
      if (JSON.stringify([newValue]) !== localStorage[key]) {
        _dispatchTargets.localStorage.dispatch();
      }
    }
    return [value, setValue, setValueAndDispatch];
  }
  useLocationHash()/*: string*/ { // TODO: add useLocation
    _dispatchTargets.locationHash.addComponent(this);
    return window.location.hash;
  }
  useWindowResize()/*: UseWindowResize*/ {
    _dispatchTargets.windowResize.addComponent(this);
    return { windowBottom: window.innerHeight, windowRight: window.innerWidth };
  }
  useNavigate()/*: UseNavigate*/ {
    return {
      pushRoute: (url/*: string*/) => location.href = url, // add url to history and reload page
      replaceRoute: (url/*: string*/) => location.replace(url), // replace url in history and reload page
      pushHistory: (url/*: string*/) => history.pushState(null, "", url), // add url to history
      replaceHistory: (url/*: string*/) => history.replaceState(null, "", url), // replace url in history
    }
  }
  rerender() {
    const root_ = this._.root;
    const rootComponent = root_.component;
    const newGcFlag = !root_.gcFlag;
    if (!root_.willRerenderNextFrame) {
      root_.willRerenderNextFrame = true;
      requestAnimationFrame(() => {
        const newRootComponent = _copyComponent(rootComponent);
        newRootComponent._ = root_;
        root_.gcFlag = newGcFlag;
        root_.component = newRootComponent;
        _render(newRootComponent, root_.parentNode);
        _unloadUnusedComponents(rootComponent, newGcFlag);
        root_.willRerenderNextFrame = false;
      });
    }
  }
  _findByName(name/*: string*/)/*: Component | undefined*/ {
    if (this.name === name) return this;
    return this.children.map(v => v._findByName(name)).filter(v => v)[0];
  }
  _logByName(name/*: string*/) {
    const component = this._findByName(name);
    console.log({ ...(component ?? {}), _: {...(component?._ ?? {})} });
  }
}
export function makeComponent/*<A extends Parameters<any>>*/(onRender/*: RenderFunction<A>*/, options/*: ComponentOptions*/ = {})/*: ComponentFunction<A>*/ {
  return (...argsOrProps/*: any[]*/) => {
    const argCount = (onRender+"").split("{")[0].split(",").length; // NOTE: allow multiple default arguments
    const args = new Array(argCount).fill(undefined);
    for (let i = 0; i < argsOrProps.length; i++) {
      args[i] = argsOrProps[i];
    }
    const propsAndBaseProps = (argsOrProps[argCount - 1] ?? {})/* as BaseProps & StringMap*/;
    const {key, style = {}, attribute = {}, className: className, cssVars = {}, events = {}/* as EventsMap*/, ...props} = propsAndBaseProps;
    const baseProps/*: RenderedBaseProps*/ = {
      key: (key != null) ? String(key) : undefined,
      style,
      attribute,
      className: Array.isArray(className) ? className : (className ?? "").split(" ").filter(v => v),
      cssVars,
      events,
    };
    return new Component(onRender, args, baseProps, props, options);
  }
}
export function _copyComponent(component/*: Component*/) {
  const newComponent = new Component(component.onRender, component.args, component.baseProps, component.props, component.options);
  newComponent._ = component._;
  return newComponent;
}

/*export type DispatchTargetAddListeners = (dispatch: () => void) => any;*/
// dispatch
export class DispatchTarget {
  components/*: Component[]*/;
  state/*: any*/;
  constructor(addListeners/*: DispatchTargetAddListeners*/ = () => {}) {
    this.components = [];
    this.state = addListeners(() => this.dispatch());
  }
  addComponent(component/*: Component*/) {
    this.components.push(component);
  }
  removeComponent(component/*: Component*/) {
    const i = this.components.indexOf(component);
    if (i !== -1) this.components.splice(i, 1);
  }
  dispatch() {
    for (let component of this.components) {
      component.rerender();
    }
  }
}
export class DispatchTargetMap {
  data/*: StringMap<DispatchTarget>*/;
  addListeners/*: (key: string) => DispatchTargetAddListeners*/;
  constructor(addListeners/*: (key: string) => DispatchTargetAddListeners*/) {
    this.data = {};
    this.addListeners = addListeners;
  }
  addDispatchTarget(key/*: string*/) {
    const {data, addListeners} = this;
    const oldDT = data[key];
    if (oldDT != null) return oldDT;
    const newDT = new DispatchTarget(addListeners(key));
    data[key] = newDT;
    return newDT;
  }
  removeComponent(component/*: Component*/) {
    for (let key in this.data) {
      this.data[key].removeComponent(component);
    }
  }
}
/*export type AddDispatchTarget = {
  map: StringMap<DispatchTarget>;
  key: string;
  addListeners: DispatchTargetAddListeners;
};*/
export const _dispatchTargets = {
  media: new DispatchTargetMap((key) => (dispatch) => {
    const mediaQueryList = window.matchMedia(key);
    mediaQueryList.addEventListener("change", dispatch);
    return mediaQueryList;
  }),
  localStorage: new DispatchTarget((dispatch) => window.addEventListener("storage", dispatch)),
  locationHash: new DispatchTarget((dispatch) => {
    window.addEventListener("hashchange", () => {
      _scrollToLocationHash();
      dispatch();
    });
  }),
  windowResize: new DispatchTarget((dispatch) => window.addEventListener("resize", dispatch)),
  /*mouseMove: new DispatchTarget((dispatch) => {
    const state = {x: -1, y: -1};
    window.addEventListener("mousemove", (event) => {
      state.x = event.clientX;
      state.y = event.clientY;
      dispatch();
    });
    return state;
  }),*/
  removeComponent(component/*: Component*/) {
    _dispatchTargets.media.removeComponent(component);
    _dispatchTargets.localStorage.removeComponent(component);
    _dispatchTargets.locationHash.removeComponent(component);
    _dispatchTargets.windowResize.removeComponent(component);
  },
}
export function _scrollToLocationHash() {
  const element = document.getElementById(location.hash.slice(1));
  if (element) element.scrollIntoView();
}

// metadata
export class ComponentMetadata {
  // state
  stateIsInitialized/*: boolean*/ = false;
  state/*: StringMap*/ = {};
  prevState/*: any | null*/ = null;
  prevNode/*: NodeType | null*/ = null;
  prevBaseProps/*: InheritedBaseProps*/ = _START_BASE_PROPS;
  prevEvents/*: EventsMap*/ = {}/* as EventsMap*/;
  gcFlag/*: boolean*/ = false;
  onUnmount/*?: () => void*/;
  // navigation
  prevBeforeNode/*: NodeType | null*/ = null;
  prevComponent/*: Component | null*/ = null;
  keyToChild/*: StringMap<ComponentMetadata>*/ = {};
  prevIndexedChildCount/*: number | null*/ = null;
  parent/*: ComponentMetadata | RootComponentMetadata | null*/;
  root/*: RootComponentMetadata*/;
  constructor(parent/*: ComponentMetadata | RootComponentMetadata | null*/) {
    this.parent = parent;
    this.root = parent?.root ?? null/* as any*/;
  }
}
export class RootComponentMetadata extends ComponentMetadata {
  component/*: Component*/;
  parentNode/*: ParentNodeType*/;
  willRerenderNextFrame/*: boolean*/ = false;
  constructor(component/*: Component*/, parentNode/*: ParentNodeType*/) {
    super(null);
    this.root = this;
    this.component = component;
    this.parentNode = parentNode;
  }
}

// render
export function renderRoot(rootComponent/*: Component*/, parentNode/*: ParentNodeType | null*/ = null)/*: RootComponentMetadata*/ {
  const root_ = new RootComponentMetadata(rootComponent, parentNode/* as any*/);
  rootComponent._ = root_;
  const render = () => {
    root_.parentNode = root_.parentNode ?? document.body;
    if (SCROLLBAR_WIDTH === 0) _computeScrollbarWidth();
    _render(rootComponent, root_.parentNode);
    requestAnimationFrame(() => {
      _scrollToLocationHash();
    });
  }
  if (root_.parentNode ?? document.body) {
    render();
  } else {
    window.addEventListener("load", render);
  }
  return root_;
}
/*export type InheritedBaseProps = UndoPartial<Omit<BaseProps, "key" | "events">> & {className: string[]};*/
export const _START_BASE_PROPS/*: InheritedBaseProps*/ = {
  attribute: {},
  className: [],
  cssVars: {},
  style: {},
};
// TODO: make this non-recursive for cleaner console errors
export function _render(component/*: Component*/, parentNode/*: ParentNodeType*/, beforeNodeStack/*: (NodeType | null)[]*/ = [], _inheritedBaseProps/*: InheritedBaseProps*/ = _START_BASE_PROPS, isTopNode = true) {
  // render elements
  const {_, name, args, baseProps, props, onRender, indexedChildCount} = component;
  const {onMount, onUnmount} = onRender.bind(component)(...args, props) ?? {};
  const {node, children} = component; // NOTE: get node and children after render
  // warn if missing keys
  const prevIndexedChildCount = _.prevIndexedChildCount;
  if (prevIndexedChildCount !== null && (indexedChildCount !== prevIndexedChildCount)) {
    console.warn(`Varying children should have a "key" prop. (${prevIndexedChildCount} -> ${indexedChildCount})`, _.prevComponent, component);
  }
  // inherit
  let inheritedBaseProps = {
    attribute: {..._inheritedBaseProps.attribute, ...baseProps.attribute},
    className: [..._inheritedBaseProps.className, ...baseProps.className],
    cssVars: {..._inheritedBaseProps.cssVars, ...baseProps.cssVars},
    style: {..._inheritedBaseProps.style, ...baseProps.style},
  };
  const prevNode = _.prevNode;
  const beforeNode = beforeNodeStack[beforeNodeStack.length - 1];
  if (node) {
    // append
    if (beforeNode && (beforeNode !== _.prevBeforeNode)) {
      beforeNode.after(node);
    } else if (!prevNode) {
      parentNode.prepend(node); // NOTE: prepend if no history
    }
    _.prevBeforeNode = beforeNode;
    if (node != prevNode) {
      if (prevNode) prevNode.remove();
      _.prevBaseProps = _START_BASE_PROPS;
      _.prevEvents = {}/* as EventsMap*/;
    }
    if (!(node instanceof Text)) {
      // style
      const styleDiff = getDiff(_.prevBaseProps.style, inheritedBaseProps.style);
      for (let {key, newValue} of styleDiff) {
        if (newValue != null) {
          node.style[key/* as any*/] = addPx(newValue);
        } else {
          node.style.removeProperty(key);
        }
      }
      // cssVars
      const cssVarsDiff = getDiff(_.prevBaseProps.cssVars, inheritedBaseProps.cssVars);
      for (let {key, newValue} of cssVarsDiff) {
        if (newValue != null) {
          node.style.setProperty(`--${key}`, addPx(newValue));
        } else {
          node.style.removeProperty(`--${key}`);
        }
      }
      // class
      if (name !== node.tagName.toLowerCase()) {
        inheritedBaseProps.className.push(name);
      };
      const classNameDiff = getDiffArray(_.prevBaseProps.className, inheritedBaseProps.className);
      for (let {key, newValue} of classNameDiff) {
        if (newValue != null) {
          if (key === "") console.warn("className cannot be empty,", name, inheritedBaseProps.className);
          if (key.includes(" ")) console.warn("className cannot contain whitespace,", name, inheritedBaseProps.className);
          node.classList.add(key);
        } else {
          node.classList.remove(key);
        }
      }
      // attribute
      const attributeDiff = getDiff(_.prevBaseProps.attribute, inheritedBaseProps.attribute);
      for (let {key, newValue} of attributeDiff) {
        if (newValue != null) {
          node.setAttribute(camelCaseToKebabCase(key), String(newValue));
        } else {
          node.removeAttribute(camelCaseToKebabCase(key));
        }
      }
      // events
      const eventsDiff = getDiff(_.prevEvents, baseProps.events ?? {});
      for (let {key, oldValue, newValue} of eventsDiff) {
        node.removeEventListener(key, oldValue/* as _EventListener*/);
        if (newValue) {
          const passive = key === "scroll" || key === "wheel";
          node.addEventListener(key, newValue/* as _EventListener*/, {passive});
        }
      }
      _.prevBaseProps = inheritedBaseProps;
      _.prevEvents = baseProps.events ?? {};
      parentNode = node;
      inheritedBaseProps = _START_BASE_PROPS;
      isTopNode = false;
    }
  } else {
    if (prevNode) {
      prevNode.remove(); // NOTE: removing components is handled by _unloadUnusedComponents()
      _.prevBaseProps = {}/* as InheritedBaseProps*/;
      _.prevEvents = {}/* as EventsMap*/;
    }
    if (name) inheritedBaseProps.className.push(name); // NOTE: fragment has name: ''
  }
  // children
  const usedKeys = new Set();
  if (node) beforeNodeStack.push(null);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const key = child.key;
    if (usedKeys.has(key)) console.warn(`Duplicate key: '${key}'`, component);
    usedKeys.add(key);
    const child_ = _.keyToChild[key] ?? new ComponentMetadata(_);
    _.keyToChild[key] = child_;
    child._ = child_;
    child_.gcFlag = _.gcFlag;
    _render(child, parentNode, beforeNodeStack, inheritedBaseProps, isTopNode);
  }
  if (node) {
    beforeNodeStack.pop();
    beforeNodeStack[beforeNodeStack.length - 1] = node;
  }
  // on mount
  _.prevNode = node;
  _.prevIndexedChildCount = indexedChildCount;
  _.prevState = {..._.state};
  _.prevComponent = component;
  if (onMount) onMount();
  if (onUnmount) _.onUnmount = onUnmount;
}

// rerender
export function _unloadUnusedComponents(prevComponent/*: Component*/, rootGcFlag/*: boolean*/) {
  for (let child of prevComponent.children) {
    const {gcFlag, parent, onUnmount, prevNode} = child._;
    if (gcFlag !== rootGcFlag) {
      _dispatchTargets.removeComponent(prevComponent);
      delete parent?.keyToChild[child.key];
      if (onUnmount) onUnmount();
      if (prevNode) prevNode.remove();
    }
    _unloadUnusedComponents(child, rootGcFlag);
  }
}
export function moveRoot(root_/*: RootComponentMetadata*/, parentNode/*: ParentNodeType*/) {
  root_.parentNode = parentNode;
  if (root_.prevNode) parentNode.append(root_.prevNode);
}
export function unloadRoot(root_/*: RootComponentMetadata*/) {
  _unloadUnusedComponents(root_.component, !root_.gcFlag);
}

// basic components
export const fragment = makeComponent(function fragment(_props/*: BaseProps*/ = {}) {}, { name: '' });
export const text = makeComponent(function text(str/*: string*/, _props/*: {}*/ = {}) {
  const state = this.useState({prevStr: ""});
  const e = this.useNode(new Text(""));
  if (str !== state.prevStr) {
    state.prevStr = str;
    (e/* as Text*/).textContent = str;
  }
})
export const ul = makeComponent(function ul(_props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("ul"));
});
export const ol = makeComponent(function ol(_props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("ol"));
});
export const li = makeComponent(function li(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("li"));
  this.append(text);
});
export const h1 = makeComponent(function h1(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("h1"));
  this.append(text);
});
export const h2 = makeComponent(function h2(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("h2"));
  this.append(text);
});
export const h3 = makeComponent(function h3(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("h3"));
  this.append(text);
});
export const h4 = makeComponent(function h4(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("h4"));
  this.append(text);
});
export const h5 = makeComponent(function h5(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("h5"));
  this.append(text);
});
export const h6 = makeComponent(function h6(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("h6"));
  this.append(text);
});
export const divider = makeComponent(function divider(vertical/*: boolean*/ = false, _props/*: BaseProps*/ = {}) {
  this.append(div({
    attribute: {dataVertical: vertical},
  }));
});
export const p = makeComponent(function p(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("p"));
  this.append(text);
});
export const b = makeComponent(function b(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("b"));
  this.append(text);
});
export const em = makeComponent(function em(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("em"));
  this.append(text);
});
export const code = makeComponent(function code(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("code"));
  this.append(text);
});
export const button = makeComponent(function button(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("button"));
  this.append(text);
});
export const input = makeComponent(function input(_props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("input"));
});
export const svg = makeComponent(function svg(svgText/*: string*/, _props/*: BaseProps*/ = {}) {
  let defaultNode = this._.prevNode;
  if (defaultNode == null) {
    const tmp = document.createElement("span");
    tmp.innerHTML = svgText;
    defaultNode = (tmp.children[0] ?? document.createElement("svg"))/* as NodeType*/;
  }
  this.useNode(defaultNode);
});
export const div = makeComponent(function div(_props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement('div'));
});
/*export type Size = "small" | "normal" | "big" | "bigger";*/
export const SIZES/*: Size[]*/ = ["small", "normal", "big", "bigger"];
/*export type BaseColor = "gray" | "secondary" | "red";*/
export const BASE_COLORS/*: Record<BaseColor, string>*/ = {
  gray: "0, 0, 0",
  secondary: "20, 80, 160",
  red: "200, 50, 50",
};
export const COLOR_SHADES = ["", "033", "067", "1", "2", "250", "3"]; // TODO: use linear colors
/*export type SpanProps = BaseProps & {
  iconName?: string;
  size?: Size;
  color?: string;
  singleLine?: string;
  fontFamily?: string;
  href?: string;
  navigate?: NavigateFunction;
  id?: string;
  selfLink?: string;
  onClick?: (event: MouseEvent) => void;
};*/
export const span = makeComponent(function _span(text/*: string | number | null | undefined*/, props/*: SpanProps*/ = {}) {
  let { iconName, size, color, singleLine, fontFamily, href, navigate, id, selfLink, onClick } = props;
  if (selfLink != null) {
    const selfLinkWrapper = this.append(div({ className: "selfLink", attribute: { id: id == null ? selfLink : id } }));
    selfLinkWrapper.append(span(text, {...props, selfLink: undefined}));
    selfLinkWrapper.append(icon("tag", { size: "normal", href: `#${selfLink}` }));
    return;
  }
  const isLink = (href != null);
  const e = this.useNode(document.createElement(isLink ? 'a' : 'span'));
  const {attribute, className, style} = this.baseProps;
  if (id) attribute.id = id;
  if (size) attribute.dataSize = size;
  if (iconName) className.push("material-symbols-outlined");
  if (color) style.color = `var(--${color})`; // TODO: remove style?
  if (singleLine) className.push("ellipsis");
  if (fontFamily) style.fontFamily = `var(--fontFamily-${fontFamily})`; // TODO: remove style?
  if (isLink) (e/* as HTMLAnchorElement*/).href = href;
  navigate = (navigate ?? this.useNavigate().pushRoute);
  if (onClick || href) {
    if (!isLink) {
      attribute.tabindex = "-1";
      attribute.clickable = "true";
    }
    e.onclick = (event) => {
      if (onClick) onClick(event);
      if (href) {
        event.preventDefault();
        navigate(href);
      }
    }
  }
  this.append(iconName || (text == null ? "" : String(text)))
}, { name: "span" });
// https://fonts.google.com/icons
/*export type IconProps = SpanProps;*/
export const icon = makeComponent(function icon(iconName/*: string*/, props/*: IconProps*/ = {}) {
  let {size, style = {}, ...extraProps} = props;
  this.baseProps.attribute.dataIcon = iconName;
  this.append(span("", {iconName, size, style, ...extraProps}));
});
export const loadingSpinner = makeComponent(function loadingSpinner(props/*: IconProps*/ = {}) {
  this.append(icon("progress_activity", props));
});
export const legend = makeComponent(function legend(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(document.createElement("legend"));
  this.append(text);
  this.baseProps.className.push("ellipsis");
});
/*export type DialogProps = BaseProps & ({
  open: boolean;
  onClose?: () => void;
  closeOnClickBackdrop?: boolean;
});*/
export const dialog = makeComponent(function dialog(props/*: DialogProps*/)/*: RenderReturn*/ {
  const {open, onClose, closeOnClickBackdrop} = props;
  const state = this.useState({ prevOpen: false });
  const e = this.useNode(document.createElement("dialog"));
  e.onclick = (event) => {
    if (closeOnClickBackdrop && (event.target === e) && onClose) onClose();
  }
  return {
    onMount: () => {
      if (open !== state.prevOpen) {
        if (open) {
          e.showModal();
        } else {
          e.close();
        }
        state.prevOpen = open;
      }
    },
  };
});
/*export type PopupDirection = "up" | "right" | "down" | "left" | "mouse";*/
export let SCROLLBAR_WIDTH = 0;
export let THIN_SCROLLBAR_WIDTH = 0;
export function _computeScrollbarWidth() {
  let e = document.createElement("div");
  e.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
  document.body.append(e);
  SCROLLBAR_WIDTH = e.offsetWidth - e.clientWidth;
  e.style.scrollbarWidth = "thin";
  THIN_SCROLLBAR_WIDTH = e.offsetWidth - e.clientWidth;
  e.remove();
  document.body.style.setProperty("--scrollbarWidth", addPx(SCROLLBAR_WIDTH));
  document.body.style.setProperty("--thinScrollbarWidth", addPx(THIN_SCROLLBAR_WIDTH));
}
export function _getPopupLeftTop(direction/*: PopupDirection*/, props/*: {
  mouse: {x: number, y: number},
  wrapperRect: DOMRect,
  popupRect: DOMRect,
}*/) {
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
export function _getPopupLeftTopWithFlipAndClamp(props/*: {
  direction: PopupDirection,
  mouse: {x: number, y: number},
  windowRight: number;
  windowBottom: number;
  wrapperRect: DOMRect,
  popupRect: DOMRect,
}*/) {
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
  return [left, top]/* as [number, number]*/;
}
/*export type PopupWrapperProps = {
  content: Component;
  direction?: PopupDirection;
  // TODO: arrow?: boolean;
  /** NOTE: open on hover if undefined *//*
  open?: boolean;
  interactable?: boolean;
};*/
export const popupWrapper = makeComponent(function popupWrapper(props/*: PopupWrapperProps*/)/*: RenderReturn*/ {
  const {content, direction: _direction = "up", open, interactable = false} = props;
  const state = this.useState({mouse: {x: -1, y: -1}, open: false, prevOnScroll: null/* as EventListener | null*/});
  const wrapper = this.useNode(document.createElement("div"));
  const {windowBottom, windowRight} = this.useWindowResize(); // TODO: just add a window listener
  const movePopup = () => {
    if (!state.open) return;
    const popupNode = popup._.prevNode/* as HTMLDivElement*/;
    const popupContentWrapperNode = popupContentWrapper._.prevNode/* as HTMLDivElement*/;
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
    (popup._.prevNode/* as HTMLDivElement | null*/)?.showPopover();
    movePopup();
  }
  const closePopup = () => {
    state.open = false;
    (popup._.prevNode/* as HTMLDivElement | null*/)?.hidePopover();
  };
  if (open == null) {
    wrapper.onmouseenter = openPopup;
    wrapper.onmouseleave = closePopup;
  }
  if (_direction === "mouse") {
    wrapper.onmousemove = (event) => {
      state.mouse = { x: event.clientX, y: event.clientY }; // TODO: useGlobalMouse() and recheck bounds on scroll?
      movePopup();
    }
  }
  const popup = this.append(div({
    className: "popup",
    attribute: {popover: "manual", dataInteractable: interactable},
  }));
  const popupContentWrapper = popup.append(div({className: "popupContentWrapper"}));
  popupContentWrapper.append(content);
  return {
    onMount: () => {
      for (let acc = (this._.prevNode/* as ParentNode | null*/); acc != null; acc = acc.parentNode) {
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
      for (let acc = (this._.prevNode/* as ParentNode | null*/); acc != null; acc = acc.parentNode) {
        acc.removeEventListener("scroll", state.prevOnScroll);
      }
    },
  };
});

/*export type ButtonProps = {
  size?: Size;
  color?: BaseColor;
  onClick?: () => void;
  disabled?: boolean;
}*/
// inputs
export const coloredButton = makeComponent(function coloredButton(text/*: string*/, props/*: ButtonProps*/ = {}) {
  const {size, color, onClick, disabled} = props;
  const e = this.useNode(document.createElement("button"));
  if (text) this.append(span(text));
  const {attribute} = this.baseProps;
  if (size) attribute.dataSize = size;
  if (color) attribute.dataColor = color;
  if (disabled) attribute.disabled = "true";
  else if (onClick) {
    e.onmousedown = () => {
      requestAnimationFrame(onClick);
    }
  }
});
/*export type InputProps = {
  type?: "text";
  placeholder?: string;
  value: string | number | null | undefined;
  autoFocus?: boolean;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onRawInput?: (event: InputEventWithTarget) => void;
  onInput?: (event: InputEventWithTarget) => void;
  onChange?: (event: ChangeEventWithTarget) => void;
  allowDisplayString?: (value: string) => boolean;
  allowString?: (value: string) => string | undefined;
} & BaseProps;*/
export const controlledInput = makeComponent(function controlledInput(props/*: InputProps*/) {
  const { type = "text", placeholder, value, autoFocus, onFocus, onBlur, onKeyDown, onRawInput, onInput, onChange,
    allowDisplayString = () => true,
    allowString = (value) => value,
  } = props;
  const state = this.useState({ prevAllowedDisplayString: String(value ?? ''), prevAllowedString: '' });
  state.prevAllowedString = String(value ?? '');
  const e = this.useNode(document.createElement('input'));
  e.type = type;
  if (placeholder) e.placeholder = placeholder;
  if (autoFocus) e.autofocus = true;
  if (value != null) e.value = String(value);
  e.onfocus = onFocus/* as _EventListener*/;
  e.onblur = onBlur/* as _EventListener*/;
  e.onkeydown = onKeyDown/* as _EventListener*/;
  e.oninput = (_event) => {
    const event = _event/* as InputEventWithTarget*/;
    if (event.data != null && !allowDisplayString(e.value)) {
      event.preventDefault();
      event.stopPropagation();
      e.value = state.prevAllowedDisplayString;
      return;
    }
    state.prevAllowedDisplayString = e.value;
    if (onRawInput) onRawInput(event);
    const allowedString = allowString(e.value);
    if (allowedString === e.value && onInput) onInput(event);
  }
  e.onchange = (_event) => { // NOTE: called only on blur
    const event = _event/* as ChangeEventWithTarget*/;
    const allowedString = allowString(e.value) ?? state.prevAllowedString;
    state.prevAllowedString = allowedString;
    if (e.value !== allowedString) {
      e.value = allowedString;
      const target = event.target;
      if (onRawInput) onRawInput({target}/* as InputEventWithTarget*/);
      if (onInput) onInput({target}/* as InputEventWithTarget*/);
    }
    if (onChange) onChange(event);
  };
});
/*export type LabeledInputProps = {
  label?: string;
  leftComponent?: Component;
  inputComponent: Component;
  rightComponent?: Component;
} & BaseProps;*/
export const labeledInput = makeComponent(function labeledInput(props/*: LabeledInputProps*/) {
  const {label = " ", leftComponent, inputComponent, rightComponent} = props;
  const fieldset = this.useNode(document.createElement("fieldset"));
  fieldset.onmousedown = (_event/*: any*/) => {
    const event = _event/* as MouseEvent*/;
    if (event.target !== inputComponent._.prevNode) {
      event.preventDefault();
    }
  }
  fieldset.onclick = (_event/*: any*/) => {
    const event = _event/* as MouseEvent*/;
    const prevNode = inputComponent._.prevNode/* as ParentNodeType*/;
    if (prevNode && (event.target !== prevNode)) {
      prevNode.focus();
    }
  };
  this.append(legend(label))
  if (leftComponent) this.append(leftComponent);
  this.append(inputComponent);
  if (rightComponent) this.append(rightComponent);
});
export const errorMessage = makeComponent(function errorMessage(error/*: string*/, props/*: SpanProps*/ = {}) {
  this.append(span(error, {color: "red", size: "small", ...props}));
});
/*export type TextInputProps = Omit<InputProps, "value"> & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  value: string | null | undefined;
};*/
export const textInput = makeComponent(function textInput(props/*: TextInputProps*/) {
  const {label, leftComponent, rightComponent, error, ...extraProps} = props;
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent: controlledInput(extraProps),
    rightComponent,
  }));
  if (error) this.append(errorMessage(error));
});
/*export type NumberArrowProps = {
  onClickUp?: (event: MouseEvent) => void;
  onClickDown?: (event: MouseEvent) => void;
} & BaseProps;*/
export const numberArrows = makeComponent(function numberArrows(props/*: NumberArrowProps*/ = {}) {
  const { onClickUp, onClickDown } = props;
  this.useNode(document.createElement("div"));
  this.append(icon("arrow_drop_up", {size: "small", onClick: onClickUp}));
  this.append(icon("arrow_drop_down", {size: "small", onClick: onClickDown}));
});
/*export type NumberInputProps = InputProps & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  min?: number,
  max?: number,
  step?: number,
  stepPrecision?: number,
  clearable?: boolean,
  onRawInput?: ((event: InputEventWithTarget) => void);
  onInput?: ((event: InputEventWithTarget) => void);
  onChange?: ((event: ChangeEventWithTarget) => void)
};*/
export const numberInput = makeComponent(function numberInput(props/*: NumberInputProps*/) {
  const {
    label, leftComponent, rightComponent: customRightComponent, error, // labeledInput
    value, min, max, step, stepPrecision, clearable = true, onKeyDown, onRawInput, onInput, onChange, ...extraProps // numberInput
  } = props;
  const stepAndClamp = (number/*: number*/) => {
    if (step) {
      const stepOffset = min ?? max ?? 0;
      number = stepOffset + Math.round((number - stepOffset) / step) * step;
    }
    number = Math.min(number, max ?? 1/0);
    number = Math.max(min ?? -1/0, number);
    const defaultStepPrecision = String(step).split(".")[1]?.length ?? 0;
    return number.toFixed(stepPrecision ?? defaultStepPrecision);
  };
  const incrementValue = (by/*: number*/) => {
    const number = stepAndClamp(+(value ?? 0) + by);
    const newValue = String(number);
    const target = inputComponent._.prevNode/* as HTMLInputElement*/;
    target.value = newValue;
    if (onRawInput) onRawInput({target}/* as unknown as InputEventWithTarget*/);
    if (onInput) onInput({target}/* as unknown as InputEventWithTarget*/);
    if (onChange) onChange({target}/* as ChangeEventWithTarget*/);
  };
  const inputComponent = controlledInput({
    value,
    onKeyDown: (event/*: KeyboardEvent*/) => {
      switch (event.key) {
        case "ArrowUp":
          incrementValue(step ?? 1);
          event.preventDefault();
          break;
        case "ArrowDown":
          incrementValue(-(step ?? 1));
          event.preventDefault();
          break;
      }
      if (onKeyDown) onKeyDown(event);
    },
    onRawInput,
    onInput,
    onChange,
    ...extraProps,
    allowDisplayString: (value) => value.split("").every((c, i) => {
      if (c === "-" && i === 0) return true;
      if (c === "." && ((step ?? 1) % 1) !== 0) return true;
      return "0123456789".includes(c);
    }),
    allowString: (value) => {
      const isAllowed = (value === "") ? clearable : !isNaN(+value);
      if (isAllowed) {
        return String(stepAndClamp(+value));
      }
    }
  });
  const rightComponent = fragment();
  if (customRightComponent) rightComponent.append(customRightComponent);
  rightComponent.append(numberArrows({
    onClickUp: (_event/*: MouseEvent*/) => {
      incrementValue(step ?? 1);
      inputComponent._.state.needFocus = true;
      inputComponent.rerender();
    },
    onClickDown: (_event/*: MouseEvent*/) => {
      incrementValue(-(step ?? 1));
      inputComponent._.state.needFocus = true;
      inputComponent.rerender();
    },
  }));
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent,
    rightComponent: rightComponent,
  }));
  if (error) this.append(errorMessage(error));
});

// table
/*export type TableColumn = {
  label: string;
  onRender: ComponentFunction<[data: {row: any, rowIndex: number, column: TableColumn, columnIndex: number}]>;
  minWidth?: string | number;
  maxWidth?: string | number;
  flex?: string | number;
};*/
/*export type TableProps = {
  label?: string;
  columns: TableColumn[];
  rows: any[];
  isLoading?: boolean;
  minHeight?: number;
  useMaxHeight?: boolean;
} & BaseProps;*/
export const table = makeComponent(function table(props/*: TableProps & BaseProps*/) {
  // TODO: set minHeight to fit N rows
  // TODO: actions, filters, search, paging, selection
  const {label, columns = [], rows = [], isLoading = false, minHeight = 400, useMaxHeight = false} = props;
  const tableWrapper = this.append(div({
    attribute: {useMaxHeight, isLoading},
    style: {minHeight},
  }));
  const makeRow = (className/*: string*/, key/*: string*/) => div({className, key});
  const makeCell = (column/*: TableColumn*/) => div({
    className: "tableCell",
    style: {flex: String(column.flex ?? 1), minWidth: column.minWidth, maxWidth: column.maxWidth},
  });
  if (label) {
    tableWrapper.append(span(label, {className: "tableLabel"}));
  }
  if (isLoading) {
    tableWrapper.append(loadingSpinner());
  } else {
    const headerWrapper = tableWrapper.append(makeRow("tableRow tableHeader", "header"));
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      const cellWrapper = headerWrapper.append(makeCell(column));
      cellWrapper.append(span(column.label));
    }
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      let row = rows[rowIndex];
      const rowWrapper = tableWrapper.append(makeRow("tableRow tableBody", `row-${rowIndex}`));
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        let column = columns[columnIndex];
        const cellWrapper = rowWrapper.append(makeCell(column));
        cellWrapper.append(column.onRender({row, rowIndex, column, columnIndex}));
      }
    }
  }
});

// router
/*export type Route = {
  path: string;
  defaultPath?: string;
  component: (props?: BaseProps) => Component;
  roles?: string[];
  wrapper?: boolean;
  showInNavigation?: boolean;
  label?: string;
  group?: string;
};*/
/*export type FallbackRoute = Omit<Route, "path">;*/
/*export type RouterProps = {
  routes: Route[];
  pageWrapperComponent?: ComponentFunction<[props: PageWrapperProps]>;
  contentWrapperComponent?: ComponentFunction<any>,
  currentRoles?: string[];
  isLoggedIn?: boolean;
  notLoggedInRoute?: FallbackRoute;
  notFoundRoute?: FallbackRoute;
  unauthorizedRoute?: FallbackRoute;
};*/
/*export type PageWrapperProps = {
  routes: Route[];
  currentRoute: Route;
  contentWrapperComponent: ComponentFunction<any>,
};*/
export const router = makeComponent(function router(props/*: RouterProps*/) {
  const {
    routes,
    pageWrapperComponent = () => fragment(),
    contentWrapperComponent = () => div({ className: "pageContent" }),
    currentRoles,
    isLoggedIn,
    notLoggedInRoute = { component: fragment },
    notFoundRoute = { component: () => span("404 Not found") },
    unauthorizedRoute = { component: fragment },
  } = props;
  let currentPath = location.pathname;
  if (currentPath.endsWith("/index.html")) currentPath = currentPath.slice(0, -10);
  let currentRoute/*: Route | null*/ = null, params = {}; // TODO: save params in rootComponent?
  for (let route of routes) {
    const regex = route.path.replace(/:([^/]+)/g, (_match, g1) => `(?<${g1}>[^/]*)`);
    const match = currentPath.match(new RegExp(`^${regex}$`));
    if (match != null) {
      params = match.groups ?? {};
      const roles = route.roles ?? [];
      const needSomeRole = (roles.length > 0);
      const haveSomeRole = (currentRoles ?? []).some(role => roles.includes(role));
      if (!needSomeRole || haveSomeRole) {
        currentRoute = route;
      } else {
        currentRoute = {
          path: ".*",
          ...(isLoggedIn ? notLoggedInRoute : unauthorizedRoute),
        };
      }
      break;
    }
  }
  if (!currentRoute) {
    console.warn(`Route '${currentPath}' not found.`);
    currentRoute = { path: ".*", ...notFoundRoute};
  }
  if (currentRoute) {
    if (currentRoute.wrapper ?? true) {
      this.append(pageWrapperComponent({routes, currentRoute, contentWrapperComponent}));
    } else {
      const contentWrapper = this.append(contentWrapperComponent());
      contentWrapper.append(currentRoute.component());
    }
  }
});
/*
TODO: documentation
  renderRoot(), moveRoot(), unloadRoot()
  css utils
  router()
  validation api
    const validate = this.useValidate((errors) => {
      if (state.username.length < 4) errors.username = "Username must have at least 4 characters."
    });
    const onSubmit = () => {
      if (validate()) {
        // ...
      }
    }
  useLocalStorage()
  useNavigate()
*/
// TODO: more input components (icon button, radio, checkbox/switch, select, date/date range input, file input)
// TODO: badgeWrapper
// TODO: snackbar api
// https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp ?
// TODO: dateTimeInput({locale: {daysInWeek: string[], firstDay: number, utcOffset: number}})
/* notFoundPage.mts */
export const notFoundPage = makeComponent(function notFoundPage() {
  this.append(span("Page not found"));
});
/* themeCreatorPage.mts */
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const state = this.useState({
    color: '#1450a0',
    count: 7,
  });
  this.append(textInput({
    value: state.color,
    allowString: (value) => {
      if (value.match("#[0-9a-zA-Z]{6}")) return value;
    },
    onInput: (event) => {
      state.color = event.target.value;
      this.rerender();
    },
    label: 'Color',
  }));
  this.append(numberInput({
    value: state.count,
    min: 0,
    onInput: (event) => {
      state.count = +event.target.value;
      this.rerender();
    },
    label: 'Count',
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Exponential",
    alphaFunction: (i, N) => {
      return 2 - 2**(i/N);
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Chebyshev roots",
    alphaFunction: (i, N) => (Math.cos(Math.PI*i / N) + 1) / 2,
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "lerp(Chebyshev, linear)",
    alphaFunction: (i, N) => {
      const v = (Math.cos(Math.PI*i / N) + 1) / 2;
      return lerp(i/(N-1), v, (N-i)/N)
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "linear",
    alphaFunction: (i, N) => {
      return (N-i)/N;
    },
  }));
  this.append(colorPalette({
    color: state.color,
    count: state.count,
    name: "Sigmoid",
    alphaFunction: (i, N) => {
      const v = (i / (0.59*N));
      return Math.exp(-v*v);
    },
  }));
});
/*type ColorPaletteProps = BaseProps & {
  color: string;
  count: number;
  name: string;
  alphaFunction: (i: number, count: number) => number;
};*/
const colorPalette = makeComponent(function colorPalette(props/*: ColorPaletteProps*/) {
  const {color, count, name, alphaFunction} = props;
  this.append(span(name, {style: {marginTop: 4}}));
  // color
  const appendColorRow = (color/*: string*/) => {
    const colorRow = this.append(div({
      style: {display: "flex"},
    }));
    for (let i = 0; i < count; i++) {
      const colorRgb = rgbFromHexString(color);
      const alpha = alphaFunction(i, count);
      colorRow.append(div({
        key: `box-${i}`,
        style: {
          width: 30,
          height: 24,
          background: `rgba(${colorRgb}, ${alpha})`,
        },
      }));
    }
    for (let i = 0; i < count; i++) {
      const colorRgb = rgbFromHexString(color);
      const alpha = alphaFunction(i, count);
      colorRow.append(span("text", {
        key: `text-${i}`,
        style: {
          width: 30,
          textAlign: "right",
          color: `rgba(${colorRgb}, ${alpha})`,
        },
      }));
    }
  }
  appendColorRow(color);
  appendColorRow("#000000");
});
/* utils.mts */
/*export type MainPageSection = {
  label: string;
  id: string;
  component: ComponentFunction<[]>;
};*/
export function getSizeLabel(size/*: string*/) {
  return size[0].toUpperCase() + size.slice(1);
}
/* generateFontVars.mts */
export function generateFontSizeCssVars(names/*: string[]*/ = SIZES) {
  /*type SizeDef = {
    fontSize: number;
    iconSize: number;
    size: number;
  };*/
  const getSizeDef = (i/*: number*/) => ({
    fontSize: 12 + i*4,
    iconSize: 14 + i*4,
    size: 16 + i*8,
  })/* as SizeDef*/;
  let acc = "  /* generated by generateFontSizeCssVars */";
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const {fontSize, iconSize, size} = getSizeDef(i);
    acc += `\n  --fontSize-${name}: ${fontSize}px;`;
    acc += `\n  --iconSize-${name}: ${iconSize}px;`;
    acc += `\n  --size-${name}: ${size}px;`;
  }
  return acc;
}
export function generateColorCssVars(colors/*: StringMap<string>*/ = BASE_COLORS, start = 0.874, step = 2, shades = COLOR_SHADES) {
  let acc = "  /* generated by generateColorCssVars */";
  for (let [colorName, color] of Object.entries(colors)) {
    for (let i = 0; i < shades.length; i++) {
      const shadeName = shades[i];
      const shadeSuffix = shadeName ? `-${shadeName}` : "";
      const shadeNumber = +`${(shadeName || "0")[0]}.${shadeName.slice(1)}`;
      const alpha = start / step ** shadeNumber;
      acc += `\n  --${colorName}${shadeSuffix}: rgba(${color}, ${alpha.toFixed(3)});`
    }
  }
  return acc;
}
setTimeout(() => {
  //console.log(generateFontSizeCssVars());
  //console.log(generateColorCssVars());
})
/* basicComponents.mts */
const htmlSection = makeComponent(function htmlSection() {
  let column = this.append(div({className: "displayColumn", style: {gap: 4}}));
  column.append(span("span"));
  column.append(input({attribute: {placeholder: "input"}}));
  const someButton = column.append(button("Button", {style: {fontSize: "14px"}}));
  someButton.append(svg(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" />
    </svg>`, {style: {width: "1em", height: "1em"}}));
});
const spanSection = makeComponent(function spanSection() {
  for (let href of [undefined, "https://www.google.com"]) {
    let row = this.append(div({className: "displayRow", style: {marginTop: -4, marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: "small", href}));
    row.append(span("Normal", {size: "normal", href}));
    row.append(span("Big", {size: "big", href}));
    row.append(span("Bigger", {size: "bigger", href}));
  }
  for (let baseColor of Object.keys(BASE_COLORS)) {
    let row = this.append(div({className: "displayRow"}))
    for (let shade of COLOR_SHADES) {
      const color = shade ? `${baseColor}-${shade}` : baseColor;
      row.append(span(color, {color}));
    }
  }
});
const buttonSection = makeComponent(function buttonSection() {
  let row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(coloredButton(getSizeLabel(size), {size}));
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  for (let size of SIZES) row.append(coloredButton(getSizeLabel(size), {color: "secondary", size}));
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  for (let size of SIZES) row.append(coloredButton("Disabled", {disabled: true, size}));
});
const iconSection = makeComponent(function spanSection() {
  let row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(icon("link", {size}));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) row.append(loadingSpinner({size}));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  for (let size of SIZES) {
    const buttonWrapper = row.append(coloredButton("", {size, color: "secondary"}));
    buttonWrapper.append(icon("link", {size}));
    buttonWrapper.append(span(getSizeLabel(size)));
  }
  // TODO: circle buttons
});
const dialogSection = makeComponent(function dialogSection() {
  const row = this.append(div({className: "displayRow"}));
  const state = this.useState({dialogOpen: false});
  const openDialog = () => {
    state.dialogOpen = true;
    this.rerender();
  };
  const closeDialog = () => {
    state.dialogOpen = false;
    this.rerender();
  };
  row.append(coloredButton("Open dialog", {color: "secondary", onClick: openDialog}));
  const dialogWrapper = row.append(dialog({open: state.dialogOpen, onClose: closeDialog, closeOnClickBackdrop: true}));
  dialogWrapper.append(span("Hello world"));
});
const popupSection = makeComponent(function popupSection() {
  for (let direction of ["up", "right", "down", "left", "mouse"]/* as PopupDirection[]*/) {
    const popupProps = {direction, interactable: direction !== "mouse"};
    const row = this.append(div({className: "wideDisplayRow"}));
    const popupA = row.append(popupWrapper({
      content: span("Tiny"),
      ...popupProps,
    }));
    popupA.append(span(`direction: "${direction}"`));
    const popupB = row.append(popupWrapper({
      content: span("I can be too big to naively fit on the screen!"),
      ...popupProps,
    }));
    popupB.append(span(`direction: "${direction}"`));
  }
  const state = this.useState({buttonPopupOpen: false});
  const row = this.append(div({className: "wideDisplayRow"}));
  const popup = row.append(popupWrapper({
    content: span("Tiny"),
    direction: "down",
    open: state.buttonPopupOpen,
  }));
  popup.append(coloredButton(`Toggle popup`, {
    onClick: () => {
      state.buttonPopupOpen = !state.buttonPopupOpen;
      this.rerender();
    },
  }));
});
const mediaQuerySection = makeComponent(function mediaQuerySection() {
  const smOrBigger = this.useMedia({minWidth: 600});
  const mdOrBigger = this.useMedia({minWidth: 900});
  const lgOrBigger = this.useMedia({minWidth: 1200});
  const xlOrBigger = this.useMedia({minWidth: 1500});
  const column = this.append(div({className: "displayColumn"}));
  column.append(span(`smOrBigger: ${smOrBigger}`));
  column.append(span(`mdOrBigger: ${mdOrBigger}`));
  column.append(span(`lgOrBigger: ${lgOrBigger}`));
  column.append(span(`xlOrBigger: ${xlOrBigger}`));
});
export const BASIC_COMPONENT_SECTIONS/*: MainPageSection[]*/ = [
  {
    label: "HTML elements",
    id: "html",
    component: htmlSection,
  },
  {
    label: "Span",
    id: "span",
    component: spanSection,
  },
  {
    label: "Button",
    id: "button",
    component: buttonSection,
  },
  {
    label: "Icon",
    id: "icon",
    component: iconSection,
  },
  {
    label: "Dialog",
    id: "dialog",
    component: dialogSection,
  },
  {
    label: "Popup",
    id: "popup",
    component: popupSection,
  },
  {
    label: "Media query",
    id: "mediaQuery",
    component: mediaQuerySection,
  },
]
/* inputs.mts */
const textInputSection = makeComponent(function textInputSection() {
  const state = this.useState({username: ""});
  // username
  let row = this.append(div({className: "displayRow", style: {marginTop: 6}}));
  row.append(
    textInput({
      label: "Username",
      value: state.username,
      onInput: (event) => {
        state.username = event.target.value;
        this.rerender();
      },
      autoFocus: true,
    })
  );
  row.append(span("This input is stored in the component state."));
  row = this.append(div({className: "displayRow", style: {marginTop: -4}}));
  row.append(span(`state: ${JSON.stringify(state)}`));
  // count
  row = this.append(div({className: "displayRow", style: {marginTop: 4}}));
  const [count, setCount] = this.useLocalStorage("count", 0/* as number | null*/);
  row.append(
    numberInput({
      label: "Count",
      value: count,
      onInput: (event) => {
        const newCount = event.target.value;
        setCount(newCount === "" ? null : +newCount);
        this.rerender();
      },
      min: 0,
      clearable: false,
    })
  );
  row.append(span("This input is stored in local storage (synced across tabs and components)."));
  row = this.append(div({className: "displayRow", style: {marginTop: -4, marginBottom: 4}}));
  row.append(span(`count: ${count}`));
});
const tableSection = makeComponent(function tableSection() {
  const displayRow = this.append(div({className: "wideDisplayColumn"}));
  const [count, setCount] = this.useLocalStorage("count", 0/* as number | null*/);
  displayRow.append(
    numberInput({
      label: "Count",
      value: count,
      onInput: (event) => {
        const newCount = event.target.value;
        setCount(newCount === "" ? null : +newCount);
        this.rerender();
      },
      min: 0,
      clearable: false,
    })
  );
  ;
  const rows = Array(clamp(+(count ?? 0), 0, 100))
    .fill(0)
    .map((_, i) => i);
  displayRow.append(
    table({
      label: "Stuff",
      rows,
      columns: [
        {
          label: "#",
          onRender: (props) => span(props.rowIndex + 1),
        },
        {
          label: "Name",
          onRender: (props) => span(`foo ${props.row}`),
        },
        {
          label: "Count",
          onRender: (props) => span(props.row),
        },
      ],
    })
  );
  if ((count ?? 0) % 2 === 0) {
    displayRow.append(testKeysComponent({key: "testKeysComponent"}));
  }
});
const testKeysComponent = makeComponent(function testKeysComponent(_/*: BaseProps*/) {
  this.append(span(""));
});

export const INPUT_SECTIONS/*: MainPageSection[]*/ = [
  {
    label: "Text input",
    id: "textInput",
    component: textInputSection,
  },
  {
    label: "Table",
    id: "table",
    component: tableSection,
  },
];
/* mainPage.mts */
export const MAIN_PAGE_SECTIONS/*: MainPageSection[]*/ = [
  ...BASIC_COMPONENT_SECTIONS,
  ...INPUT_SECTIONS,
];
export const mainPage = makeComponent(function mainPage() {
  const wrapper = this.append(
    div({
      style: {display: "flex", flexDirection: "column", alignItems: "flex-start"},
    })
  );
  wrapper.append(span(`version: ${JSGUI_VERSION}`, {size: "small", selfLink: "version"}));
  for (let section of MAIN_PAGE_SECTIONS) {
    wrapper.append(span(section.label, {size: "big", selfLink: section.id}));
    const component = section.component()
    wrapper.append(component);
    const row = wrapper.append(div({className: "displayRow"}));
    const onRender = component.onRender;
    const codeString = `const ${onRender.name} = makeComponent(${onRender});`;
    row.append(code(codeString, {style: {
      margin: "6px 0px 4px 0px",
      padding: "4px 8px",
      background: "rgba(0, 0, 0, 0.1)",
      borderRadius: 8,
    }}));
  }
});
/* routes.mts */
export const GITHUB_PAGES_PREFIX = "(/jsgui)?";
export const ROUTES = [
  {
    path: `${GITHUB_PAGES_PREFIX}/`,
    defaultPath: "/#version",
    component: () => mainPage(),
    wrapper: true,
    showInNavigation: true,
    label: "Docs",
  },
  {
    path: `${GITHUB_PAGES_PREFIX}/themeCreator`,
    defaultPath: "/themeCreator",
    component: () => themeCreatorPage(),
    wrapper: true,
    showInNavigation: true,
    label: "Theme creator",
  },
];
export const root = makeComponent(function root() {
  this.append(
    router({
      pageWrapperComponent: pageWrapper,
      routes: ROUTES,
      notFoundRoute: {
        component: () => notFoundPage(),
      },
    })
  );
});
export const pageWrapper = makeComponent(function pageWrapper(props/*: PageWrapperProps*/) {
  const {routes, currentRoute, contentWrapperComponent} = props;
  const isGithubPages = window.location.pathname.startsWith("/jsgui");
  const githubPagesPrefix = isGithubPages ? `/jsgui` : "";
  const wrapper = this.append(div({
    style: {
      height: "100%",
      display: "flex",
      alignItems: "stretch",
    },
  }));
  const navigation = wrapper.append(div({
    className: "navMenu", // TODO: styles
    style: {display: "flex", flexDirection: "column"},
  }));
  const appendRoute = (route/*: Route*/) => {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: `${githubPagesPrefix}${route.defaultPath ?? route.path}` }));
    }
  }
  const docsRoute = ROUTES[0];
  appendRoute(docsRoute);
  navigation.append(divider());
  for (let section of MAIN_PAGE_SECTIONS) {
    navigation.append(span(section.label, {href: `${githubPagesPrefix}/#${section.id}`}));
  }
  navigation.append(divider());
  for (let route of routes.slice(1)) {
    appendRoute(route);
  }
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component());
})
renderRoot(root());
