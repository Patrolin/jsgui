// base component
function parseJsonOrNull(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}
const _NAME_OVERRIDES = {
  htmlSpan: "span",
};
class Component {
  constructor(onRender, onMount, args, key, props) {
    this.name = _NAME_OVERRIDES[onRender.name] || onRender.name; // string
    if (!this.name) throw `Function name cannot be empty: ${onRender}`;
    this.args = args // any[]
    this.key = (key != null) ? String(key) : null;
    this.props = props; // Record<string, any>
    this.children = []; // Component[]
    this.onRender = onRender; // function (...) {}
    this.onMount = onMount;
    this._ = null; // ComponentMetadata | RootComponentMetadata
    this._indexedChildCount = 0; // number
    this._usedKeys = new Set(); // Set<string>
  }
  append(child) {
    this.children.push(child);
    return child;
  }
  useState(defaultState) {
    if (this._.state === null) this._.state = defaultState;
    return this._.state;
  }
  useValidate(getErrors) {
    return () => {
      let errors = {};
      this._.state.errors = getErrors(errors);
      this._.state.didValidate = true;
      const hasErrors = Object.keys(errors).length > 0;
      if (hasErrors) {
        this.rerender();
      }
      return !hasErrors;
    }
  }
  useMedia(mediaQuery) {
    const key = Object.entries(mediaQuery).map(([k, v]) => `(${_camelCaseToKebabCase(k)}: ${_addPx(v)})`).join(' and ');
    const dispatchTarget = DispatchTarget.init(key, _mediaQueryDispatchTargets, (dispatch) => {
      const mediaQueryList = window.matchMedia(key);
      mediaQueryList.addEventListener("change", dispatch);
      return mediaQueryList;
    });
    dispatchTarget.addComponent(this);
    return dispatchTarget.state.matches;
  }
  useLocalStorage(key, defaultValue) {
    _localStorageDispatchTarget.addComponent(this);
    const value = parseJsonOrNull(localStorage[key])?.[0] ?? defaultValue;
    const setValue = (newValue) => {
      localStorage.setItem(key, JSON.stringify([newValue]));
    }
    return [value, setValue];
  }
  useNavigate() {
    return {
      navigate: (url) => location.href = url,
      replace: (url) => location.replace(url),
    }
  }
  rerender() {
    const root_ = this._.root;
    const rootComponent = root_.component;
    const newGcFlag = !root_.gcFlag;
    if (!rootComponent.willRerenderNextFrame) {
      rootComponent.willRerenderNextFrame = true;
      requestAnimationFrame(() => {
        const newRootComponent = _copyComponent(rootComponent);
        root_.gcFlag = newGcFlag;
        root_.component = newRootComponent;
        _render(newRootComponent, newRootComponent._.parentNode);
        _unloadUnusedComponents(rootComponent, newGcFlag);
        rootComponent.willRerenderNextFrame = false;
      });
    }
  }
}
function makeComponent(onRender, onMount = null) {
  return (...argsOrProps) => {
    const argCount = Math.max(0, onRender.length - 1);
    const args = argsOrProps.slice(0, argCount);
    const props = {...argsOrProps[argCount]};
    const key = props.key;
    delete props.key;
    return new Component(onRender, onMount, args, key, props);
  }
}
function _copyComponent(component) {
  const newComponent = new Component(component.onRender, component.onMount, component.args, component.key, component.props);
  newComponent._ = component._;
  return newComponent;
}
class DispatchTarget {
  constructor(addListeners) {
    this.components = []; // Component[]
    this.state = addListeners(() => this.dispatch()); // any
  }
  static init(key, store, addListeners) {
    const oldDT = store[key];
    if (oldDT != null) return oldDT;
    const newDT = new DispatchTarget(addListeners);
    store[key] = newDT;
    return newDT;
  }
  addComponent(component) {
    this.components.push(component);
  }
  removeComponent(component) {
    const i = this.components.indexOf(component);
    if (i !== -1) this.component.splice(i, 1);
  }
  dispatch() {
    for (let component of this.components) {
      component.rerender();
    }
  }
}
const _mediaQueryDispatchTargets = {}; // Record<string, DispatchTarget>
const _localStorageDispatchTarget = new DispatchTarget((dispatch) => window.addEventListener("storage", dispatch));
function _scrollToLocationHash() {
  const element = document.getElementById(location.hash);
  if (element) element.scrollTo();
}
const _locationHashDispatchTarget = new DispatchTarget((dispatch) => {
  window.addEventListener("hashchange", () => {
    _scrollToLocationHash();
    dispatch();
  });
});
class ComponentMetadata {
  constructor() {
    // navigation
    this.prevComponent = null; // Component | null
    this.root = null; // RootComponentMetadata
    this.parent = null // ComponentMetadata | null
    this.keyToChild = {}; // Record<string, ComponentMetadata>
    this.prevIndexedChildCount = null; // number | null
    // state
    this.state = null; // any
    this.prevState = null; // any | null
    this.prevNode = null; // HTMLElement | null
    this.gcFlag = false; // boolean
    this.mediaListeners = {} // Record<string, () => void>
    this.localStorageListeners = {}; // Record<string, () => void>
    this.locationHashListener = null; // (() => void) | null
  }
}
class RootComponentMetadata extends ComponentMetadata {
  constructor(component, parentNode) {
    super();
    this.root = this
    this.component = component;
    this.parentNode = parentNode;
    this.willRerenderNextFrame = false;
  }
}

// render
function renderRoot(component, parentNode = null) {
  component._ = new RootComponentMetadata(component, parentNode);
  window.onload = () => {
    component._.parentNode = component._.parentNode ?? document.body;
    _render(component, component._.parentNode);
    _scrollToLocationHash();
  }
}
function _render(component, parentNode, isStartNode = true, ownerNames = [], cssVars = {}) {
  // render elements
  const {_, name, args, props, onRender, onMount, _indexedChildCount} = component;
  console.log('_render', component, args, props)
  let node = onRender.bind(component)(...args, props);
  if (!(node instanceof Element)) node = null;
  // set prev state
  const prevIndexedChildCount = _.prevIndexedChildCount;
  if (prevIndexedChildCount !== null && (_indexedChildCount !== prevIndexedChildCount)) {
    console.warn(`Varying children should have a "key" prop. (${prevIndexedChildCount} -> ${_indexedChildCount})`, _.prevComponent, component);
  }
  _.prevIndexedChildCount = _indexedChildCount;
  _.prevState = {..._.state};
  _.prevComponent = component;
  // append elements
  const {style = {}, className, attribute = {}} = props;
  if (props.cssVars)
    cssVars = {...cssVars, ...(props.cssVars ?? {})};
  if (node) {
    for (let [k, v] of Object.entries(style)) {
      if (v != null) {
        node.style[k] = _addPx(v);
      }
    }
    for (let [k, v] of Object.entries(cssVars)) {
      if (v != null) {
        console.log(k, v);
        node.style.setProperty(`--${k}`, _addPx(v));
      }
    }
    cssVars = {};
    if (name !== node.tagName.toLowerCase()) {
      ownerNames = [...ownerNames, name];
    }
    for (let ownerName of ownerNames) {
      node.classList.add(ownerName);
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
    for (let [k, v] of Object.entries(attribute)) {
      node.setAttribute(_camelCaseToKebabCase(k), v);
    }
    const prevNode = _.prevNode;
    if (isStartNode && prevNode) {
      prevNode.replaceWith(node);
    } else {
      parentNode.append(node);
    }
    if (onMount) onMount(node, _.state);
    _.prevNode = node;
    parentNode = node;
    isStartNode = false;
    ownerNames = [];
  } else {
    ownerNames = [...ownerNames, name];
  }
  const usedKeys = new Set();
  for (let child of component.children) {
    let key = child.key;
    if (key === null) {
      key = `${child.name}-${component._indexedChildCount++}`;
    }
    if (usedKeys.has(key)) console.warn(`Duplicate key: '${key}'`, component);
    usedKeys.add(key);
    const child_ = _.keyToChild[key] ?? new ComponentMetadata();
    _.keyToChild[key] = child_;
    child._ = child_;
    child_.root = _.root;
    child_.parent = _;
    child_.gcFlag = _.gcFlag;
    _render(child, parentNode, isStartNode, ownerNames, cssVars);
  }
}
function _camelCaseToKebabCase(k) {
  return k.match(/[A-Z][a-z]*|[a-z]+/g).map(v => v.toLowerCase()).join("-");
}
function _addPx(v) {
  return (v?.constructor?.name === "Number") ? `${v}px` : v;
}

// rerender
function _unloadUnusedComponents(prevComponent, gcFlag) {
  for (let child of prevComponent.children) {
    const child_ = child._;
    if (child_.gcFlag !== gcFlag) {
      for (let key in child_.mediaListeners) {
        _mediaQueryDispatchTargets[key].removeComponent(prevComponent);
      }
      _localStorageDispatchTarget.removeComponent(prevComponent);
      _locationHashDispatchTarget.removeComponent(prevComponent);
      delete child_.parent.keyToChild[child.key];
    }
    _unloadUnusedComponents(child, gcFlag);
  }
}

// basic components
const fragment = makeComponent(function fragment(_props) {})
const div = makeComponent(function div(_props) {
  return document.createElement('div');
});
const span = makeComponent(function htmlSpan(text, props) {
  const { fontSize, color, singleLine, fontFamily, href, replacePath, id } = props;
  const isLink = (href != null);
  const e = document.createElement(isLink ? 'a' : 'span');
  e.innerText = text;
  if (fontSize) e.style.fontSize = `var(--fontSize-${fontSize})`;
  if (isLink) {
    e.href = href;
    if (replacePath) {
      e.onclick = (event) => {
        event.preventDefault();
        this.useNavigate().replace(href);
      }
    }
  }
  if (color) e.style.color = `var(--${color})`;
  if (singleLine) {
    e.style.overflow = "hidden";
    e.style.textOverflow = "ellipsis";
    e.styles.whiteSpace = "nowrap";
  }
  if (fontFamily) e.style.fontFamily = `var(--fontFamily-${fontFamily})`;
  if (id) {
    const selfLink = this.append(span("", { href: `#${id}` }));
    selfLink.append(icon("tag", {fontSize: "small"})); // TODO: smaller icon / icon button?
  }
  return e;
});
// https://fonts.google.com/icons
const icon = makeComponent(function icon(iconName, props) {
  const {fontSize, color, onClick} = props;
  const e = document.createElement('span');
  e.classList.add("material-symbols-outlined");
  e.innerText = iconName;
  if (fontSize) e.style.fontSize = `calc(1.5 * var(--fontSize-${fontSize}))`;
  if (color) e.style.color = `var(--${color})`;
  if (onClick) {
    e.onclick = onClick;
    e.setAttribute("tabindex", "-1"); // NOTE: allow having focus
  }
  e.setAttribute("clickable", onClick != null);
  return e;
});
const loadingSpinner = makeComponent(function loadingSpinner(props) {
  this.append(icon("progress_activity", {color: 'blue', ...props}));
});
// inputs
const input = makeComponent(function input(props) {
  const { type = "text", placeholder, value, autoFocus, onKeyDown, onInput, onChange, allowChar, allowString = (value, _prevAllowedValue) => value } = props;
  const state = this.useState({ prevAllowedValue: value ?? '', needFocus: false });
  const e = this._?.prevNode ?? document.createElement('input'); // NOTE: e.remove() must not be called
  e.type = type;
  if (placeholder) e.placeholder = placeholder;
  if (autoFocus) e.autofocus = true;
  if (value != null) e.value = value;
  e.onkeydown = (event) => {
    if (onKeyDown) onKeyDown(event);
    state.needFocus = true;
  };
  e.oninput = (event) => {
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
  e.onchange = (event) => {
    const allowedValue = allowString(e.value, state.prevAllowedValue);
    state.prevAllowedValue = allowedValue;
    if (e.value === allowedValue) {
      if (onChange) onChange(e.value, event);
    } else {
      e.value = allowedValue;
    }
  };
  return e;
}, (e, state) => {
  if (state.needFocus) {
    e.focus();
    state.needFocus = false;
  }
});
const labeledInput = makeComponent(function labeledInput(props) {
  const {label = "", leftComponent, inputComponent, rightComponent} = props;
  const fieldset = document.createElement("fieldset");
  fieldset.onmousedown = (event) => {
    if (event.target !== inputComponent._.prevNode) {
      event.preventDefault();
    }
  }
  fieldset.onclick = (event) => {
    if (event.target !== inputComponent._.prevNode) {
      inputComponent._.prevNode.focus();
    }
  };
  const legend = document.createElement("legend");
  legend.innerText = label;
  fieldset.append(legend);
  if (leftComponent) this.append(leftComponent);
  this.append(inputComponent);
  if (rightComponent) this.append(rightComponent);
  return fieldset;
})
const errorMessage = makeComponent(function errorMessage(error, props) {
  this.append(span(error, {color: "red", fontSize: "small", ...props}));
});
const textInput = makeComponent(function textInput(props) {
  const {label, error, ...extraProps} = props;
  this.append(labeledInput({
    label,
    inputComponent: input(extraProps),
  }));
  if (error) this.append(errorMessage(error));
});
const numberArrows = makeComponent(function numberArrows(props) {
  const { onClickUp, onClickDown } = props;
  const wrapper = this.append(div());
  wrapper.append(icon("arrow_drop_up", {className: "upIcon", onClick: onClickUp}));
  wrapper.append(icon("arrow_drop_down", {className: "downIcon", onClick: onClickDown}));
});
const numberInput = makeComponent(function numberInput(props) {
  const { label, value, error, min, max, step, stepPrecision, clearable = true, onKeyDown, onInput, onChange, leftComponent, ...extraProps } = props;
  const stepAndClamp = (number) => {
    if (step) {
      const stepOffset = min ?? max ?? 0;
      number = stepOffset + Math.round((number - stepOffset) / step) * step;
    }
    number = Math.min(number, max ?? 1/0);
    number = Math.max(min ?? -1/0, number);
    const defaultStepPrecision = step ? String(step).split(".")[1].length : 0;
    return number.toFixed(stepPrecision ?? defaultStepPrecision);
  };
  const incrementValue = (by) => {
    const number = stepAndClamp(+(value ?? 0) + by);
    const newValue = String(number);
    if (onInput) onInput(newValue, event);
    if (onChange) onChange(newValue, event);
  }
  const inputComponent = input({
    value,
    onKeyDown: (event) => {
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
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent,
    rightComponent: numberArrows({
      onClickUp: (_event) => {
        incrementValue(step ?? 1);
        inputComponent._.state.needFocus = true;
        inputComponent.rerender();
      },
      onClickDown: (_event) => {
        incrementValue(-(step ?? 1));
        inputComponent._.state.needFocus = true;
        inputComponent.rerender();
      },
    }),
  }));
  if (error) this.append(errorMessage(error));
});
// table
const table = makeComponent(function table(props) {
  // TODO: set minHeight to fit N rows
  // TODO: actions, filters, search, paging, selection
  const {label, columns = [], rows = [], isLoading = false, minHeight = 400, useMaxHeight = false} = props;
  const tableWrapper = this.append(div({
    attribute: {useMaxHeight, isLoading},
    style: {minHeight},
  }));
  const makeRow = (className) => div({className});
  const makeCell = (column) => div({
    className: "cell",
    style: {flex: column.flex ?? "1 1 0", minWidth: column.minWidth, maxWidth: column.maxWidth},
  });
  if (label) {
    tableWrapper.append(span(label, {className: "label"}))
  }
  if (isLoading) {
    tableWrapper.append(loadingSpinner());
  } else {
    const headerWrapper = tableWrapper.append(makeRow("row header"));
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      const cellWrapper = headerWrapper.append(makeCell(column));
      cellWrapper.append(span(column.label));
    }
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      let row = rows[rowIndex];
      const rowWrapper = tableWrapper.append(makeRow("row body"));
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        let column = columns[columnIndex];
        const cellWrapper = rowWrapper.append(makeCell(column));
        cellWrapper.append(column.onRender({row, rowIndex, column, columnIndex}));
      }
    }
  }
});
// router
// type Route = { path: string, component: () => Component, roles: string[], wrapper?: boolean };
const router = makeComponent(function router(props) {
  const {
    routes,
    wrapperComponent = fragment(),
    roles,
    isLoggedIn,
    notLoggedInRoute = { path: ".*", component: fragment },
    unauthorizedRoute = { path: ".*", component: fragment },
  } = props;
  let lPath = location.pathname;
  if (location.protocol === "file:") {
    const acc = lPath.split("/");
    lPath = `/${acc[acc.length - 1]}`;
  }
  if (lPath.endsWith("/index.html")) lPath = lPath.slice(0, -10);
  let route = null, params = {};
  for (let [k, v] of Object.entries(routes)) {
    const regex = k.replace(/:([^/]+)/g, (_match, g1) => `(?<${g1}>[^/]*)`);
    const match = lPath.match(new RegExp(`^${regex}$`));
    if (match != null) {
      params = match.groups;
      if (v.roles && !(roles ?? []).some(role => v.roles.includes(role))) {
        route = isLoggedIn ? notLoggedInRoute : unauthorizedRoute;
      } else {
        route = v;
      }
      break;
    }
  }
  if (route) {
    if (route.wrapper ?? true) {
      this.append(wrapperComponent);
      wrapperComponent.append(route.component({params}));
    } else {
      this.append(route.component({params}));
    }
  }
})
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
*/
// TODO: history api
// TODO: more input components (button, radio, checkbox/switch, select, date/date range input, file input)
// TODO: tooltips, badges, dialogs
// TODO: snackbar api
// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API ?
// TODO: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog ?
