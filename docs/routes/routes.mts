import { div, divider, JSGUI_VERSION, makeComponent, PageWrapperProps, renderRoot, Route, router, span } from '../../jsgui/out/jsgui.mts';
import {MAIN_PAGE_SECTIONS, mainPage} from './mainPage.mts';
import { notFoundPage } from './notFoundPage.mts';
import {themeCreatorPage} from './themeCreatorPage.mts'

export const GITHUB_PAGES_PREFIX = "(/jsgui)?";
export const ROUTES = [
  {
    path: `${GITHUB_PAGES_PREFIX}/`,
    defaultPath: "/#version",
    component: () => mainPage(),
    wrapper: true,
    showInNavigation: true,
    label: "Docs",
  },
  {
    path: `${GITHUB_PAGES_PREFIX}/themeCreator`,
    defaultPath: "/themeCreator",
    component: () => themeCreatorPage(),
    wrapper: true,
    showInNavigation: true,
    label: "Theme creator",
  },
  {
    path: `${GITHUB_PAGES_PREFIX}/debugKeys`,
    defaultPath: "/debugKeys",
    component: () => debugKeysPage(),
    wrapper: false,
    showInNavigation: false,
    label: "Theme creator",
  }
];
export const root = makeComponent(function root() {
  this.append(
    router({
      pageWrapperComponent: pageWrapper,
      routes: ROUTES,
      notFoundRoute: {
        component: () => notFoundPage(),
      },
    })
  );
});
export const pageWrapper = makeComponent(function pageWrapper(props: PageWrapperProps) {
  const {routes, currentRoute, contentWrapperComponent} = props;
  // TODO: have router support routes including hash, and take longest matching route
  const isGithubPages = window.location.pathname.startsWith("/jsgui");
  const githubPagesPrefix = isGithubPages ? `/jsgui` : "";
  const wrapper = this.append(div({
    style: {
      height: "100%",
      display: "flex",
      alignItems: "stretch",
    },
  }));
  // TODO!: show version
  // TODO!: highlight routes
  const navigation = wrapper.append(div({
    className: "nav-menu", // TODO: styles
    style: {display: "flex", flexDirection: "column"},
  }));
  navigation.append(span(`version: ${JSGUI_VERSION}`, {size: "small"}));
  const appendRoute = (route: Route) => {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: `${githubPagesPrefix}${route.defaultPath ?? route.path}` }));
    }
  }
  const docsRoute = ROUTES[0];
  appendRoute(docsRoute);
  navigation.append(divider());
  for (let section of MAIN_PAGE_SECTIONS) {
    navigation.append(span(section.label, {href: `${githubPagesPrefix}/#${section.id}`}));
  }
  navigation.append(divider());
  for (let route of routes.slice(1)) {
    appendRoute(route);
  }
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component());
})
renderRoot(root());
