import { BaseProps, makeComponent, navigate, NavigateFunction, NavType, NodeType, Size } from "../jsgui.mts";

// basic components
export const fragment = makeComponent("fragment", function(_props: BaseProps = {}) {}, { name: '' });
export const ul = makeComponent("ul", function(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("ul"));
});
export const ol = makeComponent("ol", function(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("ol"));
});
export const li = makeComponent("li", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("li"));
  this.append(text);
});
export const h1 = makeComponent("h1", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h1"));
  this.append(text);
});
export const h2 = makeComponent("h2", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h2"));
  this.append(text);
});
export const h3 = makeComponent("h3", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h3"));
  this.append(text);
});
export const h4 = makeComponent("h4", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h4"));
  this.append(text);
});
export const h5 = makeComponent("h5", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h5"));
  this.append(text);
});
export const h6 = makeComponent("h6", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h6"));
  this.append(text);
});
export const divider = makeComponent("divider", function(vertical: boolean = false, _props: BaseProps = {}) {
  this.append(div({
    attribute: {dataVertical: vertical},
  }));
});
export const p = makeComponent("p", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("p"));
  this.append(text);
});
export const b = makeComponent("b", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("b"));
  this.append(text);
});
export const em = makeComponent("em", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("em"));
  this.append(text);
});
export const br = makeComponent("br", function(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("br"));
});
export const code = makeComponent("code", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("code"));
  this.append(text);
});
type HyperlinkProps = BaseProps & {
  href?: string;
};
export const hyperlink = makeComponent("a", function(text: string, props: HyperlinkProps = {}) {
  const node = this.useNode(() => document.createElement("a"));
  node.href = props.href ?? "";
  this.append(text);
});
export const form = makeComponent("form", function(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("form"));
});
export const button = makeComponent("button", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("button"));
  this.append(text);
});
export const inputLabel = makeComponent("label", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("label"));
  this.append(text);
});
export const input = makeComponent("input", function(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("input"));
});
export type TextAreaProps = BaseProps & {
  onPaste?: (event: ClipboardEvent, clipboardData: DataTransfer) => string;
};
export const textarea = makeComponent("textarea", function(props: TextAreaProps = {}) {
  const {onPaste = (_event, clipboardData) => {
    return clipboardData.getData("Text");
  }} = props;
  const node = this.useNode(() => document.createElement("span"));
  node.contentEditable = "true";
  const events = this.baseProps.events;
  if (events.paste === undefined) {
    events.paste = (event) => {
      event.preventDefault();
      const replaceString = onPaste(event, event.clipboardData as DataTransfer)
      const selection = window.getSelection() as Selection;
      const {anchorOffset: selectionA, focusOffset: selectionB} = selection;
      const selectionStart = Math.min(selectionA, selectionB);
      const selectionEnd = Math.max(selectionA, selectionB);
      const prevValue = node.innerText;
      const newValue = prevValue.slice(0, selectionStart) + replaceString + prevValue.slice(selectionEnd)
      node.innerText = newValue;
      const newSelectionEnd = selectionStart + replaceString.length;
      selection.setPosition(node.childNodes[0], newSelectionEnd);
    }
  }
});
export const img = makeComponent("img", function(src: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("img"));
  this.baseProps.attribute.src = src;
});
export const svg = makeComponent("svg", function(svgText: string, _props: BaseProps = {}) {
  this.useNode(() => {
    const tmp = document.createElement("span");
    tmp.innerHTML = svgText;
    return (tmp.children[0] ?? document.createElement("svg")) as NodeType;
  });
});
export const audio = makeComponent("audio", function(src: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("audio"));
  this.baseProps.attribute.src = src;
});
export const video = makeComponent("video", function(sources: string[], _props: BaseProps = {}) {
  this.useNode(() => {
    const node = document.createElement("video");
    for (let source of sources) {
      const sourceNode = document.createElement("source");
      sourceNode.src = source;
      node.append(sourceNode);
    }
    return node;
  }, JSON.stringify(sources));
});
export const div = makeComponent("div", function(_props: BaseProps = {}) {
  this.useNode(() => document.createElement('div'));
});
export const legend = makeComponent("legend", function(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("legend"));
  this.append(text);
  this.baseProps.className.push("ellipsis");
});

// span
export type SpanProps = BaseProps & {
  iconName?: string;
  size?: Size;
  color?: string;
  singleLine?: string;
  fontFamily?: string;
  href?: string;
  download?: string;
  navType?: NavType;
  id?: string;
  selfLink?: string;
  onClick?: (event: PointerEvent) => void;
};
export const span = makeComponent("span", function(text: string | number | null | undefined, props: SpanProps = {}) {
  let { iconName, size, color, singleLine, fontFamily, href, download, navType, id, selfLink, onClick } = props;
  if (selfLink != null) {
    const selfLinkWrapper = this.append(div({ className: "self-link", attribute: { id: id == null ? selfLink : id } }));
    selfLinkWrapper.append(span(text, {...props, selfLink: undefined}));
    selfLinkWrapper.append(icon("tag", { size: Size.normal, href: `#${selfLink}` }));
    return;
  }
  const isLink = (href != null);
  const element = this.useNode(() => document.createElement(isLink ? 'a' : 'span'));
  const {attribute, className, style, events} = this.baseProps;
  if (id) attribute.id = id;
  if (download) attribute.download = download;
  if (size) attribute.dataSize = size;
  if (iconName) className.push("material-symbols-outlined");
  if (color) style.color = `var(--${color})`;
  if (singleLine) className.push("ellipsis");
  if (fontFamily) style.fontFamily = `var(--fontFamily-${fontFamily})`;
  if (isLink) (element as HTMLAnchorElement).href = href;
  if (onClick || href) {
    if (!isLink) {
      attribute.tabindex = "-1";
      attribute.clickable = "true";
    }
    if (events.touchstart === undefined) {
      events.touchstart = ((event: TouchEvent) => {
        event.preventDefault();
      });
    }
    // TODO!: do we need to implement our own onClick, or can we just use pointerup?
    if (events.pointerdown === undefined) {
      events.pointerdown = onClick;
    }
    if (events.pointerup === undefined) {
      events.pointerup = ((event: PointerEvent) => {
        if (href && !download) {
          event.preventDefault();
          navigate(href, navType);
        }
      });
    }
  }
  this.append(iconName || (text == null ? "" : String(text)))
});
// https://fonts.google.com/icons
export type IconProps = SpanProps;
export const icon = makeComponent("icon", function(iconName: string, props: IconProps = {}) {
  let {size, style = {}, ...extraProps} = props;
  this.baseProps.attribute.dataIcon = iconName;
  this.append(span("", {iconName, size, style, ...extraProps}));
});
