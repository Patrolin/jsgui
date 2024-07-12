// TODO: make a typescript compiler to compile packages like odin
// utils
const JSGUI_VERSION = "v0.4-dev";
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
function addPx(value: string | number) {
  return (value?.constructor?.name === "Number") ? `${value}px` : value as string;
}
type Nullsy = undefined | null;
type StringMap<T = any> = Record<string, T>;
type JSONValue = string | number | any[] | StringMap | null;
type NodeType = HTMLElement;
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
type RenderFunction<T extends any[]> = (this: Component, ...argsOrProps: T) => {
  onMount?: (havePrevNode: boolean) => void,
} | void;
type GetErrorsFunction<K extends string> = (errors: Partial<Record<K, string>>) => void;
// component
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
  mediaKeys: string[];
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
    this.mediaKeys = [];
  }
  useNode<T extends NodeType>(defaultNode: T): T {
    return (this.node = (this._?.prevNode ?? defaultNode)) as T;
  }
  append(child: Component) {
    this.children.push(child);
    let key = child.baseProps.key;
    if (key == null) {
      key = `${child.name}-${this.indexedChildCount++}`;
    }
    child.key = key;
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
  useValidate<K extends string>(getErrors: GetErrorsFunction<K>) { // TODO: document this
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
  useMedia(mediaQuery: StringMap<string | number>) { // TODO: type this
    const key = Object.entries(mediaQuery).map(([k, v]) => `(${camelCaseToKebabCase(k)}: ${addPx(v)})`).join(' and ');
    this.mediaKeys.push(key);
    const dispatchTarget = DispatchTarget.init(key, _mediaQueryDispatchTargets, (dispatch) => {
      const mediaQueryList = window.matchMedia(key);
      mediaQueryList.addEventListener("change", dispatch);
      return mediaQueryList;
    });
    dispatchTarget.addComponent(this);
    return dispatchTarget.state.matches;
  }
  useLocalStorage<T>(key: string, defaultValue: T): [T, (newValue: T) => void] { // TODO: signal same page option
    _localStorageDispatchTarget.addComponent(this);
    const value = (parseJsonOrNull(localStorage[key]) as [T] | null)?.[0] ?? defaultValue;
    const setValue = (newValue: T) => {
      localStorage.setItem(key, JSON.stringify([newValue]));
    }
    return [value, setValue];
  }
  useNavigate() {
    return {
      navigate: (url: string) => location.href = url,
      replace: (url: string) => location.replace(url),
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
  constructor(addListeners: DispatchTargetAddListeners) {
    this.components = [];
    this.state = addListeners(() => this.dispatch());
  }
  static init(key: string, store: StringMap<DispatchTarget>, addListeners: DispatchTargetAddListeners) {
    const oldDT = store[key];
    if (oldDT != null) return oldDT;
    const newDT = new DispatchTarget(addListeners);
    store[key] = newDT;
    return newDT;
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
const _mediaQueryDispatchTargets: StringMap<DispatchTarget> = {};
const _localStorageDispatchTarget = new DispatchTarget((dispatch) => window.addEventListener("storage", dispatch));
function _scrollToLocationHash() {
  const element = document.getElementById(location.hash.slice(1));
  if (element) element.scrollIntoView();
}
const _locationHashDispatchTarget = new DispatchTarget((dispatch) => {
  window.addEventListener("hashchange", () => {
    _scrollToLocationHash();
    dispatch();
  });
});

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
  parentNode: NodeType;
  willRerenderNextFrame: boolean = false;
  constructor(component: Component, parentNode: NodeType) {
    super(null);
    this.root = this;
    this.component = component;
    this.parentNode = parentNode;
  }
}

// render
function renderRoot(rootComponent: Component, parentNode = null) {
  const root_ = new RootComponentMetadata(rootComponent, parentNode as any);
  rootComponent._ = root_;
  window.onload = () => {
    root_.parentNode = root_.parentNode ?? document.body;
    _render(rootComponent, root_.parentNode);
    requestAnimationFrame(() => {
      _scrollToLocationHash();
    });
  }
}
type InheritedBaseProps = UndoPartial<Omit<BaseProps, "key" | "events">> & {className: string[]};
const _START_BASE_PROPS: InheritedBaseProps = {
  attribute: {},
  className: [],
  cssVars: {},
  style: {},
};
function _render(component: Component, parentNode: NodeType, _inheritedBaseProps: InheritedBaseProps = _START_BASE_PROPS, isTopNode = true) {
  // render elements
  const {_, name, args, baseProps, props, onRender, indexedChildCount: _indexedChildCount} = component;
  const {onMount} = onRender.bind(component)(...args, props) ?? {};
  const node = component.node;
  // warn if missing keys
  const prevIndexedChildCount = _.prevIndexedChildCount;
  if (prevIndexedChildCount !== null && (_indexedChildCount !== prevIndexedChildCount)) {
    console.warn(`Varying children should have a "key" prop. (${prevIndexedChildCount} -> ${_indexedChildCount})`, _.prevComponent, component);
  }
  // inherit
  let inheritedBaseProps = {
    attribute: {..._inheritedBaseProps.attribute, ...baseProps.attribute},
    className: [..._inheritedBaseProps.className, ...baseProps.className],
    cssVars: {..._inheritedBaseProps.cssVars, ...baseProps.cssVars},
    style: {..._inheritedBaseProps.style, ...baseProps.style},
  };
  // append
  const prevNode = _.prevNode;
  if (node) {
    if (prevNode) {
      const prevName = _.prevComponent?.name;
      if (name !== prevName) {
        prevNode.replaceWith(node);
        _.prevEvents = {} as EventsMap;
      }
    } else {
      parentNode.append(node);
    }
    // style
    const styleDiff = getDiff(_.prevBaseProps.style, inheritedBaseProps.style);
    for (let {key, newValue} of styleDiff) {
      if (newValue) {
        node.style[key as any] = addPx(newValue);
      } else {
        node.style.removeProperty(key);
      }
    }
    // cssVars
    const cssVarsDiff = getDiff(_.prevBaseProps.cssVars, inheritedBaseProps.cssVars);
    for (let {key, newValue} of cssVarsDiff) {
      if (newValue) {
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
      if (newValue) {
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
        node.addEventListener(key, newValue as _EventListener);
      }
    }
    parentNode = node;
    inheritedBaseProps = _START_BASE_PROPS;
    isTopNode = false;
  } else {
    if (prevNode) {
      prevNode.remove(); // NOTE: removing components is handled by _unloadUnusedComponents()
      _.prevNode = null;
      _.prevBaseProps = _START_BASE_PROPS;
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
  if (onMount) onMount(_.prevNode != null);
  _.prevNode = node;
  _.prevBaseProps = inheritedBaseProps;
  _.prevIndexedChildCount = _indexedChildCount;
  _.prevState = {..._.state};
  _.prevComponent = component;
}

// rerender
function _unloadUnusedComponents(prevComponent: Component, rootGcFlag: boolean) {
  for (let child of prevComponent.children) {
    const child_ = child._;
    if (child_.gcFlag !== rootGcFlag) {
      for (let key of child.mediaKeys) {
        _mediaQueryDispatchTargets[key].removeComponent(prevComponent);
      }
      _localStorageDispatchTarget.removeComponent(prevComponent);
      const key = child.key;
      delete child_.parent?.keyToChild[key];
      const prevNode = child_.prevNode;
      if (prevNode) prevNode.remove();
    }
    _unloadUnusedComponents(child, rootGcFlag);
  }
}

// basic components
const fragment = makeComponent(function fragment(_props: BaseProps = {}) {}, { name: '' });
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
const COLOR_SHADES = ["", "033", "067", "1", "2", "3"];
type SpanProps = {
  iconName?: string;
  size?: Size;
  color?: string;
  singleLine?: string;
  fontFamily?: string;
  href?: string;
  replacePath?: boolean;
  id?: string;
  selfLink?: string;
  onClick?: (event: MouseEvent) => void;
} & BaseProps;
const span = makeComponent(function _span(text: string | number | null | undefined, props: SpanProps = {}) {
  let { iconName, size, color, singleLine, fontFamily, href, replacePath, id, selfLink, onClick } = props;
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
  if (isLink) {
    (e as HTMLAnchorElement).href = href;
    if (replacePath) {
      e.onclick = (event: MouseEvent) => {
        event.preventDefault();
        this.useNavigate().replace(href);
        if (onClick) onClick(event);
      }
    }
  } else {
    if (onClick) {
      e.onclick = onClick;
      attribute.tabindex = "-1";
      attribute.clickable = "true";
    }
  }
  e.innerText = iconName || (text == null ? "" : String(text));
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
const htmlLegend = makeComponent(function htmlLegend(text: string, _props: BaseProps = {}) {
  const node = this.useNode(document.createElement("legend"));
  node.innerText = text;
  this.baseProps.className.push("ellipsis");
}, {
  name: "legend",
});
type DialogProps = BaseProps & {
  open: boolean;
  onClose: () => void;
  closeOnClickBackdrop?: boolean;
};
const dialog = makeComponent(function dialog(props: DialogProps) {
  const {open, onClose, closeOnClickBackdrop} = props;
  const state = this.useState({ prevOpen: false });
  const e = this.useNode(document.createElement("dialog"));
  e.onclick = (event) => {
    if (closeOnClickBackdrop && (event.target === e)) onClose();
  }
  const onLoad = () => {
    if (open !== state.prevOpen) {
      if (open) {
        e.showModal();
      } else {
        e.close();
      }
      state.prevOpen = open;
    }
  };
  return {
    onMount: onLoad,
  }
});
// TODO: popover, onAnyScroll

type ButtonProps = {
  size?: Size;
  color?: BaseColor;
  onClick?: () => void;
  disabled?: boolean;
}
// inputs
const button = makeComponent(function button(text: string, props: ButtonProps = {}) {
  const {size, color, onClick, disabled} = props;
  const e = this.useNode(document.createElement("button"));
  if (text) this.append(span(text));
  const {attribute, cssVars} = this.baseProps;
  if (size) attribute.dataSize = size;
  if (color) {
    cssVars.buttonColor = `var(--${color})`;
    cssVars.buttonColorHover = `var(--${color}-033)`;
    cssVars.buttonColorActive = `var(--${color}-067)`;
  }
  if (disabled) attribute.disabled = "true";
  else if (onClick) {
    e.onclick = onClick;
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
const input = makeComponent(function input(props: InputProps) {
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
    const prevNode = inputComponent._.prevNode;
    if (prevNode && (event.target !== prevNode)) {
      prevNode.focus();
    }
  };
  this.append(htmlLegend(label))
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
    inputComponent: input(extraProps),
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
  const wrapper = this.append(div());
  wrapper.append(icon("arrow_drop_up", {size: "small", onClick: onClickUp}));
  wrapper.append(icon("arrow_drop_down", {size: "small", onClick: onClickDown}));
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
  const inputComponent = input({
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
  div({...})
  span(text)
  span(text, {href})
  icon(iconName)
  textInput({label, value})
  numberInput({label, value})
  loadingSpinner()
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
  useState()
  useLocalStorage()
  useNavigate()
*/
// TODO: more input components (button, radio, checkbox/switch, select, date/date range input, file input)
// TODO: tooltips, badges
// TODO: snackbar api
// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API ?
// TODO: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog ?
