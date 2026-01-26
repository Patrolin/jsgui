import { div, makeComponent, PageWrapperProps, Route, router, span } from "../../../jsgui/out/jsgui.mts";

export const routerPage = makeComponent("routerPage", function() {
  // someComponent
  type SomeComponentParams = {
    routerDemoId: string;
  };
  const someComponent = makeComponent("someComponent", function(routeParams: SomeComponentParams) {
    this.append(`routeParams: ${JSON.stringify(routeParams)}`);
    // location
    const location = this.useLocation();
    const locationDiv = this.append(div())
    locationDiv.append(`location: ${JSON.stringify(location)}`);
  });

  // default component
  const notFoundComponent = makeComponent("notFoundComponent", function() {
    this.append("notFoundComponent");
  });

  // routes
  const DEMO_ROUTES: Route[] = [
    {
      path: "/displays/router/:routerDemoId",
      component: someComponent,
      showInNavigation: true,
      defaultPath: "/displays/router/foo",
      label: "foo",
    },
    {
      path: "/displays/router/:routerDemoId",
      component: someComponent,
      showInNavigation: true,
      defaultPath: "/displays/router/foobar",
      label: "foobar",
    },
  ];

  // pageWrapperComponent
  const pageWrapperComponent = makeComponent("pageWrapperComponent", function(props: PageWrapperProps) {
    const {routes, currentRoute, contentWrapperComponent, routeParams} = props;
    const navmenu = this.append(div({style: {display: "flex", gap: 8}}));
    for (let route of routes) {
      if (route.showInNavigation) {
        navmenu.append(span(route.label, {href: route.defaultPath ?? route.path}));
      }
    }
    const contentWrapper = this.append(contentWrapperComponent());
    contentWrapper.append(currentRoute.component(routeParams));
  });

  // router
  this.append(router({
    routes: DEMO_ROUTES,
    pageWrapperComponent: pageWrapperComponent,
    notFoundRoute: {
      component: notFoundComponent,
    },
  }));
  // TODO: document navigate() function
});
