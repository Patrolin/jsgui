import { BaseProps, Component, ComponentFunction, makeComponent } from "../jsgui.mts";
import { div, fragment, span } from "./basics.mts";

export type Route = {
  path: string;
  defaultPath?: string;
  component: (props?: BaseProps) => Component;
  roles?: string[];
  wrapper?: boolean;
  showInNavigation?: boolean;
  label?: string;
  group?: string;
};
export type FallbackRoute = Omit<Route, "path">;
export type RouterProps = {
  routes: Route[];
  pageWrapperComponent?: ComponentFunction<[props: PageWrapperProps]>;
  contentWrapperComponent?: ComponentFunction<any>,
  currentRoles?: string[];
  isLoggedIn?: boolean;
  notLoggedInRoute?: FallbackRoute;
  notFoundRoute?: FallbackRoute;
  unauthorizedRoute?: FallbackRoute;
};
export type PageWrapperProps = {
  routes: Route[];
  currentRoute: Route;
  contentWrapperComponent: ComponentFunction<any>,
};
export const router = makeComponent(function router(props: RouterProps) {
  const {
    routes,
    pageWrapperComponent = () => fragment(),
    contentWrapperComponent = () => div({ className: "page-content" }),
    currentRoles,
    isLoggedIn,
    notLoggedInRoute = { component: fragment },
    notFoundRoute = { component: () => span("404 Not found") },
    unauthorizedRoute = { component: fragment },
  } = props;
  let currentPath = location.pathname;
  if (currentPath.endsWith("/index.html")) currentPath = currentPath.slice(0, -10);
  let currentRoute: Route | null = null, params = {}; // TODO: save params in rootComponent?
  for (let route of routes) {
    const regex = route.path.replace(/:([^/]+)/g, (_match, g1) => `(?<${g1}>[^/]*)`);
    const match = currentPath.match(new RegExp(`^${regex}$`));
    if (match != null) {
      params = match.groups ?? {};
      const roles = route.roles ?? [];
      const needSomeRole = (roles.length > 0);
      const haveSomeRole = (currentRoles ?? []).some(role => roles.includes(role));
      if (!needSomeRole || haveSomeRole) {
        currentRoute = route;
      } else {
        currentRoute = {
          path: ".*",
          ...(isLoggedIn ? notLoggedInRoute : unauthorizedRoute),
        };
      }
      break;
    }
  }
  if (!currentRoute) {
    console.warn(`Route '${currentPath}' not found.`);
    currentRoute = { path: ".*", ...notFoundRoute};
  }
  if (currentRoute) {
    if (currentRoute.wrapper ?? true) {
      this.append(pageWrapperComponent({routes, currentRoute, contentWrapperComponent}));
    } else {
      const contentWrapper = this.append(contentWrapperComponent());
      contentWrapper.append(currentRoute.component());
    }
  }
});