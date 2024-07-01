"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
function parseJsonOrNull(jsonString) {
    try {
        return JSON.parse(jsonString);
    }
    catch (_a) {
        return null;
    }
}
function camelCaseToKebabCase(key) {
    var _a;
    return ((_a = key.match(/[A-Z][a-z]*|[a-z]+/g)) !== null && _a !== void 0 ? _a : []).map(function (v) { return v.toLowerCase(); }).join("-");
}
function addPx(value) {
    var _a;
    return (((_a = value === null || value === void 0 ? void 0 : value.constructor) === null || _a === void 0 ? void 0 : _a.name) === "Number") ? "".concat(value, "px") : value;
}
var Component = /** @class */ (function () {
    function Component(onRender, args, key, props, options) {
        var _a;
        this.name = (_a = options.name) !== null && _a !== void 0 ? _a : onRender.name;
        if (!this.name && (options.name !== ""))
            throw "Function name cannot be empty: ".concat(onRender);
        this.args = args;
        this.key = (key != null) ? String(key) : null;
        this.props = props;
        this.children = [];
        this.onRender = onRender;
        this.options = options;
        this._ = null;
        this._indexedChildCount = 0;
        this._usedKeys = new Set();
        this._mediaKeys = [];
    }
    Component.prototype.append = function (child) {
        this.children.push(child);
        return child;
    };
    Component.prototype.useState = function (defaultState) {
        var _ = this._;
        if (!_.stateIsInitialized) {
            _.state = defaultState;
            _.stateIsInitialized = true;
        }
        return _.state;
    };
    Component.prototype.useValidate = function (getErrors) {
        var _this = this;
        return function () {
            var errors = {};
            getErrors(errors);
            var state = _this._.state;
            state.errors = errors;
            state.didValidate = true;
            var hasErrors = Object.keys(errors).length > 0;
            if (hasErrors) {
                _this.rerender();
            }
            return !hasErrors;
        };
    };
    Component.prototype.useMedia = function (mediaQuery) {
        var key = Object.entries(mediaQuery).map(function (_a) {
            var k = _a[0], v = _a[1];
            return "(".concat(camelCaseToKebabCase(k), ": ").concat(addPx(v), ")");
        }).join(' and ');
        this._mediaKeys.push(key);
        var dispatchTarget = DispatchTarget.init(key, _mediaQueryDispatchTargets, function (dispatch) {
            var mediaQueryList = window.matchMedia(key);
            mediaQueryList.addEventListener("change", dispatch);
            return mediaQueryList;
        });
        dispatchTarget.addComponent(this);
        return dispatchTarget.state.matches;
    };
    Component.prototype.useLocalStorage = function (key, defaultValue) {
        var _a, _b;
        _localStorageDispatchTarget.addComponent(this);
        var value = (_b = (_a = parseJsonOrNull(localStorage[key])) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : defaultValue;
        var setValue = function (newValue) {
            localStorage.setItem(key, JSON.stringify([newValue]));
        };
        return [value, setValue];
    };
    Component.prototype.useNavigate = function () {
        return {
            navigate: function (url) { return location.href = url; },
            replace: function (url) { return location.replace(url); },
        };
    };
    Component.prototype.rerender = function () {
        var root_ = this._.root;
        var rootComponent = root_.component;
        var newGcFlag = !root_.gcFlag;
        if (!root_.willRerenderNextFrame) {
            root_.willRerenderNextFrame = true;
            requestAnimationFrame(function () {
                var newRootComponent = _copyComponent(rootComponent);
                newRootComponent._ = root_;
                root_.gcFlag = newGcFlag;
                root_.component = newRootComponent;
                _render(newRootComponent, root_.parentNode);
                _unloadUnusedComponents(rootComponent, newGcFlag);
                root_.willRerenderNextFrame = false;
            });
        }
    };
    return Component;
}());
function makeComponent(onRender, options) {
    if (options === void 0) { options = {}; }
    return function () {
        var argsOrProps = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            argsOrProps[_i] = arguments[_i];
        }
        var argCount = Math.max(0, onRender.length - 1);
        var args = argsOrProps.slice(0, argCount);
        var props = __assign({}, argsOrProps[argCount]);
        var key = props.key;
        delete props.key;
        return new Component(onRender, args, key, props, options);
    };
}
function _copyComponent(component) {
    var newComponent = new Component(component.onRender, component.args, component.key, component.props, component.options);
    newComponent._ = component._;
    return newComponent;
}
var DispatchTarget = /** @class */ (function () {
    function DispatchTarget(addListeners) {
        var _this = this;
        this.components = [];
        this.state = addListeners(function () { return _this.dispatch(); });
    }
    DispatchTarget.init = function (key, store, addListeners) {
        var oldDT = store[key];
        if (oldDT != null)
            return oldDT;
        var newDT = new DispatchTarget(addListeners);
        store[key] = newDT;
        return newDT;
    };
    DispatchTarget.prototype.addComponent = function (component) {
        this.components.push(component);
    };
    DispatchTarget.prototype.removeComponent = function (component) {
        var i = this.components.indexOf(component);
        if (i !== -1)
            this.components.splice(i, 1);
    };
    DispatchTarget.prototype.dispatch = function () {
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var component = _a[_i];
            component.rerender();
        }
    };
    return DispatchTarget;
}());
var _mediaQueryDispatchTargets = {};
var _localStorageDispatchTarget = new DispatchTarget(function (dispatch) { return window.addEventListener("storage", dispatch); });
function _scrollToLocationHash() {
    var element = document.getElementById(location.hash.slice(1));
    if (element)
        element.scrollIntoView();
}
var _locationHashDispatchTarget = new DispatchTarget(function (dispatch) {
    window.addEventListener("hashchange", function () {
        _scrollToLocationHash();
        dispatch();
    });
});
var ComponentMetadata = /** @class */ (function () {
    function ComponentMetadata(parent) {
        var _a;
        // state
        this.stateIsInitialized = false;
        this.state = {};
        this.prevState = null;
        this.prevNode = null;
        this.gcFlag = false;
        // navigation
        this.prevComponent = null;
        this.keyToChild = {};
        this.prevIndexedChildCount = null;
        this.parent = parent;
        this.root = (_a = parent === null || parent === void 0 ? void 0 : parent.root) !== null && _a !== void 0 ? _a : null;
    }
    return ComponentMetadata;
}());
var RootComponentMetadata = /** @class */ (function (_super) {
    __extends(RootComponentMetadata, _super);
    function RootComponentMetadata(component, parentNode) {
        var _this = _super.call(this, null) || this;
        _this.willRerenderNextFrame = false;
        _this.root = _this;
        _this.component = component;
        _this.parentNode = parentNode;
        return _this;
    }
    return RootComponentMetadata;
}(ComponentMetadata));
// render
function renderRoot(component, parentNode) {
    if (parentNode === void 0) { parentNode = null; }
    var root_ = new RootComponentMetadata(component, parentNode);
    component._ = root_;
    window.onload = function () {
        var _a;
        root_.parentNode = (_a = root_.parentNode) !== null && _a !== void 0 ? _a : document.body;
        _render(component, root_.parentNode);
        setTimeout(function () {
            _scrollToLocationHash();
        });
    };
}
function _render(component, parentNode, isTopNode, inheritedCssVars, inheritedNames) {
    var _a;
    if (isTopNode === void 0) { isTopNode = true; }
    if (inheritedCssVars === void 0) { inheritedCssVars = {}; }
    if (inheritedNames === void 0) { inheritedNames = []; }
    // render elements
    var _ = component._, name = component.name, args = component.args, props = component.props, onRender = component.onRender, options = component.options, _indexedChildCount = component._indexedChildCount;
    var onMount = options.onMount;
    var node = onRender.bind(component).apply(void 0, __spreadArray(__spreadArray([], args, false), [props], false));
    if (!(node instanceof Element))
        node = undefined;
    // set prev state
    var prevIndexedChildCount = _.prevIndexedChildCount;
    if (prevIndexedChildCount !== null && (_indexedChildCount !== prevIndexedChildCount)) {
        console.warn("Varying children should have a \"key\" prop. (".concat(prevIndexedChildCount, " -> ").concat(_indexedChildCount, ")"), _.prevComponent, component);
    }
    _.prevIndexedChildCount = _indexedChildCount;
    _.prevState = __assign({}, _.state);
    _.prevComponent = component;
    // append element
    var _b = props, _c = _b.style, style = _c === void 0 ? {} : _c, className = _b.className, _d = _b.attribute, attribute = _d === void 0 ? {} : _d, cssVars = _b.cssVars;
    if (cssVars)
        inheritedCssVars = __assign(__assign({}, inheritedCssVars), cssVars);
    if (node) {
        // style
        for (var _i = 0, _e = Object.entries(style); _i < _e.length; _i++) {
            var _f = _e[_i], k = _f[0], v = _f[1];
            if (v != null) {
                node.style[k] = addPx(v);
            }
        }
        for (var _g = 0, _h = Object.entries(inheritedCssVars); _g < _h.length; _g++) {
            var _j = _h[_g], k = _j[0], v = _j[1];
            if (v != null) {
                node.style.setProperty("--".concat(k), addPx(v));
            }
        }
        // class
        if (name !== node.tagName.toLowerCase()) {
            inheritedNames = __spreadArray(__spreadArray([], inheritedNames, true), [name], false);
        }
        for (var _k = 0, inheritedNames_1 = inheritedNames; _k < inheritedNames_1.length; _k++) {
            var inheritedName = inheritedNames_1[_k];
            node.classList.add(inheritedName);
        }
        if (Array.isArray(className)) {
            for (var _l = 0, className_1 = className; _l < className_1.length; _l++) {
                var v = className_1[_l];
                node.classList.add(v);
            }
        }
        else if (className) {
            for (var _m = 0, _o = className.split(" "); _m < _o.length; _m++) {
                var v = _o[_m];
                if (v)
                    node.classList.add(v);
            }
        }
        // attribute
        for (var _p = 0, _q = Object.entries(attribute); _p < _q.length; _p++) {
            var _r = _q[_p], k = _r[0], v = _r[1];
            node.setAttribute(camelCaseToKebabCase(k), String(v));
        }
        // append
        var prevNode = _.prevNode;
        if (isTopNode && prevNode) {
            prevNode.replaceWith(node);
        }
        else {
            parentNode.append(node);
        }
        if (onMount)
            onMount(component, node);
        _.prevNode = node;
        // inherit
        parentNode = node;
        isTopNode = false;
        inheritedCssVars = {};
        inheritedNames = [];
    }
    else {
        if (name)
            inheritedNames = __spreadArray(__spreadArray([], inheritedNames, true), [name], false);
    }
    // children
    var usedKeys = new Set();
    for (var _s = 0, _t = component.children; _s < _t.length; _s++) {
        var child = _t[_s];
        var key = child.key;
        if (key === null) {
            key = "".concat(child.name, "-").concat(component._indexedChildCount++);
        }
        if (usedKeys.has(key))
            console.warn("Duplicate key: '".concat(key, "'"), component);
        usedKeys.add(key);
        var child_ = (_a = _.keyToChild[key]) !== null && _a !== void 0 ? _a : new ComponentMetadata(_);
        _.keyToChild[key] = child_;
        child._ = child_;
        child_.gcFlag = _.gcFlag;
        _render(child, parentNode, isTopNode, inheritedCssVars, inheritedNames);
    }
}
// rerender
function _unloadUnusedComponents(prevComponent, gcFlag) {
    var _a;
    for (var _i = 0, _b = prevComponent.children; _i < _b.length; _i++) {
        var child = _b[_i];
        var child_ = child._;
        if (child_.gcFlag !== gcFlag) {
            for (var _c = 0, _d = child._mediaKeys; _c < _d.length; _c++) {
                var key = _d[_c];
                _mediaQueryDispatchTargets[key].removeComponent(prevComponent);
            }
            _localStorageDispatchTarget.removeComponent(prevComponent);
            (_a = child_.parent) === null || _a === void 0 ? true : delete _a.keyToChild[child.key];
        }
        _unloadUnusedComponents(child, gcFlag);
    }
}
// basic components
var fragment = makeComponent(function fragment(_props) {
    if (_props === void 0) { _props = {}; }
}, { name: '' });
var div = makeComponent(function div(_props) {
    if (_props === void 0) { _props = {}; }
    return document.createElement('div');
});
var span = makeComponent(function _span(text, props) {
    var _this = this;
    if (props === void 0) { props = {}; }
    var iconName = props.iconName, fontSize = props.fontSize, color = props.color, singleLine = props.singleLine, fontFamily = props.fontFamily, href = props.href, replacePath = props.replacePath, id = props.id, onClick = props.onClick;
    var isLink = (href != null);
    var e = document.createElement(isLink ? 'a' : 'span');
    e.innerText = iconName || text;
    if (iconName) {
        e.classList.add("material-symbols-outlined");
        if (fontSize)
            e.style.fontSize = "calc(1.5 * var(--fontSize-".concat(fontSize, "))");
    }
    else {
        if (fontSize)
            e.style.fontSize = "var(--fontSize-".concat(fontSize, ")");
    }
    if (color)
        e.style.color = "var(--".concat(color, ")");
    if (singleLine) {
        e.style.overflow = "hidden";
        e.style.textOverflow = "ellipsis";
        e.style.whiteSpace = "nowrap";
    }
    if (fontFamily)
        e.style.fontFamily = "var(--fontFamily-".concat(fontFamily, ")");
    if (isLink) {
        e.href = href;
        if (replacePath) {
            e.onclick = function (event) {
                event.preventDefault();
                _this.useNavigate().replace(href);
                if (onClick)
                    onClick(event);
            };
        }
    }
    else {
        if (onClick) {
            e.onclick = onClick;
            e.setAttribute("tabindex", "-1");
            e.setAttribute("clickable", "true");
        }
    }
    if (id) {
        e.id = id;
        this.append(span("", {
            iconName: "tag",
            className: "icon selfLink",
            href: "#".concat(id),
            fontSize: "".concat(fontSize || "normal", "-1"),
            style: { height: "calc(1.5 * var(--fontSize-".concat(fontSize || "normal", ") - 1px)"), paddingTop: 1 },
        }));
    }
    return e;
}, { name: "span" });
// https://fonts.google.com/icons
var icon = makeComponent(function icon(iconName, props) {
    if (props === void 0) { props = {}; }
    this.append(span("", __assign({ iconName: iconName }, props)));
});
var loadingSpinner = makeComponent(function loadingSpinner(props) {
    if (props === void 0) { props = {}; }
    this.append(icon("progress_activity", props));
});
// inputs // TODO: fix input types
var input = makeComponent(function input(props) {
    var _a, _b;
    if (props === void 0) { props = {}; }
    var _c = props.type, type = _c === void 0 ? "text" : _c, placeholder = props.placeholder, value = props.value, autoFocus = props.autoFocus, onKeyDown = props.onKeyDown, onInput = props.onInput, onChange = props.onChange, allowChar = props.allowChar, _d = props.allowString, allowString = _d === void 0 ? function (value, _prevAllowedValue) { return value; } : _d;
    var state = this.useState({ prevAllowedValue: value !== null && value !== void 0 ? value : '', needFocus: false });
    var e = ((_b = (_a = this._) === null || _a === void 0 ? void 0 : _a.prevNode) !== null && _b !== void 0 ? _b : document.createElement('input')); // NOTE: e.remove() must not be called
    e.type = type;
    if (placeholder)
        e.placeholder = placeholder;
    if (autoFocus)
        e.autofocus = true;
    if (value != null)
        e.value = value;
    e.onkeydown = function (event) {
        if (onKeyDown)
            onKeyDown(event);
        state.needFocus = true;
    };
    e.oninput = function (event) {
        if (allowChar && "data" in event) {
            if ((event.data !== null) && !allowChar(event.data)) {
                event.preventDefault();
                event.stopPropagation();
                e.value = state.prevAllowedValue;
                return;
            }
        }
        var allowedValue = allowString(e.value, state.prevAllowedValue);
        state.prevAllowedValue = allowedValue;
        state.needFocus = true;
        if (allowedValue === e.value) {
            if (onInput)
                onInput(allowedValue, event);
        }
    };
    e.onchange = function (event) {
        var allowedValue = allowString(e.value, state.prevAllowedValue);
        state.prevAllowedValue = allowedValue;
        if (e.value === allowedValue) {
            if (onChange)
                onChange(e.value, event);
        }
        else {
            e.value = allowedValue;
        }
    };
    return e;
}, {
    onMount: function (component, e) {
        var state = component._.state;
        if (state.needFocus) {
            e.focus();
            state.needFocus = false;
        }
    }
});
var labeledInput = makeComponent(function labeledInput(props) {
    if (props === void 0) { props = {}; }
    var _a = props.label, label = _a === void 0 ? "" : _a, leftComponent = props.leftComponent, inputComponent = props.inputComponent, rightComponent = props.rightComponent;
    var fieldset = document.createElement("fieldset");
    fieldset.onmousedown = function (event) {
        if (event.target !== inputComponent._.prevNode) {
            event.preventDefault();
        }
    };
    fieldset.onclick = function (event) {
        if (event.target !== inputComponent._.prevNode) {
            inputComponent._.prevNode.focus();
        }
    };
    var legend = document.createElement("legend");
    legend.innerText = label;
    fieldset.append(legend);
    if (leftComponent)
        this.append(leftComponent);
    this.append(inputComponent);
    if (rightComponent)
        this.append(rightComponent);
    return fieldset;
});
var errorMessage = makeComponent(function errorMessage(error, props) {
    if (props === void 0) { props = {}; }
    this.append(span(error, __assign({ color: "red", fontSize: "small" }, props)));
});
var textInput = makeComponent(function textInput(props) {
    if (props === void 0) { props = {}; }
    var label = props.label, error = props.error, extraProps = __rest(props, ["label", "error"]);
    this.append(labeledInput({
        label: label,
        inputComponent: input(extraProps),
    }));
    if (error)
        this.append(errorMessage(error));
});
var numberArrows = makeComponent(function numberArrows(props) {
    if (props === void 0) { props = {}; }
    var onClickUp = props.onClickUp, onClickDown = props.onClickDown;
    var wrapper = this.append(div());
    wrapper.append(icon("arrow_drop_up", { className: "upIcon", onClick: onClickUp }));
    wrapper.append(icon("arrow_drop_down", { className: "downIcon", onClick: onClickDown }));
});
var numberInput = makeComponent(function numberInput(props) {
    if (props === void 0) { props = {}; }
    var label = props.label, value = props.value, error = props.error, min = props.min, max = props.max, step = props.step, stepPrecision = props.stepPrecision, _a = props.clearable, clearable = _a === void 0 ? true : _a, onKeyDown = props.onKeyDown, onInput = props.onInput, onChange = props.onChange, leftComponent = props.leftComponent, extraProps = __rest(props, ["label", "value", "error", "min", "max", "step", "stepPrecision", "clearable", "onKeyDown", "onInput", "onChange", "leftComponent"]);
    var stepAndClamp = function (number) {
        var _a;
        if (step) {
            var stepOffset = (_a = min !== null && min !== void 0 ? min : max) !== null && _a !== void 0 ? _a : 0;
            number = stepOffset + Math.round((number - stepOffset) / step) * step;
        }
        number = Math.min(number, max !== null && max !== void 0 ? max : 1 / 0);
        number = Math.max(min !== null && min !== void 0 ? min : -1 / 0, number);
        var defaultStepPrecision = step ? String(step).split(".")[1].length : 0;
        return number.toFixed(stepPrecision !== null && stepPrecision !== void 0 ? stepPrecision : defaultStepPrecision);
    };
    var incrementValue = function (by) {
        var number = stepAndClamp(+(value !== null && value !== void 0 ? value : 0) + by);
        var newValue = String(number);
        if (onInput)
            onInput(newValue, event);
        if (onChange)
            onChange(newValue, event);
    };
    var inputComponent = input(__assign(__assign({ value: value, onKeyDown: function (event) {
            switch (event.key) {
                case "ArrowUp":
                    incrementValue(step !== null && step !== void 0 ? step : 1);
                    break;
                case "ArrowDown":
                    incrementValue(-(step !== null && step !== void 0 ? step : 1));
                    break;
            }
            if (onKeyDown)
                onKeyDown(event);
        }, onInput: onInput, onChange: onChange }, extraProps), { allowChar: function (c) { return "-0123456789".includes(c); }, allowString: function (value, prevAllowedValue) {
            if (value === "")
                return clearable ? "" : prevAllowedValue;
            var number = +value;
            if (isNaN(number))
                return prevAllowedValue;
            return String(stepAndClamp(number));
        } }));
    this.append(labeledInput({
        label: label,
        leftComponent: leftComponent,
        inputComponent: inputComponent,
        rightComponent: numberArrows({
            onClickUp: function (_event) {
                incrementValue(step !== null && step !== void 0 ? step : 1);
                inputComponent._.state.needFocus = true;
                inputComponent.rerender();
            },
            onClickDown: function (_event) {
                incrementValue(-(step !== null && step !== void 0 ? step : 1));
                inputComponent._.state.needFocus = true;
                inputComponent.rerender();
            },
        }),
    }));
    if (error)
        this.append(errorMessage(error));
});
var table = makeComponent(function table(props) {
    // TODO: set minHeight to fit N rows
    // TODO: actions, filters, search, paging, selection
    var label = props.label, _a = props.columns, columns = _a === void 0 ? [] : _a, _b = props.rows, rows = _b === void 0 ? [] : _b, _c = props.isLoading, isLoading = _c === void 0 ? false : _c, _d = props.minHeight, minHeight = _d === void 0 ? 400 : _d, _e = props.useMaxHeight, useMaxHeight = _e === void 0 ? false : _e;
    var tableWrapper = this.append(div({
        attribute: { useMaxHeight: useMaxHeight, isLoading: isLoading },
        style: { minHeight: minHeight },
    }));
    var makeRow = function (className) { return div({ className: className }); };
    var makeCell = function (column) {
        var _a;
        return div({
            className: "cell",
            style: { flex: String((_a = column.flex) !== null && _a !== void 0 ? _a : 1), minWidth: column.minWidth, maxWidth: column.maxWidth },
        });
    };
    if (label) {
        tableWrapper.append(span(label, { className: "label" }));
    }
    if (isLoading) {
        tableWrapper.append(loadingSpinner());
    }
    else {
        var headerWrapper = tableWrapper.append(makeRow("row header"));
        for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
            var column = columns[columnIndex];
            var cellWrapper = headerWrapper.append(makeCell(column));
            cellWrapper.append(span(column.label));
        }
        for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            var row = rows[rowIndex];
            var rowWrapper = tableWrapper.append(makeRow("row body"));
            for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                var column = columns[columnIndex];
                var cellWrapper = rowWrapper.append(makeCell(column));
                cellWrapper.append(column.onRender({ row: row, rowIndex: rowIndex, column: column, columnIndex: columnIndex }));
            }
        }
    }
});
var router = makeComponent(function router(props) {
    var _a, _b;
    var routes = props.routes, _c = props.wrapperComponent, wrapperComponent = _c === void 0 ? fragment() : _c, currentRoles = props.currentRoles, isLoggedIn = props.isLoggedIn, _d = props.notLoggedInRoute, notLoggedInRoute = _d === void 0 ? { path: ".*", component: fragment } : _d, _e = props.notFoundRoute, notFoundRoute = _e === void 0 ? { path: ".*", component: function () { return span("404 Not found"); } } : _e, _f = props.unauthorizedRoute, unauthorizedRoute = _f === void 0 ? { path: ".*", component: fragment } : _f;
    var lPath = location.pathname;
    if (location.protocol === "file:") {
        var acc = lPath.split("/");
        lPath = "/".concat(acc[acc.length - 1]);
    }
    if (lPath.endsWith("/index.html"))
        lPath = lPath.slice(0, -10);
    var route = null, params = {};
    var _loop_1 = function (k, v) {
        var regex = k.replace(/:([^/]+)/g, function (_match, g1) { return "(?<".concat(g1, ">[^/]*)"); });
        var match = lPath.match(new RegExp("^".concat(regex, "$")));
        if (match != null) {
            params = (_a = match.groups) !== null && _a !== void 0 ? _a : {};
            if (v.roles && !(currentRoles !== null && currentRoles !== void 0 ? currentRoles : []).some(function (role) { var _a; return !((_a = v.roles) === null || _a === void 0 ? void 0 : _a.length) || v.roles.includes(role); })) {
                route = isLoggedIn ? notLoggedInRoute : unauthorizedRoute;
            }
            else {
                route = v;
            }
            return "break";
        }
    };
    for (var _i = 0, _g = Object.entries(routes); _i < _g.length; _i++) {
        var _h = _g[_i], k = _h[0], v = _h[1];
        var state_1 = _loop_1(k, v);
        if (state_1 === "break")
            break;
    }
    route = route !== null && route !== void 0 ? route : notFoundRoute;
    if (route) {
        if ((_b = route.wrapper) !== null && _b !== void 0 ? _b : true) {
            this.append(wrapperComponent);
            wrapperComponent.append(route.component()); // TODO: save params in RootComponentMetadata?
        }
        else {
            this.append(route.component());
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
var mainPage = makeComponent(function root() {
    var _this = this;
    var state = this.useState({ username: "" });
    var _a = this.useLocalStorage("count", 0), count = _a[0], setCount = _a[1];
    var wrapper = this.append(div({
        style: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
    }));
    wrapper.append(textInput({
        label: "Username",
        value: state.username,
        onInput: function (newUsername) {
            state.username = newUsername;
            _this.rerender();
        },
        autoFocus: true,
    }));
    wrapper.append(numberInput({
        label: "Count",
        value: count,
        onInput: function (newCount) {
            setCount(newCount === "" ? null : +newCount);
            _this.rerender();
        },
        min: 0,
        clearable: false,
    }));
    wrapper.append(span("state: ".concat(JSON.stringify(state))));
    wrapper.append(span("Foo", { id: "foo" }));
    wrapper.append(span("link to bar", { href: "#bar" }));
    var rows = Array(+(count !== null && count !== void 0 ? count : 0))
        .fill(0)
        .map(function (_, i) { return i; });
    wrapper.append(table({
        label: "Stuff",
        rows: rows,
        columns: [
            {
                label: "#",
                onRender: function (props) { return span(props.rowIndex + 1); },
            },
            {
                label: "Name",
                onRender: function (props) { return span("foo ".concat(props.row)); },
            },
            {
                label: "Count",
                onRender: function (props) { return span(props.row); },
            },
        ],
    }));
    if ((count !== null && count !== void 0 ? count : 0) % 2 === 0) {
        wrapper.append(someComponent({ key: "someComponent" }));
    }
    wrapper.append(span("Bar", { id: "bar" }));
    wrapper.append(loadingSpinner());
});
var someComponent = makeComponent(function someComponent(_props) {
    var lgOrBigger = this.useMedia({ minWidth: 1200 });
    this.append(span("lgOrBigger: ".concat(lgOrBigger)));
});
var root = makeComponent(function root() {
    this.append(router({
        routes: {
            "/": {
                component: function () { return mainPage(); },
            },
        },
        notFoundRoute: {
            component: function () { return notFoundPage(); },
        },
    }));
});
var notFoundPage = makeComponent(function notFoundPage() {
    this.append(span("Page not found"));
});
renderRoot(root());
//# sourceMappingURL=docs.js.map