// base component
class Component {
  constructor(_render, styles, attributes, key) {
    this.styles = styles ?? {}; // Record<string, string>
    this.attributes = attributes ?? {}; // Record<string, string>
    this.children = []; // Component[]
    this.key = key != null ? String(key) : null; // string
    this.usedKeys = new Set(); // Set<string>
    this.indexedChildCount = 0; // number
    this.index = 0; // number
    this._render = _render; // function () {}
    this.metadata = null; // ComponentMetadata
  }
  append(child) {
    if (child.key) {
      if (this.usedKeys.has(child.key)) {
        console.warn(`Duplicate key: '${child.key}'`);
      }
      this.usedKeys.add(child.key);
      const newMetadata = this.metadata.keyToChild[child.key] ?? new ComponentMetadata();
      this.metadata.keyToChild[child.key] = newMetadata;
      child.metadata = newMetadata;
    } else {
      child.index = this.indexedChildCount++;
      if (child.index >= this.metadata.indexToChild.length) {
        this.metadata.indexToChild.push(new ComponentMetadata());
      }
      child.metadata = this.metadata.indexToChild[child.index];
    }
    child.metadata.parentComponent = this.metadata;
    this.children.push(child);
    return child;
  }
  useState(defaultState) {
    if (this.metadata.state === null) this.metadata.state = defaultState;
    return this.metadata.state;
  }
  rerender() {
    _rerenderNextFrame(this);
  }
}
class ComponentMetadata {
  constructor() {
    this.parent = null; // ComponentMetadata
    this.indexToChild = []; // ComponentMetadata[]
    this.prevIndexedChildCount = null; // number | null
    this.keyToChild = {} // Record<string, ComponentMetadata>
    this.state = null; // any
    this.prevState = null; // any
    this.prevNode = null; // HTMLElement | null;
  }
}

// render
let _rootMetadata = null; // ComponentState | null;
function renderRoot(rootComponent) {
  _rootMetadata = new ComponentMetadata();
  rootComponent.metadata = _rootMetadata;
  window.onload = () => _renderElements(document.body, rootComponent);
}
function _renderElements(parentNode, component) {
  // render elements
  const node = component._render.bind(component)();
  // check if indices changed
  const indexedChildCount = component.indexedChildCount;
  const prevIndexedChildCount = component.metadata.prevIndexedChildCount;
  if (prevIndexedChildCount === null) {
    component.metadata.prevIndexedChildCount = indexedChildCount;
  } else if (indexedChildCount !== prevIndexedChildCount) {
    console.error(`indexedChildCount changed ${prevIndexedChildCount} -> ${indexedChildCount} at`, component._render)
    throw `Varying children should have a "key" prop.`;
  }
  // filter keyed items
  const usedKeys = component.usedKeys;
  component.keyToChild = Object.fromEntries(Object.entries(component.metadata.keyToChild).filter(([k, _v]) => usedKeys.has(k)));
  component.metadata.prevState = {...component.metadata.state};
  // append elements
  if (node) {
    for (let [k, v] of Object.entries(component.styles)) {
      node.style[k] = v;
    }
    for (let [k, v] of Object.entries(component.attributes)) {
      node.setAttribute(k, v);
    }
    const prevNode = component.metadata.prevNode;
    if (prevNode) {
      prevNode.remove();
    }
    parentNode.append(node)
    component.metadata.prevNode = node;
    parentNode = node;
  }
  for (let child of component.children) {
    _renderElements(parentNode, child);
  }
}

// rerender // TODO: merge rerenders?
let _componentToRerender = null; // Component | null;
let _metadataToRerender = null // ComponentMetadata | null;
let _rerenderNextFrame = false;
function _rerender(_parentNode) {
  _componentToRerender.usedKeys = new Set();
  _componentToRerender.indexedChildCount = 0;
  _componentToRerender.children = [];
  const parentNode = _parentNode ?? (_componentToRerender.metadata === _rootMetadata ? document.body : null);
  _renderElements(parentNode, _componentToRerender);
  _rerenderNextFrame = false;
  _componentToRerender = null;
  _metadataToRerender = null;
}
function _rerenderNextFrame(component) {
  if (!_rerenderNextFrame) {
    requestAnimationFrame(() => _rerender());
    _rerenderNextFrame = true;
  }
  if (_isValidAndHigherThanComponentToRerender(component.metadata)) {
    _componentToRerender = component;
  }
}
function _isValidAndHigherThanComponentToRerender(metadata) {
  let curr = metadata;
  if (metadata.parent && (metadata.parent.indexToChild.includes(metadata) || (metadata.key in metadata.parent.keyToChild))) {
    for (; curr.parent != null; curr = curr.parent) {
      if (curr === _metadataToRerender) {
        return false;
      }
    }
  }
  return curr === _rootMetadata;
}

// components
function span(text, styles, attributes, key) {
  return new Component(() => {
    const e = document.createElement('span');
    e.innerText = text;
    return e;
  }, styles, attributes, key);
}
function div(styles, attributes, key) {
  return new Component(() => {
    return document.createElement('div');
  }, styles, attributes, key);
}
// TODO: input components
