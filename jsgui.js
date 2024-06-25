// base component
class Component {
  constructor(_render, args = [], key = null, props = {}) {
    this.name = _render.name; // string
    this.args = args // any[]
    this.key = (key != null) ? String(key) : null;
    this.props = props; // Record<string, any>
    this.children = []; // Component[]
    this._render = _render; // function (...) {}
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
  useMedia(mediaQuery) {
    const mediaQueryString = Object.entries(mediaQuery).map(([k, v]) => `(${_camelCaseToKebabCase(k)}: ${_addPx(v)})`).join(' and ');
    let mediaQueryList = _mediaQueryLists[mediaQueryString];
    if (!mediaQueryList) {
      mediaQueryList = window.matchMedia(mediaQueryString);
      _mediaQueryLists[mediaQueryString] = mediaQueryList;
    }
    let listener = this._.mediaListeners[mediaQueryString];
    if (!listener) {
      listener = () => {
        this.rerender();
      };
      mediaQueryList.addEventListener("change", listener);
      this._.mediaListeners[mediaQueryString] = listener;
    }
    return mediaQueryList.matches;
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
function makeComponent(_render) {
  return (...argsOrProps) => {
    const argCount = Math.max(0, _render.length - 1);
    const args = argsOrProps.slice(0, argCount);
    const props = {...argsOrProps[argCount]};
    const key = props.key;
    delete props.key;
    return new Component(_render, args, key, props);
  }
}
function _copyComponent(component) {
  const newComponent = new Component(component._render, component.args, component.key, component.props);
  newComponent._ = component._;
  return newComponent;
}
const _mediaQueryLists = {} // Record<string, MediaQueryList>
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
  }
}
function _render(component, parentNode, isStartNode = true, ownerNames = []) {
  // render elements
  const {_} = component;
  const node = component._render.bind(component)(...component.args, component.props);
  // set prev state
  const indexedChildCount = component._indexedChildCount;
  const prevIndexedChildCount = _.prevIndexedChildCount;
  if (prevIndexedChildCount !== null && (indexedChildCount !== prevIndexedChildCount)) {
    console.warn(`Varying children should have a "key" prop. (${prevIndexedChildCount} -> ${indexedChildCount})`, _.prevComponent, component);
  }
  _.prevIndexedChildCount = indexedChildCount;
  _.prevState = {..._.state};
  _.prevComponent = component;
  // append elements
  const {style = {}, className, attribute = {}} = component.props;
  if (node) {
    for (let [k, v] of Object.entries(style)) {
      node.style[k] = _addPx(v);
    }
    if (component.name !== node.tagName.toLowerCase()) {
      ownerNames = [...ownerNames, component.name];
    }
    for (let ownerName of ownerNames) {
      node.classList.add(ownerName);
    }
    if (Array.isArray(className)) {
      for (let v of className) {
        node.classList.add(v);
      }
    } else if (className) {
      node.classList.add(className);
    }
    for (let [k, v] of Object.entries(attribute)) {
      node.setAttribute(_camelCaseToKebabCase(k), v);
    }
    const prevNode = _.prevNode;
    if (isStartNode && prevNode) {
      prevNode.after(node);
      prevNode.remove();
    } else {
      parentNode.append(node);
    }
    _.prevNode = node;
    parentNode = node;
    isStartNode = false;
    ownerNames = [];
  } else {
    ownerNames = [...ownerNames, component.name];
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
    _render(child, parentNode, isStartNode, ownerNames);
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
      for (let [k, listener] of Object.entries(child_.mediaListeners)) {
        _mediaQueryLists[k].removeEventListener('change', listener);
      }
      delete child_.parent.keyToChild[child.key];
    }
    _unloadUnusedComponents(child, gcFlag);
  }
}

// components
const div = makeComponent(function div(_props) {
  return document.createElement('div');
});
const span = makeComponent(function span(text, props) {
  const { fontSize, color, singleLine, fontFamily } = props;
  const e = document.createElement('span');
  e.innerText = text;
  if (fontSize) e.style.fontSize = `var(--fontSize-${fontSize})`;
  if (color) e.style.color = `var(--${color})`;
  if (singleLine) {
    e.style.overflow = "hidden";
    e.style.textOverflow = "ellipsis";
    e.styles.whiteSpace = "nowrap";
  }
  if (fontFamily) e.style.fontFamily = `var(--fontFamily-${fontFamily})`;
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
    e.setAttribute("tabindex", "-1"); // allow having focus¨
    // TODO: keep focus after rerender
  }
  e.setAttribute("clickable", onClick != null);
  return e;
});
const input = makeComponent(function input(props) {
  const { type = "text", value, autoFocus, onKeyDown, onInput, onChange, allowChar, allowString = (value, _prevAllowedValue) => value } = props;
  const state = this.useState({ prevAllowedValue: value ?? '', needFocus: false });
  const e = this._?.prevNode ?? document.createElement('input'); // NOTE: e.remove() must not be called
  e.type = type;
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
  setTimeout(() => {
    if (state.needFocus) {
      e.focus();
      if (e !== document.activeElement) {
        e.select();
        e.setSelectionRange(-1, -1);
      }
      state.needFocus = false;
    }
  });
  return e;
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
  //const inputWrapper = this.append(div());
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
})
const numberInput = makeComponent(function numberInput(props) {
  const { label, value, error, min, max, step, clearable = true, onKeyDown, onInput, onChange, leftComponent, ...extraProps } = props;
  const stepAndClamp = (number) => {
    if (step) {
      const stepOffset = min ?? max ?? 0;
      number = number - ((number - stepOffset) % step);
    }
    number = Math.min(number, max ?? 1/0);
    return Math.max(min ?? -1/0, number);
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
        inputComponent._.state.needFocus = true; // TODO: this flashes :focus-within on and off...
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
// TODO: more input components (buttons, radios, checkboxes, switches, selects, date/date range input, file input)
// TODO: tooltips, badges, dialogs, loading spinners
// TODO: links
// TODO: flexbox table
// TODO: history api
// TODO: snackbar api
/*
// TODO: document validation api
const validate = () => {
  const {errors} = state;
  if (state.username.length < 4) state.errors.username = "Username must have at least 4 characters."
  this.rerender();
}
*/
// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API ?
// TODO: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog ?
