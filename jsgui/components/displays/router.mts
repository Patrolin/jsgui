import { ComponentFunction, makeComponent } from "../../jsgui.mts";
import { makePath } from "../../utils/string_utils.mts";
import { div, fragment, span } from "../basics.mts";

export type Route = {
  path: string;
  defaultPath?: string;
  component: ComponentFunction<[routeParams: any]>
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
  routeParams: Record<string, string>,
  contentWrapperComponent: ComponentFunction<any>,
};
export const router = makeComponent("router", function(props: RouterProps) {
  const {
    prefix = "",
    routes,
    pageWrapperComponent,
    contentWrapperComponent = () => div({ className: "page-content" }),
    currentRoles,
    isLoggedIn,
    notLoggedInRoute = { component: fragment },
    notFoundRoute,
    unauthorizedRoute = { component: fragment },
  } = props;
  this.useLocation(); // rerender on location change
  let currentPath = makePath({origin: '', query: '', hash: ''});
  let currentRoute: Route | null = null;
  let currentRouteParams: Record<string, string> = {};
  type RouteInfo = {
    route: Route;
    paramNames: string[];
    pathRegex: string;
    sortKey: string;
  };
  const routeInfos: RouteInfo[] = routes.map(route => {
    const routePrefix = currentPath.startsWith(prefix) ? prefix : "";
    const path = makePath({
      origin: '',
      pathname: routePrefix + route.path,
      query: '',
      hash: '',
    });
    const paramNames: string[] = [];
    const pathRegex = path.replace(/:([^/]*)/g, (_m, g1) => {
      paramNames.push(g1);
      return `([^/?]*)`;
    });
    const sortKey = path.replace(/:([^/]*)/g, '');
    return {route, paramNames, pathRegex, sortKey};
  }).sort((a, b) => {
    const aKey = a.sortKey;
    const bKey = b.sortKey;
    return +(aKey < bKey) - +(aKey > bKey); // NOTE: sort descending
  });
  for (let routeInfo of routeInfos) {
    const regex = new RegExp(`^${routeInfo.pathRegex}$`);
    const match = currentPath.match(regex);
    if (match != null) {
      const routeParamEntries = routeInfo.paramNames.map((key, i) => [key, match[i + 1]]);
      currentRouteParams = Object.fromEntries(routeParamEntries);
      const route = routeInfo.route;
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
    currentRoute = {path: '*', component: () => span("404 Not found")};
    if (notFoundRoute) {
      currentRoute = {...currentRoute, ...notFoundRoute};
    } else {
      console.warn(`Route '${currentPath}' not found. routes:`, routes);
    }
  }
  if (currentRoute.wrapper && pageWrapperComponent != null) {
    this.append(pageWrapperComponent({routes, currentRoute, routeParams: currentRouteParams, contentWrapperComponent}));
  } else {
    const contentWrapper = this.append(contentWrapperComponent());
    contentWrapper.append(currentRoute.component(currentRouteParams));
  }
});
