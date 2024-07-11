// TODO: make a typescript compiler to compile packages like odin
const JSGUI_VERSION = "v0.3-dev";
type Nullsy = undefined | null;
type StringMap<T = any> = Record<string, T>;
type JSONValue = string | number | any[] | StringMap | null;
// utils
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
// base component
type ElementType = HTMLElement;
type BaseFragmentProps = {
  key?: string;
  cssVars?: StringMap<string | number | undefined>;
};
type _BaseProps = { // TODO: pass through all base props
  style?: StringMap<string | number | undefined>;
  className?: string | string[];
  attribute?: StringMap<string | number | boolean>;
};
type BaseProps = BaseFragmentProps & _BaseProps;
type RenderFunction<T extends any[]> = (this: Component, ...argsOrProps: T) => ElementType | void;
type ComponentFunction<T extends any[]> = (...argsOrProps: T) => Component;
type ComponentOptions = {
  name?: string;
  onMount?: (component: Component, node: ElementType) => void;
};
type GetErrorsFunction = (errors: StringMap<string>) => void; // TODO: type this
class Component {
  name: string;
  args: any[];
  baseProps: BaseProps;
  props: StringMap;
  children: Component[];
  onRender: RenderFunction<any[]>;
  options: ComponentOptions;
  _: ComponentMetadata | RootComponentMetadata;
  _indexedChildCount: number;
  _usedKeys: Set<string>;
  _mediaKeys: string[];
  constructor(onRender: RenderFunction<any[]>, args: any[], baseProps: BaseProps, props: StringMap, options: ComponentOptions) {
    this.name = options.name ?? onRender.name;
    if (!this.name && (options.name !== "")) throw `Function name cannot be empty: ${onRender}`;
    this.args = args
    this.baseProps = baseProps;
    this.props = props;
    this.children = [];
    this.onRender = onRender;
    this.options = options;
    this._ = null as any;
    this._indexedChildCount = 0;
    this._usedKeys = new Set();
    this._mediaKeys = [];
  }
  append(child: Component) {
    this.children.push(child);
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
  useValidate(getErrors: GetErrorsFunction) {
    return () => {
      let errors = {};
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
    this._mediaKeys.push(key);
    const dispatchTarget = DispatchTarget.init(key, _mediaQueryDispatchTargets, (dispatch) => {
      const mediaQueryList = window.matchMedia(key);
      mediaQueryList.addEventListener("change", dispatch);
      return mediaQueryList;
    });
    dispatchTarget.addComponent(this);
    return dispatchTarget.state.matches;
  }
  useLocalStorage<T>(key: string, defaultValue: T): [T, (newValue: T) => void] { // TODO: listen to same page option
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
}
function makeComponent<A extends Parameters<any>>(onRender: RenderFunction<A>, options: ComponentOptions = {}): ComponentFunction<A> { // TODO: make this be typed properly
  return (...argsOrProps: any[]) => {
    const argCount = Math.max(0, onRender.length - 1);
    const args = argsOrProps.slice(0, argCount);
    const propsAndBaseProps = (argsOrProps[argCount] ?? {}) as BaseProps & StringMap;
    const {key, style, attribute, className, cssVars, ...props} = propsAndBaseProps;
    const baseProps = {key: (key != null) ? String(key) : undefined, style, attribute, className, cssVars};
    return new Component(onRender, args, baseProps, props, options);
  }
}
function _copyComponent(component: Component) {
  const newComponent = new Component(component.onRender, component.args, component.baseProps, component.props, component.options);
  newComponent._ = component._;
  return newComponent;
}
type DispatchTargetAddListeners = (dispatch: () => void) => any;
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
class ComponentMetadata {
  // state
  stateIsInitialized: boolean = false
  state: StringMap = {};
  prevState: any | null = null;
  prevNode: ElementType | null = null;
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
  parentNode: ElementType;
  willRerenderNextFrame: boolean = false;
  constructor(component: Component, parentNode: ElementType) {
    super(null);
    this.root = this;
    this.component = component;
    this.parentNode = parentNode;
  }
}

// render
function renderRoot(component: Component, parentNode = null) {
  const root_ = new RootComponentMetadata(component, parentNode as any);
  component._ = root_;
  window.onload = () => {
    root_.parentNode = root_.parentNode ?? document.body;
    _render(component, root_.parentNode);
    setTimeout(() => {
      _scrollToLocationHash();
    })
  }
}
function _render(component: Component, parentNode: ElementType, isTopNode = true, inheritedCssVars: BaseProps['cssVars'] = {}, inheritedNames: string[] = []) {
  // render elements
  const {_, name, args, baseProps, props, onRender, options, _indexedChildCount} = component;
  const {onMount} = options;
  let node = onRender.bind(component)(...args, props);
  if (!(node instanceof Element)) node = undefined;
  // set prev state
  const prevIndexedChildCount = _.prevIndexedChildCount;
  if (prevIndexedChildCount !== null && (_indexedChildCount !== prevIndexedChildCount)) {
    console.warn(`Varying children should have a "key" prop. (${prevIndexedChildCount} -> ${_indexedChildCount})`, _.prevComponent, component);
  }
  _.prevIndexedChildCount = _indexedChildCount;
  _.prevState = {..._.state};
  _.prevComponent = component;
  // append element
  const {style = {}, className, attribute = {}, cssVars} = baseProps;
  if (cssVars) inheritedCssVars = {...inheritedCssVars, ...cssVars};
  if (node) {
    // style
    for (let [k, v] of Object.entries(style)) {
      if (v != null) {
        node.style[k as any] = addPx(v);
      }
    }
    for (let [k, v] of Object.entries(inheritedCssVars)) {
      if (v != null) {
        node.style.setProperty(`--${k}`, addPx(v));
      }
    }
    // class
    if (name !== node.tagName.toLowerCase()) {
      inheritedNames = [...inheritedNames, name];
    }
    for (let inheritedName of inheritedNames) {
      node.classList.add(inheritedName);
    }
    if (Array.isArray(className)) {
      for (let v of className) {
        node.classList.add(v);
      }
    } else if (className) {
      for (let v of className.split(" ")) {
        if (v) node.classList.add(v);
      }
    }
    // attribute
    for (let [k, v] of Object.entries(attribute)) {
      node.setAttribute(camelCaseToKebabCase(k), String(v));
    }
    // append
    const prevNode = _.prevNode;
    if (isTopNode && prevNode) {
      prevNode.replaceWith(node);
    } else {
      parentNode.append(node);
    }
    if (onMount) onMount(component, node);
    _.prevNode = node;
    // inherit
    parentNode = node;
    isTopNode = false;
    inheritedCssVars = {};
    inheritedNames = [];
  } else {
    if (name) inheritedNames = [...inheritedNames, name];
  }
  // children
  const usedKeys = new Set();
  for (let child of component.children) {
    let key = child.baseProps.key;
    if (key == null) {
      key = `${child.name}-${component._indexedChildCount++}`;
    }
    if (usedKeys.has(key)) console.warn(`Duplicate key: '${key}'`, component);
    usedKeys.add(key);
    const child_ = _.keyToChild[key] ?? new ComponentMetadata(_);
    _.keyToChild[key] = child_;
    child._ = child_;
    child_.gcFlag = _.gcFlag;
    _render(child, parentNode, isTopNode, inheritedCssVars, inheritedNames);
  }
}

// rerender
function _unloadUnusedComponents(prevComponent: Component, gcFlag: boolean) {
  for (let child of prevComponent.children) {
    const child_ = child._;
    if (child_.gcFlag !== gcFlag) {
      for (let key of child._mediaKeys) {
        _mediaQueryDispatchTargets[key].removeComponent(prevComponent);
      }
      _localStorageDispatchTarget.removeComponent(prevComponent);
      delete child_.parent?.keyToChild[child.baseProps.key as any];
    }
    _unloadUnusedComponents(child, gcFlag);
  }
}

// basic components
const fragment = makeComponent(function fragment(_props: BaseProps = {}) {}, { name: '' });
const div = makeComponent(function div(_props: BaseProps = {}) {
  return document.createElement('div');
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
  selfLink?: string;
  onClick?: (event: MouseEvent) => void;
} & BaseProps;
const span = makeComponent(function _span(text: string | number | null | undefined, props: SpanProps = {}) {
  let { iconName, size, color, singleLine, fontFamily, href, replacePath, selfLink, onClick } = props;
  if (selfLink) {
    const selfLinkWrapper = this.append(div({ className: "selfLink", attribute: { id: selfLink } }));
    selfLinkWrapper.append(span(text, {...props, selfLink: undefined}));
    selfLinkWrapper.append(icon("tag", { size: "normal", href: `#${selfLink}` }));
    return;
  }
  const isLink = (href != null);
  const e = document.createElement(isLink ? 'a' : 'span');
  if (iconName) {
    e.classList.add("material-symbols-outlined");
    if (size) e.style.fontSize = `calc(1.25 * var(--size-${size}))`;
  } else {
    if (size) e.style.fontSize = `var(--size-${size})`;
  }
  if (color) e.style.color = `var(--${color})`;
  if (singleLine) {
    e.style.overflow = "hidden";
    e.style.textOverflow = "ellipsis";
    e.style.whiteSpace = "nowrap";
  }
  if (fontFamily) e.style.fontFamily = `var(--fontFamily-${fontFamily})`;
  if (isLink) {
    (e as HTMLAnchorElement).href = href;
    if (replacePath) {
      e.onclick = (event) => {
        event.preventDefault();
        this.useNavigate().replace(href);
        if (onClick) onClick(event);
      }
    }
  } else {
    if (onClick) {
      e.onclick = onClick;
      e.setAttribute("tabindex", "-1");
      e.setAttribute("clickable", "true");
    }
  }
  e.innerText = iconName || (text == null ? "" : String(text));
  return e;
}, { name: "span" });
// https://fonts.google.com/icons
type IconProps = SpanProps;
const icon = makeComponent(function icon(iconName: string, props: IconProps = {}) {
  let {size, style = {}, ...extraProps} = props;
  this.append(span("", {iconName, size, style, ...extraProps}));
});
const loadingSpinner = makeComponent(function loadingSpinner(props: IconProps = {}) {
  this.append(icon("progress_activity", props));
});
// inputs
type ButtonProps = {
  size?: Size;
  color?: BaseColor;
  secondary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}
const button = makeComponent(function button(text: string, props: ButtonProps = {}) {
  const {size, color, onClick, disabled} = props;
  const e = document.createElement("button");
  e.innerText = text;
  if (size) e.style.fontSize = `var(--size-${size ?? "normal"})`;
  if (color) {
    e.style.setProperty("--buttonColor", `var(--${color})`);
    e.style.setProperty("--buttonColorHover", `var(--${color}-033)`);
    e.style.setProperty("--buttonColorActive", `var(--${color}-067)`);
  }
  if (disabled) e.setAttribute("disabled", "true");
  else if (onClick) e.onclick = onClick;
  return e;
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
  onChange?: (newAllowedValue: string, event: KeyboardEvent) => void;
  allowChar?: (char: string) => boolean;
  allowString?: (value: string, prevAllowedValue: string) => string;
} & BaseProps;
const input = makeComponent(function input(props: InputProps) {
  const { type = "text", placeholder, value, autoFocus, onFocus, onBlur, onKeyDown, onInput, onChange, allowChar, allowString = (value: string, _prevAllowedValue: string) => value } = props;
  const state = this.useState({ prevAllowedValue: String(value ?? ''), needFocus: false });
  const e = (this._?.prevNode ?? document.createElement('input')) as HTMLInputElement; // NOTE: e.remove() must not be called
  e.type = type;
  if (placeholder) e.placeholder = placeholder;
  if (autoFocus) e.autofocus = true;
  if (value != null) e.value = String(value);
  e.onfocus = (event: FocusEvent) => {
    if (onFocus) onFocus(event);
  }
  e.onblur = (event: FocusEvent) => {
    if (onBlur) onBlur(event);
  }
  e.onkeydown = (event: KeyboardEvent) => {
    if (onKeyDown) onKeyDown(event);
    state.needFocus = true;
  };
  e.oninput = (_event: Event) => {
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
    state.needFocus = true;
    if (allowedValue === e.value) {
      if (onInput) onInput(allowedValue, event);
    }
  }
  e.onchange = (_event: Event) => {
    const event = _event as KeyboardEvent;
    const allowedValue = allowString(e.value, state.prevAllowedValue);
    state.prevAllowedValue = allowedValue;
    if (e.value === allowedValue) {
      if (onChange) onChange(e.value, event);
    } else {
      e.value = allowedValue;
    }
  };
  return e;
}, {
  onMount(component, e) {
    const state = component._.state;
    if (state.needFocus) {
      e.focus();
      state.needFocus = false;
    }
  },
});
type LabeledInputProps = {
  label?: string;
  leftComponent?: Component;
  inputComponent: Component;
  rightComponent?: Component;
} & BaseProps;
const labeledInput = makeComponent(function labeledInput(props: LabeledInputProps) {
  const {label = "", leftComponent, inputComponent, rightComponent} = props;
  const fieldset = document.createElement("fieldset");
  fieldset.onmousedown = (event) => {
    if (event.target !== inputComponent._.prevNode) {
      event.preventDefault();
    }
  }
  fieldset.onclick = (event) => {
    const prevNode = inputComponent._.prevNode;
    if (prevNode && (event.target !== prevNode)) {
      prevNode.focus();
    }
  };
  const legend = document.createElement("legend");
  legend.innerText = label;
  fieldset.append(legend);
  if (leftComponent) this.append(leftComponent);
  this.append(inputComponent);
  if (rightComponent) this.append(rightComponent);
  return fieldset;
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
  wrapper.append(icon("arrow_drop_up", {className: "upIcon", onClick: onClickUp}));
  wrapper.append(icon("arrow_drop_down", {className: "downIcon", onClick: onClickDown}));
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
  const makeRow = (className: string) => div({className});
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
    const headerWrapper = tableWrapper.append(makeRow("tableRow tableHeader"));
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      const cellWrapper = headerWrapper.append(makeCell(column));
      cellWrapper.append(span(column.label));
    }
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      let row = rows[rowIndex];
      const rowWrapper = tableWrapper.append(makeRow("tableRow tableBody"));
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
// TODO: tooltips, badges, dialogs
// TODO: snackbar api
// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API ?
// TODO: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog ?
