import { div, icon, JSGUI_VERSION, makeComponent, PageWrapperProps, renderRoot, router, span } from '../../jsgui/out/jsgui.mts';
import { getGithubPagesPrefix, GITHUB_PAGES_PREFIX } from '../utils/utils.mts';
import { debugKeysPage } from './debugKeysPage.mts';
import {docsPage} from './docsPage.mts';
import { notFoundPage } from './notFoundPage.mts';
import {themeCreatorPage} from './themeCreatorPage.mts'

export const ROUTES = [
  {
    path: `/`,
    defaultPath: "/",
    component: docsPage,
    wrapper: true,
    showInNavigation: true,
    label: "Docs",
  },
  {
    path: `/:sectionId`,
    defaultPath: "/",
    component: docsPage,
    wrapper: true,
    showInNavigation: false,
    label: "Docs",
  },
  {
    path: `/:sectionId/:subsectionId`,
    defaultPath: "/",
    component: docsPage,
    wrapper: true,
    showInNavigation: false,
    label: "Docs",
  },
  {
    path: `/themeCreator`,
    defaultPath: "/themeCreator",
    component: themeCreatorPage,
    wrapper: true,
    showInNavigation: true,
    label: "Theme creator",
  },
  {
    path: `/debugKeys`,
    defaultPath: "/debugKeys",
    component: debugKeysPage,
    wrapper: false,
    showInNavigation: false,
    label: "Theme creator",
  }
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
  const {currentRoute, contentWrapperComponent} = props;
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
  navigation.append(span(`version: ${JSGUI_VERSION}`, {size: "small"}));
  ROUTES.forEach((route) => {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: `${getGithubPagesPrefix()}${route.defaultPath ?? route.path}` }));
    }
  });
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component());
})
renderRoot(root());
