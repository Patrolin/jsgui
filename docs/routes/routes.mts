import { div, icon, JSGUI_VERSION, makeComponent, PageWrapperProps, renderRoot, Route, router, Size, span } from '../../jsgui/out/jsgui.mts';
import { getGithubPagesPrefix, GITHUB_PAGES_PREFIX } from '../utils/utils.mts';
import { debugKeysPage } from './debugKeysPage.mts';
import {docsPage} from './docsPage.mts';
import { notFoundPage } from './notFoundPage.mts';
import {themeCreatorPage} from './themeCreatorPage.mts'

export const ROUTES: Route[] = [
  {
    path: `/`,
    component: docsPage,
    showInNavigation: true,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/:sectionId`,
    component: docsPage,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/:sectionId/:subsectionId`,
    component: docsPage,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/:sectionId/:subsectionId/:routerDemoId`,
    component: docsPage,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/themeCreator`,
    component: themeCreatorPage,
    showInNavigation: true,
    wrapper: true,
    label: "Theme creator",
  },
  {
    path: `/debugKeys`,
    component: debugKeysPage,
    wrapper: false,
    label: "Theme creator",
  },
];
export const root = makeComponent(function root() {
  this.append(
    router({
      prefix: GITHUB_PAGES_PREFIX,
      pageWrapperComponent: pageWrapper,
      routes: ROUTES,
      notFoundRoute: {
        component: () => notFoundPage(),
      },
    })
  );
});
export const pageWrapper = makeComponent(function pageWrapper(props: PageWrapperProps) {
  const {currentRoute, routeParams, contentWrapperComponent} = props;
  const wrapper = this.append(div({
    style: {
      height: "100%",
      display: "flex",
      alignItems: "stretch",
    },
  }));
  wrapper.append(icon("link", {style: {position: "absolute", color: 'rgba(0 0 0 / 0%)'}})) // preload icon font
  // TODO!: highlight routes
  const navigation = wrapper.append(div({
    className: "nav-menu", // TODO: styles
    style: {display: "flex", flexDirection: "column"},
  }));
  navigation.append(span(`version: ${JSGUI_VERSION}`, {size: Size.small}));
  ROUTES.forEach((route) => {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: `${getGithubPagesPrefix()}${route.defaultPath ?? route.path}` }));
    }
  });
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component(routeParams));
})
renderRoot(root());
