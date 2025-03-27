import { BaseProps, Component, ComponentFunction, makeComponent } from "../../jsgui.mts";
import { makeArray } from "../../utils/arrayUtils.mts";
import { makePath } from "../../utils/stringUtils.mts";
import { div, fragment, span } from "../basics.mts";

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
  prefix?: string;
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
    prefix = "",
    routes,
    pageWrapperComponent = () => fragment(),
    contentWrapperComponent = () => div({ className: "page-content" }),
    currentRoles,
    isLoggedIn,
    notLoggedInRoute = { component: fragment },
    notFoundRoute = { component: () => span("404 Not found") },
    unauthorizedRoute = { component: fragment },
  } = props;
  this.useLocation(); // rerender on location change
  let currentPath = makePath({origin: '', query: '', hash: ''});
  const currentPathWithHash = `${currentPath}${location.hash}`
  let currentRoute: Route | null = null; // TODO: save params in rootComponent?
  let currentRouteParams: Record<string, string> = {};
  for (let route of routes) {
    const routeParamNames = [] as string[];
    const routePrefix = currentPath.startsWith(prefix) ? prefix : "";
    const regex = new RegExp(`^${
      makePath({
        origin: '',
        pathname: routePrefix + route.path,
        query: '',
        hash: '',
      }).replace(/:([^/]*)/g, (_m, g1) => {
        routeParamNames.push(g1);
        return `[^/?]*`;
      })
    }$`);
    const match = currentPathWithHash.match(regex) ?? currentPath.match(regex);
    if (match != null) {
      const routeParamsEntries = makeArray(routeParamNames.length, (v, i) => [v, match[i]]);
      currentRouteParams = Object.fromEntries(routeParamsEntries);
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
  this._.root.routeParams = currentRouteParams;
  if (currentRoute.wrapper ?? true) {
    this.append(pageWrapperComponent({routes, currentRoute, contentWrapperComponent}));
  } else {
    const contentWrapper = this.append(contentWrapperComponent());
    contentWrapper.append(currentRoute.component());
  }
});
