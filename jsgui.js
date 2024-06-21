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
    const argCount = Math.max(0, _render.length - 1);
    const args = argsOrProps.slice(0, argCount);
    const props = argsOrProps[argCount];
    return new Component(_render, args, props);
  }
}
class ComponentMetadata {
  constructor() {
    // navigation
    this.rootComponent = null; // Component
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
class RootComponentMetadata extends ComponentMetadata {
  constructor() {
    super();
    this.rerenderList = [];
  }
}

// render
function renderRoot(rootComponent, parentNode = null) {
  rootComponent._ = new RootComponentMetadata();
  rootComponent._.rootComponent = rootComponent;
  window.onload = () => _renderElements(rootComponent, parentNode ?? document.body);
}
function _renderElements(component, parentNode, isStartNode = true) {
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
  const usedKeys = _.usedKeys;
  _.keyToChild = Object.fromEntries(Object.entries(_.keyToChild).filter(([k, _v]) => usedKeys.has(k)));
  _.prevState = {..._.state};
  // append elements
  const {style = {}, attribute = {}} = component.props;
  if (node) {
    for (let [k, v] of Object.entries(style)) {
      node.style[_camelCaseToKebabCase(k)] = v;
    }
    for (let [k, v] of Object.entries(attribute)) {
      node.setAttribute(_camelCaseToKebabCase(k), v);
    }
    const prevNode = _.prevNode;
    if (isStartNode && prevNode) {
      prevNode.before(node);
      prevNode.remove();
    } else {
      parentNode.append(node);
    }
    _.prevNode = node;
    parentNode = node;
    isStartNode = false;
  }
  for (let child of component.children) {
    _renderElements(child, parentNode, isStartNode);
  }
}
function _camelCaseToKebabCase(k) {
  return k.match(/[A-Z][a-z]*|[a-z]+/g).map(v => v.toLowerCase()).join("-");
}

// rerender
let _doRerenderNextFrame = false;
function _rerenderNextFrame(component) {
  const rootComponent = component._.rootComponent;
  rootComponent._.rerenderList.push(component);
  if (!_doRerenderNextFrame) {
    requestAnimationFrame(() => {
      const rerenderList = rootComponent._.rerenderList;
      walk(rootComponent, (component) => {
        const shouldRerender = rerenderList.includes(component);
        if (shouldRerender) {
          component.children = [];
          const parentNode = (component === rootComponent) ? document.body : null;
          _renderElements(component, parentNode);
        }
        return shouldRerender;
      });
      rootComponent._.rerenderList = [];
      _doRerenderNextFrame = false;
    });
    _doRerenderNextFrame = true;
  }
}
function walk(component, f) {
  const shouldBreak = f(component);
  if (!shouldBreak) {
    for (let child of component.children) {
      walk(child, f);
    };
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
})
const input = makeComponent(function input(props) {
  const state = this.useState({ needFocus: false });
  const e = this._?.prevNode ?? document.createElement('input');
  e.type = props.type ?? "text";
  if (props.onInput) e.oninput = (event) => {
    props.onInput(event);
    state.needFocus = true;
  }
  if (props.onChange) e.onchange = props.onChange;
  setTimeout(() => {
    if (state.needFocus) {
      this._.prevNode.focus();
      state.needFocus = false;
    }
  })
  return e;
})
// TODO: input components
