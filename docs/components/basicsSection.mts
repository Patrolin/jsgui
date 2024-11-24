import { audio, BASE_COLORS, button, COLOR_SHADES, coloredButton, div, icon, img, input, makeComponent, SIZES, span, svg, textarea, video } from "../../jsgui/out/jsgui.mts";
import { DocsSection, getSizeLabel } from "../utils/utils.mts";

const htmlPage = makeComponent(function htmlPage() {
    let row = this.append(div({className: "display-row"}));
    row.append(span("span"));
    row.append(input({
      style: {height: 'var(--size-normal)'}, // TODO: make size a baseProp?
      attribute: {placeholder: "input"}},
    ));
    row.append(textarea({
      attribute: {placeholder: "textarea"}},
    ));
    const someButton = row.append(button("button", {
      style: {height: 'var(--size-normal)', fontSize: "14px"},
    }));
    someButton.append(svg(`
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" />
      </svg>`, {style: {width: "1em", height: "1em"}}));
    row.append(img("/assets/test_image.bmp", {style: {width: 24}, attribute: {title: "img"}}));
    row.append(audio("https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3", {attribute: {
      controls: true,
      title: "audio",
    }}));
    this.append(video([
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    ], {style: {height: 240}, attribute: {controls: true, title: "video"}}));
});
const spanPage = makeComponent(function spanPage() {
  for (let href of [undefined]) {
    let row = this.append(div({className: "display-row", style: {marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: "small", href}));
    row.append(span("Normal", {size: "normal", href}));
    row.append(span("Big", {size: "big", href}));
    row.append(span("Bigger", {size: "bigger", href}));
  }
  for (let baseColor of Object.keys(BASE_COLORS)) {
    let row = this.append(div({className: "display-row"}))
    for (let shade of COLOR_SHADES) {
      const color = shade ? `${baseColor}-${shade}` : baseColor;
      row.append(span(color, {color}));
    }
  }
});
const anchorPage = makeComponent(function anchorPage() {
  for (let href of ["https://www.google.com"]) {
    let row = this.append(div({className: "display-row", style: {marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: "small", href}));
    row.append(span("Normal", {size: "normal", href}));
    row.append(span("Big", {size: "big", href}));
    row.append(span("Bigger", {size: "bigger", href}));
  }
  for (let href of ["assets/test_image.bmp"]) {
    let row = this.append(div({className: "display-row", style: {marginBottom: href ? 4 : 0}}))
    row.append(span("download", {size: "small", href, download: "test_image.bmp"}));
  }
});
const buttonPage = makeComponent(function buttonPage() {
  let row = this.append(div({className: "display-row"}));
  for (let size of Object.values(SIZES)) row.append(coloredButton(getSizeLabel(size), {size}));
  row = this.append(div({className: "display-row", style: {marginTop: 4}}));
  for (let size of Object.values(SIZES)) row.append(coloredButton(getSizeLabel(size), {color: "secondary", size}));
  row = this.append(div({className: "display-row", style: {marginTop: 4}}));
  for (let size of Object.values(SIZES)) row.append(coloredButton("Disabled", {disabled: true, size}));
});
const iconPage = makeComponent(function iconPage() {
  let row = this.append(div({className: "display-row"}));
  for (let size of Object.values(SIZES)) row.append(icon("link", {size}));
  row = this.append(div({className: "display-row"}));
  for (let size of Object.values(SIZES)) {
    const buttonWrapper = row.append(coloredButton("", {size, color: "secondary"}));
    buttonWrapper.append(icon("link", {size}));
    buttonWrapper.append(span(getSizeLabel(size)));
  }
  // TODO: circle buttons
});

export const BASICS_SECTION: DocsSection = {
    id: "basics",
    label: "Basics",
    pages: [
        {id: "html", label: "HTML", component: htmlPage},
        {id: "span", label: "Span", component: spanPage},
        {id: "anchor", label: "Anchor", component: anchorPage},
        {id: "button", label: "Button", component: buttonPage},
        {id: "icon", label: "Icon", component: iconPage},
    ],
};
