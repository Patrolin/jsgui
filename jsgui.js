// base component
class Component {
  constructor(createElement, styles, attributes, key) {
    this.styles = styles; // Record<string, string>
    this.attributes = attributes; // Record<string, string>
    this.children = []; // Component[]
    this.keyedChildCount = 0; // number
    this.key = key; // string
    this.index = 0; // number
    this.createElement = createElement; // function () {}
    this.metadata = null; // ComponentMetadata
  }
  append(child) {
    if (child.key) {
      this.keyedChildCount++;
      child.metadata = this.metadata.keyToChild[child.key] ?? new ComponentMetadata();
    } else {
      child.index = this.children.length - this.keyedChildCount;
      child.metadata = this.metadata.indexToChild[child.index] ?? new ComponentMetadata();
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
    this.keyToChild = {} // Record<string, ComponentMetadata>
    this.state = null; // any
    this.prevState = null; // any
    this.node = null; // HTMLElement | null;
  }
}

// render
let _rootMetadata = null; // ComponentState | null;
let _componentToRerender = null; // Component | null;
let _metadataToRerender = null // ComponentMetadata | null;
function renderRoot(rootComponent) {
  _rootMetadata = new ComponentMetadata();
  rootComponent.metadata = _rootMetadata;
  window.onload = () => _createElements(document.body, rootComponent);
}
function _createElements(parentNode, component) {
  // TODO: add checks for index/key
  const node = component.createElement.bind(component)();
  if (node instanceof Element) {
    _applyStyles(node, component.styles, component.attributes);
    const prevNode = component.metadata.node;
    if (prevNode) {
      prevNode.after(node);
      prevNode.remove();
    } else if (parentNode) {
      parentNode.append(node)
    }
    component.metadata.node = node;
    parentNode = node;
  }
  for (let child of component.children) {
    _createElements(parentNode, child);
  }
}
function _applyStyles(e, styles={}, attributes=[]) {
  for (let [k, v] of Object.entries(styles)) {
    e.style[k] = v;
  }
  for (let [k, v] of attributes) {
    if (v === false) v == "false";
    e.addAttribute(k, v);
  }
}

// rerender
let _willRenderNextFrame = false;
function _rerender(parentNode) {
  _createElements(parentNode, _componentToRerender);
  _willRenderNextFrame = false;
  _componentToRerender = null;
  _metadataToRerender = null;
}
function _rerenderNextFrame(component) {
  if (!_willRenderNextFrame) {
    requestAnimationFrame(() => _rerender());
    _willRenderNextFrame = true;
  }
  if (_isValidAndHigherThanComponentToRerender(component.metadata)) {
    _componentToRerender = component;
  }
}
function _isValidAndHigherThanComponentToRerender(metadata) {
  if (!metadata.parent.indexToChild.includes(metadata) && !(metadata.key in metadata.parent.keyToChild))
    return false;
  let v;
  for (v = metadata; v.parent != null; v = v.parent) {
    if (v === _metadataToRerender) {
      return false;
    }
  }
  return v === _rootMetadata;
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
