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
    wrapper.append(section.component());
    // TODO!: show the code
  }
});
