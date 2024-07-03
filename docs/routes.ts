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
  const wrapper = this.append(div());
  const navigation = wrapper.append(div());
  for (let [key, route] of Object.entries(routes)) {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: key }));
    }
  }
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component());
})
renderRoot(root());
