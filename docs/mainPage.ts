const MAIN_PAGE_SECTIONS: MainPageSection[] = [
  ...BASIC_COMPONENT_SECTIONS,
  ...INPUT_SECTIONS,
];
const mainPage = makeComponent(function mainPage() {
  const wrapper = this.append(
    div({
      style: {display: "flex", flexDirection: "column", alignItems: "flex-start"},
    })
  );
  wrapper.append(span(`version: ${JSGUI_VERSION}`, {size: "small", selfLink: "", id: "version"}));
  for (let section of MAIN_PAGE_SECTIONS) {
    wrapper.append(span(section.label, {size: "big", selfLink: section.id}));
    const component = section.component()
    wrapper.append(component);
    const row = wrapper.append(div({className: "displayRow"}));
    const onRender = component.onRender;
    const codeString = `const ${onRender.name} = makeComponent(${onRender});`;
    row.append(code(codeString, {style: {
      margin: "8px 0",
      padding: "3px 6px 4px 6px",
      background: "rgba(0, 0, 0, 0.1)",
      borderRadius: 4,
    }}));
  }
});
