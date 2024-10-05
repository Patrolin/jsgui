import { BaseProps, makeComponent, NavigateFunction, NodeType, Size } from "../jsgui.mts";

// basic components
export const fragment = makeComponent(function fragment(_props: BaseProps = {}) {}, { name: '' });
export const ul = makeComponent(function ul(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("ul"));
});
export const ol = makeComponent(function ol(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("ol"));
});
export const li = makeComponent(function li(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("li"));
  this.append(text);
});
export const h1 = makeComponent(function h1(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h1"));
  this.append(text);
});
export const h2 = makeComponent(function h2(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h2"));
  this.append(text);
});
export const h3 = makeComponent(function h3(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h3"));
  this.append(text);
});
export const h4 = makeComponent(function h4(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h4"));
  this.append(text);
});
export const h5 = makeComponent(function h5(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h5"));
  this.append(text);
});
export const h6 = makeComponent(function h6(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("h6"));
  this.append(text);
});
export const divider = makeComponent(function divider(vertical: boolean = false, _props: BaseProps = {}) {
  this.append(div({
    attribute: {dataVertical: vertical},
  }));
});
export const p = makeComponent(function p(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("p"));
  this.append(text);
});
export const b = makeComponent(function b(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("b"));
  this.append(text);
});
export const em = makeComponent(function em(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("em"));
  this.append(text);
});
export const code = makeComponent(function code(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("code"));
  this.append(text);
});
export const button = makeComponent(function button(text: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("button"));
  this.append(text);
});
export const input = makeComponent(function input(_props: BaseProps = {}) {
  this.useNode(() => document.createElement("input"));
});
export const img = makeComponent(function img(src: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("img"));
  this.baseProps.attribute.src = src;
});
export const svg = makeComponent(function svg(svgText: string, _props: BaseProps = {}) {
  this.useNode(() => {
    const tmp = document.createElement("span");
    tmp.innerHTML = svgText;
    return (tmp.children[0] ?? document.createElement("svg")) as NodeType;
  });
});
export const audio = makeComponent(function audio(src: string, _props: BaseProps = {}) {
  this.useNode(() => document.createElement("audio"));
  this.baseProps.attribute.src = src;
});
export const video = makeComponent(function video(sources: string[], _props: BaseProps = {}) {
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
export const div = makeComponent(function div(_props: BaseProps = {}) {
  this.useNode(() => document.createElement('div'));
});
export const legend = makeComponent(function legend(text: string, _props: BaseProps = {}) {
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
  navigate?: NavigateFunction;
  id?: string;
  selfLink?: string;
  onClick?: (event: MouseEvent) => void;
};
export const span = makeComponent(function _span(text: string | number | null | undefined, props: SpanProps = {}) {
  let { iconName, size, color, singleLine, fontFamily, href, download, navigate, id, selfLink, onClick } = props;
  if (selfLink != null) {
    const selfLinkWrapper = this.append(div({ className: "self-link", attribute: { id: id == null ? selfLink : id } }));
    selfLinkWrapper.append(span(text, {...props, selfLink: undefined}));
    selfLinkWrapper.append(icon("tag", { size: "normal", href: `#${selfLink}` }));
    return;
  }
  const isLink = (href != null);
  const e = this.useNode(() => document.createElement(isLink ? 'a' : 'span'));
  const {attribute, className, style, events} = this.baseProps;
  if (id) attribute.id = id;
  if (download) attribute.download = download;
  if (size) attribute.dataSize = size;
  if (iconName) className.push("material-symbols-outlined");
  if (color) style.color = `var(--${color})`; // TODO: remove style?
  if (singleLine) className.push("ellipsis");
  if (fontFamily) style.fontFamily = `var(--fontFamily-${fontFamily})`; // TODO: remove style?
  if (isLink) (e as HTMLAnchorElement).href = href;
  navigate = (navigate ?? this.useNavigate().pushRoute);
  if (onClick || href) {
    if (!isLink) {
      attribute.tabindex = "-1";
      attribute.clickable = "true";
    }
    events.click = events.click ?? ((event: MouseEvent) => {
      if (onClick) onClick(event);
      if (href && !download) {
        event.preventDefault();
        navigate(href);
      }
    });
  }
  this.append(iconName || (text == null ? "" : String(text)))
}, { name: "span" });
// https://fonts.google.com/icons
export type IconProps = SpanProps;
export const icon = makeComponent(function icon(iconName: string, props: IconProps = {}) {
  let {size, style = {}, ...extraProps} = props;
  this.baseProps.attribute.dataIcon = iconName;
  this.append(span("", {iconName, size, style, ...extraProps}));
});
