import { addPx, camelCaseToKebabCase, makePath, PathParts, stringifyJs } from "./utils/string_utils.mts";

// utils
export const JSGUI_VERSION = "v0.19-dev";
export function parseJsonOrNull(jsonString: string): JSONValue {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}
// TODO!: sortBy(), groupBy(), asArray()
export type Nullsy = undefined | null;
export type StringMap<T = any> = Record<string, T>;
export type JSONValue = string | number | any[] | StringMap | null;
export type ParentNodeType = HTMLElement | SVGSVGElement;
export type NodeType = ParentNodeType | Text;
export type EventWithTarget<T = Event, E = HTMLInputElement> = T & {target: E};
export type InputEventWithTarget = EventWithTarget<InputEvent>;
export type ChangeEventWithTarget = EventWithTarget<Event>;
export type _EventListener<T = Event> = ((event: T) => void);
export type EventsMap = {
  click?: _EventListener<MouseEvent>;
  dblclick?: _EventListener<MouseEvent>;
  // NOTE: mouseXX and touchXX events are platform-specific, so they shouldn't be used

  pointerenter?: _EventListener<PointerEvent>; // same as pointerover?
  pointerleave?: _EventListener<PointerEvent>; // same as pointerout?
  pointerdown?: _EventListener<PointerEvent>;
  pointermove?: _EventListener<PointerEvent>;
  pointercancel?: _EventListener<PointerEvent>;
  pointerup?: _EventListener<PointerEvent>;

  focus?: _EventListener<FocusEvent>;
  blur?: _EventListener<FocusEvent>;
  focusin?: _EventListener<FocusEvent>;
  focusout?: _EventListener<FocusEvent>;

  keydown?: _EventListener<KeyboardEvent>;
  keypress?: _EventListener<KeyboardEvent>;
  keyup?: _EventListener<KeyboardEvent>;

  scroll?: _EventListener<WheelEvent>;

  beforeinput?: _EventListener<InputEventWithTarget>;
  input?: _EventListener<InputEventWithTarget>;

  compositionstart?: _EventListener<CompositionEvent>;
  compositionend?: _EventListener<CompositionEvent>;
  compositionupdate?: _EventListener<CompositionEvent>;

  paste?: _EventListener<ClipboardEvent>;
};
export type UndoPartial<T> = T extends Partial<infer R> ? R : T;
export type Diff<T> = {
  key: string;
  oldValue: T;
  newValue: T;
};
export function getDiff<T>(oldValue: StringMap<T>, newValue: StringMap<T>): Diff<T>[] {
  const diffMap: StringMap<Partial<Diff<T>>> = {};
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
  return (Object.values(diffMap) as Diff<T>[]).filter(v => v.newValue !== v.oldValue);
}
export function getDiffArray(oldValues: string[], newValues: string[]): Diff<string>[] {
  const diffMap: StringMap<Partial<Diff<string>>> = {};
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
  return (Object.values(diffMap) as Diff<string>[]).filter(v => v.newValue !== v.oldValue);
}

// NOTE: tsc is stupid and removes comments before types
export type ComponentFunction<T extends any[]> = (...argsOrProps: T) => Component;
export type ComponentOptions = {
  name?: string;
};
export type BaseProps = {
  key?: string | number;
  attribute?: StringMap<string | number | boolean>;
  cssVars?: StringMap<string | number | undefined>;
  className?: string | string[];
  style?: StringMap<string | number | undefined>;
  events?: EventsMap;
};
export type RenderedBaseProps = UndoPartial<Omit<BaseProps, "key" | "className">> & {key?: string, className: string[]};
export type RenderReturn = void | {
  onMount?: () => void,
  onUnmount?: (removed: boolean) => void,
};
export type RenderFunction<T extends any[]> = (this: Component, ...argsOrProps: T) => RenderReturn;
export type SetState<T> = (newValue: T) => void;
export type UseNodeState = {nodeDependOn?: any};
export type GetErrorsFunction<K extends string> = (errors: Partial<Record<K, string>>) => void;
export type UseWindowResize = { windowBottom: number, windowRight: number };
// component
export function _setDefaultChildKey(component: Component, child: Component) {
  const name = child.name;
  let key = child.baseProps.key;
  if (key == null) {
    if (name === "text") {
      key = `auto_${component.indexedTextCount++}_text`;
    } else {
      key = `auto_${component.indexedChildCount++}_${name}`;
    }
  }
  child.key = key;
}
export class Component {
  // props
  name: string;
  args: any[];
  baseProps: RenderedBaseProps;
  props: StringMap;
  children: Component[];
  onRender: RenderFunction<any[]>;
  options: ComponentOptions;
  // metadata
  _: ComponentMetadata | RootComponentMetadata;
  key: string;
  // hooks
  node: NodeType | null;
  indexedChildCount: number;
  indexedTextCount: number;
  constructor(onRender: RenderFunction<any[]>, args: any[], baseProps: RenderedBaseProps, props: StringMap, options: ComponentOptions) {
    this.name = options.name ?? onRender.name;
    if (!this.name && (options.name !== "")) throw `Function name cannot be empty: ${onRender}`;
    this.args = args
    this.baseProps = baseProps;
    this.props = props;
    this.children = [];
    this.onRender = onRender;
    this.options = options;
    // metadata
    this._ = null as any;
    this.key = "";
    // hooks
    this.node = null;
    this.indexedChildCount = 0;
    this.indexedTextCount = 0;
  }
  useNode<T extends NodeType>(getNode: () => T, nodeDependOn?: any): T {
    const [state] = this.useState<UseNodeState>({});
    let node = this.getNode();
    if (state.nodeDependOn !== nodeDependOn) {
      node = getNode();
      state.nodeDependOn = nodeDependOn;
    } else if (node == null) {
      node = getNode();
    }
    return (this.node = node) as T;
  }
  getNode(): NodeType | null {
    return this._.prevNode;
  }
  append(childOrString: string | Component): Component {
    const child = (childOrString instanceof Component) ? childOrString : text(childOrString);
    this.children.push(child);
    return child;
  }
  /** `return [value, setValueAndDispatch, setValue]` */
  useState<T extends object>(defaultState: T): [T, SetState<Partial<T>>, SetState<Partial<T>>] {
    const {_} = this;
    if (!_.stateIsInitialized) {
      _.state = defaultState;
      _.stateIsInitialized = true;
    }
    const setState = (newValue: Partial<T>) => {
      _.state = {..._.state, ...newValue};
    };
    const setStateAndRerender = (newValue: Partial<T>) => {
      setState(newValue);
      this.rerender();
    }
    return [_.state as T, setStateAndRerender, setState];
  }
  useValidate<K extends string>(getErrors: GetErrorsFunction<K>) {
    return () => {
      let errors: Partial<Record<K, string>> = {};
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
  useMedia(mediaQuery: StringMap<string | number>) { // TODO: add types
    const key = Object.entries(mediaQuery).map(([k, v]) => `(${camelCaseToKebabCase(k)}: ${addPx(v)})`).join(' and ');
    const dispatchTarget = _dispatchTargets.media.addDispatchTarget(key);
    dispatchTarget.addComponent(this);
    return dispatchTarget.state.matches; // TODO: this forces recalculate style (4.69 ms), cache value so this doesn't happen?
  }
  /** `return [value, setValueAndDispatch, setValue]` */
  useLocalStorage<T>(key: string, defaultValue: T): [T, SetState<T>, SetState<T>] {
    _dispatchTargets.localStorage.addComponent(this);
    const value = (parseJsonOrNull(localStorage[key]) as [T] | null)?.[0] ?? defaultValue;
    const setValue = (newValue: T) => {
      localStorage.setItem(key, JSON.stringify([newValue]));
    }
    const setValueAndDispatch = (newValue: T) => {
      const prevValue = localStorage[key];
      setValue(newValue);
      if (JSON.stringify([newValue]) !== prevValue) {
        _dispatchTargets.localStorage.dispatch();
        this.rerender();
      }
    }
    return [value, setValueAndDispatch, setValue];
  }
  useLocation(): PathParts {
    _dispatchTargets.location.addComponent(this);
    return {}; // TODO: useLocation()
  }
  useLocationHash(): string {
    _dispatchTargets.locationHash.addComponent(this);
    return window.location.hash;
  }
  useWindowResize(): UseWindowResize {
    _dispatchTargets.windowResize.addComponent(this);
    return { windowBottom: window.innerHeight, windowRight: window.innerWidth };
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
  _findByName(name: string): Component | undefined {
    if (this.name === name) return this;
    return this.children.map(v => v._findByName(name)).filter(v => v)[0];
  }
  _logByName(name: string) {
    const component = this._findByName(name);
    console.log({ ...component, _: { ...component?._ } });
  }
}
export function makeComponent<A extends Parameters<any>>(onRender: RenderFunction<A>, options: ComponentOptions = {}): ComponentFunction<A> {
  return (...argsOrProps: any[]) => {
    const argCount = (onRender+"").split("{")[0].split(",").length; // NOTE: allow multiple default arguments
    const args = new Array(argCount).fill(undefined);
    for (let i = 0; i < argsOrProps.length; i++) {
      args[i] = argsOrProps[i];
    }
    const propsAndBaseProps = (argsOrProps[argCount - 1] ?? {}) as BaseProps & StringMap;
    const {key, style = {}, attribute = {}, className: className, cssVars = {}, events = {} as EventsMap, ...props} = propsAndBaseProps;
    if (('key' in propsAndBaseProps) && ((key == null) || (key === ""))) {
      const name = options.name ?? onRender.name;
      console.warn(`${name} component was passed ${stringifyJs(key)}, did you mean to pass a string?`)
    }
    const baseProps: RenderedBaseProps = {
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
export const text = makeComponent(function text(str: string, _props: {} = {}) {
  const [state] = this.useState({prevStr: ""});
  const textNode = this.useNode(() => new Text(""));
  if (str !== state.prevStr) {
    state.prevStr = str;
    textNode.textContent = str;
  }
});
export function _copyComponent(component: Component) {
  const newComponent = new Component(component.onRender, component.args, component.baseProps, component.props, component.options);
  newComponent._ = component._;
  return newComponent;
}

export type DispatchTargetAddListeners = (dispatch: () => void) => any;
// dispatch
export class DispatchTarget {
  components: Component[];
  state: any;
  constructor(addListeners: DispatchTargetAddListeners = () => {}) {
    this.components = [];
    this.state = addListeners(() => this.dispatch());
  }
  addComponent(component: Component) {
    this.components.push(component);
  }
  removeComponent(component: Component) {
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
  data: StringMap<DispatchTarget>;
  addListeners: (key: string) => DispatchTargetAddListeners;
  constructor(addListeners: (key: string) => DispatchTargetAddListeners) {
    this.data = {};
    this.addListeners = addListeners;
  }
  addDispatchTarget(key: string) {
    const {data, addListeners} = this;
    const oldDT = data[key];
    if (oldDT != null) return oldDT;
    const newDT = new DispatchTarget(addListeners(key));
    data[key] = newDT;
    return newDT;
  }
  removeComponent(component: Component) {
    for (let key in this.data) {
      this.data[key].removeComponent(component);
    }
  }
}
export type AddDispatchTarget = {
  map: StringMap<DispatchTarget>;
  key: string;
  addListeners: DispatchTargetAddListeners;
};
export const _dispatchTargets = {
  media: new DispatchTargetMap((key) => (dispatch) => {
    const mediaQueryList = window.matchMedia(key);
    mediaQueryList.addEventListener("change", dispatch);
    return mediaQueryList;
  }),
  localStorage: new DispatchTarget((dispatch) => window.addEventListener("storage", dispatch)),
  location: new DispatchTarget((_dispatch) => {}),
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
  removeComponent(component: Component) {
    _dispatchTargets.media.removeComponent(component);
    _dispatchTargets.localStorage.removeComponent(component);
    _dispatchTargets.location.removeComponent(component);
    _dispatchTargets.locationHash.removeComponent(component);
    _dispatchTargets.windowResize.removeComponent(component);
  },
}
export function _scrollToLocationHash() {
  const element = document.getElementById(location.hash.slice(1));
  if (element) element.scrollIntoView();
}
export type NavigateFunction = (parts: string | PathParts) => void;
export enum NavType {
  Add = "Add",
  Replace = "Replace",
  AddAndReload = "AddAndReload",
  ReplaceAndReload = "ReplaceAndReload",
  OpenInNewTab = "OpenInNewTab",
};
export function navigate(urlOrParts: string | PathParts, navType: NavType = NavType.Add) {
  const newPath = makePath(urlOrParts);
  switch (navType) {
  case "Add":
  case "Replace":
    {
      const isExternalLink = !newPath.startsWith("/") && !newPath.startsWith(window.location.origin);
      if (isExternalLink) {navType = NavType.AddAndReload}
    }
  }
  switch (navType) {
  case "Add":
    history.pushState(null, "", newPath)
    _dispatchTargets.location.dispatch();
    break;
  case "Replace":
    history.replaceState(null, "", newPath)
    _dispatchTargets.location.dispatch();
    break;
  case "AddAndReload":
    location.href = newPath;
    break;
  case "ReplaceAndReload":
    location.replace(newPath);
    break;
  case "OpenInNewTab":
    window.open(newPath);
    break;
  }
}

// metadata
export class ComponentMetadata {
  // state
  stateIsInitialized: boolean = false;
  state: StringMap = {};
  prevState: any | null = null;
  prevNode: NodeType | null = null;
  prevBaseProps: InheritedBaseProps = _START_BASE_PROPS;
  prevEvents: EventsMap = {} as EventsMap;
  gcFlag: boolean = false;
  onUnmount?: (removed: boolean) => void;
  // navigation
  prevBeforeNode: NodeType | null = null;
  prevComponent: Component | null = null;
  keyToChild: StringMap<ComponentMetadata> = {};
  parent: ComponentMetadata | RootComponentMetadata | null;
  root: RootComponentMetadata;
  // debug
  prevIndexedChildCount: number | null = null;
  constructor(parent: ComponentMetadata | RootComponentMetadata | null) {
    this.parent = parent;
    this.root = parent?.root ?? null as any;
  }
}
export class RootComponentMetadata extends ComponentMetadata {
  component: Component;
  parentNode: ParentNodeType;
  willRerenderNextFrame: boolean = false;
  constructor(component: Component, parentNode: ParentNodeType) {
    super(null);
    this.root = this;
    this.component = component;
    this.parentNode = parentNode;
  }
}

// render
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
export function renderRoot(rootComponent: Component, parentNode: ParentNodeType | null = null): RootComponentMetadata {
  const root_ = new RootComponentMetadata(rootComponent, parentNode as any);
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
export type InheritedBaseProps = UndoPartial<Omit<BaseProps, "key" | "events">> & {className: string[]};
export const _START_BASE_PROPS: InheritedBaseProps = {
  attribute: {},
  className: [],
  cssVars: {},
  style: {},
};
// TODO: make this non-recursive for cleaner console errors
export function _render(component: Component, parentNode: ParentNodeType, beforeNodeStack: (NodeType | null)[] = [], _inheritedBaseProps: InheritedBaseProps = _START_BASE_PROPS, isTopNode = true) {
  // render elements
  const {_, name, args, baseProps, props, onRender} = component;
  const {onMount, onUnmount} = onRender.bind(component)(...args, props) ?? {};
  const {node, children, indexedChildCount} = component; // NOTE: get after render
  const prevIndexedChildCount = _.prevIndexedChildCount;
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
      _.prevEvents = {} as EventsMap;
    }
    if (!(node instanceof Text)) {
      // style
      const styleDiff = getDiff(_.prevBaseProps.style, inheritedBaseProps.style);
      for (let {key, newValue} of styleDiff) {
        if (newValue != null) {
          node.style[key as any] = addPx(newValue);
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
        inheritedBaseProps.className.push(camelCaseToKebabCase(name));
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
        node.removeEventListener(key, oldValue as _EventListener);
        if (newValue) {
          const passive = key === "scroll" || key === "wheel";
          node.addEventListener(key, newValue as _EventListener, {passive});
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
      _.prevBaseProps = {} as InheritedBaseProps;
      _.prevEvents = {} as EventsMap;
    }
    if (name) inheritedBaseProps.className.push(camelCaseToKebabCase(name)); // NOTE: fragment has name: ''
  }
  // children
  const usedKeys = new Set();
  if (node) beforeNodeStack.push(null);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    _setDefaultChildKey(component, child);
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
  const prevComponent = _.prevComponent;
  _.prevComponent = component;
  const prevOnOnmount = _.onUnmount;
  if (prevOnOnmount) prevOnOnmount(false);
  if (onMount) onMount();
  if (onUnmount) _.onUnmount = onUnmount;
  // warn if missing keys
  if (prevIndexedChildCount !== null && (indexedChildCount !== prevIndexedChildCount)) {
    console.warn(`Newly added/removed children should have a "key" prop. (${prevIndexedChildCount} -> ${indexedChildCount})`, prevComponent, component);
  }
}

// rerender
export function _unloadUnusedComponents(prevComponent: Component, rootGcFlag: boolean) {
  for (let child of prevComponent.children) {
    const {gcFlag, parent, onUnmount, prevNode} = child._;
    if (gcFlag !== rootGcFlag) {
      _dispatchTargets.removeComponent(prevComponent);
      delete parent?.keyToChild[child.key];
      if (onUnmount) onUnmount(true);
      if (prevNode) prevNode.remove();
    }
    _unloadUnusedComponents(child, rootGcFlag);
  }
}
export function moveRoot(root_: RootComponentMetadata, parentNode: ParentNodeType) {
  root_.parentNode = parentNode;
  if (root_.prevNode) parentNode.append(root_.prevNode);
}
export function unloadRoot(root_: RootComponentMetadata) {
  _unloadUnusedComponents(root_.component, !root_.gcFlag);
}

// sizes
export enum Size {
  small =  "small",
  normal = "normal",
  big =    "big",
  bigger = "bigger",
};
// default colors
export const BASE_COLORS = {
  gray: "0.0, 0.85, 0, 0",
  secondary: "0.85, 0.45, 0.127, 250",
  red: "0.45, 0.85, 0.127, 25",
  //yellow: "0.45, 0.85, 0.127, 95", // TODO: yellow, green
  //green: "0.45, 0.85, 0.127, 145",
};
export type BaseColor = keyof typeof BASE_COLORS; // TODO: remove this?
export const COLOR_SHADE_COUNT = 7;

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
*/
// TODO: more input components (icon button, radio, checkbox/switch, select, date/date range input, file input)
// TODO: badgeWrapper
// TODO: snackbar api
// https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp ?
// TODO: dateTimeInput({locale: {daysInWeek: string[], firstDay: number, utcOffset: number}})
