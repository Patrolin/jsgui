// base component
class Component {
  constructor(_render, args = [], props = {}) {
    this.name = _render.name; // string
    this.args = args // any[]
    this.props = props; // Record<string, any>
    this.children = []; // Component[]
    this._render = _render; // function (...) {}
    this._ = null; // ComponentMetadata
  }
  append(child) {
    const {_} = this;
    const key = child.props.key;
    if (key) {
      if (_.usedKeys.has(key)) {
        console.warn(`Duplicate key: '${key}'`);
      }
      _.usedKeys.add(key);
      const newMetadata = _.keyToChild[key] ?? new ComponentMetadata();
      _.keyToChild[key] = newMetadata;
      child._ = newMetadata;
    } else {
      const childIndex = _.currIndexedChildCount++;
      if (childIndex >= _.indexToChild.length) {
        _.indexToChild.push(new ComponentMetadata());
      }
      child._ = _.indexToChild[childIndex];
      child._.index = childIndex;
    }
    child._.parent = this._;
    this.children.push(child);
    return child;
  }
  useState(defaultState) {
    if (this._.state === null) this._.state = defaultState;
    return this._.state;
  }
  rerender() {
    _rerenderNextFrame(this);
  }
}
function makeComponent(_render) {
  return (...argsOrProps) => {
    const args = argsOrProps.slice(0, _render.length);
    const props = argsOrProps[_render.length];
    return new Component(_render, args, props);
  }
}
class ComponentMetadata {
  constructor() {
    // navigation
    this.parent = null; // ComponentMetadata
    this.indexToChild = []; // ComponentMetadata[]
    this.keyToChild = {} // Record<string, ComponentMetadata>
    // metadata
    this.currIndexedChildCount = 0; // number
    this.prevIndexedChildCount = null; // number | null
    this.usedKeys = new Set(); // Set<string>
    // state
    this.index = 0; // number
    this.state = null; // any
    this.prevState = null; // any
    this.prevNode = null; // HTMLElement | null;
  }
}

// render
let _rootMetadata = null; // ComponentState | null;
function renderRoot(rootComponent) {
  _rootMetadata = new ComponentMetadata();
  rootComponent._ = _rootMetadata;
  window.onload = () => _renderElements(document.body, rootComponent);
}
function _renderElements(parentNode, component) {
  // render elements
  const {_} = component;
  _.usedKeys = new Set(); // Set<string>
  _.currIndexedChildCount = 0; // number
  const node = component._render.bind(component)(...component.args, component.props);
  // check if indices changed
  const currIndexedChildCount = _.currIndexedChildCount;
  const prevIndexedChildCount = _.prevIndexedChildCount;
  if (prevIndexedChildCount === null) {
    _.prevIndexedChildCount = currIndexedChildCount;
  } else if (currIndexedChildCount !== prevIndexedChildCount) {
    console.error(`indexedChildCount changed ${prevIndexedChildCount} -> ${currIndexedChildCount} at`, component._render)
    throw `Varying children should have a "key" prop.`;
  }
  // filter keyed items
  const usedKeys = component.usedKeys;
  _.keyToChild = Object.fromEntries(Object.entries(_.keyToChild).filter(([k, _v]) => usedKeys.has(k)));
  _.prevState = {..._.state};
  // append elements
  const {style = {}, attribute = {}} = component.props;
  if (node) {
    for (let [k, v] of Object.entries(style)) {
      node.style[k] = v;
    }
    for (let [k, v] of Object.entries(attribute)) {
      node.setAttribute(k, v);
    }
    const prevNode = _.prevNode;
    if (prevNode) {
      prevNode.remove();
    }
    parentNode.append(node)
    _.prevNode = node;
    parentNode = node;
  }
  for (let child of component.children) {
    _renderElements(parentNode, child);
  }
}

// rerender // TODO: merge rerenders?
let _componentToRerender = null; // Component | null;
let _metadataToRerender = null // ComponentMetadata | null;
let _doRerenderNextFrame = false;
function _rerender(_parentNode) {
  _componentToRerender.children = [];
  const parentNode = _parentNode ?? (_componentToRerender._ === _rootMetadata ? document.body : null);
  _renderElements(parentNode, _componentToRerender);
  _doRerenderNextFrame = false;
  _componentToRerender = null;
  _metadataToRerender = null;
}
function _rerenderNextFrame(component) {
  if (!_doRerenderNextFrame) {
    requestAnimationFrame(() => _rerender());
    _doRerenderNextFrame = true;
  }
  if (_isValidAndHigherThanComponentToRerender(component._)) {
    _componentToRerender = component;
  }
}
function _isValidAndHigherThanComponentToRerender(_) {
  let curr = _;
  // TODO: _.key doesn't exist
  if (_.parent && (_.parent.indexToChild.includes(_) || (_.key in _.parent.keyToChild))) {
    for (; curr.parent != null; curr = curr.parent) {
      if (curr === _metadataToRerender) {
        return false;
      }
    }
  }
  return curr === _rootMetadata;
}

// components
const span = makeComponent(function span(text, _props) {
  const e = document.createElement('span');
  e.innerText = text;
  return e;
});
const div = makeComponent(function div() {
  return document.createElement('div');
})
// TODO: input components
