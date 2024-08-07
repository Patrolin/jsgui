// TODO: make a typescript compiler to compile packages like odin
// utils
const JSGUI_VERSION = "v0.6";
function parseJsonOrNull(jsonString: string): JSONValue {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}
function camelCaseToKebabCase(key: string) {
  return (key.match(/[A-Z][a-z]*|[a-z]+/g) ?? []).map(v => v.toLowerCase()).join("-");
}
function removePrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
function removeSuffix(value: string, prefix: string): string {
  return value.endsWith(prefix) ? value.slice(value.length - prefix.length) : value;
}
function addPx(value: string | number) {
  return (value?.constructor?.name === "Number") ? `${value}px` : value as string;
}
/** clamp value between min and max (defaulting to min) */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
type Nullsy = undefined | null;
type StringMap<T = any> = Record<string, T>;
type JSONValue = string | number | any[] | StringMap | null;
type ParentNodeType = HTMLElement | SVGSVGElement;
type NodeType = ParentNodeType | Text;
type _EventListener<T = Event> = ((event: T) => void);
type EventsMap = Partial<Record<"click" | "dblclick" | "mouseup" | "mousedown", _EventListener<MouseEvent>>
  & Record<"touchstart" | "touchend" | "touchmove" | "touchcancel", _EventListener<TouchEvent>>
  & Record<"focus" | "blur" | "focusin" | "focusout", _EventListener<FocusEvent>>
  & Record<"keydown" | "keypress" | "keyup", _EventListener<KeyboardEvent>>
  & Record<"scroll", _EventListener<WheelEvent>>
  & Record<"beforeinput" | "input", _EventListener<InputEvent>>
  & Record<"compositionstart" | "compositionend" | "compositionupdate", _EventListener<CompositionEvent>>
  & Record<"change", _EventListener<Event>>
  & Record<string, _EventListener>>;
type UndoPartial<T> = T extends Partial<infer R> ? R : T;
type Diff<T> = {
  key: string;
  oldValue: T;
  newValue: T;
}
function getDiff<T>(oldValue: StringMap<T>, newValue: StringMap<T>): Diff<T>[] {
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
function getDiffArray(oldValues: string[], newValues: string[]): Diff<string>[] {
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
type ComponentFunction<T extends any[]> = (...argsOrProps: T) => Component;
type ComponentOptions = {
  name?: string;
};
type BaseProps = {
  key?: string;
  attribute?: StringMap<string | number | boolean>;
  cssVars?: StringMap<string | number | undefined>;
  className?: string | string[];
  style?: StringMap<string | number | undefined>;
  events?: EventsMap;
};
type RenderedBaseProps = UndoPartial<Omit<BaseProps, "key" | "className">> & {key?: string, className: string[]};
type RenderReturn = {
  onMount?: () => void,
  onUnmount?: () => void,
} | void
type RenderFunction<T extends any[]> = (this: Component, ...argsOrProps: T) => RenderReturn;
type GetErrorsFunction<K extends string> = (errors: Partial<Record<K, string>>) => void;
type NavigateFunction = (url: string) => void;
type UseNavigate = {
  /** add url to history and reload page */
  pushRoute: NavigateFunction;
  /** replace url in history and reload page */
  replaceRoute: NavigateFunction;
  /** add url to history */
  pushHistory: NavigateFunction;
  /** replace url in history */
  replaceHistory: NavigateFunction;
}
// component
function _setChildKey(component: Component, child: Component) {
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
class Component {
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
  useNode<T extends NodeType>(defaultNode: T): T {
    return (this.node = (this._?.prevNode ?? defaultNode)) as T;
  }
  append(childOrString: string | Component): Component {
    const child = (childOrString instanceof Component) ? childOrString : text(childOrString);
    this.children.push(child);
    _setChildKey(this, child);
    return child;
  }
  useState<T extends object>(defaultState: T): T {
    const {_} = this;
    if (!_.stateIsInitialized) {
      _.state = defaultState;
      _.stateIsInitialized = true;
    }
    return _.state as T;
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
  useMedia(mediaQuery: StringMap<string | number>) { // TODO: type this
    const key = Object.entries(mediaQuery).map(([k, v]) => `(${camelCaseToKebabCase(k)}: ${addPx(v)})`).join(' and ');
    const dispatchTarget = _dispatchTargets.media.addDispatchTarget(key);
    dispatchTarget.addComponent(this);
    return dispatchTarget.state.matches; // TODO: this forces recalculate style (4.69 ms), cache value so this doesn't happen?
  }
  useLocalStorage<T>(key: string, defaultValue: T): [T, (newValue: T) => void, (newValue: T) => void] {
    _dispatchTargets.localStorage.addComponent(this);
    const value = (parseJsonOrNull(localStorage[key]) as [T] | null)?.[0] ?? defaultValue;
    const setValue = (newValue: T) => {
      localStorage.setItem(key, JSON.stringify([newValue]));
    }
    const setValueAndDispatch = (newValue: T) => {
      setValue(newValue);
      if (JSON.stringify([newValue]) !== localStorage[key]) {
        _dispatchTargets.localStorage.dispatch();
      }
    }
    return [value, setValue, setValueAndDispatch];
  }
  useLocationHash(): string { // TODO: add useLocation
    _dispatchTargets.locationHash.addComponent(this);
    return window.location.hash;
  }
  useWindowResize(): { windowBottom: number, windowRight: number } {
    _dispatchTargets.windowResize.addComponent(this);
    return { windowBottom: window.innerHeight, windowRight: window.innerWidth };
  }
  useNavigate(): UseNavigate {
    return {
      pushRoute: (url: string) => location.href = url, // add url to history and reload page
      replaceRoute: (url: string) => location.replace(url), // replace url in history and reload page
      pushHistory: (url: string) => history.pushState(null, "", url), // add url to history
      replaceHistory: (url: string) => history.replaceState(null, "", url), // replace url in history
    }
  }
  rerender() {
    const root_ = this._.root;
    const rootComponent = root_.component;
    const newGcFlag = !root_.gcFlag;
    if (!root_.willRerenderNextFrame) {
      root_.willRerenderNextFrame = true;
      requestAnimationFrame(() => {
        const newRootComponent = _copyRootComponent(rootComponent);
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
    console.log({ ...(component ?? {}), _: {...(component?._ ?? {})} });
  }
}
function makeComponent<A extends Parameters<any>>(onRender: RenderFunction<A>, options: ComponentOptions = {}): ComponentFunction<A> {
  return (...argsOrProps: any[]) => {
    const argCount = Math.max(0, onRender.length - 1);
    const args = argsOrProps.slice(0, argCount);
    const propsAndBaseProps = (argsOrProps[argCount] ?? {}) as BaseProps & StringMap;
    const {key, style = {}, attribute = {}, className: className, cssVars = {}, events = {} as EventsMap, ...props} = propsAndBaseProps;
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
function _copyRootComponent(component: Component) {
  const newComponent = new Component(component.onRender, component.args, component.baseProps, component.props, component.options);
  newComponent._ = component._;
  return newComponent;
}

type DispatchTargetAddListeners = (dispatch: () => void) => any;
// dispatch
class DispatchTarget {
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
class DispatchTargetMap {
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
type AddDispatchTarget = {
  map: StringMap<DispatchTarget>;
  key: string;
  addListeners: DispatchTargetAddListeners;
}
const _dispatchTargets = {
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
  removeComponent(component: Component) {
    _dispatchTargets.media.removeComponent(component);
    _dispatchTargets.localStorage.removeComponent(component);
    _dispatchTargets.locationHash.removeComponent(component);
    _dispatchTargets.windowResize.removeComponent(component);
  },
}
function _scrollToLocationHash() {
  const element = document.getElementById(location.hash.slice(1));
  if (element) element.scrollIntoView();
}

// metadata
class ComponentMetadata {
  // state
  stateIsInitialized: boolean = false
  state: StringMap = {};
  prevState: any | null = null;
  prevNode: NodeType | null = null;
  prevBaseProps: InheritedBaseProps = _START_BASE_PROPS;
  prevEvents: EventsMap = {} as EventsMap;
  gcFlag: boolean = false;
  onUnmount?: () => void;
  // navigation
  prevComponent: Component | null = null;
  keyToChild: StringMap<ComponentMetadata> = {};
  prevIndexedChildCount: number | null = null;
  parent: ComponentMetadata | RootComponentMetadata | null;
  root: RootComponentMetadata;
  constructor(parent: ComponentMetadata | RootComponentMetadata | null) {
    this.parent = parent;
    this.root = parent?.root ?? null as any;
  }
}
class RootComponentMetadata extends ComponentMetadata {
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
function renderRoot(rootComponent: Component, parentNode: ParentNodeType | null = null): RootComponentMetadata {
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
type InheritedBaseProps = UndoPartial<Omit<BaseProps, "key" | "events">> & {className: string[]};
const _START_BASE_PROPS: InheritedBaseProps = {
  attribute: {},
  className: [],
  cssVars: {},
  style: {},
};
function _render(component: Component, parentNode: ParentNodeType, _inheritedBaseProps: InheritedBaseProps = _START_BASE_PROPS, isTopNode = true) {
  // render elements
  const {_, name, args, baseProps, props, onRender, indexedChildCount} = component;
  const {onMount, onUnmount} = onRender.bind(component)(...args, props) ?? {};
  const node = component.node;
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
  if (node) {
    // append
    if (prevNode) {
      const prevName = _.prevComponent?.name;
      if (name !== prevName) {
        prevNode.replaceWith(node);
        _.prevBaseProps = {} as InheritedBaseProps;
        _.prevEvents = {} as EventsMap;
      }
    } else {
      parentNode.append(node);
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
    if (name) inheritedBaseProps.className.push(name); // NOTE: fragment has name: ''
  }
  // children
  const usedKeys = new Set();
  for (let child of component.children) {
    const key = child.key;
    if (usedKeys.has(key)) console.warn(`Duplicate key: '${key}'`, component);
    usedKeys.add(key);
    const child_ = _.keyToChild[key] ?? new ComponentMetadata(_);
    _.keyToChild[key] = child_;
    child._ = child_;
    child_.gcFlag = _.gcFlag;
    _render(child, parentNode, inheritedBaseProps, isTopNode);
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
function _unloadUnusedComponents(prevComponent: Component, rootGcFlag: boolean) {
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
function moveRoot(root_: RootComponentMetadata, parentNode: ParentNodeType) {
  root_.parentNode = parentNode;
  if (root_.prevNode) parentNode.append(root_.prevNode);
}
function unloadRoot(root_: RootComponentMetadata) {
  _unloadUnusedComponents(root_.component, !root_.gcFlag);
}

// basic components
const fragment = makeComponent(function fragment(_props: BaseProps = {}) {}, { name: '' });
const text = makeComponent(function text(str: string, _props: {} = {}) {
  const state = this.useState({prevStr: ""});
  const e = this.useNode(new Text(""));
  if (str !== state.prevStr) {
    state.prevStr = str;
    (e as Text).textContent = str;
  }
})
const ul = makeComponent(function ul(_props: BaseProps = {}) {
  this.useNode(document.createElement("ul"));
});
const ol = makeComponent(function ol(_props: BaseProps = {}) {
  this.useNode(document.createElement("ol"));
});
const li = makeComponent(function li(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("li"));
  this.append(text);
});
const h1 = makeComponent(function h1(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("h1"));
  this.append(text);
});
const h2 = makeComponent(function h2(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("h2"));
  this.append(text);
});
const h3 = makeComponent(function h3(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("h3"));
  this.append(text);
});
const h4 = makeComponent(function h4(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("h4"));
  this.append(text);
});
const h5 = makeComponent(function h5(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("h5"));
  this.append(text);
});
const h6 = makeComponent(function h6(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("h6"));
  this.append(text);
});
const p = makeComponent(function p(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("p"));
  this.append(text);
});
const b = makeComponent(function b(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("b"));
  this.append(text);
});
const em = makeComponent(function em(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("em"));
  this.append(text);
});
const code = makeComponent(function code(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("code"));
  this.append(text);
});
const button = makeComponent(function button(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("button"));
  this.append(text);
});
const input = makeComponent(function input(_props: BaseProps = {}) {
  this.useNode(document.createElement("input"));
});
const svg = makeComponent(function svg(svgText: string, _props: BaseProps = {}) {
  let defaultNode = this._.prevNode;
  if (defaultNode == null) {
    const tmp = document.createElement("span");
    tmp.innerHTML = svgText;
    defaultNode = (tmp.children[0] ?? document.createElement("svg")) as NodeType;
  }
  this.useNode(defaultNode);
});
const div = makeComponent(function div(_props: BaseProps = {}) {
  this.useNode(document.createElement('div'));
});
type Size = "small" | "normal" | "big" | "bigger";
const SIZES: Size[] = ["small", "normal", "big", "bigger"];
type BaseColor = "gray" | "secondary" | "red";
const BASE_COLORS: Record<BaseColor, string> = {
  gray: "0, 0, 0",
  secondary: "20, 80, 160",
  red: "200, 50, 50",
};
const COLOR_SHADES = ["", "033", "067", "1", "2", "250", "3"]; // TODO: use linear colors
type SpanProps = {
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
} & BaseProps;
const span = makeComponent(function _span(text: string | number | null | undefined, props: SpanProps = {}) {
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
  if (isLink) (e as HTMLAnchorElement).href = href;
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
type IconProps = SpanProps;
const icon = makeComponent(function icon(iconName: string, props: IconProps = {}) {
  let {size, style = {}, ...extraProps} = props;
  this.baseProps.attribute.dataIcon = iconName;
  this.append(span("", {iconName, size, style, ...extraProps}));
});
const loadingSpinner = makeComponent(function loadingSpinner(props: IconProps = {}) {
  this.append(icon("progress_activity", props));
});
const legend = makeComponent(function legend(text: string, _props: BaseProps = {}) {
  this.useNode(document.createElement("legend"));
  this.append(text);
  this.baseProps.className.push("ellipsis");
});
type DialogProps = BaseProps & ({
  open: boolean;
  onClose?: () => void;
  closeOnClickBackdrop?: boolean;
});
const dialog = makeComponent(function dialog(props: DialogProps): RenderReturn {
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
type PopupDirection = "up" | "right" | "down" | "left" | "mouse";
let SCROLLBAR_WIDTH = 0;
let THIN_SCROLLBAR_WIDTH = 0;
function _computeScrollbarWidth() {
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
function _getPopupLeftTop(direction: PopupDirection, props: {
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
function _getPopupLeftTopWithFlipAndClamp(props: {
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
type PopupWrapperProps = {
  content: Component;
  direction?: PopupDirection;
  // TODO: arrow?: boolean;
  /** NOTE: open on hover if undefined */
  open?: boolean;
  interactable?: boolean;
};
const popupWrapper = makeComponent(function popupWrapper(props: PopupWrapperProps): RenderReturn {
  const {content, direction: _direction = "up", open, interactable = false} = props;
  const state = this.useState({mouse: {x: -1, y: -1}, open: false, prevOnScroll: null as EventListener | null});
  const wrapper = this.useNode(document.createElement("div"));
  const {windowBottom, windowRight} = this.useWindowResize(); // TODO: just add a window listener
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

type ButtonProps = {
  size?: Size;
  color?: BaseColor;
  onClick?: () => void;
  disabled?: boolean;
}
// inputs
const coloredButton = makeComponent(function coloredButton(text: string, props: ButtonProps = {}) {
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
type InputProps = {
  type?: "text";
  placeholder?: string;
  value: string | number | null | undefined;
  autoFocus?: boolean;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onInput?: (newAllowedValue: string, event: InputEvent) => void;
  onChange?: (newAllowedValue: string, event: Event) => void;
  allowChar?: (char: string) => boolean;
  allowString?: (value: string, prevAllowedValue: string) => string;
} & BaseProps;
const controlledInput = makeComponent(function controlledInput(props: InputProps) {
  const { type = "text", placeholder, value, autoFocus, onFocus, onBlur, onKeyDown, onInput, onChange, allowChar, allowString = (value: string, _prevAllowedValue: string) => value } = props;
  const state = this.useState({ prevAllowedValue: String(value ?? '') });
  const e = this.useNode(document.createElement('input'));
  e.type = type;
  if (placeholder) e.placeholder = placeholder;
  if (autoFocus) e.autofocus = true;
  if (value != null) e.value = String(value);
  e.onfocus = onFocus as _EventListener;
  e.onblur = onBlur as _EventListener;
  e.onkeydown = onKeyDown as _EventListener;
  e.oninput = (_event) => {
    const event = _event as InputEvent;
    if (allowChar && "data" in event) {
      if ((event.data !== null) && !allowChar(event.data)) {
        event.preventDefault();
        event.stopPropagation();
        e.value = state.prevAllowedValue;
        return;
      }
    }
    const allowedValue = allowString(e.value, state.prevAllowedValue);
    state.prevAllowedValue = allowedValue;
    if (allowedValue === e.value) {
      if (onInput) onInput(allowedValue, event);
    }
  }
  e.onchange = (event) => {
    const allowedValue = allowString(e.value, state.prevAllowedValue);
    state.prevAllowedValue = allowedValue;
    if (e.value === allowedValue) {
      if (onChange) onChange(e.value, event);
    } else {
      e.value = allowedValue;
    }
  };
});
type LabeledInputProps = {
  label?: string;
  leftComponent?: Component;
  inputComponent: Component;
  rightComponent?: Component;
} & BaseProps;
const labeledInput = makeComponent(function labeledInput(props: LabeledInputProps) {
  const {label = "", leftComponent, inputComponent, rightComponent} = props;
  const fieldset = this.useNode(document.createElement("fieldset"));
  fieldset.onmousedown = (_event: any) => {
    const event = _event as MouseEvent;
    if (event.target !== inputComponent._.prevNode) {
      event.preventDefault();
    }
  }
  fieldset.onclick = (_event: any) => {
    const event = _event as MouseEvent;
    const prevNode = inputComponent._.prevNode as ParentNodeType;
    if (prevNode && (event.target !== prevNode)) {
      prevNode.focus();
    }
  };
  this.append(legend(label))
  if (leftComponent) this.append(leftComponent);
  this.append(inputComponent);
  if (rightComponent) this.append(rightComponent);
});
const errorMessage = makeComponent(function errorMessage(error: string, props: SpanProps = {}) {
  this.append(span(error, {color: "red", size: "small", ...props}));
});
type TextInputProps = Omit<InputProps, "value"> & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  value: string | null | undefined;
};
const textInput = makeComponent(function textInput(props: TextInputProps) {
  const {label, leftComponent, rightComponent, error, ...extraProps} = props;
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent: controlledInput(extraProps),
    rightComponent,
  }));
  if (error) this.append(errorMessage(error));
});
type NumberArrowProps = {
  onClickUp?: (event: MouseEvent) => void;
  onClickDown?: (event: MouseEvent) => void;
} & BaseProps;
const numberArrows = makeComponent(function numberArrows(props: NumberArrowProps = {}) {
  const { onClickUp, onClickDown } = props;
  this.useNode(document.createElement("div"));
  this.append(icon("arrow_drop_up", {size: "small", onClick: onClickUp}));
  this.append(icon("arrow_drop_down", {size: "small", onClick: onClickDown}));
});
type NumberInputProps = InputProps & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  min?: number,
  max?: number,
  step?: number,
  stepPrecision?: number,
  clearable?: boolean,
  onInput?: ((newAllowedValue: string, event: InputEvent | undefined) => void);
  onChange?: ((newAllowedValue: string, event: KeyboardEvent | undefined) => void)
};
const numberInput = makeComponent(function numberInput(props: NumberInputProps) {
  const {
    label, leftComponent, rightComponent: customRightComponent, error, // labeledInput
    value, min, max, step, stepPrecision, clearable = true, onKeyDown, onInput, onChange, ...extraProps // numberInput
  } = props;
  const stepAndClamp = (number: number) => {
    if (step) {
      const stepOffset = min ?? max ?? 0;
      number = stepOffset + Math.round((number - stepOffset) / step) * step;
    }
    number = Math.min(number, max ?? 1/0);
    number = Math.max(min ?? -1/0, number);
    const defaultStepPrecision = step ? String(step).split(".")[1].length : 0;
    return number.toFixed(stepPrecision ?? defaultStepPrecision);
  };
  const incrementValue = (by: number) => {
    const number = stepAndClamp(+(value ?? 0) + by);
    const newValue = String(number);
    if (onInput) onInput(newValue, undefined);
    if (onChange) onChange(newValue, undefined);
  };
  const inputComponent = controlledInput({
    value,
    onKeyDown: (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          incrementValue(step ?? 1);
          break;
        case "ArrowDown":
          incrementValue(-(step ?? 1));
          break;
      }
      if (onKeyDown) onKeyDown(event);
    },
    onInput,
    onChange,
    ...extraProps,
    allowChar: (c) => "-0123456789".includes(c),
    allowString: (value, prevAllowedValue) => {
      if (value === "") return clearable ? "" : prevAllowedValue;
      let number = +value;
      if (isNaN(number)) return prevAllowedValue;
      return String(stepAndClamp(number));
    },
  });
  const rightComponent = fragment();
  if (customRightComponent) rightComponent.append(customRightComponent);
  rightComponent.append(numberArrows({
    onClickUp: (_event: MouseEvent) => {
      incrementValue(step ?? 1);
      inputComponent._.state.needFocus = true;
      inputComponent.rerender();
    },
    onClickDown: (_event: MouseEvent) => {
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
type TableColumn = {
  label: string;
  onRender: ComponentFunction<[data: {row: any, rowIndex: number, column: TableColumn, columnIndex: number}]>;
  minWidth?: string | number;
  maxWidth?: string | number;
  flex?: string | number;
};
type TableProps = {
  label?: string;
  columns: TableColumn[];
  rows: any[];
  isLoading?: boolean;
  minHeight?: number;
  useMaxHeight?: boolean;
} & BaseProps;
const table = makeComponent(function table(props: TableProps & BaseProps) {
  // TODO: set minHeight to fit N rows
  // TODO: actions, filters, search, paging, selection
  const {label, columns = [], rows = [], isLoading = false, minHeight = 400, useMaxHeight = false} = props;
  const tableWrapper = this.append(div({
    attribute: {useMaxHeight, isLoading},
    style: {minHeight},
  }));
  const makeRow = (className: string, key: string) => div({className, key});
  const makeCell = (column: TableColumn) => div({
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
type Route = {
  path: string;
  defaultPath?: string;
  component: (props?: BaseProps) => Component;
  roles?: string[];
  wrapper?: boolean;
  showInNavigation?: boolean;
  label?: string;
  group?: string;
};
type FallbackRoute = Omit<Route, "path">;
type RouterProps = {
  routes: Route[];
  pageWrapperComponent?: ComponentFunction<[props: PageWrapperProps]>;
  contentWrapperComponent?: ComponentFunction<any>,
  currentRoles?: string[];
  isLoggedIn?: boolean;
  notLoggedInRoute?: FallbackRoute;
  notFoundRoute?: FallbackRoute;
  unauthorizedRoute?: FallbackRoute;
};
type PageWrapperProps = {
  routes: Route[];
  currentRoute: Route;
  contentWrapperComponent: ComponentFunction<any>,
};
const router = makeComponent(function router(props: RouterProps) {
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
  let currentRoute: Route | null = null, params = {}; // TODO: save params in rootComponent?
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
