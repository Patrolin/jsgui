const root = makeComponent(function root() {
  this.append(
    router({
      pageWrapperComponent: pageWrapper,
      routes: {
        "/": {
          component: () => mainPage(),
          wrapper: true,
          showInNavigation: true,
          label: "jsgui"
        },
      },
      notFoundRoute: {
        component: () => notFoundPage(),
      },
    })
  );
});
const pageWrapper = makeComponent(function pageWrapper(props: PageWrapperProps) {
  const {routes, currentRoute, contentWrapperComponent} = props;
  const wrapper = this.append(div({
    style: {
      height: "100%",
      display: "flex",
      alignItems: "stretch",
    },
  }));
  const navigation = wrapper.append(div({
    className: "navMenu", // TODO: styles
    style: {display: "flex", flexDirection: "column"},
  }));
  for (let [key, route] of Object.entries(routes)) {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: key }));
    }
  }
  // navigation.append() // TODO: divider()
  for (let [label, section] of Object.entries(MAIN_PAGE_SECTIONS)) {
    navigation.append(span(label, {href: `#${section.id}`}));
  }
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component());
})
renderRoot(root());
