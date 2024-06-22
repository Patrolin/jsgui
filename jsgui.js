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
    let {_, _usedKeys} = this;
    let key = child.key;
    if (key === null) {
      key = `${child.name}-${this._indexedChildCount++}`;
    }
    if (_usedKeys.has(key)) console.warn(`Duplicate key: '${key}'`, this);
    _usedKeys.add(key);
    const child_ = _.keyToChild[key] ?? new ComponentMetadata();
    _.keyToChild[key] = child_;
    child._ = child_;
    child_.root = _.root;
    child_.parent = _;
    child_.gcFlag = _.gcFlag;
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
  const {style = {}, attribute = {}} = component.props; // TODO: handle className
  if (node) {
    for (let [k, v] of Object.entries(style)) {
      node.style[_camelCaseToKebabCase(k)] = _addPx(v);
    }
    if (component.name !== node.tagName.toLowerCase()) {
      ownerNames = [...ownerNames, component.name];
    }
    for (let ownerName of ownerNames) {
      node.classList.add(ownerName);
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
  for (let child of component.children) {
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
const span = makeComponent(function span(text, _props) {
  const e = document.createElement('span');
  e.innerText = text;
  return e;
});
const div = makeComponent(function div(_props) {
  return document.createElement('div');
});
const input = makeComponent(function input(props) {
  const { type, value, onInput, onChange } = props;
  const state = this.useState({ needFocus: false });
  const e = this._?.prevNode ?? document.createElement('input'); // NOTE: e.remove() must never be called
  if (value != null) e.value = value;
  e.type = type ?? "text";
  if (onInput) e.oninput = (event) => {
    onInput(event);
    state.needFocus = true;
  }
  if (onChange) e.onchange = onChange;
  setTimeout(() => {
    if (state.needFocus) {
      //e.setSelectionRange(e.value.length, e.value.length);
      e.focus();
      state.needFocus = false;
    }
  });
  return e;
});
const fieldset = makeComponent(function fieldset(props) {
  const {redirectFocusTo} = props;
  const e = document.createElement('fieldset');
  if (redirectFocusTo) {
    e.onmousedown = (event) => {
      if (event.target !== redirectFocusTo._.prevNode) {
        event.preventDefault();
      }
    }
    e.onclick = (event) => {
      if (event.target !== redirectFocusTo._.prevNode) {
        redirectFocusTo._.prevNode.focus();
      }
    };
  }
  return e;
});
const legend = makeComponent(function legend(text, _props) {
  const e = document.createElement('legend');
  e.innerText = text;
  return e;
});
const htmlLabel = makeComponent(function label(_props) {
  return document.createElement("label");
});
const textInput = makeComponent(function textInput(props) {
  const {label = "", value, onInput} = props;
  const inputComponent = input({ type: "text", value, onInput });
  const wrapper = this.append(fieldset({ redirectFocusTo: inputComponent }));
  wrapper.append(legend(label));
  wrapper.append(inputComponent);
});
// TODO: more input components
