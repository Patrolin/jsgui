const root = makeComponent(function root() {
  const GITHUB_PAGES_PREFIX = "(/jsgui)";
  this.append(
    router({
      pageWrapperComponent: pageWrapper,
      routes: [
        {
          path: `${GITHUB_PAGES_PREFIX}/`,
          component: () => mainPage(),
          wrapper: true,
          showInNavigation: true,
          label: "jsgui"
        },
      ],
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
  for (let route of routes) {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: route.path }));
    }
  }
  // navigation.append() // TODO: divider()
  for (let section of MAIN_PAGE_SECTIONS) {
    navigation.append(span(section.label, {href: `#${section.id}`}));
  }
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component());
})
renderRoot(root());
